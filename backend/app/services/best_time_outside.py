"""Best Time Outside — rule engine per docs/BEST_TIME_OUTSIDE_RULES.md."""

from datetime import datetime, timedelta, timezone
from typing import Any


STATUS_EXCELLENT = "Excellent"
STATUS_GOOD = "Good"
STATUS_MODERATE = "Moderate"
STATUS_POOR = "Poor"
STATUS_DANGEROUS = "Dangerous"


def _parse_ts(value: str) -> datetime:
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _format_ampm(dt: datetime) -> str:
    h = dt.hour % 12 or 12
    suffix = "AM" if dt.hour < 12 else "PM"
    if dt.minute:
        return f"{h}:{dt.minute:02d} {suffix}"
    return f"{h} {suffix}"


def _format_window(start: datetime, hours: int, tz_offset_sec: int) -> str:
    local_start = start + timedelta(seconds=tz_offset_sec)
    local_end = local_start + timedelta(hours=hours)
    return f"{_format_ampm(local_start)} – {_format_ampm(local_end)}"


def _format_local_clock(dt: datetime) -> str:
    h = dt.hour % 12 or 12
    suffix = "AM" if dt.hour < 12 else "PM"
    return f"{h}:{dt.minute:02d} {suffix}"


def _timezone_label(tz_offset_sec: int) -> str:
    total_minutes = tz_offset_sec // 60
    sign = "+" if total_minutes >= 0 else "-"
    hours, rem = divmod(abs(total_minutes), 60)
    if rem:
        return f"UTC{sign}{hours}:{rem:02d}"
    return f"UTC{sign}{hours}"


def _local_time_fields(tz_offset_sec: int) -> dict[str, Any]:
    local_now = datetime.now(timezone.utc) + timedelta(seconds=tz_offset_sec)
    return {
        "local_time": _format_local_clock(local_now),
        "timezone_offset_seconds": tz_offset_sec,
        "timezone_label": _timezone_label(tz_offset_sec),
    }


def _format_after(start: datetime, tz_offset_sec: int) -> str:
    local = start + timedelta(seconds=tz_offset_sec)
    return f"After {_format_ampm(local)}"


def _is_thunderstorm(main: str, description: str) -> bool:
    text = f"{main} {description}".lower()
    return "thunder" in text


def rain_status_from_pop(pop_pct: float, thunder: bool) -> str:
    if thunder or pop_pct > 75:
        return STATUS_DANGEROUS
    if pop_pct > 50:
        return STATUS_POOR
    if pop_pct > 25:
        return STATUS_MODERATE
    if pop_pct > 10:
        return STATUS_GOOD
    return STATUS_EXCELLENT


def _aqi_penalty(aqi: int) -> float:
    if aqi <= 50:
        return 0
    if aqi <= 100:
        return 12
    if aqi <= 150:
        return 25
    if aqi <= 200:
        return 40
    return 55


def _temp_penalty(temp: float) -> float:
    if 18 <= temp <= 28:
        return 0
    if 15 <= temp < 18 or 28 < temp <= 32:
        return 10
    if 10 <= temp < 15 or 32 < temp <= 36:
        return 22
    return 35


def _hour_score(
    pop: float,
    temp: float,
    aqi: int,
    weather_main: str,
    description: str,
    wind_speed: float,
    rain_mm: float,
    hour_local: int,
) -> float:
    pop_pct = pop * 100
    if _is_thunderstorm(weather_main, description):
        return 0.0

    score = 100.0
    if pop_pct > 75:
        score -= 70
    elif pop_pct > 50:
        score -= 50
    elif pop_pct > 25:
        score -= 28
    elif pop_pct > 10:
        score -= 12

    if rain_mm >= 5:
        score -= 20
    elif rain_mm >= 2:
        score -= 10

    score -= _aqi_penalty(aqi)
    score -= _temp_penalty(temp)

    if hour_local >= 11 and hour_local <= 15:
        score -= 8

    if wind_speed > 12:
        score -= 15
    elif wind_speed > 8:
        score -= 8

    return max(0.0, score)


def _overall_status(
    rain_status: str,
    aqi: int,
    temp: float,
    thunder_any: bool,
) -> str:
    if thunder_any:
        return STATUS_DANGEROUS
    statuses = [rain_status]
    if aqi > 200:
        statuses.append(STATUS_DANGEROUS)
    elif aqi > 150:
        statuses.append(STATUS_POOR)
    elif aqi > 100:
        statuses.append(STATUS_MODERATE)
    if temp > 36 or temp < 5:
        statuses.append(STATUS_DANGEROUS)
    elif temp > 32 or temp < 10:
        statuses.append(STATUS_POOR)

    order = [
        STATUS_DANGEROUS,
        STATUS_POOR,
        STATUS_MODERATE,
        STATUS_GOOD,
        STATUS_EXCELLENT,
    ]
    for level in order:
        if level in statuses:
            return level
    return STATUS_GOOD


def _activities_for(status: str, pop_pct: float) -> list[str]:
    if status in (STATUS_DANGEROUS, STATUS_POOR):
        return ["Avoid prolonged outdoor exposure"]
    if status == STATUS_MODERATE or pop_pct > 10:
        return ["Short walks", "Indoor/outdoor flexible activities"]
    return ["Walking", "Jogging", "Cycling", "Gardening"]


def _build_why(
    status: str,
    pop_pct: float,
    temp: float,
    aqi: int,
    thunder_any: bool,
    avoid_labels: list[str],
    time_window: str,
) -> str:
    if thunder_any:
        return (
            "Thunderstorms are expected in the forecast. "
            "Stay indoors until conditions improve."
        )
    if status == STATUS_DANGEROUS:
        return (
            "Heavy rain, storms, or hazardous air quality are expected. "
            "Outdoor activity is not recommended right now."
        )
    if avoid_labels and pop_pct <= 10:
        return (
            f"{time_window} is the driest window today "
            f"({round(temp)}°C, {round(pop_pct)}% rain chance). "
            f"Wetter conditions are expected around {avoid_labels[0]}."
        )
    if avoid_labels and pop_pct <= 25:
        return (
            f"{time_window} offers lower rain probability "
            f"({round(pop_pct)}%) than {avoid_labels[0]}."
        )
    if pop_pct <= 10 and aqi <= 50:
        return (
            f"{time_window}: clear weather, comfortable temperatures, "
            "and low rain probability."
        )
    if pop_pct <= 25:
        return (
            f"{time_window}: lower rain probability ({round(pop_pct)}%) "
            f"and temperatures around {round(temp)}°C."
        )
    return (
        f"{time_window}: AQI {aqi}, {round(temp)}°C, "
        f"{round(pop_pct)}% rain chance in this window."
    )


def _build_suggestions(
    status: str,
    pop_pct: float,
    show_umbrella: bool,
    avoid_labels: list[str],
    thunder_any: bool,
) -> list[str]:
    suggestions: list[str] = []
    if thunder_any:
        return [
            "Avoid outdoor activity until weather conditions improve.",
        ]
    if status in (STATUS_EXCELLENT, STATUS_GOOD):
        suggestions.append("Good time for walking and outdoor exercise.")
    elif status == STATUS_MODERATE:
        suggestions.append("Keep outdoor plans flexible and watch the forecast.")
    else:
        suggestions.append("Limit time outside and plan indoor alternatives.")

    if show_umbrella:
        suggestions.append("Carry an umbrella in case showers develop.")
    if avoid_labels:
        suggestions.append(
            f"Avoid outdoor activities during {avoid_labels[0]} due to rain intensity."
        )
    if pop_pct > 25 and status not in (STATUS_DANGEROUS, STATUS_POOR):
        suggestions.append("Shorten outdoor windows if rain probability increases.")
    return suggestions[:2]


def _slot_timeline_kind(
    pop_pct: float,
    is_best: bool,
    is_avoid: bool,
) -> str:
    if is_best:
        return "best"
    if is_avoid:
        return "avoid"
    if pop_pct > 50:
        return "poor"
    if pop_pct > 25:
        return "moderate"
    return "good"


def _build_timeline(
    scored: list[tuple[float, dict, int]],
    tz_offset: int,
    best_ts: datetime,
    avoid_ts_keys: set[str],
) -> list[dict[str, Any]]:
    timeline: list[dict[str, Any]] = []
    for _, slot, _ in scored:
        ts = _parse_ts(slot["timestamp"])
        local = ts + timedelta(seconds=tz_offset)
        pop_pct = float(slot.get("pop", 0)) * 100
        ts_key = slot["timestamp"]
        is_best = ts == best_ts
        is_avoid = ts_key in avoid_ts_keys
        timeline.append(
            {
                "label": _format_ampm(local),
                "pop_pct": round(pop_pct),
                "kind": _slot_timeline_kind(pop_pct, is_best, is_avoid),
            }
        )
    return timeline


def refresh_local_time_fields(data: dict[str, Any]) -> dict[str, Any]:
    """Update local clock fields (e.g. when serving cached analysis)."""
    offset = data.get("timezone_offset_seconds")
    if offset is None:
        return data
    return {**data, **_local_time_fields(int(offset))}


def compute_best_time_outside(
    forecast: dict[str, Any],
    pollution: dict[str, Any],
    weather: dict[str, Any],
) -> dict[str, Any]:
    slots = forecast.get("slots") or []
    tz_offset = int(forecast.get("timezone_offset") or 0)
    aqi = int(pollution.get("aqi", 50))

    if not slots:
        return {
            "time_window": "Unavailable",
            "environmental_status": STATUS_MODERATE,
            "why": "Forecast data is not available for this location.",
            "suggestions": ["Check the map or try again shortly."],
            "suggested_activities": [],
            "avoid_windows": [],
            "timeline": [],
            "rain_probability_pct": None,
            "wind_speed": round(float(weather.get("wind_speed", 0)), 1),
            "show_umbrella": False,
            "thunderstorm_alert": False,
            **_local_time_fields(tz_offset),
        }

    scored: list[tuple[float, dict, int]] = []
    thunder_any = False
    avoid_windows: list[str] = []
    avoid_ts_keys: set[str] = set()

    for slot in slots:
        ts = _parse_ts(slot["timestamp"])
        local_hour = (ts + timedelta(seconds=tz_offset)).hour
        main = slot.get("weather_main", "Clear")
        desc = slot.get("description", "")
        pop = float(slot.get("pop", 0))
        pop_pct = pop * 100
        if _is_thunderstorm(main, desc):
            thunder_any = True

        rain_st = rain_status_from_pop(pop_pct, False)
        if rain_st in (STATUS_POOR, STATUS_DANGEROUS):
            label = _format_window(ts, 3, tz_offset)
            avoid_windows.append(f"{label} · {desc or main.lower()}")
            avoid_ts_keys.add(slot["timestamp"])

        score = _hour_score(
            pop,
            float(slot.get("temp", weather.get("temperature", 22))),
            aqi,
            main,
            desc,
            float(slot.get("wind_speed", 0)),
            float(slot.get("rain_mm", 0)),
            local_hour,
        )
        scored.append((score, slot, local_hour))

    if thunder_any:
        avoid_labels = [w.split(" · ")[0] for w in avoid_windows[:2]]
        return {
            "time_window": "Not recommended today",
            "environmental_status": STATUS_DANGEROUS,
            "why": _build_why(
                STATUS_DANGEROUS, 100, 0, aqi, True, avoid_labels, "Today"
            ),
            "suggestions": _build_suggestions(
                STATUS_DANGEROUS, 100, True, avoid_labels, True
            ),
            "suggested_activities": ["Stay indoors"],
            "avoid_windows": avoid_windows[:2],
            "timeline": _build_timeline(
                scored,
                tz_offset,
                _parse_ts(scored[0][1]["timestamp"]) if scored else _parse_ts(slots[0]["timestamp"]),
                avoid_ts_keys,
            ),
            "rain_probability_pct": 100.0,
            "wind_speed": round(
                float(scored[0][1].get("wind_speed", weather.get("wind_speed", 0)))
                if scored
                else float(weather.get("wind_speed", 0)),
                1,
            ),
            "show_umbrella": True,
            "thunderstorm_alert": True,
            **_local_time_fields(tz_offset),
        }

    best_score, best_slot, _ = max(scored, key=lambda x: x[0])
    best_ts = _parse_ts(best_slot["timestamp"])
    best_pop_pct = float(best_slot.get("pop", 0)) * 100
    best_temp = float(best_slot.get("temp", weather.get("temperature", 22)))
    best_main = best_slot.get("weather_main", "Clear")
    best_desc = best_slot.get("description", "")

    rain_status = rain_status_from_pop(
        best_pop_pct, _is_thunderstorm(best_main, best_desc)
    )
    env_status = _overall_status(
        rain_status, aqi, best_temp, thunder_any
    )

    if best_score < 25:
        later = [s for s in scored if s[2] >= 16]
        if later:
            best_score, best_slot, _ = max(later, key=lambda x: x[0])
            best_ts = _parse_ts(best_slot["timestamp"])
            best_pop_pct = float(best_slot.get("pop", 0)) * 100
            best_temp = float(best_slot.get("temp", 22))
            time_window = _format_after(best_ts, tz_offset)
            env_status = _overall_status(
                rain_status_from_pop(best_pop_pct, False), aqi, best_temp, False
            )
        else:
            time_window = "Not recommended today"
            env_status = STATUS_POOR
    elif best_score < 45:
        time_window = _format_after(best_ts, tz_offset)
    else:
        time_window = _format_window(best_ts, 2, tz_offset)

    avoid_labels = [w.split(" · ")[0] for w in avoid_windows[:2]]
    show_umbrella = best_pop_pct > 10
    best_wind = float(best_slot.get("wind_speed", weather.get("wind_speed", 0)))

    return {
        "time_window": time_window,
        "environmental_status": env_status,
        "why": _build_why(
            env_status,
            best_pop_pct,
            best_temp,
            aqi,
            thunder_any,
            avoid_labels,
            time_window,
        ),
        "suggestions": _build_suggestions(
            env_status, best_pop_pct, show_umbrella, avoid_labels, thunder_any
        ),
        "suggested_activities": _activities_for(env_status, best_pop_pct),
        "avoid_windows": avoid_windows[:2],
        "timeline": _build_timeline(scored, tz_offset, best_ts, avoid_ts_keys),
        "rain_probability_pct": round(best_pop_pct, 1),
        "wind_speed": round(best_wind, 1),
        "show_umbrella": show_umbrella,
        "thunderstorm_alert": thunder_any,
        **_local_time_fields(tz_offset),
    }
