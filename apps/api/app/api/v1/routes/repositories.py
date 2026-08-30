from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import decrypt_token
from app.services.github.repos import list_user_repos
from app.models.user import User
from app.models.repository import Repository
from app.models.contributor import Contributor
from app.models.commit import Commit
from app.schemas.repository import ConnectRepositoryRequest
from app.db.postgres.session import get_db
from app.workers.tasks.indexing_tasks import index_repository

router = APIRouter(prefix="/api/v1/repositories", tags=["repositories"])


@router.get("/available")
async def get_available_repos(user: User = Depends(get_current_user)):
    access_token = decrypt_token(user.github_access_token_encrypted)
    repos = await list_user_repos(access_token)

    return [
        {
            "github_repo_id": repo["id"],
            "full_name": repo["full_name"],
            "private": repo["private"],
            "default_branch": repo["default_branch"],
            "language": repo.get("language"),
            "updated_at": repo["updated_at"],
        }
        for repo in repos
    ]


@router.get("/")
def list_connected_repositories(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repos = db.query(Repository).filter(Repository.connected_by == user.id).all()
    return [
        {
            "id": str(r.id),
            "full_name": r.full_name,
            "indexing_status": r.indexing_status,
            "primary_language": r.primary_language,
            "file_count": r.file_count,
        }
        for r in repos
    ]


@router.post("/connect")
def connect_repository(
    payload: ConnectRepositoryRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(Repository).filter(
        Repository.github_repo_id == payload.github_repo_id
    ).first()
    if existing:
        return {
            "id": str(existing.id),
            "full_name": existing.full_name,
            "indexing_status": existing.indexing_status,
            "already_connected": True,
        }

    repo = Repository(
        github_repo_id=payload.github_repo_id,
        full_name=payload.full_name,
        default_branch=payload.default_branch,
        is_private=payload.private,
        primary_language=payload.language,
        connected_by=user.id,
        indexing_status="never",
    )
    db.add(repo)
    db.commit()
    db.refresh(repo)

    return {
        "id": str(repo.id),
        "full_name": repo.full_name,
        "indexing_status": repo.indexing_status,
        "already_connected": False,
    }


@router.post("/{repository_id}/index")
def start_indexing(
    repository_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = db.query(Repository).filter(Repository.id == repository_id).first()
    if not repo:
        return {"error": "repository not found"}

    access_token = decrypt_token(user.github_access_token_encrypted)
    clone_url = f"https://{access_token}@github.com/{repo.full_name}.git"

    task = index_repository.delay(str(repo.id), clone_url)

    repo.indexing_status = "queued"
    db.commit()

    return {"task_id": task.id, "status": "queued"}


@router.get("/{repository_id}")
def get_repository(repository_id: str, db: Session = Depends(get_db)):
    repo = db.query(Repository).filter(Repository.id == repository_id).first()
    if not repo:
        return {"error": "repository not found"}

    contributors = (
        db.query(Contributor)
        .filter(Contributor.repository_id == repo.id)
        .order_by(Contributor.commit_count.desc())
        .all()
    )

    commits = (
        db.query(Commit)
        .filter(Commit.repository_id == repo.id)
        .order_by(Commit.committed_at.desc())
        .limit(20)
        .all()
    )

    return {
        "id": str(repo.id),
        "full_name": repo.full_name,
        "indexing_status": repo.indexing_status,
        "primary_language": repo.primary_language,
        "languages": repo.languages,
        "file_count": repo.file_count,
        "default_branch": repo.default_branch,
        "contributors": [
            {"login": c.github_login, "commit_count": c.commit_count}
            for c in contributors
        ],
        "commits": [
            {
                "sha": c.sha[:7],
                "message": c.message,
                "committed_at": c.committed_at.isoformat() if c.committed_at else None,
                "additions": c.additions,
                "deletions": c.deletions,
            }
            for c in commits
        ],
    }

from app.db.neo4j.driver import get_neo4j_driver


@router.get("/{repository_id}/graph")
def get_repository_graph(repository_id: str):
    driver = get_neo4j_driver()
    nodes = {}
    edges = []

    with driver.session() as session:
        result = session.run(
            """
            MATCH (n {repository_id: $repo_id})
            OPTIONAL MATCH (n)-[r]->(m {repository_id: $repo_id})
            RETURN n, r, m
            """,
            repo_id=repository_id,
        )

        for record in result:
            n = record["n"]
            _add_node(nodes, n)

            m = record["m"]
            r = record["r"]
            if m is not None and r is not None:
                _add_node(nodes, m)
                edges.append({
                    "id": f"{n.element_id}-{r.type}-{m.element_id}",
                    "source": n.element_id,
                    "target": m.element_id,
                    "label": r.type,
                })

    return {"nodes": list(nodes.values()), "edges": edges}


def _add_node(nodes: dict, n):
    if n.element_id in nodes:
        return
    label = list(n.labels)[0] if n.labels else "Unknown"
    name = n.get("name") or n.get("full_name") or n.get("path") or "unnamed"
    nodes[n.element_id] = {"id": n.element_id, "label": label, "name": name}

from app.services.ai.providers import get_ai_provider
from app.db.qdrant.client import search_similar


@router.get("/{repository_id}/search")
async def search_repository(repository_id: str, q: str):
    provider = get_ai_provider()
    query_vector = await provider.embed(q)

    results = await search_similar(repository_id, query_vector, limit=10)

    return [
        {
            "file_path": r.payload["file_path"],
            "chunk_type": r.payload.get("chunk_type"),
            "symbol_name": r.payload.get("symbol_name"),
            "start_line": r.payload.get("start_line"),
            "end_line": r.payload.get("end_line"),
            "content": r.payload["content"],
            "score": r.score,
        }
        for r in results
    ]

from app.models.pull_request import PullRequest


@router.get("/{repository_id}/pull-requests")
def get_pull_requests(repository_id: str, db: Session = Depends(get_db)):
    prs = (
        db.query(PullRequest)
        .filter(PullRequest.repository_id == repository_id)
        .order_by(PullRequest.opened_at.desc())
        .all()
    )

    return [
        {
            "number": pr.github_pr_number,
            "title": pr.title,
            "author": pr.author_login,
            "state": pr.state,
            "risk_score": float(pr.risk_score) if pr.risk_score is not None else None,
            "additions": pr.additions,
            "deletions": pr.deletions,
            "changed_files": pr.changed_files,
        }
        for pr in prs
    ]

from app.services.pr_intelligence.risk_scoring import suggest_reviewers
from app.db.neo4j.driver import get_neo4j_driver


@router.get("/{repository_id}/reviewers")
def get_suggested_reviewers(repository_id: str):
    driver = get_neo4j_driver()
    with driver.session() as session:
        result = session.run(
            "MATCH (f:File {repository_id: $repo_id}) RETURN f.path AS path LIMIT 20",
            repo_id=repository_id,
        )
        file_paths = [r["path"] for r in result]

    return suggest_reviewers(repository_id, file_paths)

from datetime import datetime, timedelta, timezone
from app.models.commit import Commit


@router.get("/{repository_id}/analytics")
def get_analytics(repository_id: str, db: Session = Depends(get_db)):
    commits = (
        db.query(Commit)
        .filter(Commit.repository_id == repository_id)
        .order_by(Commit.committed_at.asc())
        .all()
    )
    prs = (
        db.query(PullRequest)
        .filter(PullRequest.repository_id == repository_id)
        .all()
    )

    # Commits per week, last 12 weeks
    now = datetime.now(timezone.utc)
    weekly_commits: dict[str, int] = {}
    for i in range(11, -1, -1):
        week_start = now - timedelta(weeks=i)
        label = week_start.strftime("%b %d")
        weekly_commits[label] = 0

    for c in commits:
        if not c.committed_at:
            continue
        committed = c.committed_at
        if committed.tzinfo is None:
            committed = committed.replace(tzinfo=timezone.utc)
        weeks_ago = (now - committed).days // 7
        if 0 <= weeks_ago <= 11:
            week_start = now - timedelta(weeks=weeks_ago)
            label = week_start.strftime("%b %d")
            if label in weekly_commits:
                weekly_commits[label] += 1

    total_additions = sum(c.additions or 0 for c in commits)
    total_deletions = sum(c.deletions or 0 for c in commits)

    avg_risk = (
        round(sum(float(pr.risk_score or 0) for pr in prs) / len(prs), 2)
        if prs else None
    )

    return {
        "commit_velocity": [{"week": k, "commits": v} for k, v in weekly_commits.items()],
        "total_commits": len(commits),
        "total_additions": total_additions,
        "total_deletions": total_deletions,
        "total_prs": len(prs),
        "avg_pr_risk": avg_risk,
        "open_prs": len([pr for pr in prs if pr.state == "open"]),
    }

from app.services.ai.doc_generation import gather_repo_context, build_readme_prompt
from app.models.generated_document import GeneratedDocument


@router.post("/{repository_id}/generate-readme")
async def generate_readme(repository_id: str, db: Session = Depends(get_db)):
    repo = db.query(Repository).filter(Repository.id == repository_id).first()
    if not repo:
        return {"error": "repository not found"}

    context = await gather_repo_context(str(repo.id), f"main functionality of {repo.full_name}")
    prompt = build_readme_prompt(repo.full_name, repo.languages or {}, context)

    provider = get_ai_provider()
    content = await provider.generate_complete(prompt)

    doc = GeneratedDocument(
        repository_id=repo.id,
        doc_type="readme",
        content_markdown=content,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {"id": str(doc.id), "content": content}


@router.get("/{repository_id}/documents")
def list_documents(repository_id: str, db: Session = Depends(get_db)):
    docs = (
        db.query(GeneratedDocument)
        .filter(GeneratedDocument.repository_id == repository_id)
        .order_by(GeneratedDocument.generated_at.desc())
        .all()
    )
    return [
        {
            "id": str(d.id),
            "doc_type": d.doc_type,
            "content_markdown": d.content_markdown,
            "generated_at": d.generated_at.isoformat() if d.generated_at else None,
        }
        for d in docs
    ]

@router.get("/{repository_id}/architecture")
def get_architecture(repository_id: str):
    driver = get_neo4j_driver()
    nodes = {}
    edges = []

    with driver.session() as session:
        result = session.run(
            """
            MATCH (f:File {repository_id: $repo_id})
            OPTIONAL MATCH (f)-[:DEFINES]->(c:Class)
            RETURN f.path AS file_path, count(c) AS class_count
            """,
            repo_id=repository_id,
        )
        for record in result:
            nodes[record["file_path"]] = {
                "id": record["file_path"],
                "label": record["file_path"],
                "class_count": record["class_count"],
            }

        import_result = session.run(
            """
            MATCH (r:Repository {repository_id: $repo_id})-[:CONTAINS]->(f:File)
            RETURN f.path AS path
            """,
            repo_id=repository_id,
        )
        file_paths = {r["path"] for r in import_result}

    return {"nodes": list(nodes.values()), "edges": edges, "file_count": len(file_paths)}