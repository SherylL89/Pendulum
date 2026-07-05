import base64
import hashlib
import json
import os

from fastapi import Depends, FastAPI, File, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

import ai
import embeddings
import jobs
import newsletter_ingest
import pdf_export
import scraper
import trend_agent
from db import Base, engine, get_db
from models import Collection, Newsletter, Preference, PricePoint, Product, Review, TrendReport, User

Base.metadata.create_all(engine)
embeddings.ensure_schema()
jobs.start()

app = FastAPI(title="Pendulum API", version="0.2.0")
_origins = os.environ.get("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware, allow_origins=_origins, allow_methods=["*"], allow_headers=["*"]
)


@app.get("/health")
def health():
    return {"ok": True}


# ---------- dashboard ----------

@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    pref = db.scalar(select(Preference).limit(1))
    total = db.scalar(select(func.count(Product.id)))
    new_items = db.scalar(select(func.count(Product.id)).where(Product.change_pct > 0))
    top = db.scalars(select(Product).order_by(Product.change_pct.desc()).limit(8)).all()
    by_cat = db.execute(
        select(Product.category, func.count(Product.id), func.avg(Product.change_pct))
        .group_by(Product.category)
    ).all()
    return {
        "preference": {
            "categories": pref.categories if pref else [],
            "competitors": pref.competitors if pref else [],
            "price_tier": pref.price_tier if pref else "",
        },
        "stats": {"all_items": total, "new_items": new_items, "sales_items": max(0, (total or 0) - 200)},
        "movers": [_product_dict(p) for p in top],
        "categories": [
            {"category": c, "count": n, "avg_change": round(a or 0, 2)} for c, n, a in by_cat
        ],
    }


# ---------- products / performance ----------

def _product_dict(p: Product) -> dict:
    return {
        "id": p.id, "name": p.name, "brand": p.brand, "retailer": p.retailer,
        "category": p.category, "price": p.price, "change_pct": p.change_pct,
        "sales_rank": p.sales_rank, "review_rank": p.review_rank,
        "launch_date": p.launch_date, "attrs": p.attrs, "image_hue": p.image_hue,
        "image_url": p.image_url or "",
    }


def _cached_feedback(db: Session, p: Product) -> dict:
    """Sentiment analysis cached on the product; recomputed only when reviews change."""
    reviews = [r.text for r in db.scalars(select(Review).where(Review.product_id == p.id)).all()]
    h = hashlib.sha1("\n".join(sorted(reviews)).encode()).hexdigest()
    if p.feedback_hash == h and p.feedback_cache:
        return p.feedback_cache
    result = ai.analyze_feedback(reviews)
    p.feedback_cache = result
    p.feedback_hash = h
    db.commit()
    return result


@app.get("/products")
def products(
    category: str | None = None,
    brand: str | None = None,
    color: str | None = None,
    material: str | None = None,
    price_min: float | None = None,
    price_max: float | None = None,
    sort: str = "sales",  # sales | review | newest
    db: Session = Depends(get_db),
):
    q = select(Product)
    if category:
        q = q.where(Product.category == category)
    if brand:
        q = q.where(Product.brand == brand)
    if price_min is not None:
        q = q.where(Product.price >= price_min)
    if price_max is not None:
        q = q.where(Product.price <= price_max)
    order = {
        "sales": Product.sales_rank.asc(),
        "review": Product.review_rank.asc(),
        "newest": Product.launch_date.desc(),
    }.get(sort, Product.sales_rank.asc())
    rows = db.scalars(q.order_by(order).limit(200)).all()
    # attrs are JSON — filter portably in Python
    if color:
        rows = [p for p in rows if color.lower() in json.dumps(p.attrs or {}).lower()]
    if material:
        rows = [p for p in rows if material.lower() in json.dumps(p.attrs or {}).lower()]
    return [_product_dict(p) for p in rows[:60]]


@app.get("/products/compare")
def compare(ids: str, db: Session = Depends(get_db)):
    id_list = [int(x) for x in ids.split(",") if x.strip().isdigit()][:6]
    rows = db.scalars(select(Product).where(Product.id.in_(id_list))).all()
    return [_product_dict(p) for p in rows]


@app.get("/products/{pid}")
def product_detail(pid: int, date_from: str | None = None, db: Session = Depends(get_db)):
    p = db.get(Product, pid)
    if not p:
        raise HTTPException(404)
    hq = select(PricePoint).where(PricePoint.product_id == pid)
    if date_from:
        hq = hq.where(PricePoint.date >= date_from)
    history = db.scalars(hq.order_by(PricePoint.date)).all()
    return {
        **_product_dict(p),
        "history": [
            {"date": h.date, "brand_price": h.brand_price, "retailer_price": h.retailer_price, "promo": h.promo}
            for h in history
        ],
        "feedback": _cached_feedback(db, p),
    }


@app.get("/products/{pid}/similar")
def similar(pid: int, db: Session = Depends(get_db)):
    """Vector similarity via pgvector (or brute-force cosine in dev)."""
    p = db.get(Product, pid)
    if not p:
        raise HTTPException(404)
    ids = embeddings.search(embeddings.embed_text(embeddings.product_text(p)), limit=9, exclude_id=pid)
    if ids:
        rows = db.scalars(select(Product).where(Product.id.in_(ids))).all()
        rows.sort(key=lambda x: ids.index(x.id))
    else:
        rows = db.scalars(select(Product).where(Product.category == p.category, Product.id != pid).limit(9)).all()
    return [_product_dict(x) for x in rows]


@app.post("/find-similar")
async def find_similar(file: UploadFile = File(...), db: Session = Depends(get_db)):
    data = await file.read()
    tags = ai.tag_image(base64.b64encode(data).decode(), file.content_type or "image/png")
    text = " ".join([
        str(tags.get("category", "")), str(tags.get("style", "")), str(tags.get("material", "")),
        " ".join(tags.get("colors", []) if isinstance(tags.get("colors"), list) else []),
    ])
    ids = embeddings.search(embeddings.embed_text(text), limit=9)
    rows = db.scalars(select(Product).where(Product.id.in_(ids))).all() if ids else []
    if not rows:
        rows = db.scalars(select(Product).where(Product.category == tags.get("category")).limit(9)).all() \
            or db.scalars(select(Product).limit(9)).all()
    return {"tags": tags, "matches": [_product_dict(x) for x in rows]}


# ---------- collections ----------

class CollectionIn(BaseModel):
    name: str


class CollectIn(BaseModel):
    product_id: int


@app.get("/collections")
def collections(db: Session = Depends(get_db)):
    out = []
    for c in db.scalars(select(Collection)).all():
        prods = db.scalars(select(Product).where(Product.id.in_(c.product_ids or [0]))).all()
        out.append({"id": c.id, "name": c.name, "count": len(c.product_ids or []),
                    "shared_with": c.shared_with, "products": [_product_dict(p) for p in prods[:6]]})
    return out


@app.post("/collections")
def create_collection(body: CollectionIn, db: Session = Depends(get_db)):
    c = Collection(name=body.name, owner_id=1, product_ids=[])
    db.add(c)
    db.commit()
    return {"id": c.id, "name": c.name}


@app.post("/collections/{cid}/collect")
def collect(cid: int, body: CollectIn, db: Session = Depends(get_db)):
    c = db.get(Collection, cid)
    if not c:
        raise HTTPException(404)
    ids = list(c.product_ids or [])
    if body.product_id not in ids:
        ids.append(body.product_id)
    c.product_ids = ids
    db.commit()
    return {"ok": True, "count": len(ids)}


class ShareIn(BaseModel):
    user_ids: list[int]


@app.post("/collections/{cid}/share")
def share_collection(cid: int, body: ShareIn, db: Session = Depends(get_db)):
    c = db.get(Collection, cid)
    if not c:
        raise HTTPException(404)
    valid = {u.id for u in db.scalars(select(User)).all()}
    c.shared_with = [u for u in body.user_ids if u in valid]
    db.commit()
    return {"ok": True, "shared_with": c.shared_with}


class RenameIn(BaseModel):
    name: str


@app.post("/collections/{cid}/rename")
def rename_collection(cid: int, body: RenameIn, db: Session = Depends(get_db)):
    c = db.get(Collection, cid)
    if not c:
        raise HTTPException(404)
    c.name = body.name[:120]
    db.commit()
    return {"ok": True, "name": c.name}


# ---------- newsletters ----------

@app.get("/newsletters")
def newsletters(brand: str | None = None, kind: str | None = None, db: Session = Depends(get_db)):
    q = select(Newsletter).order_by(Newsletter.received_at.desc())
    if brand:
        q = q.where(Newsletter.brand == brand)
    if kind:
        q = q.where(Newsletter.kind == kind)
    rows = db.scalars(q.limit(60)).all()
    brands = [b for (b,) in db.execute(select(Newsletter.brand).distinct()).all()]
    return {
        "brands": brands,
        "items": [
            {"id": n.id, "brand": n.brand, "subject": n.subject, "kind": n.kind,
             "received_at": n.received_at.isoformat(), "read": bool(n.read)} for n in rows
        ],
    }


@app.get("/newsletters/unread-count")
def unread_count(db: Session = Depends(get_db)):
    return {"count": db.scalar(select(func.count(Newsletter.id)).where(Newsletter.read == 0)) or 0}


@app.post("/newsletters/{nid}/read")
def mark_read(nid: int, db: Session = Depends(get_db)):
    n = db.get(Newsletter, nid)
    if not n:
        raise HTTPException(404)
    n.read = 1
    db.commit()
    return {"ok": True}


class NewsletterIn(BaseModel):
    subject: str
    body: str = ""
    brand: str | None = None


@app.post("/newsletters/ingest")
def ingest_newsletter(item: NewsletterIn):
    """Webhook / manual intake — classified by Claude (keyword fallback keyless)."""
    nid = newsletter_ingest.ingest_one(item.brand, item.subject, item.body)
    return {"id": nid}


@app.post("/newsletters/poll")
def poll_inbox():
    """Trigger an IMAP poll of the configured newsletter inbox."""
    return {"ingested": newsletter_ingest.poll_imap()}


@app.get("/newsletters/{nid}/pdf")
def newsletter_pdf(nid: int, db: Session = Depends(get_db)):
    n = db.get(Newsletter, nid)
    if not n:
        raise HTTPException(404)
    data = pdf_export.render_pdf(n.subject, f"{n.brand} · {n.kind} · {n.received_at:%Y-%m-%d}", n.body or "(no body)")
    return Response(data, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="newsletter-{nid}.pdf"'})


# ---------- trends ----------

@app.get("/trends")
def trends(db: Session = Depends(get_db)):
    rows = db.scalars(select(TrendReport).order_by(TrendReport.created_at.desc())).all()
    return [
        {"id": t.id, "title": t.title, "kind": t.kind, "season": t.season,
         "summary": t.summary, "body": t.body} for t in rows
    ]


@app.post("/trends/generate")
def generate_trend():
    """Run the full trend agent: gather → draft → verify (retry) → publish."""
    return trend_agent.run_trend_agent()


@app.get("/trends/{tid}/pdf")
def trend_pdf(tid: int, db: Session = Depends(get_db)):
    t = db.get(TrendReport, tid)
    if not t:
        raise HTTPException(404)
    data = pdf_export.render_pdf(t.title, f"{t.season} · {t.kind}", t.summary + "\n\n" + (t.body or ""))
    return Response(data, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="trend-{tid}.pdf"'})


@app.post("/admin/snapshot")
def admin_snapshot():
    """Manually trigger an ingestion run (also scheduled daily via ENABLE_SCHEDULER)."""
    return scraper.snapshot()


@app.post("/admin/backfill-embeddings")
def admin_backfill():
    """Embed all products — run once after pointing VECTOR_DATABASE_URL at Supabase."""
    return {"embedded": scraper.backfill_embeddings()}


@app.post("/admin/purge-demo")
def purge_demo(db: Session = Depends(get_db)):
    """Remove seeded demo products (and their history/reviews) so dashboards
    reflect only genuinely scraped data. Real scraped products are kept."""
    demo = db.scalars(select(Product)).all()
    demo = [p for p in demo if (p.attrs or {}).get("size") == "13cm*13cm*4cm"]  # seed marker
    ids = [p.id for p in demo]
    if ids:
        db.query(PricePoint).filter(PricePoint.product_id.in_(ids)).delete(synchronize_session=False)
        db.query(Review).filter(Review.product_id.in_(ids)).delete(synchronize_session=False)
        for c in db.scalars(select(Collection)).all():
            c.product_ids = [x for x in (c.product_ids or []) if x not in ids]
        for p in demo:
            db.delete(p)
        db.commit()
    remaining = db.scalar(select(func.count(Product.id)))
    return {"purged": len(ids), "remaining_products": remaining}


# ---------- team ----------

class InviteIn(BaseModel):
    email: str
    name: str = ""


@app.get("/team")
def team(db: Session = Depends(get_db)):
    rows = db.scalars(select(User)).all()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role} for u in rows]


@app.post("/team/invite")
def invite(body: InviteIn, db: Session = Depends(get_db)):
    if (db.scalar(select(func.count(User.id))) or 0) >= 10:
        raise HTTPException(400, "Team has reached the 10 member maximum")
    u = User(name=body.name or body.email.split("@")[0], email=body.email)
    db.add(u)
    db.commit()
    return {"id": u.id, "email": u.email}
