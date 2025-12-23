from fastapi import APIRouter, HTTPException
from ..models import GithubStats, PersonaResult
from ..services.ai_service import generate_persona
from typing import Optional

router = APIRouter()


@router.post("/persona")
async def get_persona(stats: GithubStats):
    return await generate_persona(stats)
