from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    role: Mapped[str] = mapped_column(String(20), default="member")  # admin | member


class Preference(Base):
    __tablename__ = "preferences"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    categories: Mapped[list] = mapped_column(JSON, default=list)      # ["Woman - Dress", ...] max 3
    competitors: Mapped[list] = mapped_column(JSON, default=list)     # ["Zara", "H&M"]
    inspirations: Mapped[list] = mapped_column(JSON, default=list)
    price_tier: Mapped[str] = mapped_column(String(30), default="High Street")


class Product(Base):
    __tablename__ = "products"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    brand: Mapped[str] = mapped_column(String(120))
    retailer: Mapped[str] = mapped_column(String(120), default="")
    category: Mapped[str] = mapped_column(String(120))                # "Woman - Accessories - Bag"
    price: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    change_pct: Mapped[float] = mapped_column(Float, default=0.0)     # perf change since range start
    sales_rank: Mapped[int] = mapped_column(Integer, default=0)
    review_rank: Mapped[int] = mapped_column(Integer, default=0)
    launch_date: Mapped[str] = mapped_column(String(20), default="")
    attrs: Mapped[dict] = mapped_column(JSON, default=dict)           # size, style, material, colors
    image_hue: Mapped[int] = mapped_column(Integer, default=0)        # placeholder art seed

    prices: Mapped[list["PricePoint"]] = relationship(back_populates="product")
    reviews: Mapped[list["Review"]] = relationship(back_populates="product")


class PricePoint(Base):
    __tablename__ = "price_points"
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    date: Mapped[str] = mapped_column(String(20))
    brand_price: Mapped[float] = mapped_column(Float)
    retailer_price: Mapped[float] = mapped_column(Float)
    promo: Mapped[str] = mapped_column(String(255), default="")
    product: Mapped[Product] = relationship(back_populates="prices")


class Review(Base):
    __tablename__ = "reviews"
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    text: Mapped[str] = mapped_column(Text)
    rating: Mapped[int] = mapped_column(Integer, default=5)
    product: Mapped[Product] = relationship(back_populates="reviews")


class Collection(Base):
    __tablename__ = "collections"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    product_ids: Mapped[list] = mapped_column(JSON, default=list)
    shared_with: Mapped[list] = mapped_column(JSON, default=list)     # user ids


class Newsletter(Base):
    __tablename__ = "newsletters"
    id: Mapped[int] = mapped_column(primary_key=True)
    brand: Mapped[str] = mapped_column(String(120))
    subject: Mapped[str] = mapped_column(String(255))
    kind: Mapped[str] = mapped_column(String(50))  # Sales Promotions | New Product | Editorial | Others
    received_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    body: Mapped[str] = mapped_column(Text, default="")


class TrendReport(Base):
    __tablename__ = "trend_reports"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    kind: Mapped[str] = mapped_column(String(30), default="industry")  # industry | social
    season: Mapped[str] = mapped_column(String(50), default="")
    summary: Mapped[str] = mapped_column(Text, default="")
    body: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
