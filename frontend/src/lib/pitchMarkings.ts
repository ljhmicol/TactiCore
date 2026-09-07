import { PITCH_LENGTH_M, PITCH_WIDTH_M } from '@/lib/zones'

/**
 * 규정 치수(m)를 0~100 좌표계로 환산한다. Pitch는 preserveAspectRatio="none"으로
 * x/y를 독립적으로 늘리므로, 실제로는 원인 마킹(센터서클 등)도 각 축의 m 환산값을
 * 그대로 써야 화면에서 다시 원으로 보인다 (x축은 68m, y축은 105m 기준).
 */
const toX = (m: number) => (m / PITCH_WIDTH_M) * 100
const toY = (m: number) => (m / PITCH_LENGTH_M) * 100

const CENTER_CIRCLE_RADIUS_M = 9.15
const PENALTY_AREA_DEPTH_M = 16.5
const PENALTY_AREA_WIDTH_M = 40.32
const GOAL_AREA_DEPTH_M = 5.5
const GOAL_AREA_WIDTH_M = 18.32
const PENALTY_SPOT_DIST_M = 11

export const CENTER_CIRCLE = { rx: toX(CENTER_CIRCLE_RADIUS_M), ry: toY(CENTER_CIRCLE_RADIUS_M) }

export const PENALTY_AREA = {
  depth: toY(PENALTY_AREA_DEPTH_M),
  halfWidth: toX(PENALTY_AREA_WIDTH_M / 2),
}

export const GOAL_AREA = {
  depth: toY(GOAL_AREA_DEPTH_M),
  halfWidth: toX(GOAL_AREA_WIDTH_M / 2),
}

export const PENALTY_SPOT_Y = toY(PENALTY_SPOT_DIST_M)

/** 선수 노드 반지름(SVG 단위)을 화면상 원으로 보이도록 축별로 보정한다. */
export function circularRadius(rUnits: number) {
  return { rx: rUnits, ry: rUnits * (PITCH_WIDTH_M / PITCH_LENGTH_M) }
}

/**
 * 가로 모드(TO-DO 21)에서는 화면 x축이 원래 y축(105m, 긴 쪽) 역할을 하므로
 * 보정 비율의 rx/ry가 서로 바뀐다 — portrait용 {rx,ry}를 그대로 스왑하면 된다.
 */
export function swapForLandscape<T extends { rx: number; ry: number }>(r: T): T {
  return { ...r, rx: r.ry, ry: r.rx }
}
