from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from contextlib import asynccontextmanager
import os
import traceback

from db.database import init_db
from config import get_config
from middleware.auth import AuthMiddleware

IS_VERCEL = os.environ.get("VERCEL") == "1"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database
    init_db()
    yield
    # Shutdown


app = FastAPI(title="Accrue - AI 智能记账助手", version="0.1.0", lifespan=lifespan)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": str(exc)},
    )

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(AuthMiddleware)

# Import and mount controllers
from controller import (
    auth_controller,
    account_controller,
    category_controller,
    transaction_controller,
    stats_controller,
    ai_controller,
    export_controller,
    settings_controller,
    media_controller,
)

app.include_router(auth_controller.router)
app.include_router(account_controller.router)
app.include_router(category_controller.router)
app.include_router(transaction_controller.router)
app.include_router(stats_controller.router)
app.include_router(ai_controller.router)
app.include_router(export_controller.router)
app.include_router(settings_controller.router)
app.include_router(media_controller.router)

# Static file serving (local development only)
if not IS_VERCEL:
    # Serve uploaded icons
    icons_path = os.path.join(os.path.dirname(__file__), "static", "icons")
    os.makedirs(icons_path, exist_ok=True)
    app.mount("/static/icons", StaticFiles(directory=icons_path), name="icons")

    # Serve frontend static files in production
    client_dist = os.path.join(os.path.dirname(__file__), "..", "client", "dist")
    client_index = os.path.join(client_dist, "index.html")

    if os.path.exists(client_dist):
        # Mount static assets (js, css, images, etc.)
        app.mount("/assets", StaticFiles(directory=os.path.join(client_dist, "assets")), name="assets")

        # SPA fallback: any non-API, non-static path returns index.html
        @app.get("/{path:path}")
        async def spa_fallback(path: str):
            file_path = os.path.join(client_dist, path)
            if os.path.isfile(file_path):
                return FileResponse(file_path)
            return FileResponse(client_index)


if __name__ == "__main__":
    import uvicorn

    config = get_config()
    uvicorn.run("main:app", host="0.0.0.0", port=config["app"]["port"], reload=True)
