"""DB ↔ 분석 JSON 변환 (4단계 §2.3, §2.4).

저장은 전체 교체(replace) 방식이다. PUT 시 하위 players/phases/positions 를
지우고 다시 삽입한다. 편집 화면이 항상 분석 전체를 들고 있으므로
부분 갱신의 이득이 없다 (2단계 §5).
"""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

import models
import schemas


class AnalysisNotFound(Exception):
    pass


def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _load(db: Session, analysis_id: int) -> models.Analysis:
    stmt = (
        select(models.Analysis)
        .where(models.Analysis.id == analysis_id)
        .options(
            selectinload(models.Analysis.players),
            selectinload(models.Analysis.phases).selectinload(models.Phase.positions),
            selectinload(models.Analysis.phases).selectinload(models.Phase.annotations),
        )
    )
    row = db.execute(stmt).scalar_one_or_none()
    if row is None:
        raise AnalysisNotFound(analysis_id)
    return row


def list_analyses(db: Session) -> List[models.Analysis]:
    """목록 조회. 좌표를 읽지 않는다 — 하위 테이블을 조인하지 않는 이유."""
    stmt = select(models.Analysis).order_by(models.Analysis.updated_at.desc())
    return list(db.execute(stmt).scalars().all())


def get_analysis(db: Session, analysis_id: int) -> models.Analysis:
    return _load(db, analysis_id)


def delete_analysis(db: Session, analysis_id: int) -> None:
    row = _load(db, analysis_id)
    db.delete(row)
    db.commit()


def upsert_analysis(
    db: Session,
    payload: schemas.AnalysisIn,
    analysis_id: Optional[int] = None,
) -> models.Analysis:
    now = _now()

    if analysis_id is None:
        row = models.Analysis(created_at=now)
        db.add(row)
    else:
        row = _load(db, analysis_id)
        # 전체 교체: 하위를 비우면 delete-orphan 이 처리한다
        row.players.clear()
        row.phases.clear()
        db.flush()

    row.match_name = payload.match.match_name
    row.home_team = payload.match.home_team
    row.away_team = payload.match.away_team
    row.match_date = payload.match.match_date
    row.competition = payload.match.competition
    row.analyzed_team = payload.match.analyzed_team
    row.formation = payload.formation
    row.summary = payload.summary
    row.schema_version = payload.schema_version
    row.updated_at = now

    # client_id -> Player 매핑을 만들어 두고 좌표에서 참조한다.
    # 원본 id를 새로 발급하면 재로드 후 모핑이 엉킨다 (4단계 §5.1).
    player_map: dict[str, models.Player] = {}
    for p in payload.players:
        player = models.Player(
            client_id=p.id,
            name=p.name,
            number=p.number,
            role=p.role,
            tactical_role=p.tactical_role,
        )
        row.players.append(player)
        player_map[p.id] = player

    db.flush()  # player PK 확보

    for phase_type in schemas.PHASE_TYPES:
        phase_in = payload.phases[phase_type]
        phase = models.Phase(
            phase_type=phase_type,
            pressing_line_y=phase_in.pressing_line_y,
            comment=phase_in.comment,
        )
        row.phases.append(phase)

        for pos in phase_in.positions:
            phase.positions.append(
                models.Position(
                    player=player_map[pos.player_id],
                    side="own",
                    slot=0,
                    x=pos.x,
                    y=pos.y,
                )
            )
        for slot, pos in enumerate(phase_in.opponent_positions or []):
            phase.positions.append(
                models.Position(
                    player=None, side="opponent", slot=slot, x=pos.x, y=pos.y
                )
            )
        for ann in phase_in.annotations:
            phase.annotations.append(
                models.Annotation(
                    client_id=ann.id,
                    ann_type=ann.type,
                    from_x=ann.from_.x,
                    from_y=ann.from_.y,
                    to_x=ann.to.x,
                    to_y=ann.to.y,
                )
            )

    db.commit()
    return _load(db, row.id)


def to_analysis_dict(row: models.Analysis) -> dict:
    """ORM 행을 3단계 §2.3의 응답 형태로 조립한다.

    ORM을 그대로 직렬화하면 구조가 다르므로 명시적으로 만든다.
    """
    client_id_by_pk = {p.id: p.client_id for p in row.players}

    phases: dict[str, dict] = {}
    for phase in row.phases:
        own = [p for p in phase.positions if p.side == "own"]
        opponent = sorted(
            (p for p in phase.positions if p.side == "opponent"),
            key=lambda p: p.slot,
        )
        phases[phase.phase_type] = {
            "positions": [
                {
                    "player_id": client_id_by_pk[p.player_id],
                    "x": p.x,
                    "y": p.y,
                }
                for p in own
            ],
            "opponent_positions": (
                [{"x": p.x, "y": p.y} for p in opponent] if opponent else None
            ),
            "pressing_line_y": phase.pressing_line_y,
            "comment": phase.comment or "",
            "annotations": [
                {
                    "id": a.client_id,
                    "type": a.ann_type,
                    "from": {"x": a.from_x, "y": a.from_y},
                    "to": {"x": a.to_x, "y": a.to_y},
                }
                for a in phase.annotations
            ],
        }

    return {
        "id": row.id,
        "schema_version": row.schema_version,
        "match": {
            "match_name": row.match_name,
            "home_team": row.home_team,
            "away_team": row.away_team,
            "match_date": row.match_date,
            "competition": row.competition,
            "analyzed_team": row.analyzed_team,
        },
        "formation": row.formation,
        "players": [
            {
                "id": p.client_id,
                "name": p.name,
                "number": p.number,
                "role": p.role,
                "tactical_role": p.tactical_role,
            }
            for p in row.players
        ],
        "phases": phases,
        "summary": row.summary or "",
        "created_at": row.created_at,
        "updated_at": row.updated_at,
    }
