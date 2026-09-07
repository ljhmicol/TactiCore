"""SQLAlchemy ORM 모델 (2단계 §4의 SQL 스키마와 대응).

relationship 의 cascade="all, delete-orphan" 은 DB의 FK CASCADE와 별개다.
ORM 레벨 삭제 전파를 위해 둘 다 필요하다.
"""

from sqlalchemy import (
    Boolean,
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
    # 전술 역할(FM 스타일) id — frontend/src/lib/tacticalRoles.ts 참조. role(자유
    # 메모)과 별개 컬럼. 기존 DB에는 없을 수 있어 main.py에서 수동 ALTER TABLE로
    # 채운다(create_all은 기존 테이블에 컬럼을 추가하지 못한다) — TO-DO 20
    tactical_role = Column(String)

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
    annotations = relationship(
        "Annotation",
        back_populates="phase",
        cascade="all, delete-orphan",
        order_by="Annotation.id",
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


class Annotation(Base):
    """국면별 화살표(전술 그리기, TO-DO 1번). 자유 좌표 — 선수에게 부착되지 않는다.

    기존 DB에 이 테이블이 없어도 create_all이 새 테이블은 자동 생성한다
    (기존 테이블에 컬럼을 추가하는 방식은 create_all이 반영하지 못해 쓰지 않았다).
    """

    __tablename__ = "annotations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    phase_id = Column(Integer, ForeignKey("phases.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(String, nullable=False)  # JSON 쪽 id를 그대로 보존
    ann_type = Column(String, nullable=False)  # 'run'(실선·움직임) | 'pass'(점선·패스)
    from_x = Column(Float, nullable=False)
    from_y = Column(Float, nullable=False)
    to_x = Column(Float, nullable=False)
    to_y = Column(Float, nullable=False)
    # 곡선 화살표(오버랩 런 등) 여부. 기존 DB에는 없을 수 있는 컬럼이라
    # main.py에서 수동 ALTER TABLE로 채운다 — players.tactical_role과 같은
    # 이유(create_all은 기존 테이블에 컬럼을 추가하지 못한다), TO-DO 2026-09-07
    curved = Column(Boolean)

    phase = relationship("Phase", back_populates="annotations")
