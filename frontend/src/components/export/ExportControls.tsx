import { useRef, useState } from 'react'

import { ShareCard } from '@/components/export/ShareCard'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { exportCard } from '@/lib/exportImage'
import type { Analysis, PhaseType } from '@/types/analysis'

/** PNG 카드 내보내기 UI. 비율(1:1/4:5)을 고른다. 하단 텍스트는 국면별로 다르다 — 기본은 종합 평가, 공격·수비는 해당 국면 코멘트. */
export function ExportControls({ analysis, phase }: { analysis: Analysis; phase: PhaseType }) {
  const [ratio, setRatio] = useState<'1:1' | '4:5'>('1:1')
  const [exporting, setExporting] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleExport = async () => {
    if (!cardRef.current) return
    setExporting(true)
    try {
      await exportCard(cardRef.current, ratio)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={ratio} onValueChange={(v) => setRatio(v as '1:1' | '4:5')}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1:1">1:1</SelectItem>
          <SelectItem value="4:5">4:5</SelectItem>
        </SelectContent>
      </Select>
      <Button size="sm" onClick={handleExport} disabled={exporting}>
        {exporting ? '내보내는 중…' : 'PNG 내보내기'}
      </Button>

      <ShareCard ref={cardRef} analysis={analysis} phase={phase} ratio={ratio} />
    </div>
  )
}
