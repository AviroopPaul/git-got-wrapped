import { GithubStats, PersonaResult } from "../types";

export const loginToGithub = () => {
  const clientId =
    import.meta.env.VITE_GITHUB_CLIENT_ID || import.meta.env.GITHUB_CLIENT_ID;
  const redirectUri = encodeURIComponent(
    window.location.origin + "/auth/callback"
  );
  window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user,repo`;
};

export const handleAuthCallback = async (code: string): Promise<string> => {
  const response = await fetch("/api/auth/callback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate with GitHub");
  }

  const data = await response.json();
  return data.access_token;
};

export const getMergedStats = async (
  tokens: string[]
): Promise<GithubStats> => {
  const response = await fetch("/api/stats/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tokens),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch merged statistics");
  }

  return await response.json();
};

export const getStatsByUsername = async (
  username: string
): Promise<GithubStats> => {
  const response = await fetch(`/api/stats/username/${username}`);

  if (!response.ok) {
    throw new Error("Failed to fetch user statistics");
  }

  return await response.json();
};

export const generatePersona = async (
  stats: GithubStats
): Promise<PersonaResult> => {
  const response = await fetch("/api/ai/persona", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(stats),
  });

  if (!response.ok) {
    throw new Error("Failed to generate persona");
  }

  return await response.json();
};
