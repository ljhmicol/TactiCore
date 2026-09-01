import type { Analysis } from '@/types/analysis'

/**
 * 스토어의 현재 스냅샷을 JSON 파일 포맷(§1)으로 직렬화한다. JSON 내보내기(FR-07)와
 * 저장(FR-08, Phase 5) 뮤테이션이 이 함수를 공유한다 — 직렬화 로직이 갈라지면
 * 파일로 내보낸 결과와 서버에 저장한 결과가 미묘하게 달라질 수 있다.
 */
export function serializeAnalysis(analysis: Analysis): Analysis {
  return analysis
}
