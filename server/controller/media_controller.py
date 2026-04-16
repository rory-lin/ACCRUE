import os
import base64
import uuid
from fastapi import APIRouter, File, UploadFile
from models.common import ApiResponse

router = APIRouter(prefix="/api", tags=["media"])

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}

# For local development: also save to disk
ICONS_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "icons")
IS_VERCEL = os.environ.get("VERCEL") == "1"


@router.post("/upload/icon")
async def upload_icon(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return ApiResponse(success=False, error="不支持的图片格式")

    content = await file.read()

    if IS_VERCEL:
        # Serverless: return base64 data URL
        mime_map = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".svg": "image/svg+xml",
        }
        mime = mime_map.get(ext, "image/png")
        b64 = base64.b64encode(content).decode("utf-8")
        data_url = f"data:{mime};base64,{b64}"
        return ApiResponse(data={"url": data_url})
    else:
        # Local development: save to disk
        os.makedirs(ICONS_DIR, exist_ok=True)
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(ICONS_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(content)
        url = f"/static/icons/{filename}"
        return ApiResponse(data={"url": url})
