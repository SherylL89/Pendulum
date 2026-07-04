"""Object storage (Cloudflare R2, S3-compatible). Falls back to passing URLs through untouched."""

import hashlib
import os


def _client():
    endpoint = os.environ.get("R2_ENDPOINT")
    key = os.environ.get("R2_ACCESS_KEY_ID")
    secret = os.environ.get("R2_SECRET_ACCESS_KEY")
    if not (endpoint and key and secret):
        return None
    try:
        import boto3

        return boto3.client(
            "s3", endpoint_url=endpoint, aws_access_key_id=key, aws_secret_access_key=secret,
            region_name="auto",
        )
    except Exception:
        return None


def store_image(data: bytes, content_type: str = "image/jpeg") -> str | None:
    """Upload image bytes to R2, return public URL. None when R2 isn't configured."""
    client = _client()
    if client is None:
        return None
    bucket = os.environ.get("R2_BUCKET", "pendulum")
    public = os.environ.get("R2_PUBLIC_URL", "").rstrip("/")
    key = f"products/{hashlib.sha1(data).hexdigest()}.jpg"
    try:
        client.put_object(Bucket=bucket, Key=key, Body=data, ContentType=content_type)
        return f"{public}/{key}" if public else key
    except Exception:
        return None
