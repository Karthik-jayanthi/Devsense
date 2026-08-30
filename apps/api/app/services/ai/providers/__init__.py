from app.core.config import settings
from app.services.ai.providers.ollama_provider import OllamaProvider


def get_ai_provider():
    if settings.ai_provider == "ollama":
        return OllamaProvider()
    raise ValueError(f"Unknown AI provider: {settings.ai_provider}")