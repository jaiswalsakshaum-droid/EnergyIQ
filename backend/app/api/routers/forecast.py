from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.forecast import ForecastRequest, ForecastResponse, ForecastExplanation, ShapContribution
from app.services.forecasting import generate_forecast

router = APIRouter(prefix="/forecast", tags=["forecast"])

@router.post("", response_model=ForecastResponse)
def get_forecast(
    request: ForecastRequest,
    db: Session = Depends(get_db),
):
    """
    Computes multi-horizon forecast (24h, 7d, 30d) using trained machine learning model
    with prediction intervals, peak demand, and costing.
    """
    return generate_forecast(request, db)

from app.services.explain import explain_prediction_local

@router.get("/explain", response_model=ForecastExplanation)
def explain_forecast_prediction(
    building: str = Query("North Tower", description="Building name"),
    timestamp: str = Query("14:00", description="Hour or timestamp to explain"),
    db: Session = Depends(get_db),
):
    """
    Provides local SHAP waterfall explanation and plain-language interpretation
    for a specific forecast prediction.
    """
    return explain_prediction_local(building, timestamp, db)
