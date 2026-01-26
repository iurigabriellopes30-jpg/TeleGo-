from fastapi import APIRouter

router = APIRouter(prefix="/restaurants", tags=["restaurants"])

@router.get("/")
def list_restaurants():
    return [
        {"id": 1, "name": "Restaurante Exemplo"}
    ]
