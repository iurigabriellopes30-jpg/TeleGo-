import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List


from backend import models
from backend import schemas
from backend.db import SessionLocal, get_db
from backend.security import decode_access_token
from backend import dispatch

router = APIRouter(prefix="/orders", tags=["orders"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

async def get_current_user_email(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload.get("sub")

async def get_current_courier(email: str = Depends(get_current_user_email), db: AsyncSession = Depends(get_db)):
    stmt = select(models.Courier).where(models.Courier.email == email)
    result = await db.execute(stmt)
    courier = result.scalars().first()
    if courier is None:
        raise HTTPException(status_code=404, detail="Courier not found")
    return courier

@router.post("/", response_model=schemas.Order)
async def create_order(order: schemas.OrderCreate, db: AsyncSession = Depends(get_db)):
    new_order = models.Order(
        restaurant_id=order.restaurant_id,
        customer_name=order.customer_name,
        delivery_address=order.delivery_address,
        pickup_address=order.pickup_address,
        price=order.price,
        order_value=order.order_value,
        status="SEARCHING"
    )
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)

    asyncio.create_task(dispatch.dispatch_order(new_order.id))

    return new_order

@router.get("/available", response_model=List[schemas.Order])
async def get_available_orders(db: AsyncSession = Depends(get_db), current_courier: models.Courier = Depends(get_current_courier)):
    """
    Retorna pedidos que estão aguardando resposta deste motoboy específico.
    Isso serve como fallback caso o WebSocket falhe.
    """
    stmt = select(models.Order).where(
        models.Order.status == "SEARCHING",
        models.Order.current_candidate_courier_id == current_courier.id
    )
    result = await db.execute(stmt)
    orders = result.scalars().all()
    
    for order in orders:
        stmt_res = select(models.Restaurant).where(models.Restaurant.id == order.restaurant_id)
        res = await db.execute(stmt_res)
        restaurant = res.scalars().first()
        if restaurant:
            order.restaurantName = restaurant.name
                
    return orders

@router.get("/restaurant/{restaurant_id}", response_model=List[schemas.Order])
async def get_restaurant_orders(restaurant_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(models.Order).where(models.Order.restaurant_id == restaurant_id)
    result = await db.execute(stmt)
    orders = result.scalars().all()
    
    # Adicionamos metadados para o frontend
    for order in orders:
        order.restaurantName = "Seu Restaurante"
        order.pickupAddress = "Endereço da Loja"
        order.deliveryAddress = "Endereço do Cliente"
        order.price = 12.0
        order.orderValue = 0.0
        
    return orders

@router.get("/courier/{courier_id}", response_model=List[schemas.Order])
async def get_courier_orders(courier_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(models.Order).where(models.Order.courier_id == courier_id)
    result = await db.execute(stmt)
    orders = result.scalars().all()
    
    for order in orders:
        stmt_res = select(models.Restaurant).where(models.Restaurant.id == order.restaurant_id)
        res = await db.execute(stmt_res)
        restaurant = res.scalars().first()
        if restaurant:
            order.restaurantName = restaurant.name
            
    return orders

@router.post("/{order_id}/respond", response_model=schemas.Order)
async def respond_to_order(
    order_id: int,
    response: bool,
    db: AsyncSession = Depends(get_db),
    current_courier: models.Courier = Depends(get_current_courier)
):
    stmt = select(models.Order).where(models.Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalars().first()

    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    if order.current_candidate_courier_id != current_courier.id:
        raise HTTPException(status_code=403, detail="Não é a sua vez de responder a este pedido")

    if response:
        order.courier_id = current_courier.id
        order.status = "ASSIGNED"
        print(f"✅ Pedido {order_id} ACEITO pelo motoboy {current_courier.id}")
    else:
        order.current_candidate_courier_id = None
        print(f"❌ Pedido {order_id} RECUSADO pelo motoboy {current_courier.id}")

    await db.commit()

    # Sinaliza o loop de dispatch que uma resposta foi recebida
    if order.id in dispatch.courier_responses:
        dispatch.courier_responses[order.id].set()

    await db.refresh(order)
    return order

@router.put("/{order_id}/status", response_model=schemas.Order)
async def update_order_status(order_id: int, status: str, db: AsyncSession = Depends(get_db)):
    from backend.websocket_manager import manager
    
    stmt = select(models.Order).where(models.Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
        
    order.status = status
    await db.commit()
    await db.refresh(order)
    
    # Notifica restaurante e motoboy sobre a mudança de status
    try:
        await manager.notify_order_update(order.id, status, f"restaurant_{order.restaurant_id}")
        if order.courier_id:
            await manager.notify_order_update(order.id, status, f"courier_{order.courier_id}")
        print(f"✅ Notificação de status '{status}' enviada para o pedido {order.id}")
    except Exception as e:
        print(f"❌ Erro ao enviar notificação de status: {e}")
        
    return order

@router.delete("/{order_id}")
async def cancel_order(order_id: int, db: AsyncSession = Depends(get_db)):
    from backend.websocket_manager import manager
    
    stmt = select(models.Order).where(models.Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
        
    try:
        await manager.notify_order_update(order.id, "CANCELLED", f"restaurant_{order.restaurant_id}")
        if order.courier_id:
            await manager.notify_order_update(order.id, "CANCELLED", f"courier_{order.courier_id}")
    except:
        pass

    await db.delete(order)
    await db.commit()
    
    return {"status": "success", "message": "Pedido cancelado"}
