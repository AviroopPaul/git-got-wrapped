from pydantic import BaseModel
from typing import List, Optional


class Language(BaseModel):
    name: str
    percentage: float
    color: str


class ActivityData(BaseModel):
    month: str
    commits: int


class GithubStats(BaseModel):
    username: str
    avatarUrl: str
    totalCommits: int
    totalPRs: int
    totalIssues: int
    totalStars: int
    topLanguages: List[Language]
    activityData: List[ActivityData]
    mostActiveRepo: str
    streak: int
    commitMessages: List[str]


class PersonaResult(BaseModel):
    character: str
    title: str
    summary: str
    quote: str
