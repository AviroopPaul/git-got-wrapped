from fastapi import APIRouter, HTTPException, Depends
import httpx
import os
from pydantic import BaseModel

router = APIRouter()


class AuthCode(BaseModel):
    code: str


@router.post("/callback")
async def github_callback(data: AuthCode):
    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET")
    redirect_uri = os.getenv("GITHUB_REDIRECT_URI",
                             "http://localhost:3000/auth/callback")

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=500, detail="Backend configuration error: Client ID or Secret missing")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": data.code,
                "redirect_uri": redirect_uri,
            },
            headers={"Accept": "application/json"},
        )

        if response.status_code != 200:
            print(f"GitHub token exchange failed: {response.text}")
            raise HTTPException(
                status_code=400, detail=f"GitHub error: {response.status_code}")

        token_data = response.json()
        if "error" in token_data:
            print(f"GitHub returned error: {token_data}")
            raise HTTPException(status_code=400, detail=token_data.get(
                "error_description", token_data.get("error")))

        return token_data
