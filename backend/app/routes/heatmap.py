from typing import Optional

from fastapi import APIRouter, Query

from app.schemas.heatmap import HeatmapResponse
from app.services.heatmap import heatmap_service

router = APIRouter(prefix="/api/v1/heatmap", tags=["heatmap"])


@router.get("/aqi", response_model=HeatmapResponse)
async def heatmap_aqi(
    north: float = Query(..., ge=-90, le=90),
    south: float = Query(..., ge=-90, le=90),
    east: float = Query(..., ge=-180, le=180),
    west: float = Query(..., ge=-180, le=180),
    zoom: int = Query(10, ge=4, le=16),
    center_lat: Optional[float] = Query(None, ge=-90, le=90),
    center_lon: Optional[float] = Query(None, ge=-180, le=180),
):
    return await heatmap_service.generate(
        "aqi", north, south, east, west, zoom, center_lat, center_lon
    )


@router.get("/temperature", response_model=HeatmapResponse)
async def heatmap_temperature(
    north: float = Query(..., ge=-90, le=90),
    south: float = Query(..., ge=-90, le=90),
    east: float = Query(..., ge=-180, le=180),
    west: float = Query(..., ge=-180, le=180),
    zoom: int = Query(10, ge=4, le=16),
    center_lat: Optional[float] = Query(None, ge=-90, le=90),
    center_lon: Optional[float] = Query(None, ge=-180, le=180),
):
    return await heatmap_service.generate(
        "temperature", north, south, east, west, zoom, center_lat, center_lon
    )


@router.get("/vegetation", response_model=HeatmapResponse)
async def heatmap_vegetation(
    north: float = Query(..., ge=-90, le=90),
    south: float = Query(..., ge=-90, le=90),
    east: float = Query(..., ge=-180, le=180),
    west: float = Query(..., ge=-180, le=180),
    zoom: int = Query(10, ge=4, le=16),
    center_lat: Optional[float] = Query(None, ge=-90, le=90),
    center_lon: Optional[float] = Query(None, ge=-180, le=180),
):
    return await heatmap_service.generate(
        "vegetation", north, south, east, west, zoom, center_lat, center_lon
    )


@router.get("/environmental-risk", response_model=HeatmapResponse)
async def heatmap_environmental_risk(
    north: float = Query(..., ge=-90, le=90),
    south: float = Query(..., ge=-90, le=90),
    east: float = Query(..., ge=-180, le=180),
    west: float = Query(..., ge=-180, le=180),
    zoom: int = Query(10, ge=4, le=16),
    center_lat: Optional[float] = Query(None, ge=-90, le=90),
    center_lon: Optional[float] = Query(None, ge=-180, le=180),
):
    return await heatmap_service.generate(
        "environmental-risk", north, south, east, west, zoom, center_lat, center_lon
    )


@router.get("/water-stress", response_model=HeatmapResponse)
async def heatmap_water_stress(
    north: float = Query(..., ge=-90, le=90),
    south: float = Query(..., ge=-90, le=90),
    east: float = Query(..., ge=-180, le=180),
    west: float = Query(..., ge=-180, le=180),
    zoom: int = Query(10, ge=4, le=16),
    center_lat: Optional[float] = Query(None, ge=-90, le=90),
    center_lon: Optional[float] = Query(None, ge=-180, le=180),
):
    return await heatmap_service.generate(
        "water-stress", north, south, east, west, zoom, center_lat, center_lon
    )
