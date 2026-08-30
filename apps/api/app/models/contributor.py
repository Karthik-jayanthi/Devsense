import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.models.user import Base


class Contributor(Base):
    __tablename__ = "contributors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repository_id = Column(UUID(as_uuid=True), ForeignKey("repositories.id"), nullable=False)
    github_login = Column(String, nullable=False)
    commit_count = Column(Integer, default=0)

    __table_args__ = (UniqueConstraint("repository_id", "github_login"),)