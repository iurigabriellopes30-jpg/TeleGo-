"""
WebSocket Router para comunicações em tempo real
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.websocket_manager import manager

router = APIRouter()

@router.websocket("/ws/courier/{courier_id}")
async def courier_websocket_endpoint(websocket: WebSocket, courier_id: str):
    """
    WebSocket para motoboys receberem notificações de pedidos
    """
    user_id = f"courier_{courier_id}"
    
    await manager.connect(websocket, user_id, "COURIER")
    
    try:
        # Mantém a conexão aberta e escuta por mensagens
        while True:
            # Recebe dados do motoboy (ex: localização, status)
            data = await websocket.receive_json()
            
            # Processa diferentes tipos de mensagens
            if data.get("type") == "LOCATION_UPDATE":
                lat = data.get("lat")
                lng = data.get("lng")
                print(f"📍 Motoboy {courier_id} atualizou localização: {lat}, {lng}")
                # Aqui você poderia salvar no banco de dados
                
            elif data.get("type") == "HEARTBEAT":
                # Só para manter a conexão ativa
                pass
                
            elif data.get("type") == "ORDER_RESPONSE":
                # Resposta a um pedido (aceitar/recusar)
                order_id = data.get("order_id")
                accepted = data.get("accepted")
                print(f"📩 Motoboy {courier_id} respondeu pedido {order_id}: {'ACEITO' if accepted else 'RECUSADO'}")
                
    except WebSocketDisconnect:
        # Remove a conexão quando desconectar
        await manager.disconnect(user_id)
        print(f"❌ Motoboy {courier_id} desconectado")
    except Exception as e:
        print(f"❌ Erro no WebSocket do motoboy {courier_id}: {e}")
        await manager.disconnect(user_id)

@router.websocket("/ws/restaurant/{restaurant_id}")
async def restaurant_websocket_endpoint(websocket: WebSocket, restaurant_id: str):
    """
    WebSocket para restaurantes receberem atualizações de pedidos
    """
    user_id = f"restaurant_{restaurant_id}"
    
    await manager.connect(websocket, user_id, "RESTAURANT")
    
    try:
        # Restaurante só escuta atualizações (não envia muitas coisas)
        while True:
            # Apenas mantém a conexão aberta
            # Pode receber pings/heartbeats
            data = await websocket.receive_text()
            
            if data == "ping":
                await websocket.send_text("pong")
                
    except WebSocketDisconnect:
        await manager.disconnect(user_id)
        print(f"❌ Restaurante {restaurant_id} desconectado")
    except Exception as e:
        print(f"❌ Erro no WebSocket do restaurante {restaurant_id}: {e}")
        await manager.disconnect(user_id)