import ollama
from typing import AsyncIterator

from app.core.config import settings
from app.services.ai.providers.base import AIProvider


class OllamaProvider(AIProvider):
    def __init__(self):
        self.client = ollama.AsyncClient(host=settings.ollama_base_url)

    async def embed(self, text: str) -> list[float]:
        response = await self.client.embeddings(
            model=settings.ollama_embed_model, prompt=text
        )
        return response["embedding"]

    async def generate_stream(self, prompt: str) -> AsyncIterator[str]:
        async for chunk in await self.client.generate(
            model=settings.ollama_chat_model, prompt=prompt, stream=True
        ):
            yield chunk["response"]