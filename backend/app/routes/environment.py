from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.deps import verify_auth_if_required
from app.models.schemas import (
    EnvironmentalAnalysis,
    GeoLocationResponse,
    HealthResponse,
    LocationRequest,
)
from app.services.analysis import analysis_service
from app.services.geo import client_ip_from_headers, lookup_ip

router = APIRouter(prefix="/api/v1", tags=["environment"])


@router.get("/geo/me", response_model=GeoLocationResponse)
async def geo_me(request: Request):
    """Approximate client location from request IP (no browser permission required)."""
    ip = client_ip_from_headers(
        request.headers.get("X-Forwarded-For"),
        request.client.host if request.client else None,
    )
    if not ip:
        raise HTTPException(status_code=404, detail="Could not determine location")

    location = await lookup_ip(ip)
    if not location:
        raise HTTPException(status_code=404, detail="Could not determine location")

    return GeoLocationResponse(**location)


@router.get("/health", response_model=HealthResponse)
async def health_check():
    from app.config import get_settings
    settings = get_settings()
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        environment=settings.environment,
    )


@router.post("/analyze", response_model=EnvironmentalAnalysis, dependencies=[Depends(verify_auth_if_required)])
async def analyze_location(request: LocationRequest):
    """Analyze environmental conditions for a given location."""
    try:
        return await analysis_service.analyze_location(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/analyze", response_model=EnvironmentalAnalysis, dependencies=[Depends(verify_auth_if_required)])
async def analyze_by_coords(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    name: Optional[str] = Query(None, description="Location name"),
):
    """Quick analysis by coordinates."""
    request = LocationRequest(latitude=lat, longitude=lon, name=name)
    return await analyze_location(request)
