from app.services.ai.providers import get_ai_provider
from app.db.qdrant.client import search_similar


async def gather_repo_context(repository_id: str, focus_query: str, limit: int = 15) -> str:
    provider = get_ai_provider()
    query_vector = await provider.embed(focus_query)
    results = await search_similar(repository_id, query_vector, limit=limit)

    chunks = []
    for r in results:
        payload = r.payload
        chunks.append(f"From {payload['file_path']}:\n{payload['content']}")
    return "\n\n".join(chunks)


def build_readme_prompt(repo_name: str, languages: dict, context: str) -> str:
    lang_summary = ", ".join(languages.keys()) if languages else "unknown"
    return f"""Write a README.md for a project called {repo_name}.
Main languages used: {lang_summary}.

Here is code from the repository:

{context}

Write a clear README with these sections: a one-paragraph project description, a Features list based on what the code actually does, and a Getting Started section. Keep it concise. Base everything only on the code shown above, don't invent features not present in the code."""