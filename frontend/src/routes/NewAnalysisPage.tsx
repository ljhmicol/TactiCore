import { useNavigate } from 'react-router-dom'

import { FormationPicker } from '@/components/editor/FormationPicker'
import { createEmptyAnalysis, useAnalysisStore } from '@/store/analysisStore'

/** /new — 포메이션 프리셋 카드 4장 선택 → / 로 이동 (2단계 §11.3). */
export function NewAnalysisPage() {
  const navigate = useNavigate()
  const loadAnalysis = useAnalysisStore((s) => s.loadAnalysis)

  const handleSelect = (formation: string) => {
    const analysis = createEmptyAnalysis(formation, {
      matchName: '',
      homeTeam: '',
      awayTeam: '',
      matchDate: new Date().toISOString().slice(0, 10),
      analyzedTeam: 'home',
    })
    loadAnalysis(analysis)
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 text-2xl font-semibold text-foreground">포메이션 선택</h1>
      <p className="mb-8 text-sm text-muted-foreground">기본 대형을 고르면 편집 화면으로 이동합니다.</p>
      <FormationPicker onSelect={handleSelect} />
    </div>
  )
}
