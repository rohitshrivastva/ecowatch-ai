from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Coordinates(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class AreaBoundary(BaseModel):
    type: str = "Polygon"
    coordinates: list[list[list[float]]]


class LocationRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    name: Optional[str] = None
    boundary: Optional[AreaBoundary] = None


class AirPollutionMetrics(BaseModel):
    aqi: int
    aqi_label: str
    pm25: float
    pm10: float
    no2: float
    co: float
    ozone: float


class WeatherMetrics(BaseModel):
    temperature: float
    feels_like: float
    humidity: int
    wind_speed: float
    uv_index: float
    description: str


class EnvironmentalIndicators(BaseModel):
    ndvi: float
    ndvi_label: str
    urban_heat_index: float
    green_coverage_pct: float
    water_proximity_km: float


class RiskScore(BaseModel):
    score: int = Field(..., ge=0, le=100)
    level: str
    factors: dict[str, float]


class Recommendation(BaseModel):
    category: str
    priority: str
    title: str
    description: str
    actions: list[str]


class EnvironmentalAnalysis(BaseModel):
    location_id: Optional[int] = None
    location: Coordinates
    location_name: Optional[str] = None
    air_pollution: AirPollutionMetrics
    weather: WeatherMetrics
    environmental: EnvironmentalIndicators
    risk: RiskScore
    recommendations: list[Recommendation]
    timestamp: datetime


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
