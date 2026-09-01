/**
 * 포지션 코드·라인 도출 (2026-09-01 사용자 요청).
 *
 * 포메이션 이름("4-2-3-1")과 players 배열 순서(GK → DF → MF → FW,
 * formations.ts 규약)만으로 각 선수의 포지션 코드(LB/CB/DM/AM/LW…)와
 * 라인(GK/DF/MF/FW)을 계산한다. 스키마·DB 변경이 없는 대신, 코드는
 * "포메이션 슬롯 기준 자동 라벨"이지 사용자 편집 대상이 아니다
 * (선수의 role 필드는 개인 메모로 계속 별도 동작).
 *
 * 라벨 규칙 (코칭 관례):
 * - DF: 4백 LB/CB/CB/RB, 3백 LCB/CB/RCB, 5백 LWB/CB×3/RWB
 * - MF: 라인이 여럿이면 첫 라인=DM(볼란치), 마지막 라인=AM(공미).
 *   3백의 첫 MF 라인 바깥 2명은 윙백(LWB/RWB)으로 부른다.
 * - FW: 1명 ST, 2명 더블 ST, 3명 LW/ST/RW
 */
export type PositionLine = 'GK' | 'DF' | 'MF' | 'FW'

export interface PositionInfo {
  line: PositionLine
  label: string
}

export const POSITION_LINE_KOREAN: Record<PositionLine, string> = {
  GK: '골키퍼',
  DF: '수비',
  MF: '미드필더',
  FW: '공격',
}

const DF_LABELS: Record<number, string[]> = {
  2: ['CB', 'CB'],
  3: ['LCB', 'CB', 'RCB'],
  4: ['LB', 'CB', 'CB', 'RB'],
  5: ['LWB', 'CB', 'CB', 'CB', 'RWB'],
}

const FW_LABELS: Record<number, string[]> = {
  1: ['ST'],
  2: ['ST', 'ST'],
  3: ['LW', 'ST', 'RW'],
  4: ['LW', 'ST', 'ST', 'RW'],
}

type MfDepth = 'single' | 'deep' | 'mid' | 'high'

function mfLabels(depth: MfDepth, size: number, wideIsWingback: boolean): string[] {
  const table: Record<MfDepth, Record<number, string[]>> = {
    single: {
      1: ['DM'],
      2: ['CM', 'CM'],
      3: ['CM', 'CM', 'CM'],
      4: ['LM', 'CM', 'CM', 'RM'],
      5: ['LM', 'CM', 'CM', 'CM', 'RM'],
      6: ['LM', 'CM', 'CM', 'CM', 'CM', 'RM'],
    },
    deep: {
      1: ['DM'],
      2: ['DM', 'DM'],
      3: ['CM', 'CM', 'CM'],
      4: ['LM', 'CM', 'CM', 'RM'],
      5: ['LM', 'CM', 'CM', 'CM', 'RM'],
      6: ['LM', 'CM', 'CM', 'CM', 'CM', 'RM'],
    },
    mid: {
      2: ['CM', 'CM'],
      3: ['CM', 'CM', 'CM'],
      4: ['LM', 'CM', 'CM', 'RM'],
    },
    high: {
      1: ['AM'],
      2: ['AM', 'AM'],
      3: ['LW', 'AM', 'RW'],
      4: ['LW', 'AM', 'AM', 'RW'],
    },
  }
  const labels = table[depth][size] ?? Array.from({ length: size }, () => 'CM')
  // 3백 첫 MF 라인의 바깥 2명은 윙백 — 3-4-3/3-5-2/3-6-1 계열
  if (!wideIsWingback || labels.length < 4) return labels
  if (depth === 'deep' && size === 4) return ['LWB', 'DM', 'DM', 'RWB'] // 3-4-2-1 더블 피벗
  return labels.map((l, i) =>
    i === 0 ? 'LWB' : i === labels.length - 1 ? 'RWB' : l,
  )
}

/**
 * 포메이션 이름과 선수 인덱스로 포지션 정보를 도출한다.
 * 파싱할 수 없는 이름(라인 합계 ≠ 10, 비숫자)이면 null — 호출부는
 * 기존 단색 노드(PLAYER_COLORS.own)로 폴백한다.
 */
export function positionInfoAt(formation: string, index: number): PositionInfo | null {
  const parts = formation.split('-').map(Number)
  if (
    parts.length < 3 ||
    parts.some((n) => !Number.isInteger(n) || n <= 0) ||
    parts.reduce((a, b) => a + b, 0) !== 10 ||
    index < 0 ||
    index > 10 // GK 1 + 라인 합계 10
  ) {
    return null
  }

  if (index === 0) return { line: 'GK', label: 'GK' }

  const dfCount = parts[0]
  const mfLines = parts.slice(1, -1)
  const fwCount = parts[parts.length - 1]

  if (index < 1 + dfCount) {
    return { line: 'DF', label: DF_LABELS[dfCount]?.[index - 1] ?? 'DF' }
  }

  let cursor = 1 + dfCount
  for (let li = 0; li < mfLines.length; li++) {
    const size = mfLines[li]
    if (index < cursor + size) {
      const depth: MfDepth =
        mfLines.length === 1 ? 'single' : li === 0 ? 'deep' : li === mfLines.length - 1 ? 'high' : 'mid'
      const wideIsWingback = dfCount === 3 && li === 0 && size >= 4
      return { line: 'MF', label: mfLabels(depth, size, wideIsWingback)[index - cursor] ?? 'CM' }
    }
    cursor += size
  }

  return { line: 'FW', label: FW_LABELS[fwCount]?.[index - cursor] ?? 'FW' }
}
