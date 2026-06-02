"""Shared pytest fixtures."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.db import init_db
from app.main import app
from app.services.cache import cache_service


@pytest.fixture
async def client():
    await init_db()
    await cache_service.connect()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    await cache_service.disconnect()
