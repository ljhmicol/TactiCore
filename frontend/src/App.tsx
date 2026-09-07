import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'

import { AnalysesPage } from '@/routes/AnalysesPage'
import { AnalysisDetailPage } from '@/routes/AnalysisDetailPage'
import { EditorPage } from '@/routes/EditorPage'
import { NewAnalysisPage } from '@/routes/NewAnalysisPage'
import { VersusPage } from '@/routes/VersusPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex h-14 items-center justify-between border-b border-border px-6">
          <Link to="/" className="font-semibold text-foreground hover:text-foreground/80">
            TactiCore
          </Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              편집기
            </Link>
            <Link to="/analyses" className="hover:text-foreground">
              저장 목록
            </Link>
            <Link to="/versus" className="hover:text-foreground">
              전술 대결
            </Link>
          </nav>
        </div>
        <Routes>
          <Route path="/" element={<EditorPage />} />
          <Route path="/new" element={<NewAnalysisPage />} />
          <Route path="/analyses" element={<AnalysesPage />} />
          <Route path="/analyses/:id" element={<AnalysisDetailPage />} />
          <Route path="/versus" element={<VersusPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
