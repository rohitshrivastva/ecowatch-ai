"""Backend tests for EcoWatch AI."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "1.0.0"


@pytest.mark.asyncio
async def test_analyze_by_coords(client):
    response = await client.get("/api/v1/analyze", params={"lat": 28.61, "lon": 77.20})
    assert response.status_code == 200
    data = response.json()
    assert "air_pollution" in data
    assert "weather" in data
    assert "environmental" in data
    assert "risk" in data
    assert "recommendations" in data
    assert 0 <= data["risk"]["score"] <= 100


@pytest.mark.asyncio
async def test_analyze_post(client):
    response = await client.post(
        "/api/v1/analyze",
        json={"latitude": 19.07, "longitude": 72.87, "name": "Mumbai"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["location_name"] == "Mumbai"
    assert data["air_pollution"]["aqi"] > 0


@pytest.mark.asyncio
async def test_invalid_coords(client):
    response = await client.get("/api/v1/analyze", params={"lat": 999, "lon": 0})
    assert response.status_code == 422
