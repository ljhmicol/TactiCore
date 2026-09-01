# TactiCore 개발 서버 동시 기동 (3단계 §6, 6단계 §2.1).
# 백엔드(8000)와 프론트엔드(5173)를 각각 새 PowerShell 창으로 띄우고 브라우저를 연다.
# 최초 1회는 backend\.venv 와 frontend\node_modules 준비가 먼저 되어 있어야 한다
# (6단계 운영 매뉴얼 §1 참조).

Start-Process powershell -ArgumentList @(
  '-NoExit', '-Command',
  "cd '$PSScriptRoot\..\backend'; .\.venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000"
)

Start-Process powershell -ArgumentList @(
  '-NoExit', '-Command',
  "cd '$PSScriptRoot\..\frontend'; npm run dev"
)

Start-Sleep -Seconds 3
Start-Process 'http://localhost:5173'
