"""File storage. Backends: local disk (default) or S3-compatible (MinIO, AWS).
Uploaded files are served back through /storage/... on the API."""
import os
import re
import uuid

from ..config import settings


def _safe_name(name: str) -> str:
    name = os.path.basename(name or "file")
    name = re.sub(r"[^A-Za-z0-9._-]", "_", name)[:120] or "file"
    return f"{uuid.uuid4().hex[:8]}_{name}"


def save_file(data: bytes, original_name: str, subdir: str = "uploads") -> dict:
    """Persist bytes; returns {id, path, url, size}."""
    fid = uuid.uuid4().hex
    name = _safe_name(original_name)
    if settings.storage_backend == "s3":
        return _save_s3(data, name, subdir)
    d = os.path.join(settings.storage_dir, subdir)
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, f"{fid}_{name}")
    with open(path, "wb") as f:
        f.write(data)
    return {"id": fid, "path": path, "url": f"/storage/{subdir}/{os.path.basename(path)}", "size": len(data)}


def _save_s3(data: bytes, name: str, subdir: str) -> dict:
    import boto3

    client = boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint or None,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
    )
    key = f"{subdir}/{name}"
    client.put_object(Bucket=settings.s3_bucket, Key=key, Body=data)
    base = settings.public_base_url.rstrip("/")
    return {"id": uuid.uuid4().hex, "path": key, "url": f"{base}/storage/{key}", "size": len(data)}


def delete_file(url_or_key: str) -> None:
    if settings.storage_backend == "s3":
        try:
            import boto3

            client = boto3.client(
                "s3",
                endpoint_url=settings.s3_endpoint or None,
                aws_access_key_id=settings.s3_access_key,
                aws_secret_access_key=settings.s3_secret_key,
            )
            client.delete_object(Bucket=settings.s3_bucket, Key=url_or_key.replace("/storage/", "", 1))
        except Exception:
            pass
        return
    p = os.path.join(settings.storage_dir, url_or_key.replace("/storage/", "", 1))
    if os.path.isfile(p):
        os.remove(p)
