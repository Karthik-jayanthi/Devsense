import httpx

GITHUB_REPOS_URL = "https://api.github.com/user/repos"


async def list_user_repos(access_token: str) -> list[dict]:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GITHUB_REPOS_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            params={"sort": "updated", "per_page": 50},
        )
        response.raise_for_status()
        return response.json()