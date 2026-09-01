import { useRef, useState, type ChangeEvent } from 'react'

import { Button } from '@/components/ui/button'
import { analysisSchema, formatZodError } from '@/lib/schema'
import { serializeAnalysis } from '@/lib/serialize'
import { useAnalysisStore } from '@/store/analysisStore'
import type { Analysis } from '@/types/analysis'

/** JSON 내보내기/가져오기 (FR-07). 가져오기 실패 시 오류 위치를 사람이 읽을 문구로 보여준다. */
export function JsonIO({ analysis }: { analysis: Analysis }) {
  const loadAnalysis = useAnalysisStore((s) => s.loadAnalysis)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<string[] | null>(null)

  const handleExport = () => {
    const data = serializeAnalysis(analysis)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${analysis.match.matchName || 'tacticore'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const json = JSON.parse(await file.text())
      const result = analysisSchema.safeParse(json)
      if (!result.success) {
        setErrors(formatZodError(result.error))
        return
      }
      setErrors(null)
      loadAnalysis(result.data as Analysis)
    } catch {
      setErrors(['JSON 파싱에 실패했습니다. 파일 형식을 확인하세요.'])
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={handleExport}>
          JSON 내보내기
        </Button>
        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
          JSON 가져오기
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {errors && (
        <ul className="list-inside list-disc rounded-md bg-destructive/10 p-2 text-xs text-destructive">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
