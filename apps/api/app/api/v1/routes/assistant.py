from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.core.deps import get_current_user
from app.services.ai.rag_pipeline import build_context, build_prompt
from app.services.ai.providers import get_ai_provider
from app.models.user import User

router = APIRouter(prefix="/api/v1/assistant", tags=["assistant"])


@router.get("/chat")
async def chat(
    repository_id: str,
    question: str,
    user: User = Depends(get_current_user),
):
    context = await build_context(repository_id, question)
    prompt = build_prompt(question, context)
    provider = get_ai_provider()

    async def event_stream():
        async for token in provider.generate_stream(prompt):
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")