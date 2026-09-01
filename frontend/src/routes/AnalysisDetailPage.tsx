import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { useAnalysis } from '@/hooks/useAnalyses'
import { useAnalysisStore } from '@/store/analysisStore'

import { EditorPage } from './EditorPage'

/**
 * /analyses/:id — 해당 분석을 불러온 편집기. `/`와 같은 레이아웃을 그대로 쓴다
 * (2단계 §6). 불러온 뒤에도 player.id가 보존되어야 모핑이 정상 동작한다.
 */
export function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>()
  const numericId = id ? Number(id) : undefined
  const { data, isLoading, isError } = useAnalysis(numericId)
  const loadAnalysis = useAnalysisStore((s) => s.loadAnalysis)
  const loadedId = useAnalysisStore((s) => s.analysis?.id)

  useEffect(() => {
    if (data && loadedId !== data.id) {
      loadAnalysis(data)
    }
  }, [data, loadedId, loadAnalysis])

  if (isLoading) return <div className="p-6 text-muted-foreground">불러오는 중…</div>
  if (isError) return <div className="p-6 text-destructive">분석을 불러오지 못했습니다.</div>

  return <EditorPage />
}
