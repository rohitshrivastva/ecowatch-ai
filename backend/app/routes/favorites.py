from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.favorites import FavoriteCreate, FavoriteResponse, FavoriteUpdate
from app.services.favorites import favorites_service

router = APIRouter(prefix="/api/v1/favorites", tags=["favorites"])


@router.post("", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
async def create_favorite(
    body: FavoriteCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    return await favorites_service.create(session, current_user.id, body)


@router.get("", response_model=list[FavoriteResponse])
async def list_favorites(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    return await favorites_service.list_for_user(session, current_user.id)


@router.put("/{favorite_id}", response_model=FavoriteResponse)
async def update_favorite(
    favorite_id: int,
    body: FavoriteUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    updated = await favorites_service.update(session, current_user.id, favorite_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return updated


@router.delete("/{favorite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_favorite(
    favorite_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    deleted = await favorites_service.delete(session, current_user.id, favorite_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Favorite not found")
