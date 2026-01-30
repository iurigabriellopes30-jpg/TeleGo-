"""
WebSocket Manager para notificações em tempo real
"""
from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    """
    Gerencia conexões WebSocket e envia notificações
    """
    def __init__(self):
        # Armazena as conexões ativas: {user_id: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str, user_type: str):
        """
        Aceita uma nova conexão WebSocket
        """
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"✅ {user_type} {user_id} conectado via WebSocket")
    
    async def send_to_courier(self, courier_id: int, order_data: dict) -> bool:
        """
        Envia um pedido para um motoboy específico
        Retorna True se enviado, False se motoboy offline
        """
        user_id = f"courier_{courier_id}"
        
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json({
                    "type": "NEW_ORDER",
                    "order": order_data,
                    "action_required": True,
                    "timeout_seconds": 20
                })
                return True
            except:
                # Se der erro ao enviar, remove a conexão
                del self.active_connections[user_id]
                return False
        
        return False
    
    async def notify_order_update(self, order_id: int, status: str, to_user_id: str = None):
        """
        Notifica atualização de status de um pedido
        """
        message = {
            "type": "ORDER_UPDATE",
            "order_id": order_id,
            "status": status,
            "timestamp": "agora"  # Poderia usar datetime
        }
        
        if to_user_id:
            # Envia para um usuário específico
            if to_user_id in self.active_connections:
                try:
                    await self.active_connections[to_user_id].send_json(message)
                except:
                    del self.active_connections[to_user_id]
        else:
            # Envia para todos conectados (broadcast)
            disconnected = []
            for user_id, ws in self.active_connections.items():
                try:
                    await ws.send_json(message)
                except:
                    disconnected.append(user_id)
            
            # Remove conexões que falharam
            for user_id in disconnected:
                del self.active_connections[user_id]
    
    async def disconnect(self, user_id: str):
        """
        Remove uma conexão
        """
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"❌ {user_id} desconectado")

# Cria uma instância global para ser usada em todo o app
manager = ConnectionManager()