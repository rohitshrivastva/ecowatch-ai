from typing import Optional

from fastapi import APIRouter, Query, HTTPException

from app.models.schemas import LocationRequest, EnvironmentalAnalysis, HealthResponse
from app.services.analysis import analysis_service

router = APIRouter(prefix="/api/v1", tags=["environment"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    from app.config import get_settings
    settings = get_settings()
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        environment=settings.environment,
    )


@router.post("/analyze", response_model=EnvironmentalAnalysis)
async def analyze_location(request: LocationRequest):
    """Analyze environmental conditions for a given location."""
    try:
        return await analysis_service.analyze_location(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/analyze", response_model=EnvironmentalAnalysis)
async def analyze_by_coords(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    name: Optional[str] = Query(None, description="Location name"),
):
    """Quick analysis by coordinates."""
    request = LocationRequest(latitude=lat, longitude=lon, name=name)
    return await analyze_location(request)
