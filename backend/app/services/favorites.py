from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.location import EnvironmentalHistory, FavoriteLocation
from app.schemas.favorites import FavoriteCreate, FavoriteResponse, FavoriteSummary, FavoriteUpdate
from app.services.history import history_service


class FavoritesService:
    async def create(
        self,
        session: AsyncSession,
        user_id: int,
        data: FavoriteCreate,
    ) -> FavoriteResponse:
        location = await history_service.get_or_create_location(
            session, data.latitude, data.longitude, data.location_name
        )
        fav = FavoriteLocation(
            user_id=user_id,
            location_name=data.location_name,
            latitude=data.latitude,
            longitude=data.longitude,
            location_id=location.id,
        )
        session.add(fav)
        await session.commit()
        await session.refresh(fav)
        return await self._with_summary(session, fav)

    async def list_for_user(
        self, session: AsyncSession, user_id: int
    ) -> list[FavoriteResponse]:
        rows = (
            await session.execute(
                select(FavoriteLocation)
                .where(FavoriteLocation.user_id == user_id)
                .order_by(FavoriteLocation.created_at.desc())
            )
        ).scalars().all()
        result = []
        for fav in rows:
            result.append(await self._with_summary(session, fav))
        return result

    async def update(
        self,
        session: AsyncSession,
        user_id: int,
        favorite_id: int,
        data: FavoriteUpdate,
    ) -> Optional[FavoriteResponse]:
        fav = await self._get_owned(session, user_id, favorite_id)
        if not fav:
            return None
        if data.location_name is not None:
            fav.location_name = data.location_name
        await session.commit()
        await session.refresh(fav)
        return await self._with_summary(session, fav)

    async def delete(
        self, session: AsyncSession, user_id: int, favorite_id: int
    ) -> bool:
        fav = await self._get_owned(session, user_id, favorite_id)
        if not fav:
            return False
        await session.delete(fav)
        await session.commit()
        return True

    async def _get_owned(
        self, session: AsyncSession, user_id: int, favorite_id: int
    ) -> Optional[FavoriteLocation]:
        result = await session.execute(
            select(FavoriteLocation).where(
                FavoriteLocation.id == favorite_id,
                FavoriteLocation.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def _with_summary(
        self, session: AsyncSession, fav: FavoriteLocation
    ) -> FavoriteResponse:
        summary = None
        if fav.location_id:
            latest = (
                await session.execute(
                    select(EnvironmentalHistory)
                    .where(EnvironmentalHistory.location_id == fav.location_id)
                    .order_by(EnvironmentalHistory.timestamp.desc())
                    .limit(1)
                )
            ).scalar_one_or_none()
            if latest:
                level = "low"
                if latest.risk_score > 66:
                    level = "high"
                elif latest.risk_score > 33:
                    level = "medium"
                summary = FavoriteSummary(
                    aqi=latest.aqi,
                    temperature=latest.temperature,
                    risk_score=latest.risk_score,
                    risk_level=level,
                )
        return FavoriteResponse(
            id=fav.id,
            location_name=fav.location_name,
            latitude=fav.latitude,
            longitude=fav.longitude,
            location_id=fav.location_id,
            created_at=fav.created_at,
            summary=summary,
        )


favorites_service = FavoritesService()
