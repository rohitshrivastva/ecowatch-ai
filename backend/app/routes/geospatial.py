from fastapi import APIRouter, Request

from app.schemas.geospatial import GeospatialAnalyzeRequest, GeospatialAnalyzeResponse
from app.services.geospatial_water import geospatial_water_service

router = APIRouter(prefix="/api/v1/geospatial", tags=["geospatial"])


def _request_base_url(request: Request) -> str:
    return str(request.base_url).rstrip("/")


@router.post("/analyze-region", response_model=GeospatialAnalyzeResponse)
async def analyze_region(body: GeospatialAnalyzeRequest, request: Request):
    result = await geospatial_water_service.analyze_region(
        bbox=body.bbox,
        analysis_type=body.analysis_type,
        request_base_url=_request_base_url(request),
    )
    return GeospatialAnalyzeResponse(**result)
