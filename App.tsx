import React, { useState, useEffect, useRef } from "react";
import { AppStep, PersonaResult, GithubStats } from "./types";
import {
  loginToGithub,
  handleAuthCallback,
  getMergedStats,
  getStatsByUsername,
  generatePersona,
} from "./services/apiService";
import Button from "./components/Button";
import NeobrutalCard from "./components/NeobrutalCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Tooltip,
} from "recharts";

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.INTRO);
  const [tokens, setTokens] = useState<string[]>(
    JSON.parse(localStorage.getItem("gh_tokens") || "[]")
  );
  const [usernameInput, setUsernameInput] = useState("");
  const [stats, setStats] = useState<GithubStats | null>(null);
  const [persona, setPersona] = useState<PersonaResult | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingPersona, setIsLoadingPersona] = useState(false);

  const isHandlingCallback = useRef(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code && !isHandlingCallback.current) {
      isHandlingCallback.current = true;
      window.history.replaceState({}, document.title, window.location.pathname);
      handleCallback(code);
    }
  }, []);

  const handleCallback = async (code: string) => {
    try {
      const token = await handleAuthCallback(code);
      const newTokens = [...tokens, token];
      setTokens(newTokens);
      localStorage.setItem("gh_tokens", JSON.stringify(newTokens));
      setStep(AppStep.AUTH);
    } catch (error) {
      console.error(error);
      alert("Auth failed");
    }
  };

  const handleFetchStats = async () => {
    if (tokens.length === 0) return;
    setIsLoadingStats(true);
    setStep(AppStep.STATS_OVERVIEW);
    try {
      const mergedStats = await getMergedStats(tokens);
      setStats(mergedStats);
      setStep(AppStep.STATS_OVERVIEW);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch stats");
      setStep(AppStep.AUTH);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleFetchByUsername = async () => {
    if (!usernameInput) return;
    setIsLoadingStats(true);
    setStep(AppStep.STATS_OVERVIEW);
    try {
      const userStats = await getStatsByUsername(usernameInput);
      setStats(userStats);
      setStep(AppStep.STATS_OVERVIEW);
    } catch (error) {
      console.error(error);
      alert("User not found or inaccessible");
      setStep(AppStep.AUTH);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const nextStep = () => {
    if (step === AppStep.AUTH) {
      handleFetchStats();
    } else if (step === AppStep.ACTIVITY) {
      handleGeneratePersona();
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (step > AppStep.INTRO) setStep((prev) => prev - 1);
  };

  const handleGeneratePersona = async () => {
    if (!stats) return;
    setStep(AppStep.PERSONA_LOADING);
    setIsLoadingPersona(true);
    try {
      const result = await generatePersona(stats);
      setPersona(result);
      setStep(AppStep.FINAL_WRAP);
    } catch (error) {
      console.error(error);
      setStep(AppStep.FINAL_WRAP);
    } finally {
      setIsLoadingPersona(false);
    }
  };

  const renderProgress = () => {
    const totalSteps = 7;
    const progress = (step / (totalSteps - 1)) * 100;
    return (
      <div className="fixed top-0 left-0 w-full h-4 bg-black border-b-4 border-white z-50">
        <div
          className="h-full bg-white transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 md:p-12 relative">
      {renderProgress()}

      <div className="max-w-4xl w-full">
        {step === AppStep.INTRO && (
          <div className="text-center space-y-8 animate-in fade-in duration-700">
            <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-none border-b-8 border-white pb-4">
              GitHub
              <br />
              Wrapped
            </h1>
            <p className="text-2xl font-bold uppercase tracking-widest bg-white text-black px-4 py-2 inline-block">
              2025 Edition
            </p>
            <div className="pt-8">
              <Button onClick={() => setStep(AppStep.AUTH)}>Get Started</Button>
            </div>
          </div>
        )}

        {step === AppStep.AUTH && (
          <div className="text-center space-y-12 animate-in slide-in-from-bottom duration-500 max-w-2xl mx-auto">
            <div className="space-y-4">
              <h2 className="text-6xl font-black uppercase">
                Choose Your Path
              </h2>
              <p className="text-xl font-bold">
                Connect your account for full data or just peek with a username.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Path 1: Connect Accounts */}
              <div className="border-4 border-white p-6 bg-black neobrutalism-shadow flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <h3 className="text-2xl font-black uppercase">
                    The Jedi Path
                  </h3>
                  <p className="text-sm font-bold opacity-80">
                    Login to fetch private repos, detailed PR/Issue counts, and
                    multiple accounts.
                  </p>
                </div>

                <div className="space-y-4">
                  {tokens.length > 0 && (
                    <div className="w-full space-y-2">
                      <p className="text-xs font-black uppercase opacity-50 text-left">
                        Connected: {tokens.length}
                      </p>
                      <Button onClick={nextStep} className="w-full py-2 px-4">
                        Generate Wrap
                      </Button>
                    </div>
                  )}
                  <Button
                    onClick={loginToGithub}
                    className="w-full py-2 px-4 bg-white text-black"
                  >
                    {tokens.length > 0 ? "Add Another" : "Connect GitHub"}
                  </Button>
                </div>
              </div>

              {/* Path 2: Username Only */}
              <div className="border-4 border-white p-6 bg-black neobrutalism-shadow flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <h3 className="text-2xl font-black uppercase">
                    The Droid Path
                  </h3>
                  <p className="text-sm font-bold opacity-80">
                    Quick scan using only a public username. Limited to public
                    contributions.
                  </p>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="GITHUB USERNAME"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full p-2 bg-black border-2 border-white text-white font-black uppercase placeholder-gray-700 focus:outline-none focus:border-gray-400"
                  />
                  <Button
                    onClick={handleFetchByUsername}
                    className="w-full py-2 px-4"
                    disabled={!usernameInput}
                  >
                    Scan Username
                  </Button>
                </div>
              </div>
            </div>

            {tokens.length > 0 && (
              <button
                onClick={() => {
                  setTokens([]);
                  localStorage.removeItem("gh_tokens");
                }}
                className="text-xs font-black uppercase underline opacity-30 hover:opacity-100 transition-opacity"
              >
                Clear All Connections
              </button>
            )}
          </div>
        )}

        {(step === AppStep.STATS_OVERVIEW || isLoadingStats) &&
          (!stats || isLoadingStats ? (
            <div className="text-center py-12 space-y-8">
              <div className="inline-block w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              <p className="text-2xl font-black uppercase">
                Fetching 2025 Data...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom duration-500">
              <div className="space-y-6">
                <h2 className="text-6xl font-black uppercase leading-none">
                  The Raw
                  <br />
                  Numbers
                </h2>
                <p className="text-xl font-medium border-l-8 border-white pl-4">
                  Your productivity across the galaxy was noted.
                </p>
                <Button onClick={nextStep}>Next Chapter</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <NeobrutalCard title="Commits">
                  <span className="text-5xl font-black">
                    {stats.totalCommits}
                  </span>
                </NeobrutalCard>
                <NeobrutalCard title="PRs">
                  <span className="text-5xl font-black">{stats.totalPRs}</span>
                </NeobrutalCard>
                <NeobrutalCard title="Stars">
                  <span className="text-5xl font-black">
                    {stats.totalStars}
                  </span>
                </NeobrutalCard>
                <NeobrutalCard title="Streak">
                  <span className="text-5xl font-black">{stats.streak}d</span>
                </NeobrutalCard>
              </div>
            </div>
          ))}

        {step === AppStep.LANGUAGES && stats && (
          <div className="flex flex-col md:flex-row gap-8 items-center animate-in slide-in-from-right duration-500">
            <div className="flex-1 space-y-6">
              <h2 className="text-6xl font-black uppercase">
                Core
                <br />
                Arsenal
              </h2>
              <div className="space-y-2">
                {stats.topLanguages.map((lang, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-white text-black p-3 border-2 border-white neobrutalism-shadow-sm"
                  >
                    <span className="font-bold uppercase">{lang.name}</span>
                    <span className="font-black text-2xl">
                      {lang.percentage}%
                    </span>
                  </div>
                ))}
              </div>
              <Button onClick={nextStep} className="mt-8">
                See Movement
              </Button>
            </div>
            <div className="w-full md:w-1/2 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.topLanguages}
                    dataKey="percentage"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    stroke="#fff"
                    strokeWidth={4}
                  >
                    {stats.topLanguages.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index % 2 === 0 ? "#fff" : "#333"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#000",
                      color: "#fff",
                      border: "4px solid white",
                      borderRadius: "0",
                      boxShadow: "4px 4px 0px 0px #fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {step === AppStep.ACTIVITY && stats && (
          <div className="space-y-8 animate-in zoom-in duration-500">
            <div className="flex justify-between items-end border-b-8 border-white pb-4">
              <h2 className="text-6xl font-black uppercase leading-none">
                Activity
                <br />
                Pulse
              </h2>
              <div className="text-right">
                <p className="font-bold uppercase text-xl text-gray-400">
                  Most Active
                </p>
                <p className="font-black text-3xl">{stats.mostActiveRepo}</p>
              </div>
            </div>

            <div className="h-[300px] w-full bg-black border-4 border-white p-4 neobrutalism-shadow">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.activityData}>
                  <XAxis dataKey="month" stroke="#fff" fontWeight="bold" />
                  <YAxis stroke="#fff" fontWeight="bold" />
                  <Bar dataKey="commits" fill="#fff" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center">
              <Button
                onClick={prevStep}
                className="border-gray-500 text-gray-500"
              >
                Back
              </Button>
              <Button onClick={nextStep}>Analyze Persona</Button>
            </div>
          </div>
        )}

        {step === AppStep.PERSONA_LOADING && (
          <div className="text-center space-y-12 py-12">
            <div className="inline-block w-24 h-24 border-8 border-white border-t-transparent rounded-full animate-spin"></div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black uppercase">
                Scanning the Jedi Archives...
              </h2>
              <p className="text-xl font-bold animate-pulse uppercase">
                Gemini is analyzing your coding patterns
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto opacity-30">
              {[
                "FORCE",
                "GALAXY",
                "DROID",
                "SITH",
                "JEDI",
                "CODE",
                "PULL",
                "PUSH",
              ].map((word) => (
                <div
                  key={word}
                  className="border-2 border-white p-2 font-black"
                >
                  {word}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === AppStep.FINAL_WRAP && persona && stats && (
          <div className="animate-in fade-in zoom-in duration-1000 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-0 border-8 border-white neobrutalism-shadow">
              {/* Left Side: Avatar & Identity */}
              <div className="md:col-span-2 bg-white text-black p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold uppercase mb-2 tracking-widest text-gray-500">
                    Your Identity
                  </h3>
                  <div className="w-full aspect-square border-4 border-black mb-6 overflow-hidden">
                    <img
                      src={stats.avatarUrl}
                      alt="User"
                      className="w-full h-full object-cover grayscale"
                    />
                  </div>
                  <h2 className="text-5xl font-black uppercase leading-tight mb-2">
                    {persona.character}
                  </h2>
                  <p className="text-2xl font-bold border-l-4 border-black pl-4 italic opacity-80">
                    "{persona.quote}"
                  </p>
                </div>
                <div className="pt-8">
                  <p className="text-sm font-bold uppercase tracking-widest opacity-50">
                    GitHub Wrapped 2025
                  </p>
                </div>
              </div>

              {/* Right Side: Persona Details & Summary */}
              <div className="md:col-span-3 bg-black p-8 space-y-8 flex flex-col justify-between border-t-8 md:border-t-0 md:border-l-8 border-white">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-black uppercase text-gray-500 mb-1">
                      Rank
                    </h4>
                    <p className="text-4xl font-black uppercase border-b-4 border-white inline-block">
                      {persona.title}
                    </p>
                  </div>

                  <div className="bg-zinc-900 border-4 border-white p-4 neobrutalism-shadow-sm">
                    <p className="text-lg font-bold leading-snug">
                      {persona.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border-2 border-white bg-white text-black">
                      <p className="text-xs font-black uppercase opacity-50">
                        Impact
                      </p>
                      <p className="text-2xl font-black">
                        {stats.totalCommits} COMMITS
                      </p>
                    </div>
                    <div className="p-4 border-2 border-white">
                      <p className="text-xs font-black uppercase opacity-50">
                        Top Tool
                      </p>
                      <p className="text-2xl font-black">
                        {stats.topLanguages[0]?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <Button
                    className="w-full"
                    onClick={() => window.location.reload()}
                  >
                    Start Over
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-center mt-12 font-black uppercase text-sm tracking-[1em] opacity-30">
              May the source be with you
            </p>
          </div>
        )}
      </div>

      {/* Persistent Navigation Controls */}
      {step !== AppStep.INTRO &&
        step !== AppStep.PERSONA_LOADING &&
        step !== AppStep.FINAL_WRAP && (
          <div className="fixed bottom-8 right-8 flex gap-4">
            {step > AppStep.STATS_OVERVIEW && (
              <button
                onClick={prevStep}
                className="bg-black text-white border-2 border-white p-4 font-black neobrutalism-shadow-sm hover:neobrutalism-shadow-active active:shadow-none transition-all"
              >
                &larr;
              </button>
            )}
          </div>
        )}
    </div>
  );
};

export default App;
