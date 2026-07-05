"""Agentic product ingestion.

Real sources: fetch a listing page with httpx, let Claude extract structured product JSON
(resilient to layout changes — no CSS selectors to maintain). Demo source: applies realistic
price drift to existing products so the pipeline runs end-to-end without network or keys.

Run manually:  python -m scraper            (one snapshot)
Scheduled:     ENABLE_SCHEDULER=1           (daily, see jobs.py)
"""

import json
import os
import random
from datetime import datetime

import httpx

import ai
import embeddings
import storage
from db import SessionLocal
from models import PricePoint, Product, ScrapeRun

# Configure real sources here. selector-free: Claude reads the page text.
# Example:
# SCRAPE_SOURCES='[{"brand":"Zara","url":"https://www.zara.com/us/en/woman-bags-l1024.html","category":"Woman - Accessories - Bag"}]'


def _load_sources() -> list[dict]:
    raw = os.environ.get("SCRAPE_SOURCES", "[]").strip()
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict):  # single entry without brackets — accept it
            return [parsed]
        if isinstance(parsed, list):
            return [s for s in parsed if isinstance(s, dict) and s.get("url")]
        print(f"WARNING: SCRAPE_SOURCES must be a JSON list, got {type(parsed).__name__}; ignoring.")
    except json.JSONDecodeError as e:
        print(f"WARNING: SCRAPE_SOURCES is not valid JSON ({e}); ignoring. "
              'Expected: [{"brand":"...","url":"https://...","category":"..."}]')
    return []


SOURCES: list[dict] = _load_sources()


import re


def _clean_html(html: str) -> str:
    """Strip HTML to readable text so the extraction budget is spent on content,
    not scripts. Keeps image URLs inline as [IMG url] markers."""
    html = re.sub(r"<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
    html = re.sub(r"<img[^>]+src=[\"']([^\"']+)[\"'][^>]*>", r" [IMG \1] ", html, flags=re.I)
    html = re.sub(r"<a[^>]+href=[\"']([^\"']+)[\"'][^>]*>", r" ", html, flags=re.I)
    html = re.sub(r"<[^>]+>", " ", html)
    html = html.replace("&amp;", "&").replace("&nbsp;", " ").replace("&quot;", '"').replace("&#39;", "'")
    return re.sub(r"\s+", " ", html).strip()


def extract_products(page_html: str, brand: str, category: str) -> list[dict]:
    """Claude turns cleaned page text into structured products. Empty list if no key."""
    client = ai._client()
    if client is None:
        return []
    try:
        text_in = _clean_html(page_html)
        msg = client.messages.create(
            model=ai.MODEL,
            max_tokens=3000,
            system="Reply with valid JSON only.",
            messages=[{
                "role": "user",
                "content": (
                    "Extract fashion products from this listing page text. [IMG url] markers are "
                    "product images — pair each product with the nearest one. Return JSON list: "
                    '[{"name":str,"price":float,"image_url":str|null,"colors":[str],"material":str|null}]. '
                    "Max 20 items. Skip navigation/menu items; products have prices.\n\n" + text_in[:40000]
                ),
            }],
        )
        text = msg.content[0].text.strip()
        if text.startswith("```"):
            text = text.strip("`").removeprefix("json").strip()
        return json.loads(text)
    except Exception:
        return []


def parse_shopify(payload: dict) -> list[dict]:
    """Shopify /products.json → our product schema. No AI needed — the data is structured."""
    items = []
    for p in payload.get("products", [])[:40]:
        variants = p.get("variants") or [{}]
        price = float(variants[0].get("price") or 0)
        if not p.get("title") or price <= 0:
            continue
        tags = p.get("tags") or []
        tags = tags if isinstance(tags, list) else [t.strip() for t in tags.split(",")]
        # tag dialects vary by store: "color-family GREEN", "color-brown", "color: Orange"
        colors, materials = [], []
        for t in tags:
            m = re.match(r"^colou?r(?:-family)?[-: ]\s*(.+)$", t, re.I)
            if m:
                colors.append(m.group(1).strip().title())
                continue
            m = re.match(r"^(?:material(?:-name)?|fabric)[-: ]\s*(.+)$", t, re.I)
            if m:
                materials.append(m.group(1).strip().title())
        images = p.get("images") or []
        items.append({
            "name": p["title"], "price": price,
            "image_url": images[0]["src"] if images else None,
            "colors": colors, "material": materials[0] if materials else None,
        })
    return items


def _upsert_product(db, item: dict, brand: str, category: str, today: str) -> int:
    p = db.query(Product).filter_by(name=item["name"], brand=brand).first()
    if p is None:
        p = Product(
            name=item["name"], brand=brand, category=category, price=item["price"],
            launch_date=today, attrs={"colors": item.get("colors", []), "material": item.get("material")},
            image_hue=random.randint(0, 360),
        )
        db.add(p)
        db.flush()
    prev = p.price or item["price"]
    p.change_pct = round((item["price"] - prev) / prev * 100, 2) if prev else 0.0
    p.price = item["price"]
    if item.get("image_url"):
        try:
            data = httpx.get(item["image_url"], timeout=15).content
            url = storage.store_image(data)
            # R2 copy when configured; otherwise hotlink the source image directly
            p.image_url = url or item["image_url"]
        except Exception:
            p.image_url = item["image_url"]
    db.add(PricePoint(product_id=p.id, date=today, brand_price=item["price"],
                      retailer_price=item["price"], promo=item.get("promo", "")))
    embeddings.upsert(p.id, embeddings.embed_text(embeddings.product_text(p)))
    return p.id


def _demo_drift(db, today: str) -> int:
    """Keyless/demo mode: drift existing prices so history keeps accumulating."""
    n = 0
    for p in db.query(Product).all():
        promo = "20% off" if random.random() < 0.04 else ""
        new_price = max(10, round(p.price * random.uniform(0.97, 1.02), 0))
        p.change_pct = round((new_price - p.price) / p.price * 100, 2)
        p.price = new_price
        db.add(PricePoint(product_id=p.id, date=today,
                          brand_price=new_price,
                          retailer_price=round(new_price * (0.8 if promo else 1.0), 0), promo=promo))
        n += 1
    return n


def snapshot() -> dict:
    """One ingestion run across all sources (or demo drift when none configured)."""
    embeddings.ensure_schema()
    db = SessionLocal()
    today = str(datetime.utcnow().date())
    counts, mode = 0, "live"
    try:
        if SOURCES:
            for src in SOURCES:
                try:
                    resp = httpx.get(src["url"], timeout=30, follow_redirects=True,
                                     headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                                              "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
                                              "Accept-Language": "en-US,en;q=0.9"})
                    if "products.json" in src["url"]:
                        items = parse_shopify(resp.json())  # structured Shopify feed, no AI needed
                    else:
                        items = extract_products(resp.text, src["brand"], src["category"])
                    for item in items:
                        _upsert_product(db, item, src["brand"], src["category"], today)
                        counts += 1
                except Exception:
                    continue
        if counts == 0:
            mode = "demo-drift"
            counts = _demo_drift(db, today)
        db.add(ScrapeRun(ran_at=datetime.utcnow(), mode=mode, items=counts))
        db.commit()
        return {"mode": mode, "items": counts, "date": today}
    finally:
        db.close()


def backfill_embeddings() -> int:
    """Embed every product that lacks a vector (run once after enabling Supabase)."""
    embeddings.ensure_schema()
    db = SessionLocal()
    n = 0
    try:
        for p in db.query(Product).all():
            embeddings.upsert(p.id, embeddings.embed_text(embeddings.product_text(p)))
            n += 1
        return n
    finally:
        db.close()


if __name__ == "__main__":
    print(snapshot())
