import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { EditorPage } from '@/routes/EditorPage'
import { NewAnalysisPage } from '@/routes/NewAnalysisPage'

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-14 items-center border-b border-border px-6">
        <span className="font-semibold text-foreground">TactiCore</span>
      </div>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/new" element={<NewAnalysisPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
