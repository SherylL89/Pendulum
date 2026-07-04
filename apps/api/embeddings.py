"""Embeddings + vector search.

Vector store lives in VECTOR_DATABASE_URL (Supabase Postgres with pgvector) when set,
otherwise falls back to the main DB with brute-force cosine (works on SQLite for dev).

Embedding provider: Voyage AI (VOYAGE_API_KEY) → OpenAI (OPENAI_API_KEY) → deterministic
hash-based fallback so similarity search always functions in dev.
"""

import hashlib
import json
import math
import os

import httpx
from sqlalchemy import create_engine, text

DIM = 256  # fallback dim; provider dims are projected/truncated to keep the schema stable


def _vector_engine():
    url = os.environ.get("VECTOR_DATABASE_URL") or os.environ.get("DATABASE_URL", "sqlite:///./pendulum.db")
    connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
    return create_engine(url, connect_args=connect_args), url.startswith("postgresql")


def embed_text(text_in: str) -> list[float]:
    v_key = os.environ.get("VOYAGE_API_KEY")
    o_key = os.environ.get("OPENAI_API_KEY")
    try:
        if v_key:
            r = httpx.post(
                "https://api.voyageai.com/v1/embeddings",
                headers={"Authorization": f"Bearer {v_key}"},
                json={"model": "voyage-3-lite", "input": [text_in]},
                timeout=20,
            )
            vec = r.json()["data"][0]["embedding"]
            return _fit(vec)
        if o_key:
            r = httpx.post(
                "https://api.openai.com/v1/embeddings",
                headers={"Authorization": f"Bearer {o_key}"},
                json={"model": "text-embedding-3-small", "input": text_in},
                timeout=20,
            )
            vec = r.json()["data"][0]["embedding"]
            return _fit(vec)
    except Exception:
        pass
    return _hash_embed(text_in)


def _fit(vec: list[float]) -> list[float]:
    return vec[:DIM] if len(vec) >= DIM else vec + [0.0] * (DIM - len(vec))


def _hash_embed(text_in: str) -> list[float]:
    """Deterministic pseudo-embedding: stable, similarity-preserving for token overlap."""
    vec = [0.0] * DIM
    for token in text_in.lower().split():
        h = int(hashlib.md5(token.encode()).hexdigest(), 16)
        vec[h % DIM] += 1.0
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / norm for x in vec]


def product_text(p) -> str:
    attrs = p.attrs or {}
    return " ".join([
        p.name, p.brand, p.category,
        str(attrs.get("style", "")), str(attrs.get("material", "")),
        " ".join(attrs.get("colors", []) if isinstance(attrs.get("colors"), list) else []),
    ])


def ensure_schema():
    engine, is_pg = _vector_engine()
    with engine.begin() as conn:
        if is_pg:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.execute(text(
                f"CREATE TABLE IF NOT EXISTS product_embeddings (product_id INT PRIMARY KEY, embedding vector({DIM}))"
            ))
        else:
            conn.execute(text(
                "CREATE TABLE IF NOT EXISTS product_embeddings (product_id INTEGER PRIMARY KEY, embedding TEXT)"
            ))


def upsert(product_id: int, vec: list[float]):
    engine, is_pg = _vector_engine()
    with engine.begin() as conn:
        if is_pg:
            conn.execute(text(
                "INSERT INTO product_embeddings (product_id, embedding) VALUES (:id, :v) "
                "ON CONFLICT (product_id) DO UPDATE SET embedding = :v"
            ), {"id": product_id, "v": str(vec)})
        else:
            conn.execute(text(
                "INSERT OR REPLACE INTO product_embeddings (product_id, embedding) VALUES (:id, :v)"
            ), {"id": product_id, "v": json.dumps(vec)})


def search(vec: list[float], limit: int = 9, exclude_id: int | None = None) -> list[int]:
    engine, is_pg = _vector_engine()
    with engine.begin() as conn:
        if is_pg:
            rows = conn.execute(text(
                "SELECT product_id FROM product_embeddings "
                + ("WHERE product_id != :ex " if exclude_id else "")
                + "ORDER BY embedding <=> :v LIMIT :n"
            ), {"v": str(vec), "n": limit, **({"ex": exclude_id} if exclude_id else {})}).all()
            return [r[0] for r in rows]
        rows = conn.execute(text("SELECT product_id, embedding FROM product_embeddings")).all()
    scored = []
    for pid, emb in rows:
        if pid == exclude_id:
            continue
        e = json.loads(emb)
        dot = sum(a * b for a, b in zip(vec, e))
        scored.append((dot, pid))
    scored.sort(reverse=True)
    return [pid for _, pid in scored[:limit]]
