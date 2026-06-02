from pydantic import BaseModel, Field


class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    intensity: float = Field(..., ge=0, le=1)


class HeatmapResponse(BaseModel):
    type: str
    points: list[HeatmapPoint]
    bounds: dict[str, float]
