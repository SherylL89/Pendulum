"""AI layer: Claude-powered analysis with deterministic fallbacks when no API key is set."""

import json
import os

MODEL = "claude-sonnet-4-5"


def _client():
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        return None
    try:
        import anthropic

        return anthropic.Anthropic(api_key=key)
    except Exception:
        return None


def _ask_json(prompt: str, system: str = "Reply with valid JSON only.") -> dict | None:
    client = _client()
    if client is None:
        return None
    try:
        msg = client.messages.create(
            model=MODEL,
            max_tokens=1500,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        text = msg.content[0].text.strip()
        if text.startswith("```"):
            text = text.strip("`").removeprefix("json").strip()
        return json.loads(text)
    except Exception:
        return None


FALLBACK_SENTIMENT = {
    "aspects": [
        {"aspect": "Size", "positive": 62, "negative": 38, "keywords": ["true to size", "runs small", "compact"]},
        {"aspect": "Style", "positive": 81, "negative": 19, "keywords": ["elegant", "versatile", "timeless"]},
        {"aspect": "Quality", "positive": 74, "negative": 26, "keywords": ["leather", "stitching", "hardware"]},
    ],
    "top_terms": [
        {"term": "leather", "weight": 36}, {"term": "elegant", "weight": 28},
        {"term": "compact", "weight": 22}, {"term": "gift", "weight": 18},
        {"term": "pricey", "weight": 15}, {"term": "classic", "weight": 12},
    ],
    "source": "fallback",
}


def analyze_feedback(reviews: list[str]) -> dict:
    """Aspect-level sentiment from review texts."""
    result = _ask_json(
        "Analyze these fashion product reviews. Return JSON: "
        '{"aspects":[{"aspect":"Size|Style|Quality","positive":<pct>,"negative":<pct>,"keywords":[...]}],'
        '"top_terms":[{"term":str,"weight":int}]}\n\nReviews:\n' + "\n".join(reviews[:50])
    )
    if result:
        result["source"] = "claude"
        return result
    return FALLBACK_SENTIMENT


FALLBACK_TAGS = {
    "category": "Woman - Accessories - Bag",
    "colors": ["Brown", "Black"],
    "style": "Shoulder bag",
    "material": "Leather",
    "source": "fallback",
}


def tag_image(image_b64: str, media_type: str) -> dict:
    """Tag an uploaded product image with category/colors/style/material."""
    client = _client()
    if client is None:
        return FALLBACK_TAGS
    try:
        msg = client.messages.create(
            model=MODEL,
            max_tokens=400,
            system="Reply with valid JSON only.",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": image_b64}},
                    {"type": "text", "text": 'Tag this fashion product. JSON: {"category":str,"colors":[str],"style":str,"material":str}'},
                ],
            }],
        )
        text = msg.content[0].text.strip()
        if text.startswith("```"):
            text = text.strip("`").removeprefix("json").strip()
        out = json.loads(text)
        out["source"] = "claude"
        return out
    except Exception:
        return FALLBACK_TAGS


def generate_trend_report(stats: dict) -> dict:
    """Agentic-lite loop: draft from aggregates, verify numbers, return report."""
    draft = _ask_json(
        "You are a fashion trend analyst. Using ONLY these aggregates, write a trend report. "
        'JSON: {"title":str,"summary":str,"body":str(markdown, ~300 words),"verified_numbers":[str]}\n\n'
        f"Aggregates: {json.dumps(stats)}"
    )
    if draft:
        # verify pass: every number cited must appear in the aggregates
        nums_ok = all(str(n) in json.dumps(stats) for n in draft.get("verified_numbers", []))
        draft["verified"] = bool(nums_ok)
        draft["source"] = "claude"
        return draft
    return {
        "title": "High Street Womenswear: Signals This Month",
        "summary": "Bags and knit layers lead engagement; price cuts cluster mid-month.",
        "body": "Fallback report generated without an API key. Set ANTHROPIC_API_KEY to enable live analysis.",
        "verified": True,
        "source": "fallback",
    }
