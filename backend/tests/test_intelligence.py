"""Tests for history, favorites, and heatmap APIs."""

import uuid

import pytest


@pytest.mark.asyncio
async def test_analyze_returns_location_id(client):
    response = await client.get("/api/v1/analyze", params={"lat": 28.61, "lon": 77.20})
    assert response.status_code == 200
    data = response.json()
    assert data.get("location_id") is not None
    assert isinstance(data["location_id"], int)


@pytest.mark.asyncio
async def test_history_trends_and_comparison(client):
    analyze = await client.get("/api/v1/analyze", params={"lat": 19.07, "lon": 72.87})
    location_id = analyze.json()["location_id"]

    trends = await client.get(
        "/api/v1/history/trends",
        params={"location_id": location_id, "period": "7d"},
    )
    assert trends.status_code == 200
    body = trends.json()
    assert body["location_id"] == location_id
    assert "metrics" in body
    assert "series" in body

    comparison = await client.get(
        "/api/v1/history/comparison",
        params={"location_id": location_id, "period": "30d"},
    )
    assert comparison.status_code == 200
    assert comparison.json()["location_id"] == location_id


@pytest.mark.asyncio
async def test_history_pagination(client):
    analyze = await client.get("/api/v1/analyze", params={"lat": 12.97, "lon": 77.59})
    location_id = analyze.json()["location_id"]

    history = await client.get(
        f"/api/v1/history/{location_id}",
        params={"page": 1, "page_size": 10},
    )
    assert history.status_code == 200
    data = history.json()
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert "items" in data
    assert data["total"] >= 0


@pytest.mark.asyncio
async def test_heatmap_endpoints(client):
    bounds = {"north": 28.8, "south": 28.4, "east": 77.4, "west": 77.0, "zoom": 10}
    for path in ("aqi", "temperature", "vegetation", "environmental-risk", "water-stress"):
        response = await client.get(f"/api/v1/heatmap/{path}", params=bounds)
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == path
        assert "updated_at" in data
        assert isinstance(data["points"], list)
        assert len(data["points"]) >= 100
        assert len(data["points"]) <= 1500
        for point in data["points"]:
            assert "lat" in point and "lng" in point and "intensity" in point
            assert 0 <= point["intensity"] <= 1
            if point.get("value") is not None:
                assert isinstance(point["value"], (int, float))


@pytest.mark.asyncio
async def test_favorites_crud(client):
    email = f"fav-{uuid.uuid4().hex[:8]}@example.com"
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "securepass123"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    unauthorized = await client.get("/api/v1/favorites")
    assert unauthorized.status_code == 401

    created = await client.post(
        "/api/v1/favorites",
        json={
            "location_name": "Home",
            "latitude": 28.6139,
            "longitude": 77.209,
        },
        headers=headers,
    )
    assert created.status_code == 201
    fav = created.json()
    assert fav["location_name"] == "Home"

    listed = await client.get("/api/v1/favorites", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()) >= 1

    updated = await client.put(
        f"/api/v1/favorites/{fav['id']}",
        json={"location_name": "Office"},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["location_name"] == "Office"

    deleted = await client.delete(
        f"/api/v1/favorites/{fav['id']}",
        headers=headers,
    )
    assert deleted.status_code == 204
