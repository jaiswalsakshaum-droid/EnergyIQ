from fastapi import APIRouter
from app.config import settings

router = APIRouter(prefix="", tags=["Health"])

@router.get("/health")
def healthcheck():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }
