Set-Location "$PSScriptRoot\.."

if (-not (Test-Path ".venv")) {
  python -m venv .venv
}

.\.venv\Scripts\python.exe -m pip install -r requirements.txt

if (-not (Test-Path ".env")) {
  Copy-Item .env.example .env
}

$env:DATABASE_URL = "sqlite:///./finance_app.db"
$env:AUTO_CREATE_TABLES = "true"

.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
