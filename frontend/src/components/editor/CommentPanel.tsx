import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAnalysisStore } from '@/store/analysisStore'
import type { PhaseType } from '@/types/analysis'

const PHASE_LABELS: Record<PhaseType, string> = {
  base: '기본',
  attack: '공격',
  defense: '수비',
}

/**
 * 국면별 코멘트 + 종합 평가 (FR-04). 제목이 현재 국면명을 따라 바뀐다 —
 * 어느 국면에 쓰는 중인지 헷갈리는 것이 가장 흔한 실수다 (2단계 §11.1).
 */
export function CommentPanel({ phase, comment, summary }: { phase: PhaseType; comment: string; summary: string }) {
  const setComment = useAnalysisStore((s) => s.setComment)
  const setSummary = useAnalysisStore((s) => s.setSummary)

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="phase-comment">{PHASE_LABELS[phase]} 국면 코멘트</Label>
        <Textarea
          id="phase-comment"
          value={comment}
          onChange={(e) => setComment(phase, e.target.value)}
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="summary">종합 평가</Label>
        <Textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
      </div>
    </div>
  )
}
