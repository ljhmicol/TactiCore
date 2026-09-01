import { describe, expect, it } from 'vitest'

import { computeOverload } from '@/lib/overload'
import type { PhaseData } from '@/types/analysis'

function phase(own: { x: number; y: number }[], opp?: { x: number; y: number }[]): PhaseData {
  return {
    positions: own.map((p, i) => ({ playerId: `p${i}`, ...p })),
    opponentPositions: opp,
    comment: '',
  }
}

describe('computeOverload', () => {
  it('상대 좌표가 없으면 빈 배열을 반환한다 (레이어 비활성)', () => {
    expect(computeOverload(phase([{ x: 50, y: 50 }]))).toEqual([])
    expect(computeOverload(phase([{ x: 50, y: 50 }], []))).toEqual([])
  })

  it('15구역(5채널 x 3서드)을 모두 생성한다', () => {
    const result = computeOverload(phase([], [{ x: 50, y: 50 }]))
    expect(result).toHaveLength(15)
  })

  it('diff>=2는 strong, diff==1은 weak, 그 외는 none이다', () => {
    // center / middle zone: x in [36.5,63.5), y in [33.3,66.7)
    const own = [
      { x: 50, y: 50 },
      { x: 51, y: 50 },
      { x: 52, y: 50 },
    ]
    const opp = [{ x: 50, y: 51 }]
    const result = computeOverload(phase(own, opp))
    const centerMiddle = result.find((z) => z.channel === 'center' && z.third === 'middle')!
    expect(centerMiddle.own).toBe(3)
    expect(centerMiddle.opp).toBe(1)
    expect(centerMiddle.diff).toBe(2)
    expect(centerMiddle.level).toBe('strong')
  })

  it('경계는 하한 포함·상한 배제이다 (x=20은 leftHalf, x=36.5는 center)', () => {
    const result = computeOverload(phase([{ x: 20, y: 50 }, { x: 36.5, y: 50 }], [{ x: 0, y: 0 }]))
    const leftWingMiddle = result.find((z) => z.channel === 'leftWing' && z.third === 'middle')!
    const leftHalfMiddle = result.find((z) => z.channel === 'leftHalf' && z.third === 'middle')!
    const centerMiddle = result.find((z) => z.channel === 'center' && z.third === 'middle')!
    expect(leftWingMiddle.own).toBe(0) // x=20은 leftWing(0~20)에 안 속함 — 상한 배제
    expect(leftHalfMiddle.own).toBe(1) // x=20은 leftHalf(20~36.5)의 하한 포함
    expect(centerMiddle.own).toBe(1) // x=36.5는 center(36.5~63.5)의 하한 포함
  })

  it('좌표가 정확히 100인 선수도 마지막 구역에 포함된다 (JSON 가져오기 경로 대응)', () => {
    const result = computeOverload(phase([{ x: 100, y: 100 }], [{ x: 0, y: 0 }]))
    const rightWingDefensive = result.find((z) => z.channel === 'rightWing' && z.third === 'defensive')!
    expect(rightWingDefensive.own).toBe(1)
    const totalOwnCounted = result.reduce((sum, z) => sum + z.own, 0)
    expect(totalOwnCounted).toBe(1) // 어떤 구역에서도 누락되지 않고 정확히 한 번만 집계됨
  })
})
