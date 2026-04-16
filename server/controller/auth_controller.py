import os
import bcrypt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.common import ApiResponse
from middleware.auth import create_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Configurable via env vars, fallback to defaults
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "rory")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "qaz.007.008")

# Pre-compute bcrypt hash once at module load
HASHED_PASSWORD = bcrypt.hashpw(
    ADMIN_PASSWORD.encode("utf-8"), bcrypt.gensalt()
).decode("utf-8")


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
async def login(req: LoginRequest):
    if req.username != ADMIN_USERNAME or not bcrypt.checkpw(
        req.password.encode("utf-8"), HASHED_PASSWORD.encode("utf-8")
    ):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    token = create_token(req.username)
    return ApiResponse(data={"token": token, "username": req.username})
