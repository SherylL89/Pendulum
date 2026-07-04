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

## AI & data features

Everything degrades gracefully — with no keys configured the app runs fully on fallbacks.

| Feature | Powered by | Env vars |
|---|---|---|
| Feedback sentiment (cached per product) | Claude | `ANTHROPIC_API_KEY` |
| Image tagging (Find Similar upload) | Claude vision | `ANTHROPIC_API_KEY` |
| Trend agent (gather → draft → verify → publish, retries) | Claude | `ANTHROPIC_API_KEY` |
| Vector similarity search | pgvector + Voyage/OpenAI embeddings | `VECTOR_DATABASE_URL`, `VOYAGE_API_KEY` |
| Agentic scraper (selector-free extraction) | Claude + httpx | `SCRAPE_SOURCES`, `ANTHROPIC_API_KEY` |
| Newsletter inbox ingestion + classification | IMAP + Claude | `IMAP_HOST/USER/PASSWORD` |
| Product images | Cloudflare R2 | `R2_*` |
| Schedules (daily snapshot, 30-min IMAP, weekly trend) | APScheduler | `ENABLE_SCHEDULER=1` |

See `.env.example` for the full list. Recommended production setup: AWS RDS for
`DATABASE_URL`, Supabase for `VECTOR_DATABASE_URL` (run `POST /admin/backfill-embeddings`
once after connecting), Cloudflare R2 for images.

**Ops endpoints:** `POST /admin/snapshot` (manual ingestion run), `POST /newsletters/poll`
(IMAP fetch), `POST /admin/backfill-embeddings`.

**Seeding is safe:** `python seed.py` refuses to touch a non-empty database; use
`--reset` only when you intend to wipe scraped history.

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
