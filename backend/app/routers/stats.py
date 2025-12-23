from fastapi import APIRouter, HTTPException, Body
from typing import List
from ..services.github_service import fetch_user_stats, merge_stats
from ..models import GithubStats

import os

router = APIRouter()


@router.post("/merge")
async def get_merged_stats(tokens: List[str] = Body(...)):
    if not tokens:
        raise HTTPException(status_code=400, detail="No tokens provided")

    all_stats = []
    for token in tokens:
        try:
            stats = await fetch_user_stats(token)
            all_stats.append(stats)
        except Exception as e:
            print(f"Error fetching stats for token: {e}")

    if not all_stats:
        raise HTTPException(
            status_code=404, detail="Could not fetch stats for any account")

    return merge_stats(all_stats)


@router.get("/username/{username}")
async def get_stats_by_username(username: str):
    token = os.getenv("GITHUB_TOKEN") or os.getenv("GITHUB_CLIENT_SECRET")
    if not token:
        raise HTTPException(
            status_code=500, detail="Server not configured for username-only lookup")

    try:
        return await fetch_user_stats(token, target_username=username)
    except Exception as e:
        print(f"Error fetching stats for username {username}: {e}")
        raise HTTPException(
            status_code=404, detail=f"User {username} not found or data inaccessible")
