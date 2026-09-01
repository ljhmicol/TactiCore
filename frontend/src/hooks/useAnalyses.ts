import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createAnalysis, deleteAnalysis, fetchAnalyses, fetchAnalysis, updateAnalysis } from '@/lib/api'
import type { Analysis } from '@/types/analysis'

const ANALYSES_KEY = ['analyses']

export function useAnalyses() {
  return useQuery({ queryKey: ANALYSES_KEY, queryFn: fetchAnalyses })
}

export function useAnalysis(id: number | undefined) {
  return useQuery({
    queryKey: [...ANALYSES_KEY, id],
    queryFn: () => fetchAnalysis(id!),
    enabled: id !== undefined,
  })
}

/** id 없으면 POST(생성), 있으면 PUT(전체 교체)으로 저장한다. */
export function useSaveAnalysis() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (analysis: Analysis) => {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = analysis
      void _id
      void _createdAt
      void _updatedAt
      return analysis.id ? updateAnalysis(analysis.id, payload) : createAnalysis(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANALYSES_KEY })
    },
  })
}

export function useDeleteAnalysis() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAnalysis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANALYSES_KEY })
    },
  })
}
