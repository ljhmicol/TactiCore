import { describe, expect, it } from 'vitest'

import { FORMATIONS, FORMATION_NAMES } from '@/lib/formations'

/** TO-DO 15번 — 포메이션 프리셋 무결성. 좌표 배열이 11개가 아니면 applyFormation이 어긋난다. */
describe('FORMATIONS', () => {
  it('18종 이상의 포메이션이 있다', () => {
    expect(FORMATION_NAMES.length).toBeGreaterThanOrEqual(18)
  })

  it('모든 포메이션은 정확히 11개 좌표를 가진다', () => {
    for (const [name, coords] of Object.entries(FORMATIONS)) {
      expect(coords, name).toHaveLength(11)
    }
  })

  it('모든 좌표는 0~100 안에 있다', () => {
    for (const [name, coords] of Object.entries(FORMATIONS)) {
      for (const c of coords) {
        expect(c.x, `${name} x`).toBeGreaterThanOrEqual(0)
        expect(c.x, `${name} x`).toBeLessThanOrEqual(100)
        expect(c.y, `${name} y`).toBeGreaterThanOrEqual(0)
        expect(c.y, `${name} y`).toBeLessThanOrEqual(100)
      }
    }
  })

  it('이름의 라인 합계가 11명(골키퍼 제외)과 일치한다', () => {
    for (const name of FORMATION_NAMES) {
      const sum = name.split('-').reduce((acc, part) => acc + Number(part), 0)
      expect(sum, name).toBe(10)
    }
  })
})
