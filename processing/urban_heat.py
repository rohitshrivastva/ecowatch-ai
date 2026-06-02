"""Urban heat island detection and heatmap generation."""

import numpy as np
from typing import Optional


class UrbanHeatAnalyzer:
    def analyze(
        self,
        lat: float,
        lon: float,
        boundary: Optional[dict] = None,
        land_surface_temp: Optional[np.ndarray] = None,
    ) -> dict:
        if land_surface_temp is not None:
            return self._analyze_from_raster(land_surface_temp, lat, lon)

        return self._simulate_heat(lat, lon)

    def _analyze_from_raster(
        self, lst: np.ndarray, lat: float, lon: float
    ) -> dict:
        mean_temp = float(np.nanmean(lst))
        rural_baseline = mean_temp - 3
        heat_index = mean_temp / max(rural_baseline, 1)

        heatmap_points = self._generate_heatmap_points(lat, lon, lst)

        return {
            "heat_index": round(heat_index, 2),
            "mean_surface_temp_c": round(mean_temp, 1),
            "is_heat_island": heat_index > 1.2,
            "heatmap_points": heatmap_points,
        }

    def _simulate_heat(self, lat: float, lon: float) -> dict:
        seed = abs(int(lat * 10000) + int(lon * 10000))
        rng = np.random.default_rng(seed)

        is_urban = (seed % 3) == 0
        base_temp = 28 + (seed % 12)

        if is_urban:
            heat_index = 1.2 + (seed % 40) / 100
        else:
            heat_index = 0.8 + (seed % 30) / 100

        grid_size = 8
        temp_grid = rng.normal(base_temp, 2, (grid_size, grid_size))
        if is_urban:
            center = grid_size // 2
            temp_grid[center - 1 : center + 2, center - 1 : center + 2] += 4

        heatmap_points = []
        step = 0.005
        for i in range(grid_size):
            for j in range(grid_size):
                heatmap_points.append([
                    lat + (i - grid_size / 2) * step,
                    lon + (j - grid_size / 2) * step,
                    float(temp_grid[i, j]),
                ])

        return {
            "heat_index": round(heat_index, 2),
            "mean_surface_temp_c": round(float(np.mean(temp_grid)), 1),
            "is_heat_island": heat_index > 1.2,
            "heatmap_points": heatmap_points,
        }

    def _generate_heatmap_points(
        self, lat: float, lon: float, lst: np.ndarray
    ) -> list:
        h, w = lst.shape
        step = 0.003
        points = []
        for i in range(min(h, 20)):
            for j in range(min(w, 20)):
                points.append([
                    lat + (i - h / 2) * step,
                    lon + (j - w / 2) * step,
                    float(lst[i * h // 20, j * w // 20]),
                ])
        return points
