import numpy as np

from app.schemas.heatmap import HeatmapPoint, HeatmapResponse
from app.services.cache import cache_service
from app.services.satellite import satellite_service
from app.services.weather import pollution_service, weather_service


class HeatmapService:
    async def generate(
        self,
        heatmap_type: str,
        north: float,
        south: float,
        east: float,
        west: float,
        zoom: int = 10,
    ) -> HeatmapResponse:
        cache_key = (
            heatmap_type,
            round(north, 3),
            round(south, 3),
            round(east, 3),
            round(west, 3),
            zoom,
        )
        cached = await cache_service.get("heatmap", *cache_key)
        if cached:
            return HeatmapResponse(**cached)

        grid = max(6, min(20, zoom))
        lats = np.linspace(south, north, grid)
        lons = np.linspace(west, east, grid)
        points: list[HeatmapPoint] = []

        for lat in lats:
            for lon in lons:
                intensity = await self._intensity_at(heatmap_type, float(lat), float(lon))
                points.append(HeatmapPoint(lat=float(lat), lng=float(lon), intensity=intensity))

        response = HeatmapResponse(
            type=heatmap_type,
            points=points,
            bounds={"north": north, "south": south, "east": east, "west": west},
        )
        await cache_service.set("heatmap", response.model_dump(), *cache_key)
        return response

    async def _intensity_at(self, heatmap_type: str, lat: float, lon: float) -> float:
        if heatmap_type == "aqi":
            data = await pollution_service.get_pollution(lat, lon)
            return min(1.0, max(0.0, data["aqi"] / 200.0))

        if heatmap_type == "temperature":
            data = await weather_service.get_weather(lat, lon)
            temp = data["temperature"]
            return min(1.0, max(0.0, (temp - 5) / 40.0))

        if heatmap_type == "vegetation":
            sat = await satellite_service.analyze_area(lat, lon)
            return min(1.0, max(0.0, (sat["ndvi"] + 0.2) / 1.1))

        if heatmap_type == "environmental-risk":
            pollution = await pollution_service.get_pollution(lat, lon)
            weather = await weather_service.get_weather(lat, lon)
            sat = await satellite_service.analyze_area(lat, lon)
            aqi_n = pollution["aqi"] / 200.0
            heat_n = min(1.0, sat["urban_heat_index"] / 2.0)
            veg_n = 1.0 - min(1.0, max(0.0, (sat["ndvi"] + 0.2) / 1.1))
            humid_n = 1.0 - (weather["humidity"] / 100.0)
            score = 0.35 * aqi_n + 0.25 * heat_n + 0.25 * veg_n + 0.15 * humid_n
            return min(1.0, max(0.0, score))

        return 0.5


heatmap_service = HeatmapService()
