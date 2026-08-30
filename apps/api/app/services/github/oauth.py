import httpx

from app.core.config import settings

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"


def get_github_authorize_url() -> str:
    """Builds the URL the browser redirects to for the user to approve access."""
    params = (
        f"client_id={settings.github_client_id}"
        f"&redirect_uri={settings.github_oauth_callback_url}"
        f"&scope=read:user user:email repo"
    )
    return f"{GITHUB_AUTHORIZE_URL}?{params}"


async def exchange_code_for_token(code: str) -> str:
    """Trades the temporary code GitHub sent back for a real access token."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GITHUB_TOKEN_URL,
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
                "redirect_uri": settings.github_oauth_callback_url,
            },
            headers={"Accept": "application/json"},
        )
        response.raise_for_status()
        data = response.json()
        if "access_token" not in data:
            raise ValueError(f"GitHub OAuth error: {data.get('error_description', data)}")
        return data["access_token"]


async def fetch_github_user(access_token: str) -> dict:
    """Uses the access token to get the logged-in user's GitHub profile."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GITHUB_USER_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        return response.json()