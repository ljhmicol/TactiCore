import { describe, expect, it } from 'vitest'

import { clampCoord, mirrorPoint } from '@/lib/coords'

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
