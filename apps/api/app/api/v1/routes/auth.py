from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.services.github.oauth import (
    get_github_authorize_url,
    exchange_code_for_token,
    fetch_github_user,
)
from app.core.security import create_access_token, encrypt_token
from app.core.config import settings
from app.core.deps import get_current_user
from app.db.postgres.session import get_db
from app.models.user import User

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.get("/login")
def login():
    return RedirectResponse(url=get_github_authorize_url())


@router.get("/callback")
async def callback(code: str, db: Session = Depends(get_db)):
    github_token = await exchange_code_for_token(code)
    profile = await fetch_github_user(github_token)

    encrypted_token = encrypt_token(github_token)

    user = db.query(User).filter(User.github_id == profile["id"]).first()
    if user is None:
        user = User(
            github_id=profile["id"],
            email=profile.get("email"),
            name=profile.get("name"),
            avatar_url=profile.get("avatar_url"),
            github_access_token_encrypted=encrypted_token,
        )
        db.add(user)
    else:
        user.name = profile.get("name")
        user.avatar_url = profile.get("avatar_url")
        user.github_access_token_encrypted = encrypted_token

    db.commit()
    db.refresh(user)

    jwt_token = create_access_token(user_id=str(user.id))

    response = RedirectResponse(url=f"{settings.frontend_url}/dashboard")
    response.set_cookie(
        key="access_token",
        value=jwt_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=settings.jwt_expire_minutes * 60,
    )
    return response


@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": str(user.id),
        "github_id": user.github_id,
        "name": user.name,
        "email": user.email,
        "avatar_url": user.avatar_url,
    }



@router.get("/logout")
def logout():
    response = RedirectResponse(url=f"{settings.frontend_url}/")
    response.delete_cookie("access_token", secure=True, samesite="none")
    return response