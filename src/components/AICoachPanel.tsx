import React, { useState, useEffect } from "react";
import {
  Brain,
  Sparkles,
  Calendar,
  Layers,
  Search,
  MessageSquare,
  Import,
  AlertTriangle,
  ClipboardList,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  FileText,
  User,
  Zap,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  SearchCode,
  Loader2,
  RefreshCw,
  Award
} from "lucide-react";
import { Goal, GoalTask, Skill, Course, Chapter, Project, ProjectTask, DailyTask } from "../types";

interface AICoachPanelProps {
  token: string | null;
  goals: Goal[];
  tasks: GoalTask[];
  skills: Skill[];
  courses: Course[];
  chapters: Chapter[];
  projects: Project[];
  projectTasks: ProjectTask[];
  dailies: DailyTask[];
  syncData: () => Promise<void>;
}

export default function AICoachPanel({
  token,
  goals,
  tasks,
  skills,
  courses,
  chapters,
  projects,
  projectTasks,
  dailies,
  syncData
}: AICoachPanelProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"coach" | "chat" | "roadmaps" | "interviews" | "gap" | "resumes" | "notes">("coach");

  // Loaders
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // States
  const [coachReport, setCoachReport] = useState<string>("");
  const [dailySummary, setDailySummary] = useState<string>("");
  const [reviewMode, setReviewMode] = useState<"weekly" | "monthly" | "burnout">("weekly");
  const [reviewContent, setReviewContent] = useState<string>("");

  // Chat conversation
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<{ role: "user" | "coach"; text: string }[]>([
    { role: "coach", text: "Greetings! I am Qwen, your local Docker AI Productivity Coach. Ask me how to improve your interview confidence, analyze your current goals, or design a custom AWS/Kubernets study roadmap." }
  ]);

  // Planning / Roadmaps generator inputs
  const [targetQuery, setTargetQuery] = useState("");
  const [roadmapTrack, setRoadmapTrack] = useState("DevOps Engineer");
  const [generatedPlan, setGeneratedPlan] = useState<string>("");
  const [importableData, setImportableData] = useState<any | null>(null);

  // Skill Interview / Gap Inputs
  const [selectedSkillForInterview, setSelectedSkillForInterview] = useState("");
  const [interviewOutput, setInterviewOutput] = useState("");
  const [desiredRole, setDesiredRole] = useState("Platform Engineer");
  const [gapOutput, setGapOutput] = useState("");

  // Resume / Habit Improvement States
  const [resumeAdvice, setResumeAdvice] = useState("");
  const [habitAdvice, setHabitAdvice] = useState("");

  // Chapter Note summarizer states
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [chapterSummaryOutput, setChapterSummaryOutput] = useState("");

  // Project stall audit states
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectAuditOutput, setProjectAuditOutput] = useState("");

  // Natural Language Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any | null>(null);

  // Global notification banner
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Initialize selected skill dropdown
  useEffect(() => {
    if (skills.length > 0 && !selectedSkillForInterview) {
      setSelectedSkillForInterview(skills[0].skillName);
    }
  }, [skills]);

  // Initialize selected entities
  useEffect(() => {
    if (chapters.length > 0 && !selectedChapterId) {
      setSelectedChapterId(chapters[0].id);
    }
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [chapters, projects]);

  // Auto trigger daily and coach on mount
  useEffect(() => {
    if (token) {
      fetchDailySummary();
      fetchCoachReport();
    }
  }, [token]);

  // Alert handler
  const triggerAlert = (text: string, type: "success" | "error" = "success") => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 5000);
  };

  // API Call general wrapper
  const fetchAIEndpoint = async (endpoint: string, method: "GET" | "POST" = "GET", body: any = null) => {
    if (!token) return null;
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(endpoint, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "AI service operation failed");
      }
      return await res.json();
    } catch (e: any) {
      console.error(`AI Fetch error [${endpoint}]:`, e);
      triggerAlert(e.message || "Endpoint connection failed.", "error");
      return { error: e.message || "Endpoint connection failed." };
    }
  };

  // 1. Fetch Coach Report
  const fetchCoachReport = async (refresh = false) => {
    if (!token) return;
    setLoadingCoach(true);
    const data = await fetchAIEndpoint(refresh ? "/api/ai/coach?refresh=true" : "/api/ai/coach");
    if (data) {
      if (data.error) {
        setCoachReport(`Error: AI Coach is not connected.\nDetails: ${data.error}`);
      } else if (data.report) {
        setCoachReport(data.report);
      }
    }
    setLoadingCoach(false);
  };

  // 2. Fetch Daily summary
  const fetchDailySummary = async (refresh = false) => {
    if (!token) return;
    setLoadingDaily(true);
    const data = await fetchAIEndpoint(refresh ? "/api/ai/daily-summary?refresh=true" : "/api/ai/daily-summary");
    if (data) {
      if (data.error) {
        setDailySummary(`Error: AI summary is unavailable.\nDetails: ${data.error}`);
      } else if (data.summary) {
        setDailySummary(data.summary);
      }
    }
    setLoadingDaily(false);
  };

  // 3. Fetch Periodic Review (Weekly/Monthly/Burnout)
  const fetchPeriodicReview = async (mode: "weekly" | "monthly" | "burnout") => {
    setLoadingReview(true);
    setReviewMode(mode);
    setReviewContent("");
    const path = mode === "weekly" ? "/api/ai/weekly-review" : mode === "monthly" ? "/api/ai/monthly-review" : "/api/ai/burnout-coach";
    const data = await fetchAIEndpoint(path);
    if (data) {
      if (data.error) {
        setReviewContent(`Error: AI review failed to generate.\nDetails: ${data.error}`);
      } else {
        setReviewContent(data.review || data.recommendations || "Empty review compiled.");
      }
    }
    setLoadingReview(false);
  };

  // 4. Submit Chat query
  const submitChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatLog((prev) => [...prev, { role: "user", text: userMsg }]);

    setLoadingAction(true);
    const historyPayload = chatLog.slice(-10); // send last 10 messages context
    const data = await fetchAIEndpoint("/api/ai/chat", "POST", { query: userMsg, history: historyPayload });
    if (data) {
      if (data.error) {
        setChatLog((prev) => [...prev, { role: "coach", text: `Error: Chat offline.\nDetails: ${data.error}` }]);
      } else if (data.response) {
        setChatLog((prev) => [...prev, { role: "coach", text: data.response }]);
      }
    }
    setLoadingAction(false);
  };

  // 5. Generate Roadmap Tracker
  const generateRoadmap = async () => {
    setLoadingAction(true);
    setGeneratedPlan("");
    setImportableData(null);
    const data = await fetchAIEndpoint("/api/ai/roadmap", "POST", { track: roadmapTrack, refresh: true });
    if (data) {
      if (data.error) {
        setGeneratedPlan(`Error: Failed to build learning roadmap.\nDetails: ${data.error}`);
      } else if (data.plan) {
        setGeneratedPlan(data.plan);
        extractImportableData(data.plan);
      }
    }
    setLoadingAction(false);
  };

  // 6. Generate Custom Goal Plan
  const generateGoalPlan = async () => {
    if (!targetQuery.trim()) return;
    setLoadingAction(true);
    setGeneratedPlan("");
    setImportableData(null);
    const data = await fetchAIEndpoint("/api/ai/plan-goal", "POST", { topic: targetQuery, refresh: true });
    if (data) {
      if (data.error) {
        setGeneratedPlan(`Error: Failed to structure study plan.\nDetails: ${data.error}`);
      } else if (data.plan) {
        setGeneratedPlan(data.plan);
        extractImportableData(data.plan);
      }
    }
    setLoadingAction(false);
  };

  // 7. Generate Project Ideas
  const generateProjects = async () => {
    setLoadingAction(true);
    setGeneratedPlan("");
    setImportableData(null);
    const query = goals.length > 0 ? goals.map((g) => g.title).join(", ") : "Cloud native engineer";
    const data = await fetchAIEndpoint("/api/ai/project", "POST", { goalsQuery: query, refresh: true });
    if (data) {
      if (data.error) {
        setGeneratedPlan(`Error: Failed to generate portfolio projects.\nDetails: ${data.error}`);
      } else if (data.plan) {
        setGeneratedPlan(data.plan);
        extractImportableData(data.plan);
      }
    }
    setLoadingAction(false);
  };

  // 8. Generate Mock Interview preparation cards
  const generateMockInterview = async () => {
    if (!selectedSkillForInterview) {
      triggerAlert("Declare at least one skill in GoalTracker first!", "error");
      return;
    }
    setLoadingAction(true);
    setInterviewOutput("");
    setImportableData(null);
    const data = await fetchAIEndpoint("/api/ai/mock-interview", "POST", { skillName: selectedSkillForInterview, refresh: true });
    if (data) {
      if (data.error) {
        setInterviewOutput(`Error: Mock Interview Prep failed.\nDetails: ${data.error}`);
      } else if (data.questions) {
        setInterviewOutput(data.questions);
        extractImportableData(data.questions);
      }
    }
    setLoadingAction(false);
  };

  // 9. Gap analysis trigger
  const runSkillGapAnalysis = async () => {
    setLoadingAction(true);
    setGapOutput("");
    const data = await fetchAIEndpoint("/api/ai/skill-gap", "POST", { desiredRole, refresh: true });
    if (data) {
      if (data.error) {
        setGapOutput(`Error: Skill Gap Analysis failed.\nDetails: ${data.error}`);
      } else if (data.analysis) {
        setGapOutput(data.analysis);
      }
    }
    setLoadingAction(false);
  };

  // 10. Resume optimizations trigger
  const fetchResumeAdvice = async () => {
    setLoadingAction(true);
    setResumeAdvice("");
    const data = await fetchAIEndpoint("/api/ai/resume-helper");
    if (data) {
      if (data.error) {
        setResumeAdvice(`Error: Resume assistance failed.\nDetails: ${data.error}`);
      } else if (data.recommendations) {
        setResumeAdvice(data.recommendations);
      }
    }
    setLoadingAction(false);
  };

  // 11. Habit improvements trigger
  const fetchHabitAdvice = async () => {
    setLoadingAction(true);
    setHabitAdvice("");
    const data = await fetchAIEndpoint("/api/ai/habit-advisor");
    if (data) {
      if (data.error) {
        setHabitAdvice(`Error: Habit analysis failed.\nDetails: ${data.error}`);
      } else if (data.recommendations) {
        setHabitAdvice(data.recommendations);
      }
    }
    setLoadingAction(false);
  };

  // 12. Chapter study notes summarizer
  const summarizeChapterNotes = async () => {
    if (!selectedChapterId) return;
    setLoadingAction(true);
    setChapterSummaryOutput("");
    const data = await fetchAIEndpoint("/api/ai/study-notes", "POST", { chapterId: selectedChapterId });
    if (data) {
      if (data.error) {
        setChapterSummaryOutput(`Error: Summarizing chapter notes failed.\nDetails: ${data.error}`);
      } else if (data.notesSummary) {
        setChapterSummaryOutput(data.notesSummary);
      }
    }
    setLoadingAction(false);
  };

  // 13. Project stall reviewer
  const reviewProjectStall = async () => {
    if (!selectedProjectId) return;
    setLoadingAction(true);
    setProjectAuditOutput("");
    const data = await fetchAIEndpoint("/api/ai/project-reviewer", "POST", { projectId: selectedProjectId });
    if (data) {
      if (data.error) {
        setProjectAuditOutput(`Error: Project audit failed.\nDetails: ${data.error}`);
      } else if (data.review) {
        setProjectAuditOutput(data.review);
      }
    }
    setLoadingAction(false);
  };

  // 14. Natural language query backend search
  const triggerNaturalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoadingSearch(true);
    setSearchResults(null);
    const data = await fetchAIEndpoint("/api/ai/search", "POST", { query: searchQuery });
    if (data) {
      setSearchResults(data);
    }
    setLoadingSearch(false);
  };

  // --- ENTITY AUTO IMPORT PIPELINE ---
  const extractImportableData = (text: string) => {
    try {
      const match = text.match(/===IMPORTABLE_DATA===([\s\S]*?)===END===/);
      if (match && match[1]) {
        const payload = JSON.parse(match[1].trim());
        setImportableData(payload);
      }
    } catch (e) {
      console.warn("Could not extract JSON imports payload.", e);
    }
  };

  const handleImportPlan = async () => {
    if (!importableData) return;
    setLoadingAction(true);
    const data = await fetchAIEndpoint("/api/ai/import-entities", "POST", importableData);
    if (data && data.success) {
      triggerAlert(data.message || "Syllabus track imported successfully!");
      setImportableData(null);
      await syncData();
    }
    setLoadingAction(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6" id="ai-coach-dashboard-panel">
      
      {/* HEADER SUMMARY SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm leading-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Brain className="w-5 h-5 animate-pulse" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Qwen Docker AI Assistent & Coach
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Powered by locally simulated Qwen-2.5-1.5B-Instruct reasoning for intelligent career guidance.
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => { fetchDailySummary(true); fetchCoachReport(true); }}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 rounded-xl transition-all cursor-pointer border border-slate-100 dark:border-slate-750"
            title="Recalculate models metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(loadingCoach || loadingDaily) ? "animate-spin" : ""}`} /> Recalculate
          </button>
        </div>
      </div>

      {/* GLOBAL ALERTS BANNER */}
      {alertMsg && (
        <div className={`p-4 rounded-2xl flex items-center gap-2 text-xs font-semibold ${
          alertMsg.type === "success" 
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30"
            : "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/35"
        }`}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* PERSISTENT TAB NAVBAR */}
      <div className="flex overflow-x-auto gap-1 bg-slate-100/70 dark:bg-slate-950/40 p-1 rounded-2xl shrink-0 border border-slate-150/40 dark:border-slate-850/40">
        <button
          onClick={() => setActiveTab("coach")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === "coach"
              ? "bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> AI Coach & Summaries
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === "chat"
              ? "bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" /> Conversational Hub
        </button>
        <button
          onClick={() => setActiveTab("roadmaps")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === "roadmaps"
              ? "bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Roadmap & Projects
        </button>
        <button
          onClick={() => setActiveTab("interviews")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === "interviews"
              ? "bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          <Award className="w-3.5 h-3.5" /> Interview Prep
        </button>
        <button
          onClick={() => setActiveTab("gap")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === "gap"
              ? "bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Skill Gap Analyzer
        </button>
        <button
          onClick={() => setActiveTab("resumes")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === "resumes"
              ? "bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Resume & Habits
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === "notes"
              ? "bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Study Summaries
        </button>
      </div>

      {/* ==================== TAB 1: COACHING & REPORTS ==================== */}
      {activeTab === "coach" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* BENTO BLOCK A: DAILY AI SUMMARY */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800/80 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Daily AI Briefing
                  </h3>
                </div>
                {loadingDaily && <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />}
              </div>

              {dailySummary ? (
                <div className="prose prose-sm dark:prose-invert text-xs text-slate-750 dark:text-slate-300 leading-normal space-y-4 whitespace-pre-line">
                  {dailySummary}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No briefing compiled. Click Recalculate to generate.</p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800/60">
              <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">
                DAILY DISPATCH ENGREGATOR
              </span>
            </div>
          </div>

          {/* BENTO BLOCK B: PERSONALIZED AI COACH ADVICES */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between lg:col-span-2">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800/80 mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Personalized AI Coach Roadmap
                  </h3>
                </div>
                {loadingCoach && <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />}
              </div>

              {coachReport ? (
                <div className="prose prose-sm dark:prose-invert text-xs text-slate-750 dark:text-slate-300 leading-6 space-y-4 whitespace-pre-line">
                  {coachReport}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 italic space-y-3">
                  <p className="text-xs">Initial loading of your simulated Qwen-2.5 advisor recommendations...</p>
                  <button
                    onClick={fetchCoachReport}
                    className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    Click to generate report manually
                  </button>
                </div>
              )}
            </div>

            {/* QUICK ACTIONS ROW */}
            <div className="mt-8 pt-4 border-t border-slate-50 dark:border-slate-800/60 flex flex-wrap gap-2 justify-between items-center">
              <span className="text-[10px] font-mono font-bold text-indigo-500">
                MAPPED SYSTEM METRICS & VELOCITY CHANNELS ACTIVE
              </span>
              <button
                onClick={fetchCoachReport}
                className="text-xs font-bold px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer border border-slate-100 dark:border-slate-750"
              >
                Refresh Advisor Recommendations
              </button>
            </div>
          </div>

          {/* BENTO BLOCK C: PERIODIC PERFORMANCE REVIEWS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm lg:col-span-3 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800/80 gap-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  System Multi-Period Performances & Burnouts Reviews
                </h3>
              </div>
              <div className="flex gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-150/40 dark:border-slate-850/40">
                <button
                  onClick={() => fetchPeriodicReview("weekly")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    reviewMode === "weekly" ? "bg-white text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 shadow-xs" : "text-slate-500"
                  }`}
                >
                  Weekly Performance Review
                </button>
                <button
                  onClick={() => fetchPeriodicReview("monthly")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    reviewMode === "monthly" ? "bg-white text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 shadow-xs" : "text-slate-500"
                  }`}
                >
                  Monthly Narrative Review
                </button>
                <button
                  onClick={() => fetchPeriodicReview("burnout")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    reviewMode === "burnout" ? "bg-white text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 shadow-xs" : "text-slate-500"
                  }`}
                >
                  Burnout Insights
                </button>
              </div>
            </div>

            {loadingReview ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs text-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <p>Generating simulated Qwen-2.5 high-performance summary review...</p>
              </div>
            ) : reviewContent ? (
              <div className="prose prose-sm dark:prose-invert text-xs text-slate-755 dark:text-slate-300 leading-relaxed whitespace-pre-line p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-50 dark:border-slate-850">
                {reviewContent}
              </div>
            ) : (
              <div className="py-10 text-center text-slate-400 text-xs italic">
                <p>No active performance log requested yet. Select a review period above to generate.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: CHAT CONVERSTATION TERMINAL ==================== */}
      {activeTab === "chat" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800/80">
            <div className="space-y-0.5">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500 animate-bounce" /> Qwen Dialogue Terminal
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">INFERENCE PORT BOUND COCH-INTEGRATE ACTIVE</p>
            </div>
            {loadingAction && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
          </div>

          <div className="h-[430px] overflow-y-auto bg-slate-50 dark:bg-slate-950/40 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-900 space-y-4">
            {chatLog.map((chat, idx) => (
              <div key={idx} className={`flex gap-3 max-w-4xl ${chat.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-sm ${
                  chat.role === "user" ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600" : "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600"
                }`}>
                  {chat.role === "user" ? <User className="w-3.5 h-3.5" /> : <Brain className="w-3.5 h-3.5" />}
                </div>
                <div className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 max-w-2xl whitespace-pre-wrap ${
                  chat.role === "user" 
                    ? "bg-indigo-600 text-white rounded-tr-none" 
                    : "bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800"
                }`}>
                  {chat.text}
                </div>
              </div>
            ))}
            {loadingAction && (
              <div className="flex gap-3 max-w-lg mr-auto animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                  <Brain className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 text-slate-400 rounded-2xl rounded-tl-none text-xs italic border border-slate-100 dark:border-slate-800">
                  Qwen is reasoning from your database records...
                </div>
              </div>
            )}
          </div>

          {/* QUICK SUGGESTION PILLS */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            <span className="text-[10px] font-bold text-slate-400 pt-1">Try asking:</span>
            <button
              onClick={() => setChatInput("What should I focus on today?")}
              className="px-2.5 py-1 text-[10px] font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 rounded-lg cursor-pointer border border-slate-100 dark:border-slate-750"
            >
              "What should I focus on today?"
            </button>
            <button
              onClick={() => setChatInput("How can I improve my Kubernetes skills?")}
              className="px-2.5 py-1 text-[10px] font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 rounded-lg cursor-pointer border border-slate-100 dark:border-slate-750"
            >
              "How can I improve my Kubernetes skills?"
            </button>
            <button
              onClick={() => setChatInput("What habit is hurting my progress?")}
              className="px-2.5 py-1 text-[10px] font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 rounded-lg cursor-pointer border border-slate-100 dark:border-slate-750"
            >
              "What habit is hurting my progress?"
            </button>
            <button
              onClick={() => setChatInput("Which course should I complete first?")}
              className="px-2.5 py-1 text-[10px] font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 rounded-lg cursor-pointer border border-slate-100 dark:border-slate-750"
            >
              "Which course should I complete first?"
            </button>
          </div>

          {/* CHAT INPUT FIELD FORM */}
          <form onSubmit={submitChat} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Qwen about your study scores, syllabus structures, or burnout risks..."
              className="flex-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl text-xs border border-slate-150 dark:border-slate-850 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              disabled={loadingAction}
            />
            <button
              type="submit"
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
              disabled={loadingAction}
            >
              Send Chat
            </button>
          </form>
        </div>
      )}

      {/* ==================== TAB 3: ROADMAPS & PROJECTS ==================== */}
      {activeTab === "roadmaps" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* CONTROL SUITE PANEL */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-50 dark:border-slate-800">
                <Layers className="w-4 h-4 text-indigo-500" /> Career Roadmap Generator
              </h3>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 block uppercase">RECOMMENDED TRACK</label>
                <select
                  value={roadmapTrack}
                  onChange={(e) => setRoadmapTrack(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 text-xs text-slate-750 dark:text-slate-350"
                >
                  <option value="DevOps Engineer">DevOps Engineer Track</option>
                  <option value="Kubernetes Administrator">Kubernetes Administrator Track</option>
                  <option value="Platform Engineer">Platform Engineer Track</option>
                  <option value="Site Reliability Engineer">Site Reliability Engineer Track</option>
                </select>
              </div>

              <button
                onClick={generateRoadmap}
                disabled={loadingAction}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Compile Roadmap
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-50 dark:border-slate-800">
                <Sparkles className="w-4 h-4 text-indigo-500" /> Smart Study Planner
              </h3>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 block uppercase">STUDY TARGET OR TARGET SKILL</label>
                <input
                  type="text"
                  value={targetQuery}
                  onChange={(e) => setTargetQuery(e.target.value)}
                  placeholder="e.g. AWS Solutions Architect, Terraform Basics..."
                  className="w-full bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 text-xs text-slate-900 dark:text-slate-200"
                />
              </div>

              <button
                onClick={generateGoalPlan}
                disabled={loadingAction || !targetQuery.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-40"
              >
                Assemble Study Plan
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-50 dark:border-slate-800">
                <Layers className="w-4 h-4 text-indigo-500" /> AI Project Ideas Generator
              </h3>
              <p className="text-[10px] text-slate-400 leading-normal">
                Generates hands-on project ideas with targets matching your active, declared career goals.
              </p>
              <button
                onClick={generateProjects}
                disabled={loadingAction}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Generate Custom Project
              </button>
            </div>
          </div>

          {/* ROADMAP OUTPUT INTERSECTION */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[480px] flex flex-col justify-between">
              
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800/80 mb-4">
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Generated Roadmap Output Channel
                  </h3>
                  {loadingAction && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                </div>

                {generatedPlan ? (
                  <div className="prose prose-sm dark:prose-invert text-xs text-slate-755 dark:text-slate-300 leading-6 space-y-4 whitespace-pre-wrap">
                    {/* Filter out JSON blocks for pristine visual presentation */}
                    {generatedPlan.split("===IMPORTABLE_DATA===")[0]}
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400 text-xs italic space-y-2">
                    <Brain className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p>Select DevOps track or write an AWS planner topic to build high-level milestone matrices.</p>
                  </div>
                )}
              </div>

              {/* IMPORT PAYLOAD BUTTON PANEL */}
              {importableData && (
                <div className="mt-8 p-5 bg-indigo-50/50 dark:bg-slate-950/40 border border-indigo-100/50 dark:border-slate-850 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 animate-scaleUp">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Action Plan Ready for Integration
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Importing will automatically map goals, mock exercises, and target skills into your Console.
                    </p>
                  </div>
                  <button
                    onClick={handleImportPlan}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer self-start sm:self-center shrink-0"
                    disabled={loadingAction}
                  >
                    <Import className="w-3.5 h-3.5" /> Auto-Import into Console
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: MOCK INTERVIEWS PREP ==================== */}
      {activeTab === "interviews" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800/80 gap-4">
            <div className="space-y-0.5">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-500" /> AI Mock Interview Board
              </h3>
              <p className="text-[10px] text-slate-400 font-mono text-left">MAPS REAL EXERCISES AS TASK CARDS ON CONSOLE</p>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={selectedSkillForInterview}
                onChange={(e) => setSelectedSkillForInterview(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl text-xs text-slate-750 dark:text-slate-350 border border-slate-150 dark:border-slate-850"
              >
                {skills.length > 0 ? (
                  skills.map((s) => (
                    <option key={s.id} value={s.skillName}>{s.skillName}</option>
                  ))
                ) : (
                  <option value="">No Active Skills Found</option>
                )}
              </select>
              
              <button
                onClick={generateMockInterview}
                disabled={loadingAction || !selectedSkillForInterview}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Compile Flashcards
              </button>
            </div>
          </div>

          {interviewOutput ? (
            <div className="space-y-6">
              <div className="prose prose-sm dark:prose-invert text-xs text-slate-755 dark:text-slate-300 leading-6 space-y-4 whitespace-pro-wrap p-5 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-50 dark:border-slate-850">
                {interviewOutput.split("===IMPORTABLE_DATA===")[0]}
              </div>

              {importableData && (
                <div className="p-4 bg-indigo-50/50 dark:bg-slate-950/40 border border-indigo-100/50 dark:border-slate-850 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Save Questions as Actionable Study Tasks</h4>
                    <p className="text-[10px] text-slate-550">
                      Adds these beginner, intermediate, and advanced questions as tasks inside active goals.
                    </p>
                  </div>
                  <button
                    onClick={handleImportPlan}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer self-start sm:self-center shrink-0"
                    disabled={loadingAction}
                  >
                    <Import className="w-3.5 h-3.5" /> Save Questions as Tasks
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs italic space-y-2">
              <HelpCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>Choose any confidence progress skill above and generate structural mock interview checkpoints.</p>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 5: SKILL GAP ANALYZER ==================== */}
      {activeTab === "gap" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800/80 gap-4">
            <div className="space-y-0.5">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500 animate-pulse" /> Skill Gap & Career Comparer
              </h3>
              <p className="text-[10px] text-slate-400 font-mono text-left">TARGET DESIRED PROFESSIONAL ROLE WITH SYLLABUS DIRECTIVES</p>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={desiredRole}
                onChange={(e) => setDesiredRole(e.target.value)}
                placeholder="Target Role (e.g. Lead SRE)"
                className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl text-xs text-slate-900 dark:text-slate-200 border border-slate-150 dark:border-slate-850"
              />
              <button
                onClick={runSkillGapAnalysis}
                disabled={loadingAction || !desiredRole.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Scan Skill Gap
              </button>
            </div>
          </div>

          {gapOutput ? (
            <div className="prose prose-sm dark:prose-invert text-xs text-slate-755 dark:text-slate-300 leading-relaxed whitespace-pre-wrap p-5 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-50 dark:border-slate-850">
              {gapOutput}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs italic space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300 mb-2 animate-bounce" />
              <p>Submit your desired career role to trigger market-benchmarking difference filters.</p>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 6: RESUME & HABITS ADVISOR ==================== */}
      {activeTab === "resumes" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          
          {/* ASSISTANT CARD A: RECRUITER RESUME REVIEWER */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800/80 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Resume Preparation optimization Assistant
                  </h3>
                </div>
                {loadingAction && <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />}
              </div>

              {resumeAdvice ? (
                <div className="prose prose-sm dark:prose-invert text-xs text-slate-750 dark:text-slate-300 leading-6 space-y-3 whitespace-pre-line">
                  {resumeAdvice}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs italic space-y-3">
                  <p>Check quantifiable descriptors generated from your finalized portfolio projects.</p>
                  <button
                    onClick={fetchResumeAdvice}
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Click to review resume suggestions
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-50 dark:border-slate-800/60 flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase">SUGGESTIONS ONLY — ABSOLUTE SECURE LOGS</span>
              {resumeAdvice && (
                <button
                  onClick={fetchResumeAdvice}
                  className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Recalculate advice
                </button>
              )}
            </div>
          </div>

          {/* ASSISTANT CARD B: HABIT IMPROVEMENT ROUTINE CHECKER */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800/80 mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    AI Habit Improvement Advisor
                  </h3>
                </div>
                {loadingAction && <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />}
              </div>

              {habitAdvice ? (
                <div className="prose prose-sm dark:prose-invert text-xs text-slate-750 dark:text-slate-300 leading-6 space-y-3 whitespace-pre-line">
                  {habitAdvice}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs italic space-y-3">
                  <p>Optimize your habit completion routines using study logs failure risks indicators patterns.</p>
                  <button
                    onClick={fetchHabitAdvice}
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Load habit advise suggestions
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-50 dark:border-slate-800/60 flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase">ROUTINE ANALYSIS FREQUENCIES ENABLED</span>
              {habitAdvice && (
                <button
                  onClick={fetchHabitAdvice}
                  className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Rerun analyses
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 7: STUDY SUMMARIES & NOTES SYSTEM ==================== */}
      {activeTab === "notes" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          
          {/* ASSISTANT TASK A: CHAPTER GOOGLE DOCS SUMMARIZER */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800/80 mb-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" /> Chapter Study Notes Assistant
                </h3>
                <p className="text-[10px] text-slate-400 leading-normal">COMPOSES PORTABLE SUMMARIES FROM GOOGLE DOCS LINKS</p>
              </div>
              {loadingAction && <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />}
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 block uppercase">SELECT COURSE CHAPTER</label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 text-xs text-slate-750 dark:text-slate-350 focus:outline-none"
                >
                  {chapters.length > 0 ? (
                    chapters.map((ch) => (
                      <option key={ch.id} value={ch.id}>{ch.chapterName} ({courses.find(c => c.id === ch.courseId)?.courseName || "General Course"})</option>
                    ))
                  ) : (
                    <option value="">No Active Study Chapters Logged</option>
                  )}
                </select>
              </div>

              <button
                onClick={summarizeChapterNotes}
                disabled={loadingAction || !selectedChapterId}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-40"
              >
                Summarize & Build Exam Quiz
              </button>
            </div>

            {chapterSummaryOutput && (
              <div className="prose prose-sm dark:prose-invert text-xs text-slate-755 dark:text-slate-300 leading-6 space-y-4 whitespace-pre-wrap p-5 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-50 dark:border-slate-850 max-h-[380px] overflow-y-auto">
                {chapterSummaryOutput}
              </div>
            )}
          </div>

          {/* ASSISTANT TASK B: PROJECTS AUDITOR & REVIEW BLOCK */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800/80 mb-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" /> AI Project Review Assistant
                </h3>
                <p className="text-[10px] text-slate-400 leading-normal font-mono">MONITORS STALLED CODE PROJECTS & COMMITS</p>
              </div>
              {loadingAction && <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />}
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 block uppercase">SELECT CODE REPO PROJECT</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 text-xs text-slate-750 dark:text-slate-350 focus:outline-none"
                >
                  {projects.length > 0 ? (
                    projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title} ({p.status})</option>
                    ))
                  ) : (
                    <option value="">No Active Projects Logged</option>
                  )}
                </select>
              </div>

              <button
                onClick={reviewProjectStall}
                disabled={loadingAction || !selectedProjectId}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-40"
              >
                Audit Project Staleness
              </button>
            </div>

            {projectAuditOutput && (
              <div className="prose prose-sm dark:prose-invert text-xs text-slate-755 dark:text-slate-300 leading-6 space-y-4 whitespace-pre-wrap p-5 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-50 dark:border-slate-850 max-h-[380px] overflow-y-auto">
                {projectAuditOutput}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PERSISTENT BENTO SECTION AT BOTTOM: NATURAL LANGUAGE SEARCH */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="space-y-1 border-b border-slate-50 dark:border-slate-800/80 pb-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 font-display">
            <Search className="w-4 h-4 text-indigo-500" /> AI-Powered Natural Language Search Engine
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Search your complete workspace using natural queries (e.g. "Which skills are below confidence level 3?" or "Show tasks overdue this week")
          </p>
        </div>

        <form onSubmit={triggerNaturalSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g. Show courses I have not worked on recently... or Show weak skills..."
            className="flex-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl text-xs border border-slate-150 dark:border-slate-850 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 bg-indigo-600 shadow-sm"
            disabled={loadingSearch}
          >
            {loadingSearch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SearchCode className="w-3.5 h-3.5" />} Search Database
          </button>
        </form>

        {/* QUICK SEARCH PILOT GUIDES */}
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="text-slate-400 font-semibold pt-1">Try:</span>
          <button
            onClick={() => setSearchQuery("Show tasks overdue this week")}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 rounded-lg cursor-pointer hover:bg-slate-150"
          >
            "Show tasks overdue this week"
          </button>
          <button
            onClick={() => setSearchQuery("Which skills are below confidence level 3?")}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 rounded-lg cursor-pointer hover:bg-slate-150"
          >
            "Which skills are below confidence level 3?"
          </button>
          <button
            onClick={() => setSearchQuery("Show courses I have not worked on recently")}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 rounded-lg cursor-pointer hover:bg-slate-150"
          >
            "Show courses I have not worked on recently"
          </button>
        </div>

        {searchResults && (
          <div className="mt-4 p-5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 animate-scaleUp">
            
            {searchResults.insightMatches && searchResults.insightMatches.map((m: string, i: number) => (
              <div key={i} className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-100/30">
                ⚡ {m}
              </div>
            ))}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* GOALS */}
              {searchResults.goals && searchResults.goals.length > 0 && (
                <div className="space-y-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-50 dark:border-slate-800 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1 border-b border-slate-50 pb-1.5 mb-2">
                    🎯 Goals Matches ({searchResults.goals.length})
                  </h4>
                  {searchResults.goals.map((g: any) => (
                    <div key={g.id} className="text-xs leading-normal">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{g.title}</div>
                      <div className="text-[10px] text-slate-400">{g.description}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* TASKS */}
              {searchResults.tasks && searchResults.tasks.length > 0 && (
                <div className="space-y-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-50 dark:border-slate-800 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1 border-b border-slate-50 pb-1.5 mb-2">
                    📋 Overdue Tasks ({searchResults.tasks.length})
                  </h4>
                  {searchResults.tasks.map((t: any) => (
                    <div key={t.id} className="text-xs flex justify-between items-center bg-slate-50/40 dark:bg-slate-950/20 p-1.5 rounded border border-slate-100">
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{t.title}</div>
                        <div className="text-[10px] text-rose-500">Slipped past: {t.dueDate}</div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-50 px-1.5 rounded">{t.priority}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* SKILLS */}
              {searchResults.skills && searchResults.skills.length > 0 && (
                <div className="space-y-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-50 dark:border-slate-800 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1 border-b border-slate-50 pb-1.5 mb-2">
                    💪 Slow/Unconfident Skills ({searchResults.skills.length})
                  </h4>
                  {searchResults.skills.map((s: any) => (
                    <div key={s.id} className="text-xs flex justify-between items-center">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{s.skillName}</span>
                      <span className="text-[10px] font-mono leading-none px-2 py-0.5 bg-amber-50 text-amber-700 font-bold border border-amber-100">Confidence: {s.confidenceLevel}/5</span>
                    </div>
                  ))}
                </div>
              )}

              {/* COURSES */}
              {searchResults.courses && searchResults.courses.length > 0 && (
                <div className="space-y-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-50 dark:border-slate-800 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1 border-b border-slate-50 pb-1.5 mb-2">
                    🎓 Highlighted Course / Platforms ({searchResults.courses.length})
                  </h4>
                  {searchResults.courses.map((c: any) => (
                    <div key={c.id} className="text-xs flex justify-between items-center">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{c.courseName}</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 rounded font-bold">{c.progressPercentage}% Done</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {Object.values(searchResults).every(arr => !Array.isArray(arr) || arr.length === 0) && (
              <div className="text-center py-6 text-slate-400 italic text-xs">
                No active entities (goals, tasks, skills, habits) matched this natural language query directly.
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
