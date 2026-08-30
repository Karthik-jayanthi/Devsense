from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../../.env",  # points up to the project root .env
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    env: str = "development"
    debug: bool = True
    frontend_url: str
    backend_url: str

    qdrant_url: str
    ai_provider: str = "ollama"
    ollama_base_url: str
    ollama_chat_model: str
    ollama_embed_model: str
    embedding_dimensions: int = 768

    # Postgres
    database_url: str

    # Redis
    redis_url: str
    celery_broker_url: str
    celery_result_backend: str

    #neo4j
    neo4j_uri: str
    neo4j_user: str
    neo4j_password: str

    # Auth
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    encryption_key: str

    # GitHub OAuth
    github_client_id: str
    github_client_secret: str
    github_oauth_callback_url: str
    github_webhook_secret: str
    
    # CORS
    cors_origins: str = "http://localhost:3000"


settings = Settings()

    