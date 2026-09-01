# 3단계: 기술 규격 및 API (TactiCore)

> 선행 문서: `1단계_요구사항_정의.md`(FR-01~08), `2단계_시스템_설계서.md`(좌표계·DB·아키텍처)

## 1. TypeScript 타입 정의

`frontend/src/types/analysis.ts`. 이 타입이 JSON 파일 포맷(FR-07)이자 API 본문 형식이다.

```ts
export type PhaseType = 'base' | 'attack' | 'defense';
export type TeamSide = 'home' | 'away';

/** 0~100 백분율 좌표. x=좌우 터치라인, y=0이 상대 골라인 */
export interface Point {
  x: number;
  y: number;
}

export interface MatchInfo {
  matchName: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;      // YYYY-MM-DD
  competition?: string;
  analyzedTeam: TeamSide;
}

export interface Player {
  id: string;             // 프론트가 생성 (nanoid). 저장·재로드해도 불변
  name: string;
  number: number;         // 1~99
  role?: string;
}

export interface PlayerPosition extends Point {
  playerId: string;
}

export interface PhaseData {
  positions: PlayerPosition[];        // 자팀 11명
  opponentPositions?: Point[];        // 있으면 11개 전부
  pressingLineY?: number;             // 없으면 자동 산출
  comment: string;
}

export interface Analysis {
  id?: number;                        // 서버 저장 후에만 존재
  schemaVersion: 1;
  match: MatchInfo;
  formation: string;                  // '4-3-3'
  players: Player[];                  // 11명 고정
  phases: Record<PhaseType, PhaseData>;
  summary: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 목록 조회 전용 (좌표 없음) */
export interface AnalysisSummary {
  id: number;
  matchName: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  competition?: string;
  updatedAt: string;
}
```

시각화 계산용 타입:

```ts
export type Channel = 'leftWing' | 'leftHalf' | 'center' | 'rightHalf' | 'rightWing';
export type Third = 'attacking' | 'middle' | 'defensive';
export type OverloadLevel = 'none' | 'weak' | 'strong';

export interface ZoneOverload {
  channel: Channel;
  third: Third;
  own: number;
  opp: number;
  diff: number;
  level: OverloadLevel;
}

export interface LayerToggles {   // 화면 설정. 저장 대상 아님
  channelGrid: boolean;
  halfSpaces: boolean;
  pressingLine: boolean;
  compactness: boolean;
  overload: boolean;
  ghostView: boolean;
}
```

### 1.1 상수 정의

`frontend/src/lib/zones.ts`:

```ts
export const CHANNEL_BOUNDS: Record<Channel, [number, number]> = {
  leftWing:  [0, 20],
  leftHalf:  [20, 36.5],
  center:    [36.5, 63.5],
  rightHalf: [63.5, 80],
  rightWing: [80, 100],
};

export const THIRD_BOUNDS: Record<Third, [number, number]> = {
  attacking: [0, 33.3],
  middle:    [33.3, 66.7],
  defensive: [66.7, 100],
};

/** 실측 환산 (105m x 68m) */
export const PITCH_LENGTH_M = 105;
export const PITCH_WIDTH_M = 68;
```

## 2. API 엔드포인트 상세

베이스 URL `http://localhost:8000/api`. 서버는 snake_case, 클라이언트는 camelCase이며 `lib/api.ts`가 변환한다. 아래 예시는 **클라이언트가 보는 camelCase 기준**이다.

### 2.1 `GET /api/health`

서버 가용성 확인 (FR-08 폴백 판정용).

```json
{ "status": "ok", "version": "1.0.0" }
```

프론트는 앱 진입 시 1회 호출하고, 저장 실패 시 재확인한다. 타임아웃 2초.

### 2.2 `GET /api/analyses`

저장된 분석 목록. 최근 수정순 정렬.

```json
[
  {
    "id": 3,
    "matchName": "맨시티 vs 아스날",
    "homeTeam": "맨체스터 시티",
    "awayTeam": "아스날",
    "matchDate": "2026-08-30",
    "competition": "프리미어리그",
    "updatedAt": "2026-09-01T12:04:11"
  }
]
```

### 2.3 `GET /api/analyses/{id}`

분석 전체. **응답 본문은 §1의 `Analysis` 타입, 즉 JSON 파일 포맷과 동일하다.**

> 아래 예시는 지면상 **축약한 것**이다. 실제 응답에서 `players`는 11개, 각 국면의 `positions`는 11개여야 하며(§2.7), 빈 배열은 검증을 통과하지 못한다.

```json
{
  "id": 3,
  "schemaVersion": 1,
  "match": {
    "matchName": "맨시티 vs 아스날",
    "homeTeam": "맨체스터 시티",
    "awayTeam": "아스날",
    "matchDate": "2026-08-30",
    "competition": "프리미어리그",
    "analyzedTeam": "home"
  },
  "formation": "4-3-3",
  "players": [
    { "id": "p1", "name": "에데르송", "number": 31, "role": "GK" }
  ],
  "phases": {
    "base": {
      "positions": [{ "playerId": "p1", "x": 50, "y": 92 }],
      "opponentPositions": [{ "x": 50, "y": 12 }],
      "pressingLineY": 68,
      "comment": "4-3-3 기본 배치"
    },
    "attack": { "positions": [], "comment": "" },
    "defense": { "positions": [], "comment": "" }
  },
  "summary": "빌드업 시 좌측 하프스페이스 오버로드",
  "createdAt": "2026-09-01T11:20:00",
  "updatedAt": "2026-09-01T12:04:11"
}
```

오류: 존재하지 않는 id → `404 {"detail": "Analysis not found"}`

### 2.4 `POST /api/analyses`

새 분석 저장. 요청 본문은 `Analysis`에서 `id`/`createdAt`/`updatedAt`을 제외한 형태. 응답은 `201`과 저장된 전체 분석(id 포함).

### 2.5 `PUT /api/analyses/{id}`

전체 교체. 하위 `players`/`phases`/`positions`를 삭제 후 재삽입한다. 응답은 갱신된 전체 분석.

### 2.6 `DELETE /api/analyses/{id}`

`204 No Content`. 하위 데이터는 FK CASCADE로 함께 삭제된다.

### 2.7 검증 규칙과 오류 응답

Pydantic(서버)과 zod(클라이언트)에서 **동일한 규칙**을 적용한다.

서버 스키마에서 `phases`는 고정 필드 3개를 가진 모델이 아니라 **`Dict[PhaseType, PhaseIn]`으로 선언**하고, "3개 키가 모두 존재" 조건은 validator로 검사한다. 4단계 `crud.upsert_analysis`가 `payload.phases.items()`로 순회하기 때문이며, 2차의 타임라인 확장에서 국면 종류가 늘어날 때도 구조를 바꾸지 않아도 된다.

| 대상 | 규칙 | 위반 시 |
| --- | --- | --- |
| `x`, `y` | `0 <= v <= 100` | 422 |
| `players` | 정확히 11개, `id` 중복 불가 | 422 |
| `number` | 1~99 | 422 |
| `phases` | `base`/`attack`/`defense` 3개 모두 존재 | 422 |
| `positions` | 각 국면마다 11개, `playerId`가 `players`에 존재 | 422 |
| `opponentPositions` | 생략 가능. 존재하면 정확히 11개 | 422 |
| `matchDate` | `YYYY-MM-DD` | 422 |
| `analyzedTeam` | `home` \| `away` | 422 |
| `schemaVersion` | `1` | 422 |

FastAPI 기본 422 응답 형식을 그대로 사용한다:

```json
{
  "detail": [
    { "loc": ["body", "phases", "attack", "positions", 3, "x"],
      "msg": "Input should be less than or equal to 100",
      "type": "less_than_equal" }
  ]
}
```

프론트는 JSON 가져오기 실패 시 `loc` 경로를 사람이 읽을 수 있는 문구로 바꿔 보여준다(FR-07의 "오류 위치 안내").

## 3. 백엔드 패키지

`backend/requirements.txt`:

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
sqlalchemy==2.0.35
pydantic==2.9.2
pydantic-settings==2.5.2
python-dateutil==2.9.0
```

`pydantic-settings`는 §5의 `backend/.env`를 읽기 위해 필요하다. 이것 없이 값을 코드에 하드코딩하면, 6단계 운영 매뉴얼이 안내하는 "포트를 바꾸면 `.env`를 고치세요"가 실제로는 아무 효과가 없게 된다.

- DB 드라이버는 Python 표준 `sqlite3`를 쓰므로 별도 설치가 없다.
- 마이그레이션 도구(Alembic)는 MVP에서 쓰지 않는다. 스키마 변경 시 `tacticore.db`를 지우고 재생성한다(단일 사용자 로컬 전제). 2차에서 도입 검토.

## 4. 프론트엔드 패키지

`frontend/package.json` (주요 의존성):

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2",
    "@tanstack/react-query": "^5.56.2",
    "zustand": "^4.5.5",
    "framer-motion": "^11.5.4",
    "html-to-image": "^1.11.11",
    "zod": "^3.23.8",
    "nanoid": "^5.0.7",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2",
    "lucide-react": "^0.441.0"
  },
  "devDependencies": {
    "typescript": "^5.6.2",
    "vite": "^5.4.6",
    "@vitejs/plugin-react": "^4.3.1",
    "tailwindcss": "^3.4.11",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.10.0",
    "vitest": "^2.1.1"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- shadcn/ui는 npm 패키지가 아니라 CLI로 컴포넌트 소스를 복사해 넣는 방식이다: `npx shadcn@latest init` 후 `npx shadcn@latest add button dialog tabs input textarea select`.
- 테스트는 Vitest로 **순수 계산 로직만** 다룬다(오버로드 산출, 좌표 검증, 압박 라인 자동 산출, 직렬화). 컴포넌트 렌더링 테스트는 MVP 범위 밖이다.
- 단일 테스트 실행: `npx vitest run src/lib/overload.test.ts`, 이름으로 필터링은 `npx vitest run -t "오버로드"`.

## 5. 환경 설정

`frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

`backend/.env`:

```
DATABASE_URL=sqlite:///./tacticore.db
CORS_ORIGINS=http://localhost:5173
```

`.gitignore`에 반드시 포함할 항목:

```
backend/tacticore.db
backend/__pycache__/
backend/.venv/
frontend/node_modules/
frontend/dist/
.env
```

## 6. 실행 스크립트

Docker는 사용하지 않는다(2단계 §0). 두 프로세스를 각각 띄우거나, 아래 스크립트로 동시에 기동한다.

`scripts/dev.ps1` (Windows PowerShell):

```powershell
# 백엔드 (포트 8000)
Start-Process powershell -ArgumentList @(
  '-NoExit','-Command',
  "cd '$PSScriptRoot\..\backend'; .\.venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000"
)

# 프론트엔드 (포트 5173)
Start-Process powershell -ArgumentList @(
  '-NoExit','-Command',
  "cd '$PSScriptRoot\..\frontend'; npm run dev"
)

Start-Sleep -Seconds 3
Start-Process 'http://localhost:5173'
```

최초 1회 준비:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

cd ..\frontend
npm install
```

## 7. CORS 설정

`backend/main.py`에서 Vite Dev Server만 허용한다. 허용 목록은 §5의 `.env`에서 읽는다.

```python
# backend/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite:///./tacticore.db"
    cors_origins: str = "http://localhost:5173"   # 콤마 구분

    class Config:
        env_file = ".env"

settings = Settings()
```

```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

`allow_origins=["*"]`를 쓰지 않는다. 로컬 전용이라도 다른 사이트가 브라우저를 통해 로컬 API를 호출할 수 있는 상태를 만들 이유가 없다.

## 8. 다음 단계
`4단계_구현_상세_가이드.md`에서 Phase별 구현 순서와 핵심 코드 골격, 알고리즘 구현 주의사항을 정리한다.
