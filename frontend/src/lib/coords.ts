/**
 * SVG viewBox="0 0 100 100" + preserveAspectRatio를 쓰면 화면 비율에 따라
 * 좌우 또는 상하 여백이 생긴다. getScreenCTM().inverse()로 이 여백을 뺀
 * 실제 피치 좌표를 구한다 (4단계 §3.4).
 */
export function clientToPitch(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const { x, y } = pt.matrixTransform(svg.getScreenCTM()!.inverse())
  return { x, y }
}

/** 0~99.9로 클램프한다. 100을 배제해 오버로드 경계 계산이 항상 어떤 구역에 속하도록 한다. */
export function clampCoord(v: number): number {
  return Math.min(99.9, Math.max(0, v))
}

/**
 * 저장된 분석은 항상 "자팀 골 = y=100" 기준이다(2단계 §3). 전술 대결 뷰에서
 * 두 팀을 한 피치에 겹칠 때, 상대로 지정된 쪽은 이 180도 회전을 거쳐야
 * 자기 골문이 상대가 공격하는 방향(y=0)에 놓인다. y만 뒤집으면 좌우 플랭크가
 * 실제와 반대로 그려지므로 x도 함께 뒤집는다 — 16번 항목, TO-DO-LIST.md 참조.
 */
export function mirrorPoint(p: { x: number; y: number }): { x: number; y: number } {
  return { x: 100 - p.x, y: 100 - p.y }
}
