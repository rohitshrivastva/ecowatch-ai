from typing import Literal, Optional

from pydantic import BaseModel, Field


class GeospatialAnalyzeRequest(BaseModel):
    bbox: list[float] = Field(
        ...,
        min_length=4,
        max_length=4,
        description="[minLon, minLat, maxLon, maxLat]",
    )
    analysis_type: Literal["water", "ndvi", "ndwi", "climate"] = Field(
        default="water", alias="analysisType"
    )
    polygon: Optional[list[list[list[float]]]] = None

    model_config = {"populate_by_name": True}


class ClimateRiskComponentOut(BaseModel):
    name: str
    key: str
    score: float
    weight: float
    contribution: float


class OverlayUrls(BaseModel):
    ndvi: str
    ndwi: str
    water_stress: str = Field(alias="waterStress")
    climate_risk: str = Field(default="", alias="climateRisk")

    model_config = {"populate_by_name": True}


class GeospatialAnalyzeResponse(BaseModel):
    overlay_url: str = Field(alias="overlayUrl")
    overlay_urls: OverlayUrls = Field(alias="overlayUrls")
    ndvi_score: float = Field(alias="ndviScore")
    ndwi_score: float = Field(alias="ndwiScore")
    water_risk: str = Field(alias="waterRisk")
    water_crisis_score: int = Field(alias="waterCrisisScore")
    climate_risk_score: Optional[int] = Field(default=None, alias="climateRiskScore")
    climate_risk_category: Optional[str] = Field(default=None, alias="climateRiskCategory")
    climate_risk_trend: Optional[str] = Field(default=None, alias="climateRiskTrend")
    climate_risk_summary: Optional[str] = Field(default=None, alias="climateRiskSummary")
    climate_risk_components: list[ClimateRiskComponentOut] = Field(
        default_factory=list, alias="climateRiskComponents"
    )
    bounds: list[float]
    insights: list[str]
    climate_insights: list[str] = Field(default_factory=list, alias="climateInsights")
    rainfall_deficit_pct: float = Field(alias="rainfallDeficitPct")
    temperature_anomaly: float = Field(alias="temperatureAnomaly")
    cached: bool = False

    model_config = {"populate_by_name": True}
