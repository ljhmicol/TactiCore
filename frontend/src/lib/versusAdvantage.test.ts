import { describe, expect, it } from 'vitest'

import { computeMatchupAdvantage } from '@/lib/versusAdvantage'
import type { ZoneOverload } from '@/types/analysis'

function zone(diff: number, channel: ZoneOverload['channel'] = 'center', third: ZoneOverload['third'] = 'middle'): ZoneOverload {
  return { channel, third, own: Math.max(diff, 0), opp: Math.max(-diff, 0), diff, level: 'none' }
}

describe('computeMatchupAdvantage', () => {
  it('counts positive diff zones as A, negative as B, zero as neutral', () => {
    const result = computeMatchupAdvantage([zone(2), zone(1), zone(0), zone(-1), zone(-3)])
    expect(result.aZoneCount).toBe(2)
    expect(result.bZoneCount).toBe(2)
    expect(result.neutralZoneCount).toBe(1)
    expect(result.totalZones).toBe(5)
  })

  it('picks the most lopsided zone for each side', () => {
    const result = computeMatchupAdvantage([
      zone(1, 'leftWing'),
      zone(3, 'center'),
      zone(-1, 'rightWing'),
      zone(-2, 'rightHalf'),
    ])
    expect(result.aTopZone?.channel).toBe('center')
    expect(result.aTopZone?.diff).toBe(3)
    expect(result.bTopZone?.channel).toBe('rightHalf')
    expect(result.bTopZone?.diff).toBe(-2)
  })

  it('returns null top zones when nobody is ahead anywhere', () => {
    const result = computeMatchupAdvantage([zone(0), zone(0)])
    expect(result.aTopZone).toBeNull()
    expect(result.bTopZone).toBeNull()
  })

  it('handles an empty zone list', () => {
    const result = computeMatchupAdvantage([])
    expect(result).toEqual({
      aZoneCount: 0,
      bZoneCount: 0,
      neutralZoneCount: 0,
      totalZones: 0,
      aTopZone: null,
      bTopZone: null,
    })
  })
})
