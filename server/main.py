from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
import traceback

from db.database import init_db
from config import get_config
from middleware.auth import AuthMiddleware


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
)

app.include_router(auth_controller.router)
app.include_router(account_controller.router)
app.include_router(category_controller.router)
app.include_router(transaction_controller.router)
app.include_router(stats_controller.router)
app.include_router(ai_controller.router)
app.include_router(export_controller.router)
app.include_router(settings_controller.router)

# Serve frontend static files in production
client_dist = os.path.join(os.path.dirname(__file__), "..", "client", "dist")
if os.path.exists(client_dist):
    app.mount("/", StaticFiles(directory=client_dist, html=True), name="client")


if __name__ == "__main__":
    import uvicorn

    config = get_config()
    uvicorn.run("main:app", host="0.0.0.0", port=config["app"]["port"], reload=True)
