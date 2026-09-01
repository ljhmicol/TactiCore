import { nanoid } from 'nanoid'
import { create } from 'zustand'

import { FORMATIONS } from '@/lib/formations'
import type {
  Analysis,
  AnnotationType,
  DrawTool,
  LayerToggles,
  MatchInfo,
  PhaseType,
  Player,
  Point,
} from '@/types/analysis'

function emptyPhase(formation: string, players: Player[]) {
  const coords = FORMATIONS[formation] ?? FORMATIONS['4-3-3']
  return {
    positions: players.map((player, i) => ({
      playerId: player.id,
      x: coords[i]?.x ?? 50,
      y: coords[i]?.y ?? 50,
    })),
    comment: '',
    annotations: [],
  }
}

export function createEmptyAnalysis(formation: string, match: MatchInfo): Analysis {
  const players: Player[] = Array.from({ length: 11 }, (_, i) => ({
    id: nanoid(),
    name: '',
    number: i + 1,
  }))

  return {
    schemaVersion: 1,
    match,
    formation,
    players,
    phases: {
      base: emptyPhase(formation, players),
      attack: emptyPhase(formation, players),
      defense: emptyPhase(formation, players),
    },
    summary: '',
  }
}

/** 국면 전환 애니메이션 사양 (2단계 §8) — GhostLayer의 자동 노출 시간 계산에도 쓴다. */
export const PHASE_TRANSITION_MS = 600
const GHOST_AUTO_HIDE_MS = 2000

interface AnalysisStore {
  analysis: Analysis | null
  currentPhase: PhaseType
  previousPhase: PhaseType | null // Ghost View가 참조하는 "직전 국면"
  ghostAutoVisible: boolean // 전환 직후 2초간 자동으로 켜지는 Ghost 표시 (레이어 토글과 별개)
  layers: LayerToggles
  isMorphing: boolean
  isDirty: boolean
  drawTool: DrawTool // 전술 그리기 도구 (화면 설정 — 저장 대상 아님)
  editingPlayerId: string | null // 피치의 선수 클릭으로 연 편집 다이얼로그

  loadAnalysis: (a: Analysis) => void
  setPhase: (p: PhaseType) => void
  switchPhase: (p: PhaseType) => void // 국면 탭 클릭 — isMorphing/Ghost 타이밍까지 함께 처리
  setIsMorphing: (v: boolean) => void
  movePlayer: (playerId: string, x: number, y: number) => void // 현재 국면에만 반영
  moveOpponent: (slot: number, x: number, y: number) => void
  setDrawTool: (t: DrawTool) => void
  setEditingPlayer: (id: string | null) => void
  addAnnotation: (type: AnnotationType, from: Point, to: Point) => void // 현재 국면에 추가
  removeAnnotation: (id: string) => void
  addOpponents: () => void // 현재 국면에 상대팀 11명 기본 배치 추가 (자팀 포메이션을 하프라인 기준 대칭)
  removeOpponents: () => void
  setComment: (phase: PhaseType, text: string) => void
  setSummary: (text: string) => void
  setMatchInfo: (patch: Partial<MatchInfo>) => void
  updatePlayer: (playerId: string, patch: Partial<Omit<Player, 'id'>>) => void
  toggleLayer: (key: keyof LayerToggles) => void
  applyFormation: (name: string) => void // FR-06
  applySavedMeta: (meta: { id: number; createdAt: string; updatedAt: string }) => void // 저장 성공 후 id/시각만 반영
}

const defaultLayers: LayerToggles = {
  channelGrid: true,
  halfSpaces: true,
  pressingLine: true,
  compactness: false,
  overload: false,
  ghostView: false,
}

let morphTimer: ReturnType<typeof setTimeout> | undefined
let ghostTimer: ReturnType<typeof setTimeout> | undefined

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  analysis: null,
  currentPhase: 'base',
  previousPhase: null,
  ghostAutoVisible: false,
  layers: defaultLayers,
  isMorphing: false,
  isDirty: false,
  drawTool: 'select',
  editingPlayerId: null,

  loadAnalysis: (a) =>
    set({ analysis: a, currentPhase: 'base', previousPhase: null, isDirty: false, editingPlayerId: null }),

  setPhase: (p) => set({ currentPhase: p }),

  switchPhase: (next) => {
    const { currentPhase } = get()
    if (next === currentPhase) return

    clearTimeout(morphTimer)
    clearTimeout(ghostTimer)

    set({ previousPhase: currentPhase, currentPhase: next, isMorphing: true, ghostAutoVisible: true })

    morphTimer = setTimeout(() => set({ isMorphing: false }), PHASE_TRANSITION_MS)
    ghostTimer = setTimeout(() => set({ ghostAutoVisible: false }), GHOST_AUTO_HIDE_MS)
  },

  setIsMorphing: (v) => set({ isMorphing: v }),

  movePlayer: (playerId, x, y) => {
    const { analysis, currentPhase } = get()
    if (!analysis) return
    const phase = analysis.phases[currentPhase]
    set({
      analysis: {
        ...analysis,
        phases: {
          ...analysis.phases,
          [currentPhase]: {
            ...phase,
            positions: phase.positions.map((pos) => (pos.playerId === playerId ? { ...pos, x, y } : pos)),
          },
        },
      },
      isDirty: true,
    })
  },

  moveOpponent: (slot, x, y) => {
    const { analysis, currentPhase } = get()
    if (!analysis) return
    const phase = analysis.phases[currentPhase]
    const opp = phase.opponentPositions ? [...phase.opponentPositions] : []
    opp[slot] = { x, y }
    set({
      analysis: {
        ...analysis,
        phases: {
          ...analysis.phases,
          [currentPhase]: { ...phase, opponentPositions: opp },
        },
      },
      isDirty: true,
    })
  },

  setDrawTool: (t) => set({ drawTool: t }),

  setEditingPlayer: (id) => set({ editingPlayerId: id }),

  addAnnotation: (type, from, to) => {
    const { analysis, currentPhase } = get()
    if (!analysis) return
    const phase = analysis.phases[currentPhase]
    set({
      analysis: {
        ...analysis,
        phases: {
          ...analysis.phases,
          [currentPhase]: {
            ...phase,
            annotations: [...phase.annotations, { id: nanoid(), type, from, to }],
          },
        },
      },
      isDirty: true,
    })
  },

  removeAnnotation: (id) => {
    const { analysis, currentPhase } = get()
    if (!analysis) return
    const phase = analysis.phases[currentPhase]
    set({
      analysis: {
        ...analysis,
        phases: {
          ...analysis.phases,
          [currentPhase]: { ...phase, annotations: phase.annotations.filter((a) => a.id !== id) },
        },
      },
      isDirty: true,
    })
  },

  addOpponents: () => {
    const { analysis, currentPhase } = get()
    if (!analysis) return
    const phase = analysis.phases[currentPhase]
    // 자팀 포메이션을 하프라인 기준으로 대칭 이동한 좌표를 기본값으로 준다 (y' = 100 - y).
    const opp = phase.positions.map((p) => ({ x: p.x, y: 100 - p.y }))
    set({
      analysis: { ...analysis, phases: { ...analysis.phases, [currentPhase]: { ...phase, opponentPositions: opp } } },
      isDirty: true,
    })
  },

  removeOpponents: () => {
    const { analysis, currentPhase } = get()
    if (!analysis) return
    const phase = analysis.phases[currentPhase]
    const { opponentPositions: _drop, ...rest } = phase
    void _drop
    set({
      analysis: { ...analysis, phases: { ...analysis.phases, [currentPhase]: rest } },
      isDirty: true,
    })
  },

  setComment: (phase, text) => {
    const { analysis } = get()
    if (!analysis) return
    set({
      analysis: {
        ...analysis,
        phases: { ...analysis.phases, [phase]: { ...analysis.phases[phase], comment: text } },
      },
      isDirty: true,
    })
  },

  setSummary: (text) => {
    const { analysis } = get()
    if (!analysis) return
    set({ analysis: { ...analysis, summary: text }, isDirty: true })
  },

  setMatchInfo: (patch) => {
    const { analysis } = get()
    if (!analysis) return
    set({ analysis: { ...analysis, match: { ...analysis.match, ...patch } }, isDirty: true })
  },

  updatePlayer: (playerId, patch) => {
    const { analysis } = get()
    if (!analysis) return
    set({
      analysis: {
        ...analysis,
        players: analysis.players.map((p) => (p.id === playerId ? { ...p, ...patch } : p)),
      },
      isDirty: true,
    })
  },

  toggleLayer: (key) => set((state) => ({ layers: { ...state.layers, [key]: !state.layers[key] } })),

  applyFormation: (name) => {
    const { analysis } = get()
    if (!analysis) return
    const coords = FORMATIONS[name]
    if (!coords) return
    const phases = { ...analysis.phases }
    for (const phaseType of Object.keys(phases) as PhaseType[]) {
      phases[phaseType] = {
        ...phases[phaseType],
        positions: analysis.players.map((player, i) => ({
          playerId: player.id,
          x: coords[i]?.x ?? 50,
          y: coords[i]?.y ?? 50,
        })),
      }
    }
    set({ analysis: { ...analysis, formation: name, phases }, isDirty: true })
  },

  applySavedMeta: (meta) => {
    const { analysis } = get()
    if (!analysis) return
    set({ analysis: { ...analysis, ...meta }, isDirty: false })
  },
}))
