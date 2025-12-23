import os
import google.generativeai as genai
from pydantic import BaseModel
from typing import List, Optional
import json

from ..models import GithubStats, PersonaResult, Language


def get_genai_model():
    api_key = os.getenv("GOOGLE_API_KEY")
    genai.configure(api_key=api_key)
    # Changed from gemini-3-flash-preview as 1.5 is more common/stable for now, or match user's if preferred
    return genai.GenerativeModel('gemini-2.5-flash')


async def generate_persona(stats: GithubStats) -> PersonaResult:
    model = get_genai_model()

    prompt = f"""
    Analyze this developer's GitHub activity for the year:
    Username: {stats.username}
    Total Commits: {stats.totalCommits}
    Top Languages: {', '.join([l.name for l in stats.topLanguages])}
    Most Active Repo: {stats.mostActiveRepo}
    Commit Messages: {'; '.join(stats.commitMessages)}

    Assign them a Star Wars character persona based on this data. 
    - Yoda: Clean code, refactoring heavy, wise.
    - Han Solo: Fast commits, "hotfixes", slightly chaotic but gets it done.
    - Darth Vader: Force pushes, powerful architecture, dominating presence.
    - R2-D2: Automation expert, helper functions, reliable.
    - Luke Skywalker: Heroic fixes, learning new languages, bright future.
    - C-3PO: Documentation heavy, strict typing, procedural.

    Return the result as a JSON object with keys: character, title, summary, quote.
    """

    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            response_mime_type="application/json",
        )
    )

    try:
        data = json.loads(response.text)
        return PersonaResult(**data)
    except Exception as e:
        print(f"Failed to parse AI response: {e}")
        return PersonaResult(
            character="The Unknown Droid",
            title="Silent Contributor",
            summary="Your code flows through the galaxy in mysterious ways.",
            quote="Beep boop."
        )
