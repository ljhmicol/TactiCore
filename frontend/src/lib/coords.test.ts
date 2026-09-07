import { describe, expect, it } from 'vitest'

import { clampCoord, mirrorPoint, resolveDefendingPressingLineY } from '@/lib/coords'

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
  it('returns A value unchanged when A defends', () => {
    expect(resolveDefendingPressingLineY(true, 82, 40)).toBe(82)
  })

  it('mirrors B value (100-y) when B defends', () => {
    expect(resolveDefendingPressingLineY(false, 82, 40)).toBe(60)
  })

  // 회귀 테스트 — 2026-09-07 실제 버그: 백엔드에서 불러온 분석은 미설정
  // pressingLineY가 undefined가 아니라 null로 온다(Python None → JSON
  // null). `!== undefined`만 검사하면 null을 "0으로 지정됨"으로 오인해
  // `100 - null`(JS가 null→0 강제 변환)인 100을 반환해버렸다 — 전술
  // 대결에서 공수를 교대해도 한쪽 방향은 압박 라인이 항상 100(매우 낮음)에
  // 고정되는 눈에 보이는 버그였다.
  it('treats null the same as undefined for both A and B (regression)', () => {
    expect(resolveDefendingPressingLineY(true, null, 40)).toBeUndefined()
    expect(resolveDefendingPressingLineY(true, undefined, 40)).toBeUndefined()
    expect(resolveDefendingPressingLineY(false, 82, null)).toBeUndefined()
    expect(resolveDefendingPressingLineY(false, 82, undefined)).toBeUndefined()
  })

  it('0 is a real value, not "unset" — must not be treated as null', () => {
    expect(resolveDefendingPressingLineY(true, 0, 40)).toBe(0)
    expect(resolveDefendingPressingLineY(false, 82, 0)).toBe(100)
  })
})
