import { createContext, useContext, type RefObject } from 'react'

const PitchSvgContext = createContext<RefObject<SVGSVGElement | null> | null>(null)

export const PitchSvgProvider = PitchSvgContext.Provider

export function usePitchSvg(): RefObject<SVGSVGElement | null> {
  const ctx = useContext(PitchSvgContext)
  if (!ctx) throw new Error('usePitchSvg must be used within <Pitch>')
  return ctx
}
