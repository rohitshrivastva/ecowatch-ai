"""US EPA Air Quality Index from pollutant concentrations (OpenWeather units)."""

from __future__ import annotations

from typing import Optional

# (C_low, C_high, I_low, I_high)
PM25_BREAKPOINTS = [
    (0.0, 12.0, 0, 50),
    (12.1, 35.4, 51, 100),
    (35.5, 55.4, 101, 150),
    (55.5, 150.4, 151, 200),
    (150.5, 250.4, 201, 300),
    (250.5, 350.4, 301, 400),
    (350.5, 500.4, 401, 500),
]

PM10_BREAKPOINTS = [
    (0, 54, 0, 50),
    (55, 154, 51, 100),
    (155, 254, 101, 150),
    (255, 354, 151, 200),
    (355, 424, 201, 300),
    (425, 504, 301, 400),
    (505, 604, 401, 500),
]

O3_8H_BREAKPOINTS = [
    (0, 54, 0, 50),
    (55, 70, 51, 100),
    (71, 85, 101, 150),
    (86, 105, 151, 200),
    (106, 200, 201, 300),
]

NO2_1H_BREAKPOINTS = [
    (0, 53, 0, 50),
    (54, 100, 51, 100),
    (101, 360, 101, 150),
    (361, 649, 151, 200),
    (650, 1249, 201, 300),
    (1250, 1649, 301, 400),
    (1650, 2049, 401, 500),
]

SO2_1H_BREAKPOINTS = [
    (0, 35, 0, 50),
    (36, 75, 51, 100),
    (76, 185, 101, 150),
    (186, 304, 151, 200),
    (305, 604, 201, 300),
    (605, 804, 301, 400),
    (805, 1004, 401, 500),
]

CO_8H_BREAKPOINTS = [
    (0.0, 4.4, 0, 50),
    (4.5, 9.4, 51, 100),
    (9.5, 12.4, 101, 150),
    (12.5, 15.4, 151, 200),
    (15.5, 30.4, 201, 300),
    (30.5, 40.4, 301, 400),
    (40.5, 50.4, 401, 500),
]


def _truncate_pm(value: float) -> float:
    return int(value * 10) / 10.0


def _ug_m3_to_ppb(ug_m3: float, molecular_weight: float) -> float:
    return (ug_m3 * 24.45) / molecular_weight


def _ug_m3_to_ppm(ug_m3: float, molecular_weight: float) -> float:
    return (ug_m3 * 24.45) / (molecular_weight * 1000.0)


def _sub_index(concentration: float, breakpoints: list[tuple[float, float, int, int]]) -> Optional[int]:
    if concentration < 0:
        return None
    for c_lo, c_hi, i_lo, i_hi in breakpoints:
        if c_lo <= concentration <= c_hi:
            return round((i_hi - i_lo) / (c_hi - c_lo) * (concentration - c_lo) + i_lo)
    if breakpoints and concentration > breakpoints[-1][1]:
        return 500
    return None


def us_epa_aqi_from_components(components: dict) -> int:
    """
    Compute US EPA AQI as the max sub-index across available pollutants.
    OpenWeather concentrations: pm2_5, pm10, o3, no2, so2, co (µg/m³).
    """
    indices: list[int] = []

    pm25 = components.get("pm2_5")
    if pm25 is not None:
        idx = _sub_index(_truncate_pm(float(pm25)), PM25_BREAKPOINTS)
        if idx is not None:
            indices.append(idx)

    pm10 = components.get("pm10")
    if pm10 is not None:
        idx = _sub_index(_truncate_pm(float(pm10)), PM10_BREAKPOINTS)
        if idx is not None:
            indices.append(idx)

    o3 = components.get("o3")
    if o3 is not None:
        o3_ppb = _ug_m3_to_ppb(float(o3), 48.0)
        idx = _sub_index(o3_ppb, O3_8H_BREAKPOINTS)
        if idx is not None:
            indices.append(idx)

    no2 = components.get("no2")
    if no2 is not None:
        no2_ppb = _ug_m3_to_ppb(float(no2), 46.0)
        idx = _sub_index(no2_ppb, NO2_1H_BREAKPOINTS)
        if idx is not None:
            indices.append(idx)

    so2 = components.get("so2")
    if so2 is not None:
        so2_ppb = _ug_m3_to_ppb(float(so2), 64.0)
        idx = _sub_index(so2_ppb, SO2_1H_BREAKPOINTS)
        if idx is not None:
            indices.append(idx)

    co = components.get("co")
    if co is not None:
        co_ppm = _ug_m3_to_ppm(float(co), 28.0)
        idx = _sub_index(co_ppm, CO_8H_BREAKPOINTS)
        if idx is not None:
            indices.append(idx)

    if not indices:
        return 50

    return max(indices)
