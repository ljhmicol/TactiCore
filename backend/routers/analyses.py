"""분석 CRUD 엔드포인트 (3단계 §2)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db

router = APIRouter(prefix="/api/analyses", tags=["analyses"])


@router.get("", response_model=list[schemas.AnalysisSummary])
def list_analyses(db: Session = Depends(get_db)):
    return crud.list_analyses(db)


@router.get("/{analysis_id}", response_model=schemas.AnalysisOut)
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    try:
        row = crud.get_analysis(db, analysis_id)
    except crud.AnalysisNotFound:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return crud.to_analysis_dict(row)


@router.post("", response_model=schemas.AnalysisOut, status_code=status.HTTP_201_CREATED)
def create_analysis(payload: schemas.AnalysisIn, db: Session = Depends(get_db)):
    row = crud.upsert_analysis(db, payload)
    return crud.to_analysis_dict(row)


@router.put("/{analysis_id}", response_model=schemas.AnalysisOut)
def update_analysis(
    analysis_id: int, payload: schemas.AnalysisIn, db: Session = Depends(get_db)
):
    try:
        row = crud.upsert_analysis(db, payload, analysis_id)
    except crud.AnalysisNotFound:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return crud.to_analysis_dict(row)


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(analysis_id: int, db: Session = Depends(get_db)):
    try:
        crud.delete_analysis(db, analysis_id)
    except crud.AnalysisNotFound:
        raise HTTPException(status_code=404, detail="Analysis not found")
