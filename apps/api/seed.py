"""Seed the database with realistic sample data for every screen."""

import random
from datetime import datetime, timedelta

from db import Base, SessionLocal, engine
from models import Collection, Newsletter, Preference, PricePoint, Product, Review, TrendReport, User

random.seed(42)

BRANDS = ["Zara", "H&M", "&Other Stories", "COS", "Saint Laurent", "OAK + FORT", "Tommy Bruch"]
RETAILERS = ["Marcy's", "Saks off Fifth", ""]
CATEGORIES = ["Woman - Top", "Woman - Dress", "Woman - Accessories - Bag", "Woman - Shoes", "Man - Jeans"]
NAMES = {
    "Woman - Top": ["Ribbed Knit Top", "Cropped Cardigan 5064", "Silk Camisole", "Boxy Tee"],
    "Woman - Dress": ["Slip Midi Dress", "Wrap Dress", "Pleated Maxi", "Shirt Dress"],
    "Woman - Accessories - Bag": ["Small Envelope Shoulder Bag", "Ashadh Bag", "Croissant Hobo", "Mini Tote"],
    "Woman - Shoes": ["Ballet Flats", "Combat Boots", "Strappy Sandals", "Court Heels"],
    "Man - Jeans": ["Straight Leg Jean", "Relaxed Taper", "Raw Selvedge", "Slim Stretch"],
}
MATERIALS = ["Leather", "Cotton", "Velvet", "Wool", "Linen"]
COLORS = ["Black", "Brown", "Beige", "Blue", "Green", "Gold"]
REVIEW_SNIPPETS = [
    ("Beautiful leather and stitching, feels premium.", 5),
    ("Runs small, size up if between sizes.", 3),
    ("Elegant and versatile, wear it everywhere.", 5),
    ("Strap broke after two weeks. Disappointed.", 1),
    ("Perfect gift, classic look.", 5),
    ("Color slightly different from photos.", 3),
    ("Great value during the promotion.", 4),
    ("Compact but fits all essentials.", 4),
]
NL_KINDS = ["Sales Promotions", "New Product Announcement", "Editorial / Blogs", "Others"]
NL_SUBJECTS = [
    "Winter is Coming! Shop Our Snow Collection!",
    "48h Flash Sale — up to 40% off",
    "New Arrivals: The Studio Edit",
    "Behind the Seams: Our Spring Story",
]


def run(reset: bool = False):
    """Safe by default: refuses to wipe a database that already has data.
    Use `python seed.py --reset` to force a full reseed (destroys scraped history!)."""
    Base.metadata.create_all(engine)
    db = SessionLocal()
    existing = db.query(Product).count()
    if existing and not reset:
        print(f"Database already has {existing} products — skipping seed. Use --reset to wipe and reseed.")
        db.close()
        return
    if reset:
        db.close()
        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)
        db = SessionLocal()

    admin = User(name="Yiren Xu", email="yiren@pendulum.com", role="admin")
    members = [User(name=n, email=e) for n, e in [
        ("Miao Kang", "miao@pendulum.com"), ("Yifan Mao", "yifan@pendulum.com"), ("Junya S", "junya@pendulum.com")]]
    db.add_all([admin, *members])
    db.flush()

    db.add(Preference(
        user_id=admin.id,
        categories=["Woman - Top", "Woman - Dress", "Woman - Accessories - Bag"],
        competitors=["Zara", "H&M", "&Other Stories", "Tommy Bruch"],
        inspirations=["OffWhite", "Balenciaga"],
        price_tier="High Street",
    ))

    products = []
    today = datetime.utcnow().date()
    for cat in CATEGORIES:
        for name in NAMES[cat]:
            for brand in random.sample(BRANDS, k=3):
                base = round(random.uniform(29, 2400), 0)
                p = Product(
                    name=name, brand=brand, retailer=random.choice(RETAILERS), category=cat,
                    price=base, change_pct=round(random.uniform(-6, 8), 2),
                    sales_rank=random.randint(1, 500), review_rank=random.randint(1, 500),
                    launch_date=str(today - timedelta(days=random.randint(30, 900))),
                    attrs={"size": "13cm*13cm*4cm", "style": random.choice(["Dress", "Bottom", "Classic"]),
                           "material": random.choice(MATERIALS), "colors": random.sample(COLORS, k=2)},
                    image_hue=random.randint(0, 360),
                )
                db.add(p)
                products.append(p)
    db.flush()

    for p in products:
        price = p.price
        for d in range(30, -1, -1):
            date = str(today - timedelta(days=d))
            promo = "20% off" if d in (4, 5) and random.random() < 0.3 else ""
            drift = random.uniform(-0.01, 0.008) * price
            price = max(10, price + drift)
            rp = price * (0.8 if promo else random.uniform(0.95, 1.0))
            db.add(PricePoint(product_id=p.id, date=date, brand_price=round(price, 0),
                              retailer_price=round(rp, 0), promo=promo))
        for text, rating in random.sample(REVIEW_SNIPPETS, k=5):
            db.add(Review(product_id=p.id, text=text, rating=rating))

    db.add_all([
        Collection(name="Bags", owner_id=admin.id,
                   product_ids=[p.id for p in products if "Bag" in p.category][:22],
                   shared_with=[members[0].id]),
        Collection(name="Shoes", owner_id=admin.id,
                   product_ids=[p.id for p in products if "Shoes" in p.category][:5]),
    ])

    now = datetime.utcnow()
    for i in range(28):
        db.add(Newsletter(
            brand=random.choice(BRANDS[:4]),
            subject=random.choice(NL_SUBJECTS),
            kind=random.choice(NL_KINDS),
            received_at=now - timedelta(days=random.randint(0, 20), hours=random.randint(0, 23)),
            body="Full email body would be archived here.",
        ))

    for season, kind in [("High Fashion 2026", "industry"), ("Spring Social Signals", "social")]:
        for i in range(4):
            db.add(TrendReport(
                title=f"Dior Fashion Show 2026 — Look {i + 1}" if kind == "industry" else f"TikTok Micro-trend #{i + 1}",
                kind=kind, season=season,
                summary="Sculptural silhouettes and acid accents dominate.",
                body="Report body. Generate live reports via POST /trends/generate.",
            ))

    db.commit()
    db.close()
    print(f"Seeded {len(products)} products, 31-day price history, reviews, collections, newsletters, reports.")


if __name__ == "__main__":
    import sys

    run(reset="--reset" in sys.argv)
