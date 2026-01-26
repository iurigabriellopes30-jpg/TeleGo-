from fastapi import APIRouter

router = APIRouter(prefix="/couriers", tags=["couriers"])

@router.get("/")
def list_couriers():
    return [
        {"id": 1, "name": "Entregador Exemplo"}
    ]
