from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.schemas.simulator import SimulatorRequest, SimulatorResponse
from app.services.simulator import calculate_savings_simulation

router = APIRouter(prefix="/simulator", tags=["Simulator"])

@router.post("/calculate", response_model=SimulatorResponse)
def calculate_savings(payload: SimulatorRequest, db: Session = Depends(get_db)):
    """Computes data-driven scenario simulation from meter baseline and schedule adjustments."""
    return calculate_savings_simulation(payload, db)
