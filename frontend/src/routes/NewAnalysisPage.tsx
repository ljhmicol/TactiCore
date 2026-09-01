import { useNavigate } from 'react-router-dom'

import { FormationPicker } from '@/components/editor/FormationPicker'
import { ManagerPresetPicker } from '@/components/editor/ManagerPresetPicker'
import { loadSampleAnalysis } from '@/lib/loadSample'
import { createEmptyAnalysis, useAnalysisStore } from '@/store/analysisStore'

/** /new — 포메이션 프리셋 또는 감독 스타일 프리셋 선택 → / 로 이동 (2단계 §11.3). */
export function NewAnalysisPage() {
  const navigate = useNavigate()
  const loadAnalysis = useAnalysisStore((s) => s.loadAnalysis)

  const handleSelectFormation = (formation: string) => {
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

  const handleSelectManagerPreset = async (url: string) => {
    const analysis = await loadSampleAnalysis(url)
    loadAnalysis(analysis)
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <section className="mb-12">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">감독 스타일로 시작하기</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          실제 감독들의 대표 전술을 국면(기본/공격/수비)별로 재현한 예시입니다. 그대로 둘러보거나 드래그해서 직접
          바꿔볼 수 있습니다.
        </p>
        <ManagerPresetPicker onSelect={handleSelectManagerPreset} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-foreground">빈 포메이션으로 시작하기</h2>
        <p className="mb-6 text-sm text-muted-foreground">기본 대형을 고르면 빈 편집 화면으로 이동합니다.</p>
        <FormationPicker onSelect={handleSelectFormation} />
      </section>
    </div>
  )
}
