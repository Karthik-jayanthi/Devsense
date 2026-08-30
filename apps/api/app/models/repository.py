import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, BigInteger, Boolean, DateTime, ForeignKey, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID

from app.models.user import Base


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    github_repo_id = Column(BigInteger, unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    default_branch = Column(String, nullable=True)
    is_private = Column(Boolean, default=False)
    primary_language = Column(String, nullable=True)
    connected_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    connected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    indexing_status = Column(String, default="never")
    languages = Column(JSON, nullable=True)
    file_count = Column(Integer, nullable=True)