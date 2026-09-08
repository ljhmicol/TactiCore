import { beforeEach, describe, expect, it } from 'vitest'

import { FORMATIONS } from '@/lib/formations'
import { analysisSchema } from '@/lib/schema'

import { createEmptyAnalysis, useAnalysisStore } from './analysisStore'

/** TO-DO 14 — 벤치 선수(11명 초과) 추가/삭제가 선발 인덱스·좌표·스키마를 깨지 않는지 확인한다. */
describe('analysisStore — 벤치 선수', () => {
  beforeEach(() => {
    const analysis = createEmptyAnalysis('4-3-3', {
      matchName: '테스트',
      homeTeam: '홈',
      awayTeam: '원정',
      matchDate: '2026-09-01',
      analyzedTeam: 'home',
    })
    useAnalysisStore.getState().loadAnalysis(analysis)
  })

  it('addPlayer는 배열 끝에 벤치 선수를 추가하고 어느 국면의 positions에도 넣지 않는다', () => {
    useAnalysisStore.getState().addPlayer()
    const { analysis } = useAnalysisStore.getState()
    expect(analysis!.players).toHaveLength(12)
    const bench = analysis!.players[11]
    for (const phase of Object.values(analysis!.phases)) {
      expect(phase.positions.some((p) => p.playerId === bench.id)).toBe(false)
    }
  })

  it('addPlayer로 늘어난 스쿼드도 analysisSchema를 통과한다', () => {
    useAnalysisStore.getState().addPlayer()
    useAnalysisStore.getState().addPlayer()
    const { analysis } = useAnalysisStore.getState()
    const result = analysisSchema.safeParse(analysis)
    expect(result.success).toBe(true)
  })

  it('removePlayer는 벤치 선수만 지운다 — 선발은 지우지 못한다', () => {
    useAnalysisStore.getState().addPlayer()
    const benchId = useAnalysisStore.getState().analysis!.players[11].id
    const starterId = useAnalysisStore.getState().analysis!.players[0].id

    useAnalysisStore.getState().removePlayer(starterId)
    expect(useAnalysisStore.getState().analysis!.players).toHaveLength(12) // 선발 삭제는 무시됨

    useAnalysisStore.getState().removePlayer(benchId)
    expect(useAnalysisStore.getState().analysis!.players).toHaveLength(11)
    expect(useAnalysisStore.getState().analysis!.players.find((p) => p.id === benchId)).toBeUndefined()
  })

  it('removePlayer는 선발 11명 밑으로는 내려가지 않는다', () => {
    const starterId = useAnalysisStore.getState().analysis!.players[0].id
    useAnalysisStore.getState().removePlayer(starterId)
    expect(useAnalysisStore.getState().analysis!.players).toHaveLength(11)
  })

  it('applyFormation은 벤치 선수에게 좌표를 부여하지 않고, 선발 11명 인덱스를 보존한다', () => {
    useAnalysisStore.getState().addPlayer()
    useAnalysisStore.getState().applyFormation('4-4-2')
    const { analysis } = useAnalysisStore.getState()
    expect(analysis!.players).toHaveLength(12)
    const benchId = analysis!.players[11].id
    for (const phase of Object.values(analysis!.phases)) {
      expect(phase.positions).toHaveLength(11)
      expect(phase.positions.some((p) => p.playerId === benchId)).toBe(false)
    }
    const result = analysisSchema.safeParse(analysis)
    expect(result.success).toBe(true)
  })

  it('addPlayer는 23명을 넘기지 않는다', () => {
    for (let i = 0; i < 20; i++) useAnalysisStore.getState().addPlayer()
    expect(useAnalysisStore.getState().analysis!.players.length).toBeLessThanOrEqual(23)
  })
})

/** 로고 클릭 시 "처음 화면으로" — 로드된 분석과 관련 임시 상태를 비운다. */
describe('analysisStore — closeAnalysis', () => {
  it('analysis를 null로 되돌리고 국면·더러움 상태를 초기화한다', () => {
    const analysis = createEmptyAnalysis('4-3-3', {
      matchName: '테스트',
      homeTeam: '홈',
      awayTeam: '원정',
      matchDate: '2026-09-01',
      analyzedTeam: 'home',
    })
    useAnalysisStore.getState().loadAnalysis(analysis)
    useAnalysisStore.getState().switchPhase('attack')
    useAnalysisStore.getState().updatePlayer(analysis.players[0].id, { name: '수정됨' })

    useAnalysisStore.getState().closeAnalysis()

    const state = useAnalysisStore.getState()
    expect(state.analysis).toBeNull()
    expect(state.currentPhase).toBe('base')
    expect(state.previousPhase).toBeNull()
    expect(state.isDirty).toBe(false)
  })
})

/** TO-DO 4 — 상대 포메이션 템플릿을 대칭 배치해 오버로드 레이어를 바로 켤 수 있게 한다. */
describe('analysisStore — addOpponentsFromFormation', () => {
  beforeEach(() => {
    const analysis = createEmptyAnalysis('4-3-3', {
      matchName: '테스트',
      homeTeam: '홈',
      awayTeam: '원정',
      matchDate: '2026-09-01',
      analyzedTeam: 'home',
    })
    useAnalysisStore.getState().loadAnalysis(analysis)
  })

  it('지정한 포메이션 템플릿을 하프라인 기준(y=100-y)으로 대칭 이동해 현재 국면에 넣는다', () => {
    useAnalysisStore.getState().addOpponentsFromFormation('4-4-2')
    const { analysis, currentPhase } = useAnalysisStore.getState()
    const opp = analysis!.phases[currentPhase].opponentPositions
    expect(opp).toHaveLength(11)
    const template = FORMATIONS['4-4-2']
    opp!.forEach((p, i) => {
      expect(p.x).toBe(template[i].x)
      expect(p.y).toBe(100 - template[i].y)
    })
  })

  it('자팀 포메이션과 무관하게 선택한 상대 포메이션 모양을 쓴다(자팀은 4-3-3, 상대는 4-4-2)', () => {
    useAnalysisStore.getState().addOpponentsFromFormation('4-4-2')
    const { analysis, currentPhase } = useAnalysisStore.getState()
    const opp = analysis!.phases[currentPhase].opponentPositions
    // 4-3-3(자팀)의 미드필더 3명 x좌표(32/50/68)와 달리 4-4-2 상대는 미드필더 4명이다.
    expect(opp).not.toHaveLength(0)
    expect(opp!.map((p) => p.x)).not.toEqual(analysis!.phases[currentPhase].positions.map((p) => p.x))
  })

  it('현재 국면에만 적용되고 다른 국면은 그대로 둔다', () => {
    useAnalysisStore.getState().switchPhase('attack')
    useAnalysisStore.getState().addOpponentsFromFormation('3-5-2')
    const { analysis } = useAnalysisStore.getState()
    expect(analysis!.phases.attack.opponentPositions).toHaveLength(11)
    expect(analysis!.phases.base.opponentPositions).toBeUndefined()
    expect(analysis!.phases.defense.opponentPositions).toBeUndefined()
  })

  it('존재하지 않는 포메이션 이름은 무시하고 상태를 바꾸지 않는다', () => {
    const before = useAnalysisStore.getState().analysis
    useAnalysisStore.getState().addOpponentsFromFormation('존재하지-않음')
    expect(useAnalysisStore.getState().analysis).toBe(before)
  })

  it('결과가 analysisSchema를 통과한다', () => {
    useAnalysisStore.getState().addOpponentsFromFormation('4-4-2')
    const result = analysisSchema.safeParse(useAnalysisStore.getState().analysis)
    expect(result.success).toBe(true)
  })
})
