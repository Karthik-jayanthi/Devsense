from abc import ABC, abstractmethod
from typing import AsyncIterator


class AIProvider(ABC):
    @abstractmethod
    async def embed(self, text: str) -> list[float]:
        """Turns text into a vector for similarity search."""
        ...

    @abstractmethod
    async def generate_stream(self, prompt: str) -> AsyncIterator[str]:
        """Streams a text response token by token."""
        ...

    async def generate_complete(self, prompt: str) -> str:
        """Collects a full streamed response into one string."""
        chunks = []
        async for token in self.generate_stream(prompt):
            chunks.append(token)
        return "".join(chunks)