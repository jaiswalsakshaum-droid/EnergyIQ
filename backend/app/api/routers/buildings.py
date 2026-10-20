from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.db.models import Building
from app.schemas.overview import BuildingSummary

router = APIRouter(prefix="/buildings", tags=["Buildings"])

DEFAULT_BUILDINGS = [
    {"name": "North Tower", "area": "Headquarters · 18 floors", "value": 438.0, "share": 76, "building_type": "office", "peak_kw": 94.2},
    {"name": "Innovation Hub", "area": "R&D Wing · Labs A & B", "value": 362.0, "share": 63, "building_type": "lab", "peak_kw": 128.0},
    {"name": "West Annex", "area": "Operations & Logistics", "value": 281.0, "share": 49, "building_type": "operations", "peak_kw": 62.4},
    {"name": "South Studio", "area": "Design Center & Cafeteria", "value": 203.0, "share": 35, "building_type": "studio", "peak_kw": 54.1},
    {"name": "Central Library", "area": "Academic & Archive Wing", "value": 145.0, "share": 25, "building_type": "library", "peak_kw": 38.6},
]

@router.get("", response_model=List[BuildingSummary])
def get_buildings(db: Session = Depends(get_db)):
    db_buildings = db.query(Building).all()
    if db_buildings:
        return [
            BuildingSummary(
                name=b.name,
                area=f"{b.description or b.building_type.capitalize()} · {int(b.area_sqm):,} m²",
                value=b.base_load * 4.2,  # scaled representative current load
                share=min(100, int((b.base_load / 100.0) * 80)),
                building_type=b.building_type,
                peak_kw=b.base_load * 2.1,
            )
            for b in db_buildings
        ]
    return [BuildingSummary(**b) for b in DEFAULT_BUILDINGS]
