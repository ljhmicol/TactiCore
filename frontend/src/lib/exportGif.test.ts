import { describe, expect, it } from 'vitest'

import { createEmptyAnalysis } from '@/store/analysisStore'
import type { PlayerPosition } from '@/types/analysis'

import { buildGifFrameSpecs, easeInOutCubic, interpolatePositions } from './exportGif'

describe('easeInOutCubic', () => {
  it('starts at 0 and ends at 1', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(1)).toBe(1)
  })

  it('is monotonically increasing (no overshoot)', () => {
    let prev = -Infinity
    for (let t = 0; t <= 1; t += 0.1) {
      const v = easeInOutCubic(t)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })
})

describe('interpolatePositions', () => {
  const from: PlayerPosition[] = [
    { playerId: 'p1', x: 0, y: 0 },
    { playerId: 'p2', x: 20, y: 80 },
  ]
  const to: PlayerPosition[] = [
    { playerId: 'p1', x: 100, y: 100 },
    { playerId: 'p2', x: 40, y: 40 },
  ]

  it('t=0이면 from과 같다', () => {
    expect(interpolatePositions(from, to, 0)).toEqual(from)
  })

  it('t=1이면 to와 같다(순서·값 모두)', () => {
    const result = interpolatePositions(from, to, 1)
    expect(result.map(({ playerId, x, y }) => ({ playerId, x, y }))).toEqual(to)
  })

  it('t=0.5면 정확히 중간값이다', () => {
    const result = interpolatePositions(from, to, 0.5)
    expect(result).toEqual([
      { playerId: 'p1', x: 50, y: 50 },
      { playerId: 'p2', x: 30, y: 60 },
    ])
  })

  it('to에 없는 playerId는 원래 위치를 그대로 유지한다(안전장치)', () => {
    const result = interpolatePositions(from, [{ playerId: 'p1', x: 100, y: 100 }], 0.5)
    expect(result.find((p) => p.playerId === 'p2')).toEqual({ playerId: 'p2', x: 20, y: 80 })
  })
})

describe('buildGifFrameSpecs', () => {
  const analysis = createEmptyAnalysis('4-3-3', {
    matchName: '테스트',
    homeTeam: '홈',
    awayTeam: '원정',
    matchDate: '2026-09-08',
    analyzedTeam: 'home',
  })

  it('기본→공격→수비→기본 순환이 되도록 3번의 전환을 포함한다', () => {
    const frames = buildGifFrameSpecs(analysis)
    const phaseSequence = [...new Set(frames.map((f) => f.phase))]
    expect(phaseSequence).toEqual(['base', 'attack', 'defense'])
  })

  it('각 국면마다 정지 프레임이 정확히 하나씩 있다(위치가 해당 국면의 원본 positions와 동일)', () => {
    const frames = buildGifFrameSpecs(analysis)
    const baseHold = frames.find((f) => f.phase === 'base' && f.positions === analysis.phases.base.positions)
    expect(baseHold).toBeDefined()
  })

  it('모든 프레임의 delay는 0보다 크다(재생이 멈추지 않도록)', () => {
    const frames = buildGifFrameSpecs(analysis)
    for (const f of frames) {
      expect(f.delayMs).toBeGreaterThan(0)
    }
  })

  it('선수 11명 모두 매 프레임에 위치를 갖는다', () => {
    const frames = buildGifFrameSpecs(analysis)
    for (const f of frames) {
      expect(f.positions).toHaveLength(11)
    }
  })
})
