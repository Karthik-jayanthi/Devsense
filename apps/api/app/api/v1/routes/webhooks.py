import hmac
import hashlib
from fastapi import APIRouter, Request, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_db
from app.models.repository import Repository
from app.models.pull_request import PullRequest
from app.services.pr_intelligence.risk_scoring import calculate_risk_score
from fastapi import Depends

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])


def verify_signature(payload_body: bytes, signature_header: str) -> bool:
    if not signature_header:
        return False
    expected = "sha256=" + hmac.new(
        settings.github_webhook_secret.encode(), payload_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)


@router.post("/github")
async def github_webhook(
    request: Request,
    x_hub_signature_256: str = Header(None),
    x_github_event: str = Header(None),
    db: Session = Depends(get_db),
):
    body = await request.body()

    if not verify_signature(body, x_hub_signature_256):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()

    if x_github_event != "pull_request":
        return {"status": "ignored", "event": x_github_event}

    pr_data = payload["pull_request"]
    repo_github_id = payload["repository"]["id"]

    repo = db.query(Repository).filter(Repository.github_repo_id == repo_github_id).first()
    if not repo:
        return {"status": "ignored", "reason": "repository not connected"}

    risk = calculate_risk_score(
        pr_data["additions"], pr_data["deletions"], pr_data["changed_files"]
    )

    existing = db.query(PullRequest).filter(
        PullRequest.repository_id == repo.id,
        PullRequest.github_pr_number == pr_data["number"],
    ).first()

    if existing:
        existing.title = pr_data["title"]
        existing.state = pr_data["state"]
        existing.additions = pr_data["additions"]
        existing.deletions = pr_data["deletions"]
        existing.changed_files = pr_data["changed_files"]
        existing.risk_score = risk
    else:
        db.add(PullRequest(
            repository_id=repo.id,
            github_pr_number=pr_data["number"],
            title=pr_data["title"],
            author_login=pr_data["user"]["login"],
            state=pr_data["state"],
            additions=pr_data["additions"],
            deletions=pr_data["deletions"],
            changed_files=pr_data["changed_files"],
            risk_score=risk,
        ))

    db.commit()
    return {"status": "processed", "risk_score": risk}