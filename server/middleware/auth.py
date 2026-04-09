from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError
import os

SECRET_KEY = os.environ.get("JWT_SECRET", "accrue-secret-key-change-in-production")
ALGORITHM = "HS256"

EXCLUDE_PATHS = ["/api/auth/login", "/docs", "/openapi.json", "/redoc"]


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        # Skip auth for excluded paths and non-API paths
        if any(path.startswith(p) for p in EXCLUDE_PATHS) or not path.startswith("/api"):
            return await call_next(request)

        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return JSONResponse(
                status_code=401,
                content={"detail": "未登录"},
            )

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            request.state.user = payload
        except JWTError:
            return JSONResponse(
                status_code=401,
                content={"detail": "登录已过期，请重新登录"},
            )

        return await call_next(request)


def create_token(username: str) -> str:
    return jwt.encode({"sub": username}, SECRET_KEY, algorithm=ALGORITHM)
