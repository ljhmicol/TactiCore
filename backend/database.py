"""엔진·세션 구성 (4단계 §2.1).

SQLite는 커넥션마다 FK를 켜야 한다. 이걸 빠뜨리면 ON DELETE CASCADE가
조용히 무시되어 고아 행이 쌓인다.
"""

from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

from config import settings


def _ensure_sqlite_dir(url: str) -> None:
    """DB 파일이 놓일 디렉토리를 미리 만든다.

    컨테이너 첫 기동이나 data/ 를 지운 뒤에도 그냥 실행되도록 하기 위함이다.
    """
    if not url.startswith("sqlite"):
        return
    path = url.split("sqlite:///", 1)[-1]
    if path and path != ":memory:":
        Path(path).parent.mkdir(parents=True, exist_ok=True)


_ensure_sqlite_dir(settings.database_url)

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
)


@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
