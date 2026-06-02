from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    intensity: float = Field(..., ge=0, le=1)
    value: Optional[float] = None


class HeatmapResponse(BaseModel):
    type: str
    points: list[HeatmapPoint]
    bounds: dict[str, float]
    updated_at: datetime
