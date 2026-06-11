from typing import Literal, Optional

from pydantic import BaseModel, Field


class GeospatialAnalyzeRequest(BaseModel):
    bbox: list[float] = Field(
        ...,
        min_length=4,
        max_length=4,
        description="[minLon, minLat, maxLon, maxLat]",
    )
    analysis_type: Literal["water", "ndvi", "ndwi"] = Field(
        default="water", alias="analysisType"
    )
    polygon: Optional[list[list[list[float]]]] = None

    model_config = {"populate_by_name": True}


class OverlayUrls(BaseModel):
    ndvi: str
    ndwi: str
    water_stress: str = Field(alias="waterStress")

    model_config = {"populate_by_name": True}


class GeospatialAnalyzeResponse(BaseModel):
    overlay_url: str = Field(alias="overlayUrl")
    overlay_urls: OverlayUrls = Field(alias="overlayUrls")
    ndvi_score: float = Field(alias="ndviScore")
    ndwi_score: float = Field(alias="ndwiScore")
    water_risk: str = Field(alias="waterRisk")
    water_crisis_score: int = Field(alias="waterCrisisScore")
    bounds: list[float]
    insights: list[str]
    rainfall_deficit_pct: float = Field(alias="rainfallDeficitPct")
    temperature_anomaly: float = Field(alias="temperatureAnomaly")
    cached: bool = False

    model_config = {"populate_by_name": True}
