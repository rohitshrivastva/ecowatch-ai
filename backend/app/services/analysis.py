from datetime import datetime, timezone
from typing import Optional

from app.models.schemas import (
    EnvironmentalAnalysis,
    LocationRequest,
    Coordinates,
    AirPollutionMetrics,
    WeatherMetrics,
    EnvironmentalIndicators,
    RiskScore,
    Recommendation,
)
from app.services.weather import weather_service, pollution_service
from app.services.satellite import satellite_service
from app.services.ai import ai_service
from app.services.risk_scoring import compute_risk_score
from app.services.cache import cache_service


class AnalysisService:
    async def analyze_location(self, request: LocationRequest) -> EnvironmentalAnalysis:
        lat, lon = request.latitude, request.longitude
        cache_key = (round(lat, 4), round(lon, 4))

        cached = await cache_service.get("analysis", *cache_key)
        if cached:
            return EnvironmentalAnalysis(**cached)

        boundary_dict = request.boundary.model_dump() if request.boundary else None

        pollution, weather, satellite = await self._fetch_all(lat, lon, boundary_dict)

        risk_data = compute_risk_score(
            aqi=pollution["aqi"],
            temperature=weather["temperature"],
            ndvi=satellite["ndvi"],
            urban_heat_index=satellite["urban_heat_index"],
            humidity=weather["humidity"],
            green_coverage_pct=satellite["green_coverage_pct"],
        )

        recommendations = await ai_service.generate_recommendations(
            pollution=pollution,
            weather=weather,
            environmental=satellite,
            risk=risk_data,
        )

        analysis = EnvironmentalAnalysis(
            location=Coordinates(latitude=lat, longitude=lon),
            location_name=request.name,
            air_pollution=AirPollutionMetrics(**pollution),
            weather=WeatherMetrics(**weather),
            environmental=EnvironmentalIndicators(
                ndvi=satellite["ndvi"],
                ndvi_label=satellite["ndvi_label"],
                urban_heat_index=satellite["urban_heat_index"],
                green_coverage_pct=satellite["green_coverage_pct"],
                water_proximity_km=satellite["water_proximity_km"],
            ),
            risk=RiskScore(**risk_data),
            recommendations=[Recommendation(**r) for r in recommendations],
            timestamp=datetime.now(timezone.utc),
        )

        await cache_service.set("analysis", analysis.model_dump(), *cache_key)
        return analysis

    async def _fetch_all(self, lat: float, lon: float, boundary: Optional[dict]):
        import asyncio

        pollution_task = pollution_service.get_pollution(lat, lon)
        weather_task = weather_service.get_weather(lat, lon)
        satellite_task = satellite_service.analyze_area(lat, lon, boundary)

        pollution, weather, satellite = await asyncio.gather(
            pollution_task, weather_task, satellite_task
        )
        return pollution, weather, satellite


analysis_service = AnalysisService()
