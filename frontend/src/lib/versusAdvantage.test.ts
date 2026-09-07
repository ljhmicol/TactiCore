import { describe, expect, it } from 'vitest'

import { computeMatchupAdvantage } from '@/lib/versusAdvantage'
import type { ZoneOverload } from '@/types/analysis'

function zone(diff: number, channel: ZoneOverload['channel'] = 'center', third: ZoneOverload['third'] = 'middle'): ZoneOverload {
  return { channel, third, own: Math.max(diff, 0), opp: Math.max(-diff, 0), diff, level: 'none' }
}

describe('computeMatchupAdvantage', () => {
  it('splits positive diff zones into aZones, negative into bZones, zero as neutral', () => {
    const result = computeMatchupAdvantage([zone(2), zone(1), zone(0), zone(-1), zone(-3)])
    expect(result.aZones).toHaveLength(2)
    expect(result.bZones).toHaveLength(2)
    expect(result.neutralZoneCount).toBe(1)
    expect(result.totalZones).toBe(5)
  })

  it('sorts each side by |diff| descending and picks the top as aTopZone/bTopZone', () => {
    const result = computeMatchupAdvantage([
      zone(1, 'leftWing'),
      zone(3, 'center'),
      zone(-1, 'rightWing'),
      zone(-2, 'rightHalf'),
    ])
    expect(result.aZones.map((z) => z.channel)).toEqual(['center', 'leftWing'])
    expect(result.bZones.map((z) => z.channel)).toEqual(['rightHalf', 'rightWing'])
    expect(result.aTopZone?.diff).toBe(3)
    expect(result.bTopZone?.diff).toBe(-2)
  })

  it('returns null top zones and empty lists when nobody is ahead anywhere', () => {
    const result = computeMatchupAdvantage([zone(0), zone(0)])
    expect(result.aZones).toEqual([])
    expect(result.bZones).toEqual([])
    expect(result.aTopZone).toBeNull()
    expect(result.bTopZone).toBeNull()
  })

  it('handles an empty zone list', () => {
    const result = computeMatchupAdvantage([])
    expect(result).toEqual({
      aZones: [],
      bZones: [],
      neutralZoneCount: 0,
      totalZones: 0,
      aTopZone: null,
      bTopZone: null,
    })
  })
})
