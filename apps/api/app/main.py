from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.routes.assistant import router as assistant_router
from app.api.v1.routes.webhooks import router as webhooks_router

app = FastAPI(title="OpenDev Intelligence API", version="0.1.0")
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.repositories import router as repositories_router

app.include_router(auth_router)
app.include_router(repositories_router)
app.include_router(assistant_router)
app.include_router(webhooks_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "opendev-intelligence-api"}
from app.models.user import Base
from app.models.repository import Repository
from app.models.contributor import Contributor
from app.models.commit import Commit
from app.db.postgres.session import engine
from app.models.pull_request import PullRequest
from app.models.generated_document import GeneratedDocument

Base.metadata.create_all(bind=engine)

