from pydantic import BaseModel
from typing import Optional


class ConnectRepositoryRequest(BaseModel):
    github_repo_id: int
    full_name: str
    default_branch: Optional[str] = None
    private: bool = False
    language: Optional[str] = None