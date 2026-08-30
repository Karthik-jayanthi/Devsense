import tempfile
import shutil
import os
import asyncio

from app.services.indexing.ast_parser import parse_repository
from app.services.indexing.graph_builder import clear_repository_graph, build_repository_graph, build_ownership
from app.workers.celery_app import celery_app
from app.db.postgres.session import SessionLocal
from app.models.repository import Repository
from app.models.contributor import Contributor
from app.models.commit import Commit
from app.services.indexing.indexer import clone_repository, walk_and_analyze, extract_commits
from app.services.ai.embeddings import embed_and_store_chunks
from app.db.qdrant.client import clear_repository_embeddings


async def _embed_all_files(repository_id: str, tmp_dir: str, parsed_files: list[dict]):
    for file_data in parsed_files:
        full_file_path = os.path.join(tmp_dir, file_data["file_path"])
        try:
            with open(full_file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            await embed_and_store_chunks(repository_id, file_data["file_path"], content, file_data)
        except Exception:
            pass


@celery_app.task
def index_repository(repository_id: str, clone_url: str):
    db = SessionLocal()
    repo = db.query(Repository).filter(Repository.id == repository_id).first()
    if not repo:
        db.close()
        return {"error": "repository not found"}

    repo.indexing_status = "indexing"
    db.commit()

    tmp_dir = tempfile.mkdtemp(prefix="odi_index_")

    try:
        clone_repository(clone_url, tmp_dir)
        analysis = walk_and_analyze(tmp_dir)
        commits_data = extract_commits(tmp_dir)

        repo.languages = analysis["languages"]
        repo.file_count = analysis["file_count"]
        if analysis["languages"]:
            repo.primary_language = max(analysis["languages"], key=analysis["languages"].get)

        parsed_files = parse_repository(tmp_dir)
        clear_repository_graph(str(repo.id))
        build_repository_graph(str(repo.id), repo.full_name, parsed_files)
        build_ownership(str(repo.id), commits_data)

        asyncio.run(clear_repository_embeddings(str(repo.id)))
        asyncio.run(_embed_all_files(str(repo.id), tmp_dir, parsed_files))

        for c in commits_data:
            contributor = db.query(Contributor).filter(
                Contributor.repository_id == repo.id,
                Contributor.github_login == c["author_email"],
            ).first()
            if not contributor:
                contributor = Contributor(
                    repository_id=repo.id,
                    github_login=c["author_email"],
                    commit_count=0,
                )
                db.add(contributor)
                db.flush()
            contributor.commit_count += 1

            existing_commit = db.query(Commit).filter(
                Commit.repository_id == repo.id,
                Commit.sha == c["sha"],
            ).first()
            if not existing_commit:
                db.add(Commit(
                    repository_id=repo.id,
                    sha=c["sha"],
                    contributor_id=contributor.id,
                    message=c["message"],
                    committed_at=c["committed_at"],
                    additions=c["additions"],
                    deletions=c["deletions"],
                    files_changed=c["files_changed"],
                ))

        repo.indexing_status = "ready"
        db.commit()
        return {"status": "ready", "file_count": analysis["file_count"]}

    except Exception as e:
        repo.indexing_status = "failed"
        db.commit()
        raise

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        db.close()