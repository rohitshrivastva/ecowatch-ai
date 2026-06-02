.PHONY: dev backend frontend test docker-up docker-down

dev: backend frontend

backend:
	cd backend && source venv/bin/activate 2>/dev/null || true && \
	PYTHONPATH=..:../backend uvicorn app.main:app --reload --app-dir backend

frontend:
	cd frontend && npm run dev

test:
	cd backend && PYTHONPATH=..:. pytest tests/ -v

docker-up:
	docker compose up --build

docker-down:
	docker compose down

install:
	cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
	cd frontend && npm install
