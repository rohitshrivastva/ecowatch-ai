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
        return f"{h}:{dt.minute:02d}{suffix}"
    return f"{h}{suffix}"


def _format_window(start: datetime, hours: int, tz_offset_sec: int) -> str:
    local_start = start + timedelta(seconds=tz_offset_sec)
    local_end = local_start + timedelta(hours=hours)
    return f"{_format_ampm(local_start)} – {_format_ampm(local_end)}"


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
    if avoid_labels:
        return (
            f"Higher rain and humidity are likely during {avoid_labels[0]}. "
            "Cooler, drier conditions are expected later in the day."
        )
    if pop_pct <= 10 and aqi <= 50:
        return (
            "Clear weather, comfortable temperatures, and low rain probability "
            "are expected during this window."
        )
    if pop_pct <= 25:
        return (
            "Lower temperatures and reduced rain probability are expected "
            "during this period."
        )
    return (
        f"Air quality (AQI {aqi}) and temperatures around {round(temp)}°C "
        "were factored into this window."
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
    return suggestions[:3]


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
            "rain_probability_pct": None,
            "show_umbrella": False,
            "thunderstorm_alert": False,
        }

    scored: list[tuple[float, dict, int]] = []
    thunder_any = False
    avoid_windows: list[str] = []

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
            avoid_windows.append(f"{label} → {desc or main.lower()}")

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
        return {
            "time_window": "Not recommended today",
            "environmental_status": STATUS_DANGEROUS,
            "why": _build_why(STATUS_DANGEROUS, 100, 0, aqi, True, avoid_windows),
            "suggestions": _build_suggestions(
                STATUS_DANGEROUS, 100, False, avoid_windows, True
            ),
            "suggested_activities": ["Stay indoors"],
            "avoid_windows": avoid_windows[:2],
            "rain_probability_pct": 100.0,
            "show_umbrella": True,
            "thunderstorm_alert": True,
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

    avoid_labels = [w.split(" →")[0] for w in avoid_windows[:2]]
    show_umbrella = best_pop_pct > 10 or env_status in (
        STATUS_MODERATE,
        STATUS_POOR,
    )

    return {
        "time_window": time_window,
        "environmental_status": env_status,
        "why": _build_why(
            env_status, best_pop_pct, best_temp, aqi, thunder_any, avoid_labels
        ),
        "suggestions": _build_suggestions(
            env_status, best_pop_pct, show_umbrella, avoid_labels, thunder_any
        ),
        "suggested_activities": _activities_for(env_status, best_pop_pct),
        "avoid_windows": avoid_windows[:2],
        "rain_probability_pct": round(best_pop_pct, 1),
        "show_umbrella": show_umbrella,
        "thunderstorm_alert": thunder_any,
    }
