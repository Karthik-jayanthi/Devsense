from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams
from qdrant_client.models import Distance, VectorParams, Filter, FieldCondition, MatchValue

from app.core.config import settings

_client = AsyncQdrantClient(url=settings.qdrant_url)

COLLECTION_NAME = "code_chunks"


async def ensure_collection():
    collections = await _client.get_collections()
    exists = any(c.name == COLLECTION_NAME for c in collections.collections)
    if not exists:
        await _client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=settings.embedding_dimensions, distance=Distance.COSINE
            ),
        )


def get_qdrant_client():
    return _client

async def search_similar(repository_id: str, query_vector: list[float], limit: int = 5):
    client = get_qdrant_client()
    response = await client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        query_filter={
            "must": [{"key": "repository_id", "match": {"value": repository_id}}]
        },
        limit=limit,
    )
    return response.points

async def clear_repository_embeddings(repository_id: str):
    client = get_qdrant_client()
    await client.delete(
        collection_name=COLLECTION_NAME,
        points_selector=Filter(
            must=[FieldCondition(key="repository_id", match=MatchValue(value=repository_id))]
        ),
    )