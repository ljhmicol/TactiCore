import { nanoid } from 'nanoid'
import { create } from 'zustand'

import { FORMATIONS } from '@/lib/formations'
import type { Analysis, LayerToggles, MatchInfo, PhaseType, Player } from '@/types/analysis'

function emptyPhase(formation: string, players: Player[]) {
  const coords = FORMATIONS[formation] ?? FORMATIONS['4-3-3']
  return {
    positions: players.map((player, i) => ({
      playerId: player.id,
      x: coords[i]?.x ?? 50,
      y: coords[i]?.y ?? 50,
    })),
    comment: '',
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

interface AnalysisStore {
  analysis: Analysis | null
  currentPhase: PhaseType
  layers: LayerToggles
  isMorphing: boolean
  isDirty: boolean

  loadAnalysis: (a: Analysis) => void
  setPhase: (p: PhaseType) => void
  setIsMorphing: (v: boolean) => void
  movePlayer: (playerId: string, x: number, y: number) => void // 현재 국면에만 반영
  moveOpponent: (slot: number, x: number, y: number) => void
  setComment: (phase: PhaseType, text: string) => void
  setSummary: (text: string) => void
  setMatchInfo: (patch: Partial<MatchInfo>) => void
  updatePlayer: (playerId: string, patch: Partial<Omit<Player, 'id'>>) => void
  toggleLayer: (key: keyof LayerToggles) => void
  applyFormation: (name: string) => void // FR-06
}

const defaultLayers: LayerToggles = {
  channelGrid: true,
  halfSpaces: true,
  pressingLine: true,
  compactness: false,
  overload: false,
  ghostView: false,
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  analysis: null,
  currentPhase: 'base',
  layers: defaultLayers,
  isMorphing: false,
  isDirty: false,

  loadAnalysis: (a) => set({ analysis: a, currentPhase: 'base', isDirty: false }),

  setPhase: (p) => set({ currentPhase: p }),

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
}))
