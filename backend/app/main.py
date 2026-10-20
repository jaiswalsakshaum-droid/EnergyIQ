from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.session import init_db
from app.api.routers import health, overview, buildings, simulator, data, models, forecast

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema on startup
    init_db()
    yield

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="AI-Powered Building Energy Intelligence API",
        lifespan=lifespan,
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API routers under /api
    app.include_router(health.router, prefix=settings.API_V1_STR)
    app.include_router(overview.router, prefix=settings.API_V1_STR)
    app.include_router(buildings.router, prefix=settings.API_V1_STR)
    app.include_router(simulator.router, prefix=settings.API_V1_STR)
    app.include_router(data.router, prefix=settings.API_V1_STR)
    app.include_router(models.router, prefix=settings.API_V1_STR)
    app.include_router(forecast.router, prefix=settings.API_V1_STR)

    return app

app = create_app()
