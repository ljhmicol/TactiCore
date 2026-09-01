import { analysisSchema, formatZodError } from '@/lib/schema'
import type { Analysis } from '@/types/analysis'

/** `public/` 아래의 샘플 JSON을 가져와 검증한다 (감독 프리셋, 예시 경기 공용). */
export async function loadSampleAnalysis(url: string): Promise<Analysis> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`샘플을 불러오지 못했습니다 (${res.status})`)
  const json = await res.json()
  const result = analysisSchema.safeParse(json)
  if (!result.success) throw new Error(formatZodError(result.error).join('\n'))
  return result.data as Analysis
}
