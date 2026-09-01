"""FastAPI 앱 진입점 (4단계 Phase 1-7)."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models  # noqa: F401  (create_all 전에 모델 등록이 필요)
import schemas
from config import settings
from database import Base, engine
from routers import analyses

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TactiCore API", version=settings.app_version)

# 로컬 전용이라도 allow_origins=["*"] 는 쓰지 않는다 (3단계 §7).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.include_router(analyses.router)


@app.get("/api/health", response_model=schemas.HealthOut, tags=["health"])
def health():
    """프론트가 저장/목록 UI 활성화 여부를 판단하는 데 쓴다 (FR-08 폴백)."""
    return {"status": "ok", "version": settings.app_version}
