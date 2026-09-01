# TactiCore

축구 전술을 국면(기본/공격/수비)별 대형 변화와 공간 점유로 시각화하고, 결과를 SNS 카드용 PNG로 내보내는 도구입니다. MVP는 공개 배포 없이 PC에서 로컬로 실행합니다.

## 기능

- 포메이션 프리셋 18종 자동 배치 + 드래그로 미세 조정
- 피치에서 선수 클릭 → 이름·등번호·역할 바로 수정
- 전술 그리기 도구: 실선(움직임)·점선(패스) 화살표를 국면별로 저장 — PNG·JSON·DB에 자동 포함
- 기본/공격/수비 3개 국면 전환 애니메이션 + 이전 국면 잔상(Ghost View)
- 공간 시각화 레이어: 5채널, 하프스페이스, 압박 라인, 콤팩트니스, 오버로드(상대팀 좌표 입력 시)
- 국면별 코멘트 + 종합 평가
- 분석 결과를 1:1 / 4:5 비율의 PNG 카드로 내보내기
- JSON 내보내기 / 가져오기 (검증 오류 위치 안내 포함)
- 백엔드(FastAPI + SQLite) 저장 및 목록 조회 — 백엔드가 꺼져 있어도 편집·PNG·JSON은 계속 사용 가능

## 기술 스택

- 프론트엔드: React 18 + TypeScript + Vite, Tailwind CSS + shadcn/ui, Framer Motion, Zustand, React Query
- 백엔드: FastAPI + SQLAlchemy + Pydantic, SQLite
- 배포(2차용): Dockerfile — 개발 중에는 사용하지 않음

## 실행

두 프로세스(백엔드 8000, 프론트엔드 5173)를 함께 띄워야 저장/목록 기능이 동작합니다. 저장 기능이 필요 없다면 프론트엔드만 띄워도 편집·PNG·JSON 내보내기는 그대로 동작합니다.

### 최초 1회 준비

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

cd ..\frontend
npm install
```

### 실행

```powershell
# 방법 1: 한 번에 (backend/.venv, frontend/node_modules 준비 후)
.\scripts\dev.ps1

# 방법 2: 개별 실행 (터미널 2개)
cd backend && .\.venv\Scripts\Activate.ps1 && uvicorn main:app --reload --port 8000
cd frontend && npm run dev
```

| 대상 | 주소 |
| --- | --- |
| 앱 | http://localhost:5173 |
| API | http://localhost:8000/api |
| API 문서 (Swagger) | http://localhost:8000/docs |

macOS/Linux에서는 `.\.venv\Scripts\Activate.ps1` 대신 `source .venv/bin/activate`를 씁니다.

### 개발 명령

```bash
cd frontend
npm run dev       # 개발 서버
npm run build     # 타입체크 + 프로덕션 빌드
npm run lint      # eslint
npm test          # vitest (순수 계산 로직 단위 테스트)
```

## 샘플 데이터

`frontend/public/samples/sample-4-3-3.json`을 편집 화면의 "JSON 가져오기"로 불러오면 국면별 대형·상대팀 좌표·코멘트가 채워진 예시를 바로 확인할 수 있습니다.

## 문서

설계와 진행 상황은 `docs/`에 6단계 문서로 정리되어 있습니다. 새로 합류했다면 `docs/5단계_기능_완료_보고서.md`부터 읽고 진행 상황을 확인하세요.

| 문서 | 내용 |
| --- | --- |
| `1단계_요구사항_정의.md` | 요구사항 (FR-01~08) |
| `2단계_시스템_설계서.md` | 아키텍처, 좌표계, DB 스키마 |
| `3단계_기술_규격_및_API.md` | 타입, API 명세, 패키지 |
| `4단계_구현_상세_가이드.md` | Phase별 구현 가이드 |
| `5단계_기능_완료_보고서.md` | 진행 체크리스트 (최신 상태) |
| `6단계_운영_매뉴얼.md` | 설치·실행·백업·문제 해결 |

프로젝트 전반의 결정 사항과 작업 시 주의할 점은 `CLAUDE.md`에 있습니다.
