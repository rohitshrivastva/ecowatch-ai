from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import init_db
from app.routes.auth import router as auth_router
from app.routes.environment import router as environment_router
from app.routes.favorites import router as favorites_router
from app.routes.history import router as history_router
from app.routes.heatmap import router as heatmap_router
from app.services.cache import cache_service


@asynccontextmanager
async def lifespan(app: FastAPI):
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

    return app


app = create_app()
