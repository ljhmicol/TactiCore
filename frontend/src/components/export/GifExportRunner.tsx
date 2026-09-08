import { toCanvas } from 'html-to-image'
import { useEffect, useMemo, useRef, useState } from 'react'

import { AnimatedShareCard, GIF_CARD_SIZE } from '@/components/export/AnimatedShareCard'
import { buildGifFrameSpecs, encodeGif, type CapturedFrame } from '@/lib/exportGif'
import type { Analysis } from '@/types/analysis'

interface GifExportRunnerProps {
  analysis: Analysis
  onDone: (blob: Blob) => void
  onError: (err: unknown) => void
}

/**
 * GIF 내보내기(TO-DO 6)의 실제 캡처 루프. PNG(exportImage.ts)는 이미
 * 정지된 화면을 한 번만 캡처하지만, GIF는 프레임 수십 장을 순서대로
 * 렌더링→캡처해야 한다. React state(index)로 한 번에 프레임 하나씩
 * AnimatedShareCard를 다시 그리고, 두 번의 requestAnimationFrame으로
 * 페인트가 끝난 뒤에만 `toCanvas`로 캡처한다 — 라이브 애니메이션을
 * 실시간으로 녹화하는 대신, 국면 사이 좌표를 미리 계산해(lib/exportGif.ts)
 * 정지 이미지를 순서대로 찍는 방식이라 캡처 타이밍이 기기 성능에 흔들리지
 * 않는다.
 *
 * 프레임 전부를 다 캡처하면 gifenc로 인코딩해 onDone(blob)을 호출하고,
 * 그 시점부터는 이 컴포넌트를 부모(ExportControls)가 언마운트한다.
 */
export function GifExportRunner({ analysis, onDone, onError }: GifExportRunnerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const frames = useMemo(() => buildGifFrameSpecs(analysis), [analysis])
  const capturedRef = useRef<CapturedFrame[]>([])
  const finishedRef = useRef(false)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index >= frames.length) return
    let cancelled = false

    async function captureCurrentFrame() {
      await document.fonts.ready // 웹폰트 로드 전에 캡처하면 폴백 폰트로 찍힌다
      // 레이아웃 이펙트(useFitFontSize) → 페인트 순서를 보장하려고 두 번 기다린다.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      if (cancelled || !ref.current) return
      try {
        const canvas = await toCanvas(ref.current, {
          pixelRatio: 1,
          cacheBust: true,
          width: GIF_CARD_SIZE,
          height: GIF_CARD_SIZE,
        })
        if (cancelled) return
        capturedRef.current.push({ canvas, delayMs: frames[index].delayMs })
        setIndex((i) => i + 1)
      } catch (err) {
        if (!cancelled && !finishedRef.current) {
          finishedRef.current = true
          onError(err)
        }
      }
    }

    captureCurrentFrame()
    return () => {
      cancelled = true
    }
  }, [index, frames, onError])

  useEffect(() => {
    if (frames.length === 0 || index < frames.length || finishedRef.current) return
    finishedRef.current = true
    try {
      onDone(encodeGif(capturedRef.current))
    } catch (err) {
      onError(err)
    }
  }, [index, frames.length, onDone, onError])

  const frame = frames[index]
  if (!frame) return null
  return <AnimatedShareCard ref={ref} analysis={analysis} frame={frame} />
}
