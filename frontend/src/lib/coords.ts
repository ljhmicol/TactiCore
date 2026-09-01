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
