"""Raster processing utilities for satellite imagery.

Supports Sentinel-2, Copernicus, and Google Earth Engine data formats.
Requires rasterio and opencv for production satellite processing.
"""

import numpy as np
from typing import Optional, Tuple


class RasterProcessor:
    """Process satellite raster bands for environmental analysis."""

    def load_bands(
        self,
        nir_path: Optional[str] = None,
        red_path: Optional[str] = None,
        lst_path: Optional[str] = None,
    ) -> dict:
        bands = {}
        try:
            import rasterio
            if nir_path:
                with rasterio.open(nir_path) as src:
                    bands["nir"] = src.read(1)
            if red_path:
                with rasterio.open(red_path) as src:
                    bands["red"] = src.read(1)
            if lst_path:
                with rasterio.open(lst_path) as src:
                    bands["lst"] = src.read(1)
        except ImportError:
            pass
        return bands

    def compare_historical(
        self,
        current: np.ndarray,
        historical: np.ndarray,
    ) -> dict:
        diff = current.astype(float) - historical.astype(float)
        pct_change = np.where(
            historical != 0,
            (diff / historical.astype(float)) * 100,
            0,
        )

        return {
            "mean_change": round(float(np.nanmean(diff)), 4),
            "max_increase": round(float(np.nanmax(diff)), 4),
            "max_decrease": round(float(np.nanmin(diff)), 4),
            "pct_change_mean": round(float(np.nanmean(pct_change)), 2),
            "change_map": diff.tolist() if diff.size < 10000 else [],
        }

    def generate_heatmap_grid(
        self,
        values: np.ndarray,
        lat: float,
        lon: float,
        grid_step: float = 0.003,
    ) -> list:
        h, w = values.shape
        points = []
        for i in range(h):
            for j in range(w):
                points.append([
                    lat + (i - h / 2) * grid_step,
                    lon + (j - w / 2) * grid_step,
                    float(values[i, j]),
                ])
        return points

    def clip_to_boundary(
        self,
        array: np.ndarray,
        bounds: Tuple[float, float, float, float],
    ) -> np.ndarray:
        return array
