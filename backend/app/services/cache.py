import json
import hashlib
from typing import Optional

import redis.asyncio as redis

from app.config import get_settings


class CacheService:
    def __init__(self):
        self._redis: Optional[redis.Redis] = None
        self._settings = get_settings()

    async def connect(self):
        try:
            self._redis = redis.from_url(
                self._settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
            await self._redis.ping()
        except Exception:
            self._redis = None

    async def disconnect(self):
        if self._redis:
            await self._redis.close()

    def _key(self, prefix: str, *args) -> str:
        raw = f"{prefix}:" + ":".join(str(a) for a in args)
        return hashlib.md5(raw.encode()).hexdigest()

    async def get(self, prefix: str, *args) -> Optional[dict]:
        if not self._redis:
            return None
        try:
            data = await self._redis.get(self._key(prefix, *args))
            return json.loads(data) if data else None
        except Exception:
            return None

    async def set(self, prefix: str, value: dict, *args):
        if not self._redis:
            return
        try:
            await self._redis.setex(
                self._key(prefix, *args),
                self._settings.cache_ttl_seconds,
                json.dumps(value, default=str),
            )
        except Exception:
            pass


cache_service = CacheService()
