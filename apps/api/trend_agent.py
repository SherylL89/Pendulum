"""Trend agent: a bounded plan → gather → draft → verify → publish loop.

Each step is explicit and auditable. Max 2 verification retries; on failure the report
is published flagged unverified rather than silently dropped.
"""

import json
from collections import Counter
from datetime import datetime, timedelta

from sqlalchemy import func, select

import ai
from db import SessionLocal
from models import Newsletter, PricePoint, Product, TrendReport

MAX_RETRIES = 2


def gather(db) -> dict:
    """Step 1: pull grounded aggregates the drafter is allowed to cite."""
    week_ago = str((datetime.utcnow() - timedelta(days=7)).date())
    by_cat = db.execute(
        select(Product.category, func.count(Product.id), func.avg(Product.change_pct))
        .group_by(Product.category)
    ).all()
    promos = db.scalar(
        select(func.count(PricePoint.id)).where(PricePoint.promo != "", PricePoint.date >= week_ago)
    )
    movers = db.scalars(select(Product).order_by(Product.change_pct.desc()).limit(5)).all()
    nl_kinds = Counter(k for (k,) in db.execute(
        select(Newsletter.kind).where(Newsletter.received_at >= datetime.utcnow() - timedelta(days=14))
    ).all())
    return {
        "week_of": str(datetime.utcnow().date()),
        "categories": [{"category": c, "items": n, "avg_change_pct": round(a or 0, 2)} for c, n, a in by_cat],
        "promos_last_7d": promos,
        "top_movers": [{"name": p.name, "brand": p.brand, "change_pct": p.change_pct} for p in movers],
        "newsletter_mix_14d": dict(nl_kinds),
    }


def draft(stats: dict, feedback: str = "") -> dict | None:
    """Step 2: draft strictly from aggregates. Feedback comes from failed verification."""
    return ai._ask_json(
        "You are a fashion trend analyst. Write a weekly trend report using ONLY the aggregates below. "
        "Cite specific numbers. Do not invent any figure.\n"
        + (f"REVISION NOTE — your previous draft failed verification: {feedback}\n" if feedback else "")
        + 'JSON: {"title":str,"summary":str(1 sentence),"body":str(markdown ~350 words),'
        '"numbers_cited":[str]}\n\nAggregates:\n' + json.dumps(stats)
    )


def verify(report: dict, stats: dict) -> tuple[bool, str]:
    """Step 3: every cited number must literally exist in the gathered aggregates."""
    blob = json.dumps(stats)
    missing = [n for n in report.get("numbers_cited", []) if str(n).replace("%", "") not in blob]
    if missing:
        return False, f"numbers not found in source data: {missing}"
    return True, ""


def run_trend_agent() -> dict:
    db = SessionLocal()
    try:
        stats = gather(db)
        report, verified, note = None, False, ""
        for attempt in range(MAX_RETRIES + 1):
            report = draft(stats, feedback=note)
            if report is None:  # no API key → deterministic fallback
                report = ai.generate_trend_report(stats)
                verified = True
                break
            verified, note = verify(report, stats)
            if verified:
                break
        t = TrendReport(
            title=report["title"], kind="industry", season="Generated",
            summary=report["summary"] + ("" if verified else " [unverified]"),
            body=report["body"],
        )
        db.add(t)
        db.commit()
        return {"id": t.id, "title": t.title, "verified": verified, "attempts": attempt + 1}
    finally:
        db.close()
