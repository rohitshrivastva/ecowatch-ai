from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.db import init_db
from app.routes.auth import router as auth_router
from app.routes.environment import router as environment_router
from app.routes.favorites import router as favorites_router
from app.routes.geospatial import router as geospatial_router
from app.routes.history import router as history_router
from app.routes.heatmap import router as heatmap_router
from app.services.cache import cache_service

OVERLAY_DIR = Path(__file__).resolve().parent.parent / "data" / "overlays"
OVERLAY_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    OVERLAY_DIR.mkdir(parents=True, exist_ok=True)
    await init_db()
    await cache_service.connect()
    yield
    await cache_service.disconnect()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description="Environmental Health Intelligence Platform API",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router)
    app.include_router(environment_router)
    app.include_router(history_router)
    app.include_router(favorites_router)
    app.include_router(heatmap_router)
    app.include_router(geospatial_router)
    app.mount(
        "/static/overlays",
        StaticFiles(directory=str(OVERLAY_DIR)),
        name="overlays",
    )

    return app


app = create_app()
