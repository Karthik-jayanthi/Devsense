import uuid
from qdrant_client.models import PointStruct

from app.db.qdrant.client import get_qdrant_client, COLLECTION_NAME, ensure_collection
from app.services.ai.providers import get_ai_provider
from app.services.ai.chunking import chunk_file


async def embed_and_store_chunks(repository_id: str, file_path: str, content: str, parsed: dict):
    if not content.strip():
        return

    await ensure_collection()
    provider = get_ai_provider()
    client = get_qdrant_client()

    chunks = chunk_file(content, parsed)
    points = []

    for chunk in chunks:
        if not chunk["content"].strip():
            continue
        vector = await provider.embed(chunk["content"])
        point_id = str(uuid.uuid5(
            uuid.NAMESPACE_URL,
            f"{repository_id}:{file_path}:{chunk['chunk_type']}:{chunk['symbol_name']}:{chunk['start_line']}",
        ))
        points.append(PointStruct(
            id=point_id,
            vector=vector,
            payload={
                "repository_id": repository_id,
                "file_path": file_path,
                "chunk_type": chunk["chunk_type"],
                "symbol_name": chunk["symbol_name"],
                "start_line": chunk["start_line"],
                "end_line": chunk["end_line"],
                "content": chunk["content"],
            },
        ))

    if points:
        await client.upsert(collection_name=COLLECTION_NAME, points=points)