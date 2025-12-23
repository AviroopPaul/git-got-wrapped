import httpx
from typing import List, Dict, Any
from ..models import GithubStats, Language, ActivityData
import asyncio
from collections import defaultdict


async def fetch_user_stats(token: str, target_username: str = None) -> GithubStats:
    headers = {
        "Authorization": f"bearer {token}",
        "Content-Type": "application/json",
    }

    query = """
    query($login: String!) {
      user(login: $login) {
        login
        avatarUrl
        repositories(first: 100, orderBy: {field: PUSHED_AT, direction: DESC}) {
          nodes {
            name
            stargazerCount
            primaryLanguage {
              name
              color
            }
            defaultBranchRef {
              target {
                ... on Commit {
                  history(since: "2025-01-01T00:00:00Z", until: "2025-12-31T23:59:59Z") {
                    totalCount
                    nodes {
                      message
                      committedDate
                    }
                  }
                }
              }
            }
          }
        }
        pullRequests(states: [MERGED, OPEN], last: 100) {
          totalCount
          nodes {
            createdAt
          }
        }
        issues(last: 100) {
          totalCount
          nodes {
            createdAt
          }
        }
      }
    }
    """

    viewer_query = """
    query {
      viewer {
        login
        avatarUrl
        repositories(first: 100, orderBy: {field: PUSHED_AT, direction: DESC}) {
          nodes {
            name
            stargazerCount
            primaryLanguage {
              name
              color
            }
            defaultBranchRef {
              target {
                ... on Commit {
                  history(since: "2025-01-01T00:00:00Z", until: "2025-12-31T23:59:59Z") {
                    totalCount
                    nodes {
                      message
                      committedDate
                    }
                  }
                }
              }
            }
          }
        }
        pullRequests(states: [MERGED, OPEN], last: 100) {
          totalCount
          nodes {
            createdAt
          }
        }
        issues(last: 100) {
          totalCount
          nodes {
            createdAt
          }
        }
      }
    }
    """

    async with httpx.AsyncClient() as client:
        if target_username:
            resp = await client.post(
                "https://api.github.com/graphql",
                json={"query": query, "variables": {"login": target_username}},
                headers=headers,
                timeout=30.0
            )
        else:
            resp = await client.post(
                "https://api.github.com/graphql",
                json={"query": viewer_query},
                headers=headers,
                timeout=30.0
            )

        if resp.status_code != 200:
            print(f"GraphQL Error: {resp.text}")
            return GithubStats(
                username="Error", avatarUrl="", totalCommits=0, totalPRs=0, totalIssues=0,
                totalStars=0, topLanguages=[], activityData=[], mostActiveRepo="", streak=0, commitMessages=[]
            )

        resp_json = resp.json()
        if "errors" in resp_json:
            print(f"GraphQL Response Errors: {resp_json['errors']}")
            raise Exception("User not found or inaccessible")

        data = resp_json["data"]["user"] if target_username else resp_json["data"]["viewer"]
        username = data["login"]
        avatar_url = data["avatarUrl"]

        total_commits = 0
        total_stars = 0
        repo_commits = {}
        languages_count = defaultdict(int)
        monthly_activity = defaultdict(int)
        commit_messages = []

        # Process Repositories
        for repo in data["repositories"]["nodes"]:
            total_stars += repo["stargazerCount"]

            if repo["primaryLanguage"]:
                languages_count[repo["primaryLanguage"]["name"]] += 1

            history = (repo.get("defaultBranchRef") or {}).get(
                "target", {}).get("history", {})
            commits_in_repo = history.get("totalCount", 0)

            if commits_in_repo > 0:
                total_commits += commits_in_repo
                repo_commits[repo["name"]] = commits_in_repo

                for commit in history.get("nodes", []):
                    # Activity by month
                    date_str = commit["committedDate"]  # ISO format
                    month = date_str[5:7]  # Get "MM"
                    month_names = ["Jan", "Feb", "Mar", "Apr", "May",
                                   "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                    month_name = month_names[int(month)-1]
                    monthly_activity[month_name] += 1

                    # Store messages for persona
                    if len(commit_messages) < 15:
                        commit_messages.append(commit["message"])

        # Filter PRs/Issues for 2025
        total_prs = sum(
            1 for pr in data["pullRequests"]["nodes"] if "2025" in pr["createdAt"])
        total_issues = sum(
            1 for issue in data["issues"]["nodes"] if "2025" in issue["createdAt"])

        # Formatting for return
        most_active_repo = max(
            repo_commits, key=repo_commits.get) if repo_commits else "None"

        # Calculate language percentages
        total_langs = sum(languages_count.values())
        top_languages = []
        for name, count in sorted(languages_count.items(), key=lambda x: x[1], reverse=True)[:5]:
            top_languages.append(Language(
                name=name,
                percentage=round((count/total_langs)*100,
                                 1) if total_langs > 0 else 0,
                color="#ccc"  # Generic color
            ))

        # Activity data sorted by month
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        activity_data = [ActivityData(
            month=m, commits=monthly_activity[m]) for m in months]

        return GithubStats(
            username=username,
            avatarUrl=avatar_url,
            totalCommits=total_commits,
            totalPRs=total_prs,
            totalIssues=total_issues,
            totalStars=total_stars,
            topLanguages=top_languages,
            activityData=activity_data,
            mostActiveRepo=most_active_repo,
            streak=0,
            commitMessages=commit_messages
        )


def merge_stats(all_stats: List[GithubStats]) -> GithubStats:
    if not all_stats:
        raise ValueError("No stats to merge")

    merged = GithubStats(
        username=" & ".join([s.username for s in all_stats]),
        avatarUrl=all_stats[0].avatarUrl,
        totalCommits=sum(s.totalCommits for s in all_stats),
        totalPRs=sum(s.totalPRs for s in all_stats),
        totalIssues=sum(s.totalIssues for s in all_stats),
        totalStars=sum(s.totalStars for s in all_stats),
        topLanguages=[],  # Logic to merge languages
        activityData=[],  # Logic to merge activity
        mostActiveRepo=all_stats[0].mostActiveRepo,  # Simple pick for now
        streak=max(s.streak for s in all_stats),
        commitMessages=[]
    )

    # Merge languages
    lang_map = defaultdict(float)
    for s in all_stats:
        for l in s.topLanguages:
            lang_map[l.name] += l.percentage

    total_l = sum(lang_map.values())
    if total_l > 0:
        for name, val in lang_map.items():
            merged.topLanguages.append(
                Language(name=name, percentage=round((val/total_l)*100, 1), color="#ccc"))

    # Merge activity data
    month_map = defaultdict(int)
    for s in all_stats:
        for a in s.activityData:
            month_map[a.month] += a.commits

    for month, count in month_map.items():
        merged.activityData.append(ActivityData(month=month, commits=count))

    # Merge commit messages
    all_msgs = []
    for s in all_stats:
        all_msgs.extend(s.commitMessages)
    merged.commitMessages = all_msgs[:10]  # Limit

    return merged
