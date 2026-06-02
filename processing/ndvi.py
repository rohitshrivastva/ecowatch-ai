"""NDVI computation from satellite band data.

NDVI = (NIR - RED) / (NIR + RED)

Values range from -1 to 1:
  < 0.2  = Bare soil / urban
  0.2-0.4 = Sparse vegetation
  0.4-0.6 = Moderate vegetation
  > 0.6  = Dense vegetation
"""

import numpy as np
from typing import Optional


NDVI_LABELS = [
    (0.6, "Dense Vegetation"),
    (0.4, "Moderate Vegetation"),
    (0.2, "Sparse Vegetation"),
    (0.0, "Bare Soil / Urban"),
    (-1.0, "Water / No Data"),
]


def ndvi_label(value: float) -> str:
    for threshold, label in NDVI_LABELS:
        if value >= threshold:
            return label
    return "Water / No Data"


class NDVIProcessor:
    def compute_ndvi(
        self,
        lat: float,
        lon: float,
        boundary: Optional[dict] = None,
        nir_band: Optional[np.ndarray] = None,
        red_band: Optional[np.ndarray] = None,
    ) -> dict:
        if nir_band is not None and red_band is not None:
            return self._compute_from_bands(nir_band, red_band)

        return self._simulate_ndvi(lat, lon, boundary)

    def _compute_from_bands(self, nir: np.ndarray, red: np.ndarray) -> dict:
        denominator = nir.astype(float) + red.astype(float)
        denominator[denominator == 0] = 1e-10
        ndvi_array = (nir.astype(float) - red.astype(float)) / denominator

        mean_ndvi = float(np.nanmean(ndvi_array))
        grid = self._downsample_grid(ndvi_array, 10)

        return {
            "ndvi": round(mean_ndvi, 3),
            "label": ndvi_label(mean_ndvi),
            "grid": grid,
            "min": round(float(np.nanmin(ndvi_array)), 3),
            "max": round(float(np.nanmax(ndvi_array)), 3),
        }

    def _simulate_ndvi(
        self, lat: float, lon: float, boundary: Optional[dict] = None
    ) -> dict:
        seed = abs(int(lat * 10000) + int(lon * 10000))
        rng = np.random.default_rng(seed)

        base_ndvi = 0.15 + (seed % 50) / 100
        if abs(lat) < 30:
            base_ndvi += 0.1
        if abs(lat) > 45:
            base_ndvi -= 0.05

        grid_size = 10
        grid_array = rng.normal(base_ndvi, 0.08, (grid_size, grid_size))
        grid_array = np.clip(grid_array, -0.2, 0.9)

        mean_ndvi = float(np.mean(grid_array))

        return {
            "ndvi": round(mean_ndvi, 3),
            "label": ndvi_label(mean_ndvi),
            "grid": grid_array.tolist(),
            "min": round(float(np.min(grid_array)), 3),
            "max": round(float(np.max(grid_array)), 3),
        }

    def _downsample_grid(self, array: np.ndarray, size: int) -> list:
        h, w = array.shape
        step_h = max(1, h // size)
        step_w = max(1, w // size)
        sampled = array[::step_h, ::step_w][:size, :size]
        return sampled.tolist()

    def detect_vegetation_change(
        self, current_ndvi: float, historical_ndvi: float
    ) -> dict:
        change = current_ndvi - historical_ndvi
        pct_change = (change / max(abs(historical_ndvi), 0.01)) * 100

        if change > 0.05:
            trend = "improving"
        elif change < -0.05:
            trend = "declining"
        else:
            trend = "stable"

        return {
            "current": current_ndvi,
            "historical": historical_ndvi,
            "change": round(change, 3),
            "pct_change": round(pct_change, 1),
            "trend": trend,
        }
