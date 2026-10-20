from typing import List, Optional
from app.schemas.base import CamelModel

class CsvQualityReport(CamelModel):
    filename: str
    size: str
    count: int
    missing: int
    duplicates: int
    dates: int
    coverage_pct: float
    is_valid: bool
    headers: List[str]
    sample_rows: List[List[str]]
    issues: List[str] = []
    error: Optional[str] = None

class UploadResponse(CamelModel):
    message: str
    report: CsvQualityReport
    committed: bool
    retrain_job_id: Optional[str] = None
