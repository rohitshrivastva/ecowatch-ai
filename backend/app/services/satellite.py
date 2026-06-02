import sys
from pathlib import Path
from typing import Optional

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from processing.ndvi import NDVIProcessor
from processing.urban_heat import UrbanHeatAnalyzer
from processing.environmental import EnvironmentalAnalyzer


class SatelliteService:
    def __init__(self):
        self.ndvi_processor = NDVIProcessor()
        self.heat_analyzer = UrbanHeatAnalyzer()
        self.env_analyzer = EnvironmentalAnalyzer()

    async def analyze_area(
        self, lat: float, lon: float, boundary: Optional[dict] = None
    ) -> dict:
        ndvi_result = self.ndvi_processor.compute_ndvi(lat, lon, boundary)
        heat_result = self.heat_analyzer.analyze(lat, lon, boundary)
        env_result = self.env_analyzer.analyze(lat, lon, ndvi_result, heat_result)

        return {
            "ndvi": ndvi_result["ndvi"],
            "ndvi_label": ndvi_result["label"],
            "urban_heat_index": heat_result["heat_index"],
            "green_coverage_pct": env_result["green_coverage_pct"],
            "water_proximity_km": env_result["water_proximity_km"],
            "heatmap_data": heat_result.get("heatmap_points", []),
            "ndvi_grid": ndvi_result.get("grid", []),
        }


satellite_service = SatelliteService()
