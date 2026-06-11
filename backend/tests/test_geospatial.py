"""Tests for geospatial water crisis intelligence API."""

import pytest


@pytest.mark.asyncio
async def test_geospatial_analyze_region(client):
    payload = {
        "bbox": [77.0, 28.4, 77.4, 28.8],
        "analysisType": "water",
    }
    response = await client.post("/api/v1/geospatial/analyze-region", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "overlayUrl" in data
    assert "overlayUrls" in data
    assert data["overlayUrls"]["ndvi"]
    assert data["overlayUrls"]["ndwi"]
    assert data["overlayUrls"]["waterStress"]
    assert 0 <= data["ndviScore"] <= 1 or -1 <= data["ndviScore"] <= 1
    assert data["waterRisk"] in ("Low", "Moderate", "High", "Critical")
    assert 0 <= data["waterCrisisScore"] <= 100
    assert len(data["insights"]) >= 1
    assert len(data["bounds"]) == 4


@pytest.mark.asyncio
async def test_geospatial_cache_hit(client):
    payload = {"bbox": [72.8, 19.0, 73.0, 19.2], "analysisType": "ndvi"}
    first = await client.post("/api/v1/geospatial/analyze-region", json=payload)
    second = await client.post("/api/v1/geospatial/analyze-region", json=payload)
    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["ndviScore"] == first.json()["ndviScore"]
