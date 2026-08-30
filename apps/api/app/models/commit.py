import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.models.user import Base


class Commit(Base):
    __tablename__ = "commits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repository_id = Column(UUID(as_uuid=True), ForeignKey("repositories.id"), nullable=False)
    contributor_id = Column(UUID(as_uuid=True), ForeignKey("contributors.id"), nullable=True)
    sha = Column(String, nullable=False)
    message = Column(String, nullable=True)
    committed_at = Column(DateTime, nullable=True)
    additions = Column(Integer, default=0)
    deletions = Column(Integer, default=0)
    files_changed = Column(Integer, default=0)

    __table_args__ = (UniqueConstraint("repository_id", "sha"),)