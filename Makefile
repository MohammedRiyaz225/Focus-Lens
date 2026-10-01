.PHONY: install backend frontend dev test lint format clean

install:
	@echo "Installing backend virtual environment & dependencies..."
	python -m venv backend/.venv
	backend/.venv/Scripts/pip install -r backend/requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

backend:
	backend/.venv/Scripts/uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload

frontend:
	cd frontend && npm run dev

dev:
	@echo "Starting FocusLens Backend and Frontend..."
	powershell -Command "Start-Process -FilePath 'backend/.venv/Scripts/uvicorn.exe' -ArgumentList 'app.main:app','--app-dir','backend','--host','127.0.0.1','--port','8000','--reload' ; cd frontend ; npm run dev"

test-backend:
	cd backend && .venv/Scripts/pytest -v tests/

test-frontend:
	cd frontend && npx vitest run

test: test-backend test-frontend

lint:
	cd frontend && npm run build
	cd backend && .venv/Scripts/pytest -v tests/
