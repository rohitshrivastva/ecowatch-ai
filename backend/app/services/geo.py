from ipaddress import ip_address
from typing import Optional, Union
import httpx


def is_public_ip(ip: str) -> bool:
    try:
        return ip_address(ip).is_global
    except ValueError:
        return False


def client_ip_from_headers(forwarded_for: Optional[str], direct_host: Optional[str]) -> Optional[str]:
    if forwarded_for:
        candidate = forwarded_for.split(",")[0].strip()
        if candidate:
            return candidate
    return direct_host


def format_location_name(city: Optional[str], region: Optional[str], country: Optional[str]) -> str:
    parts = [p for p in (city, region, country) if p]
    return ", ".join(parts) if parts else "Your area"


async def lookup_ip(ip: str) -> Optional[dict[str, Union[float, str]]]:
    if not is_public_ip(ip):
        return None

    url = f"https://ipapi.co/{ip}/json/"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url, headers={"User-Agent": "EcoWatch-AI/1.0"})
            if response.status_code != 200:
                return None
            data = response.json()
    except (httpx.HTTPError, ValueError):
        return None

    if data.get("error"):
        return None

    latitude = data.get("latitude")
    longitude = data.get("longitude")
    if latitude is None or longitude is None:
        return None

    return {
        "latitude": float(latitude),
        "longitude": float(longitude),
        "name": format_location_name(
            data.get("city"),
            data.get("region"),
            data.get("country_name"),
        ),
        "source": "ip",
    }
