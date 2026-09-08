import { describe, expect, it } from 'vitest'

import { clampCoord, mirrorPoint, resolveDefendingPressingLineLevel, resolveDefendingPressingLineY } from '@/lib/coords'
import type { PlayerPosition } from '@/types/analysis'

// 각 팀 고유(미러링 전) 좌표계 — GK가 y 최댓값이라는 autoPressingLine의 전제가
// 성립하는 "정상" 방향이다. positionsB는 일부러 GK 다음으로 얕은 선수(fw, y=40)를
// 뒀다 — 미러링 후에는 이 선수가 가장 전진한 값(y'=60)이 되어, 좌표를 먼저
// 미러링한 뒤 autoPressingLine을 돌리면 이 fw의 라인(32, mf)이 잘못 뽑힌다.
const positionsA: PlayerPosition[] = [
  { playerId: 'a-gk', x: 50, y: 95 },
  { playerId: 'a-cb', x: 50, y: 70 },
  { playerId: 'a-mf', x: 50, y: 50 },
  { playerId: 'a-fw', x: 50, y: 20 },
]
const positionsB: PlayerPosition[] = [
  { playerId: 'b-gk', x: 50, y: 95 },
  { playerId: 'b-cb', x: 50, y: 82 },
  { playerId: 'b-mf', x: 50, y: 68 },
  { playerId: 'b-fw', x: 50, y: 40 },
]

describe('clampCoord', () => {
  it('clamps below 0 up to 0', () => {
    expect(clampCoord(-5)).toBe(0)
  })

  it('clamps 100 and above down to 99.9', () => {
    expect(clampCoord(100)).toBe(99.9)
    expect(clampCoord(150)).toBe(99.9)
  })

  it('passes through in-range values', () => {
    expect(clampCoord(42)).toBe(42)
  })
})

describe('mirrorPoint', () => {
  it('rotates 180 degrees around the pitch center', () => {
    expect(mirrorPoint({ x: 50, y: 94 })).toEqual({ x: 50, y: 6 })
    expect(mirrorPoint({ x: 20, y: 30 })).toEqual({ x: 80, y: 70 })
  })

  it('is its own inverse', () => {
    const p = { x: 17.5, y: 62.25 }
    expect(mirrorPoint(mirrorPoint(p))).toEqual(p)
  })

  it('leaves the pitch center fixed', () => {
    expect(mirrorPoint({ x: 50, y: 50 })).toEqual({ x: 50, y: 50 })
  })
})

describe('resolveDefendingPressingLineY', () => {
  it('returns A value unchanged when A defends (manual value set)', () => {
    expect(resolveDefendingPressingLineY(true, 82, 40, positionsA, positionsB)).toBe(82)
  })

  it('mirrors B value (100-y) when B defends (manual value set)', () => {
    expect(resolveDefendingPressingLineY(false, 82, 40, positionsA, positionsB)).toBe(60)
  })

  // 회귀 테스트 — 2026-09-07 실제 버그: 백엔드에서 불러온 분석은 미설정
  // pressingLineY가 undefined가 아니라 null로 온다(Python None → JSON
  // null). `!== undefined`만 검사하면 null을 "0으로 지정됨"으로 오인해
  // `100 - null`(JS가 null→0 강제 변환)인 100을 반환해버렸다 — 전술
  // 대결에서 공수를 교대해도 한쪽 방향은 압박 라인이 항상 100(매우 낮음)에
  // 고정되는 눈에 보이는 버그였다. null·undefined 둘 다 "미설정"으로
  // 취급해 자동 산출(autoPressingLine)로 폴백해야 한다.
  it('treats null the same as undefined for both A and B — falls back to autoPressingLine', () => {
    expect(resolveDefendingPressingLineY(true, null, 40, positionsA, positionsB)).toBe(70) // autoPressingLine(positionsA)
    expect(resolveDefendingPressingLineY(true, undefined, 40, positionsA, positionsB)).toBe(70)
    expect(resolveDefendingPressingLineY(false, 82, null, positionsA, positionsB)).toBe(18) // 100 - autoPressingLine(positionsB), autoPressingLine(positionsB)=82
    expect(resolveDefendingPressingLineY(false, 82, undefined, positionsA, positionsB)).toBe(18)
  })

  it('0 is a real value, not "unset" — must not be treated as null', () => {
    expect(resolveDefendingPressingLineY(true, 0, 40, positionsA, positionsB)).toBe(0)
    expect(resolveDefendingPressingLineY(false, 82, 0, positionsA, positionsB)).toBe(100)
  })

  // 회귀 테스트 — 2026-09-08 실제 버그: "A공격이면 B팀 수비라인이 압박라인
  // 이어야 하는데 이상하게 돼있어". 좌표를 먼저 미러링한 뒤 autoPressingLine을
  // 돌리면 GK 판별(y 최댓값)이 뒤집혀서, positionsB의 실제 백라인(cb, y=82 →
  // 미러링 후 18)이 아니라 엉뚱한 선수(mf, 미러링 후 32)가 뽑힌다. 반드시
  // 미러링 전 원본 positionsB로 자동 산출한 뒤 마지막에 결과값만 미러링해야
  // 한다.
  it('auto-computes on native (unmirrored) positions before mirroring the scalar result', () => {
    const result = resolveDefendingPressingLineY(false, 82, null, positionsA, positionsB)
    expect(result).toBe(18)
    expect(result).not.toBe(32) // 좌표를 먼저 미러링했다면 나왔을 잘못된 값
  })
})

describe('resolveDefendingPressingLineLevel', () => {
  it('A가 수비면 resolveDefendingPressingLineY와 같다(미러링이 없으므로)', () => {
    expect(resolveDefendingPressingLineLevel(true, 82, 40, positionsA, positionsB)).toBe(82)
    expect(resolveDefendingPressingLineLevel(true, null, 40, positionsA, positionsB)).toBe(70)
  })

  // 회귀 테스트 — 2026-09-08 실제 버그(2차): "전술 대결에서 교대할 때 압박라인이
  // 좀 이상하다". resolveDefendingPressingLineY(false, ...)는 그리기 위치를 위해
  // B의 값을 미러링해 100-82=18을 반환하는데, 이 미러링된 값을 그대로
  // pressingLineLevel에 넣으면 B팀의 평범한(깊은) 백라인이 "매우 높음"으로
  // 잘못 표시된다. labelY(이 함수의 반환값)는 미러링하지 않은 B의 원본 값(82,
  // 자기 진영 깊숙한 라인 → "낮음")을 그대로 반환해야 한다.
  it('B가 수비면 미러링하지 않은 원본 값을 반환한다(resolveDefendingPressingLineY와 다름)', () => {
    const drawY = resolveDefendingPressingLineY(false, 82, 40, positionsA, positionsB)
    const labelY = resolveDefendingPressingLineLevel(false, 82, 40, positionsA, positionsB)
    expect(drawY).toBe(60) // 그리기용 — 미러링됨(100-40)
    expect(labelY).toBe(40) // 라벨용 — 미러링 안 됨(B의 원본 값 그대로)
  })

  it('B가 수비면서 자동 산출인 경우도 미러링하지 않는다', () => {
    const labelY = resolveDefendingPressingLineLevel(false, 82, null, positionsA, positionsB)
    expect(labelY).toBe(82) // autoPressingLine(positionsB) 그대로, 100-82 아님
  })
})
