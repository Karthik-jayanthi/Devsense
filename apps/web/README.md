# DevSense

**Where code meets intuition.**

DevSense is an AI-powered developer intelligence platform. Connect a GitHub repository and it indexes your codebase, builds a knowledge graph of its structure, and lets you ask natural-language questions about your own code — grounded in a local retrieval-augmented generation (RAG) pipeline.

## What it does

- **GitHub OAuth integration** — connect and browse your own repositories
- **Automated repository indexing** — clones, parses, and analyzes code structure in the background via Celery
- **Knowledge graph** — visualizes files, classes, functions, and their relationships using Neo4j and an interactive React Flow canvas
- **Semantic code search** — vector similarity search over your codebase, chunked at the function/class level
- **AI assistant** — ask questions about your repository and get answers grounded in your actual code, streamed in real time
- **Pull request intelligence** — GitHub webhook integration computes risk scores and suggests reviewers based on file-ownership analysis in the knowledge graph
- **Analytics dashboard** — commit velocity, code churn, and PR activity, computed from real indexed data
- **AI-generated documentation** — draft READMEs and architecture overviews from your indexed code

## Tech stack

**Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, React Flow, Recharts

**Backend:** FastAPI, Celery, SQLAlchemy

**Data layer:** PostgreSQL, Neo4j (knowledge graph), Qdrant (vector search), Redis (cache & task queue)

**AI/ML:** Local LLM inference via Ollama, retrieval-augmented generation with function-level code chunking

**Auth:** GitHub OAuth, JWT sessions

**Infrastructure:** Docker Compose, deployed on Vercel (frontend) and Render (backend)

## Architecture

The system follows a clean separation of concerns: the Next.js frontend never talks to any database directly, routing all data access through the FastAPI backend. Long-running work (repository cloning, AST parsing, embedding generation) is offloaded to Celery workers so API requests stay fast. Neo4j models code structure as a graph — files, classes, functions, and developer ownership — enabling graph-aware queries like reviewer suggestions and dependency analysis that would be awkward as SQL joins.

## Running locally

This is a monorepo with independent frontend and backend apps.

```bash
# Backend
cd apps/api
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd apps/web
pnpm install
pnpm dev

# Background worker
cd apps/api
celery -A app.workers.celery_app worker --loglevel=info
```

Requires Docker Compose for PostgreSQL, Redis, Neo4j, and Qdrant (see `infra/docker/`), plus [Ollama](https://ollama.com) running locally for AI features.

---

Built as a personal project to explore full-stack architecture, background job processing, graph databases, and local AI inference end to end.