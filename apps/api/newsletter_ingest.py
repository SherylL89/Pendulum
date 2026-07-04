"""Newsletter ingestion.

Two paths:
1. IMAP poll — point IMAP_HOST/IMAP_USER/IMAP_PASSWORD at a dedicated inbox subscribed
   to competitor newsletters; each poll classifies new mail with Claude.
2. POST /newsletters/ingest — webhook for services like Mailgun/CloudMailin, or manual adds.
"""

import email
import imaplib
import os
from datetime import datetime
from email.header import decode_header

import ai
from db import SessionLocal
from models import Newsletter

KINDS = ["Sales Promotions", "New Product Announcement", "Editorial / Blogs", "Others"]


def classify(subject: str, body: str) -> dict:
    """Claude classifies brand + kind; keyword fallback keeps it functional keyless."""
    result = ai._ask_json(
        'Classify this fashion marketing email. JSON: {"brand":str,"kind":'
        f'{KINDS}' + '}\n\nSubject: ' + subject + "\n\nBody:\n" + body[:4000]
    )
    if result and result.get("kind") in KINDS:
        return result
    s = (subject + " " + body[:500]).lower()
    if any(w in s for w in ["% off", "sale", "deal", "promo", "flash"]):
        kind = "Sales Promotions"
    elif any(w in s for w in ["new arrival", "new collection", "introducing", "just in"]):
        kind = "New Product Announcement"
    elif any(w in s for w in ["story", "editorial", "journal", "behind"]):
        kind = "Editorial / Blogs"
    else:
        kind = "Others"
    return {"brand": subject.split(":")[0][:50] if ":" in subject else "Unknown", "kind": kind}


def ingest_one(brand: str | None, subject: str, body: str, received_at: datetime | None = None) -> int:
    tags = classify(subject, body)
    db = SessionLocal()
    try:
        n = Newsletter(
            brand=brand or tags.get("brand", "Unknown"),
            subject=subject[:255], kind=tags["kind"],
            received_at=received_at or datetime.utcnow(), body=body,
        )
        db.add(n)
        db.commit()
        return n.id
    finally:
        db.close()


def _decode(value: str | None) -> str:
    if not value:
        return ""
    parts = decode_header(value)
    return "".join(p.decode(enc or "utf-8", "ignore") if isinstance(p, bytes) else p for p, enc in parts)


def poll_imap() -> int:
    """Fetch unseen messages from the configured inbox. Returns count ingested."""
    host = os.environ.get("IMAP_HOST")
    user = os.environ.get("IMAP_USER")
    password = os.environ.get("IMAP_PASSWORD")
    if not (host and user and password):
        return 0
    count = 0
    try:
        m = imaplib.IMAP4_SSL(host)
        m.login(user, password)
        m.select("INBOX")
        _, data = m.search(None, "UNSEEN")
        for num in data[0].split()[:50]:
            _, msg_data = m.fetch(num, "(RFC822)")
            msg = email.message_from_bytes(msg_data[0][1])
            subject = _decode(msg.get("Subject"))
            sender = _decode(msg.get("From"))
            body = ""
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    body = part.get_payload(decode=True).decode("utf-8", "ignore")
                    break
            brand = sender.split("<")[0].strip().strip('"') or None
            ingest_one(brand, subject, body)
            count += 1
        m.logout()
    except Exception:
        pass
    return count
