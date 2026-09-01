"""SQLAlchemy ORM 모델 (2단계 §4의 SQL 스키마와 대응).

relationship 의 cascade="all, delete-orphan" 은 DB의 FK CASCADE와 별개다.
ORM 레벨 삭제 전파를 위해 둘 다 필요하다.
"""

from sqlalchemy import (
    Column,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_name = Column(String, nullable=False)
    home_team = Column(String, nullable=False)
    away_team = Column(String, nullable=False)
    match_date = Column(String, nullable=False)  # YYYY-MM-DD
    competition = Column(String)
    analyzed_team = Column(String, nullable=False)  # 'home' | 'away'
    formation = Column(String, nullable=False)
    summary = Column(Text)
    schema_version = Column(Integer, nullable=False, default=1)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)

    players = relationship(
        "Player",
        back_populates="analysis",
        cascade="all, delete-orphan",
        order_by="Player.id",
    )
    phases = relationship(
        "Phase",
        back_populates="analysis",
        cascade="all, delete-orphan",
        order_by="Phase.id",
    )


class Player(Base):
    __tablename__ = "players"
    __table_args__ = (UniqueConstraint("analysis_id", "client_id"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(
        Integer, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False
    )
    # JSON 쪽 players[].id 를 그대로 보존한다. 저장·재로드를 반복해도 이 값이
    # 바뀌지 않아야 모핑 애니메이션의 노드 동일성이 유지된다 (4단계 §5.1).
    client_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    number = Column(Integer, nullable=False)
    role = Column(String)

    analysis = relationship("Analysis", back_populates="players")
    positions = relationship(
        "Position", back_populates="player", cascade="all, delete-orphan"
    )


class Phase(Base):
    __tablename__ = "phases"
    __table_args__ = (UniqueConstraint("analysis_id", "phase_type"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(
        Integer, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False
    )
    phase_type = Column(String, nullable=False)  # 'base' | 'attack' | 'defense'
    pressing_line_y = Column(Float)  # NULL이면 프론트에서 자동 산출
    comment = Column(Text)

    analysis = relationship("Analysis", back_populates="phases")
    positions = relationship(
        "Position",
        back_populates="phase",
        cascade="all, delete-orphan",
        order_by="Position.id",
    )


class Position(Base):
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    phase_id = Column(
        Integer, ForeignKey("phases.id", ondelete="CASCADE"), nullable=False
    )
    # 상대팀 좌표는 선수 정보가 없으므로 NULL이다.
    player_id = Column(Integer, ForeignKey("players.id", ondelete="CASCADE"))
    side = Column(String, nullable=False)  # 'own' | 'opponent'
    slot = Column(Integer, nullable=False, default=0)  # 상대팀 좌표 순서 보존
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)

    phase = relationship("Phase", back_populates="positions")
    player = relationship("Player", back_populates="positions")
