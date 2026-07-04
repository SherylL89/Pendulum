# Pendulum — Smart Fashion Planning

Trend forecasting tool for fashion teams: track competitor products, prices and promotions, analyze consumer feedback, and generate AI-powered trend reports and design directions.

Recreated from the original Figma wireframes with a modern full-stack + AI architecture.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite (dev default) / Postgres + pgvector (docker) |
| AI | Anthropic Claude API (sentiment, image tagging, trend reports) |

## Quick start (no Docker)

```bash
# 1. Backend
cd apps/api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python seed.py            # creates pendulum.db with sample data
uvicorn main:app --reload # http://localhost:8000 (docs at /docs)

# 2. Frontend (new terminal)
cd apps/web
npm install
npm run dev               # http://localhost:3000
```

The web app works even without the API running — it falls back to built-in mock data. With the API up you get live data from the seed.

## Quick start (Docker)

```bash
cp .env.example .env      # optionally add ANTHROPIC_API_KEY
docker compose up --build # web :3000, api :8000, postgres :5432
```

## AI features

Set `ANTHROPIC_API_KEY` in `.env` (or apps/api/.env) to enable:

- **Feedback analysis** — sentiment extraction from product reviews
- **Image tagging** — upload a product photo, get category/color/style/material
- **Trend reports** — agentic generation: query aggregates → draft → verify → publish

Without a key, these endpoints return deterministic fallback data so the UI still works.

## Repo layout

```
apps/
  web/   Next.js frontend
  api/   FastAPI backend + seed data
infra/   (reserved) deploy configs
```

## Push to GitHub

```bash
git remote add origin https://github.com/<you>/pendulum.git
git push -u origin main
```
