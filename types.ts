export interface GithubStats {
  username: string;
  avatarUrl: string;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalStars: number;
  topLanguages: { name: string; percentage: number; color: string }[];
  activityData: { month: string; commits: number }[];
  mostActiveRepo: string;
  streak: number;
  commitMessages: string[];
}

export interface PersonaResult {
  character: string;
  title: string;
  summary: string;
  quote: string;
}

export enum AppStep {
  INTRO,
  AUTH,
  STATS_OVERVIEW,
  LANGUAGES,
  ACTIVITY,
  PERSONA_LOADING,
  FINAL_WRAP,
}
