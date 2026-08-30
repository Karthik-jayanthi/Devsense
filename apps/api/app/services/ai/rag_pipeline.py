from app.services.ai.providers import get_ai_provider
from app.db.qdrant.client import search_similar


async def build_context(repository_id: str, question: str) -> str:
    provider = get_ai_provider()
    query_vector = await provider.embed(question)

    results = await search_similar(repository_id, query_vector, limit=5)

    if not results:
        return "No relevant code found in this repository."

    chunks = []
    for r in results:
        payload = r.payload
        header = f"From file {payload['file_path']}:"
        chunks.append(f"{header}\n{payload['content']}")

    return "\n\n".join(chunks)


def build_prompt(question: str, context: str) -> str:
    return f"""You are answering a question about a codebase. Below are code snippets from the repository.

{context}

Question: {question}

Give a direct, short answer based only on the code snippets above."""