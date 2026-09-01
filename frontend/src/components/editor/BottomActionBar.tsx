import { Button } from '@/components/ui/button'
import { SaveButton } from '@/components/editor/SaveButton'
import type { Analysis } from '@/types/analysis'

/**
 * 모바일 전용 하단 고정 액션 바 (2단계 §11.2) — `[저장] [PNG 내보내기]`.
 * PNG는 비율/텍스트 출처를 고르는 전체 컨트롤이 헤더 툴바에 이미 있으므로,
 * 여기서는 그 컨트롤로 스크롤해 올려주는 방식으로 단순화했다 — ShareCard를
 * 두 번 마운트하지 않기 위한 실용적 절충 (5단계 §9 기록).
 */
export function BottomActionBar({ analysis }: { analysis: Analysis }) {
  const scrollToExportToolbar = () => {
    document.getElementById('export-toolbar')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-center gap-3 border-t border-border bg-background p-3 lg:hidden">
      <SaveButton analysis={analysis} />
      <Button size="sm" variant="outline" onClick={scrollToExportToolbar}>
        PNG 내보내기
      </Button>
    </div>
  )
}
