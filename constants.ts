
import { GithubStats } from './types';

export const MOCK_USER_STATS: GithubStats = {
  username: "skywalker_dev",
  avatarUrl: "https://picsum.photos/seed/github/200/200",
  totalCommits: 1452,
  totalPRs: 84,
  totalIssues: 12,
  totalStars: 432,
  streak: 42,
  mostActiveRepo: "death-star-api",
  topLanguages: [
    { name: "TypeScript", percentage: 45, color: "#3178c6" },
    { name: "Rust", percentage: 30, color: "#dea584" },
    { name: "Go", percentage: 15, color: "#00add8" },
    { name: "Python", percentage: 10, color: "#3572a5" }
  ],
  activityData: [
    { month: "Jan", commits: 120 },
    { month: "Feb", commits: 95 },
    { month: "Mar", commits: 150 },
    { month: "Apr", commits: 110 },
    { month: "May", commits: 180 },
    { month: "Jun", commits: 210 },
    { month: "Jul", commits: 190 },
    { month: "Aug", commits: 160 },
    { month: "Sep", commits: 80 },
    { month: "Oct", commits: 130 },
    { month: "Nov", commits: 110 },
    { month: "Dec", commits: 67 }
  ],
  commitMessages: [
    "Refactor hyperdrive logic",
    "Fix memory leak in R2 unit interface",
    "Hotfix: thermal exhaust port vulnerability",
    "Initial commit of Jedi Training SDK",
    "Cleanup old debris from workspace"
  ]
};
