"""Auth API tests."""

import uuid

import pytest


@pytest.mark.asyncio
async def test_register_and_login(client):
    email = f"testuser-{uuid.uuid4().hex[:8]}@example.com"
    password = "securepass123"

    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Test User"},
    )
    assert reg.status_code == 201
    data = reg.json()
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == email
    assert "access_token" in data

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200
    assert login.json()["access_token"]

    dup = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    assert dup.status_code == 400


@pytest.mark.asyncio
async def test_analyze_public_by_default(client):
    response = await client.get("/api/v1/analyze", params={"lat": 28.61, "lon": 77.20})
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_analyze_with_token(client):
    email = f"analyst-{uuid.uuid4().hex[:8]}@example.com"
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "securepass123"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get(
        "/api/v1/analyze",
        params={"lat": 28.61, "lon": 77.20},
        headers=headers,
    )
    assert response.status_code == 200
    assert "air_pollution" in response.json()
