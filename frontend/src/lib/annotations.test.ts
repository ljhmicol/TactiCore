import { describe, expect, it } from 'vitest'

import { ANNOTATION_MIN_LENGTH, arrowGeometry } from '@/lib/annotations'
import { analysisSchema } from '@/lib/schema'

const PITCH_LENGTH_M = 105
const PITCH_WIDTH_M = 68
const K = PITCH_LENGTH_M / PITCH_WIDTH_M

describe('arrowGeometry', () => {
  it('화살촉 tip은 정확히 to에 놓인다', () => {
    const geo = arrowGeometry({ x: 20, y: 80 }, { x: 40, y: 40 })
    expect(geo.head[0]).toEqual({ x: 40, y: 40 })
  })

  it('수직 화살표의 화살촉 좌우 날이 균일 축척 공간에서 대칭이다', () => {
    const from = { x: 50, y: 80 }
    const to = { x: 50, y: 40 }
    const geo = arrowGeometry(from, to)
    const [, left, right] = geo.head
    // 균일 공간(y*K)에서 두 날의 y가 같고 x가 tip 기준 대칭
    expect(left.y * K).toBeCloseTo(right.y * K)
    expect((to.x - left.x)).toBeCloseTo(-(to.x - right.x))
  })

  it('화살대 끝은 화살촉에 묻히지 않도록 to보다 짧다', () => {
    const geo = arrowGeometry({ x: 10, y: 90 }, { x: 80, y: 20 })
    const dShaft = Math.hypot(geo.shaftEnd.x - 10, (geo.shaftEnd.y - 90) * K)
    const dTip = Math.hypot(80 - 10, (20 - 90) * K)
    expect(dShaft).toBeLessThan(dTip)
    expect(dShaft).toBeGreaterThan(0)
  })

  it('길이 0 입력에서도 죽지 않는다', () => {
    const p = { x: 50, y: 50 }
    expect(arrowGeometry(p, p)).toEqual({ shaftEnd: p, head: [p, p, p] })
  })

  it('최소 길이 기준은 실수 클릭 수준으로 잡혀 있다', () => {
    expect(ANNOTATION_MIN_LENGTH).toBeLessThan(4)
  })
})

describe('annotations 스키마', () => {
  const base = {
    schemaVersion: 1,
    match: {
      matchName: 't',
      homeTeam: 'a',
      awayTeam: 'b',
      matchDate: '2026-01-01',
      analyzedTeam: 'home',
    },
    formation: '4-4-2',
    players: Array.from({ length: 11 }, (_, i) => ({ id: `p${i}`, name: `n${i}`, number: i + 1 })),
    summary: '',
  }
  const positions = Array.from({ length: 11 }, (_, i) => ({ playerId: `p${i}`, x: 50, y: 50 }))

  it('annotations 키가 없는 구버전 데이터는 빈 배열로 채워진다', () => {
    const parsed = analysisSchema.parse({
      ...base,
      phases: {
        base: { positions, comment: '' },
        attack: { positions, comment: '' },
        defense: { positions, comment: '' },
      },
    })
    expect(parsed.phases.base.annotations).toEqual([])
    expect(parsed.phases.attack.annotations).toEqual([])
  })

  it('화살표를 파싱하고 잘못된 type은 거부한다', () => {
    const withArrow = {
      ...base,
      phases: {
        base: {
          positions,
          comment: '',
          annotations: [{ id: 'a1', type: 'run', from: { x: 10, y: 10 }, to: { x: 40, y: 30 } }],
        },
        attack: { positions, comment: '' },
        defense: { positions, comment: '' },
      },
    }
    expect(analysisSchema.parse(withArrow).phases.base.annotations).toHaveLength(1)

    const bad = structuredClone(withArrow)
    bad.phases.base.annotations[0].type = 'dribble'
    expect(analysisSchema.safeParse(bad).success).toBe(false)
  })
})
