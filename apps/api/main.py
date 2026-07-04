import base64
from collections import Counter

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

import ai
from db import Base, engine, get_db
from models import Collection, Newsletter, Preference, PricePoint, Product, Review, TrendReport, User

Base.metadata.create_all(engine)

app = FastAPI(title="Pendulum API", version="0.1.0")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
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
    }


@app.get("/products")
def products(
    category: str | None = None,
    brand: str | None = None,
    sort: str = "sales",  # sales | review | newest
    db: Session = Depends(get_db),
):
    q = select(Product)
    if category:
        q = q.where(Product.category == category)
    if brand:
        q = q.where(Product.brand == brand)
    order = {
        "sales": Product.sales_rank.asc(),
        "review": Product.review_rank.asc(),
        "newest": Product.launch_date.desc(),
    }.get(sort, Product.sales_rank.asc())
    rows = db.scalars(q.order_by(order).limit(60)).all()
    return [_product_dict(p) for p in rows]


@app.get("/products/{pid}")
def product_detail(pid: int, db: Session = Depends(get_db)):
    p = db.get(Product, pid)
    if not p:
        raise HTTPException(404)
    history = db.scalars(
        select(PricePoint).where(PricePoint.product_id == pid).order_by(PricePoint.date)
    ).all()
    reviews = db.scalars(select(Review).where(Review.product_id == pid)).all()
    return {
        **_product_dict(p),
        "history": [
            {"date": h.date, "brand_price": h.brand_price, "retailer_price": h.retailer_price, "promo": h.promo}
            for h in history
        ],
        "feedback": ai.analyze_feedback([r.text for r in reviews]),
    }


@app.get("/products/{pid}/similar")
def similar(pid: int, db: Session = Depends(get_db)):
    p = db.get(Product, pid)
    if not p:
        raise HTTPException(404)
    rows = db.scalars(
        select(Product).where(Product.category == p.category, Product.id != pid).limit(9)
    ).all()
    return [_product_dict(x) for x in rows]


@app.post("/find-similar")
async def find_similar(file: UploadFile = File(...), db: Session = Depends(get_db)):
    data = await file.read()
    tags = ai.tag_image(base64.b64encode(data).decode(), file.content_type or "image/png")
    rows = db.scalars(select(Product).where(Product.category == tags.get("category")).limit(9)).all()
    if not rows:
        rows = db.scalars(select(Product).limit(9)).all()
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
             "received_at": n.received_at.isoformat()} for n in rows
        ],
    }


# ---------- trends ----------

@app.get("/trends")
def trends(db: Session = Depends(get_db)):
    rows = db.scalars(select(TrendReport).order_by(TrendReport.created_at.desc())).all()
    return [
        {"id": t.id, "title": t.title, "kind": t.kind, "season": t.season,
         "summary": t.summary, "body": t.body} for t in rows
    ]


@app.post("/trends/generate")
def generate_trend(db: Session = Depends(get_db)):
    by_cat = db.execute(
        select(Product.category, func.count(Product.id), func.avg(Product.change_pct)).group_by(Product.category)
    ).all()
    kinds = Counter(k for (k,) in db.execute(select(Newsletter.kind)).all())
    stats = {
        "categories": [{"category": c, "items": n, "avg_change_pct": round(a or 0, 2)} for c, n, a in by_cat],
        "newsletter_mix": dict(kinds),
    }
    report = ai.generate_trend_report(stats)
    t = TrendReport(title=report["title"], kind="industry", season="Generated",
                    summary=report["summary"], body=report["body"])
    db.add(t)
    db.commit()
    return {"id": t.id, **report}


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
