"""Environmental indicator analysis combining multiple data sources."""

import math
from typing import Optional


class EnvironmentalAnalyzer:
    def analyze(
        self,
        lat: float,
        lon: float,
        ndvi_result: dict,
        heat_result: dict,
    ) -> dict:
        seed = abs(int(lat * 10000) + int(lon * 10000))

        ndvi = ndvi_result.get("ndvi", 0.3)
        green_coverage = self._estimate_green_coverage(ndvi, seed)
        water_proximity = self._estimate_water_proximity(lat, lon, seed)

        return {
            "green_coverage_pct": green_coverage,
            "water_proximity_km": water_proximity,
            "biodiversity_index": round(min(ndvi * 1.5, 1.0), 2),
            "environmental_quality": self._quality_score(
                ndvi, green_coverage, heat_result.get("heat_index", 1.0)
            ),
        }

    def _estimate_green_coverage(self, ndvi: float, seed: int) -> float:
        base = ndvi * 60 + (seed % 20)
        return round(min(max(base, 5), 85), 1)

    def _estimate_water_proximity(self, lat: float, lon: float, seed: int) -> float:
        coastal_lat_factor = max(0, 30 - abs(abs(lat) - 23.5))
        proximity = 5 + (seed % 30) - coastal_lat_factor
        return round(max(proximity, 0.5), 1)

    def _quality_score(
        self, ndvi: float, green_coverage: float, heat_index: float
    ) -> float:
        veg_score = ndvi * 40
        green_score = green_coverage * 0.3
        heat_penalty = max(0, (heat_index - 1.0) * 20)
        return round(max(0, min(100, veg_score + green_score - heat_penalty)), 1)
