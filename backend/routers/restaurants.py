from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.db import get_db
from backend import models

router = APIRouter(prefix="/restaurants", tags=["restaurants"])

# 🔥 ENDPOINT TEMPORÁRIO PARA ATUALIZAR LOCALIZAÇÃO
@router.post("/{restaurant_id}/location")
async def update_restaurant_location(
    restaurant_id: int,
    location_update: dict,
    db: AsyncSession = Depends(get_db)
):
    """Endpoint temporário para atualizar localização do restaurante"""
    stmt = select(models.Restaurant).where(models.Restaurant.id == restaurant_id)
    result = await db.execute(stmt)
    restaurant = result.scalars().first()
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")
    
    # Atualiza localização
    restaurant.lat = location_update.get("lat", restaurant.lat)
    restaurant.lng = location_update.get("lng", restaurant.lng)
    
    await db.commit()
    await db.refresh(restaurant)
    
    return {"message": "Localização atualizada", "restaurant": restaurant}