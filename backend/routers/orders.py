from fastapi import APIRouter

router = APIRouter(prefix="/orders", tags=["orders"])

@router.get("/")
def list_orders():
    return [
        {"id": 1, "status": "pendente"},
        {"id": 2, "status": "em entrega"}
    ]
