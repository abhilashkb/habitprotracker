import React, { useState, useEffect } from "react";
import { User, Goal, GoalTask, Skill, Course, Chapter, Project, ProjectTask, DailyTask, Activity, Quote, InsightsData } from "./types";
import ActivityHeatmap from "./components/ActivityHeatmap";
import DailyQuotes from "./components/DailyQuotes";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import GoalConsole from "./components/GoalConsole";
import ProjectBoard from "./components/ProjectBoard";
import DailiesPlanner from "./components/DailiesPlanner";
import NotificationsCenter from "./components/NotificationsCenter";
import InsightsDashboard from "./components/InsightsDashboard";
import AICoachPanel from "./components/AICoachPanel";
import {
  Flame,
  Target,
  Code2,
  GraduationCap,
  Sparkles,
  BarChart4,
  LogOut,
  User as UserIcon,
  Search,
  SlidersHorizontal,
  FolderSync,
  Compass,
  FileCode,
  Lock,
  Loader2,
  KeyRound,
  CheckCircle,
  Eye,
  Menu,
  X,
  Bookmark,
  Brain
} from "lucide-react";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("gt_token"));
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiLoading, setApiLoading] = useState(false);

  // Core system states
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<GoalTask[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [dailies, setDailies] = useState<DailyTask[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [insights, setInsights] = useState<InsightsData | null>(null);

  // Navigation state
  const [currentScreen, setCurrentScreen] = useState<"dashboard" | "goals" | "projects" | "habits" | "search" | "insights" | "ai-coach">("dashboard");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication states
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Search & Filters parameters
  const [globalSearchToken, setGlobalSearchToken] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");

  // Profile Edit
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    avatar: "",
    timezone: "",
    preferredReminderTime: "",
  });

  // Base API configuration fetch helper
  const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as object) || {}),
    };

    const res = await fetch(endpoint, { ...options, headers });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw { status: res.status, error: data.error || "An API operation error occurred" };
    }
    return res.json();
  };

  // Sync / pull all database packages from backend
  const syncApplicationData = async () => {
    if (!token) return;
    setApiLoading(true);
    try {
      // Load user profile
      const userProfile = await apiFetch("/api/auth/profile");
      setActiveUser(userProfile);
      setProfileForm({
        name: userProfile.name,
        avatar: userProfile.avatar,
        timezone: userProfile.timezone,
        preferredReminderTime: userProfile.preferredReminderTime,
      });

      // Retrieve collections concurrently
      const [
        goalsRes,
        projectsRes,
        ptasksRes,
        dailiesRes,
        activitiesRes,
        quotesRes,
        insightsRes,
      ] = await Promise.all([
        apiFetch("/api/goals"),
        apiFetch("/api/projects"),
        apiFetch("/api/projects/all_tasks").catch(() => []), // fallback wrapper
        apiFetch("/api/dailies"),
        apiFetch("/api/activities"),
        apiFetch("/api/quotes"),
        apiFetch("/api/insights").catch(() => null),
      ]);

      setGoals(goalsRes);
      setProjects(projectsRes);
      setDailies(dailiesRes);
      setActivities(activitiesRes);
      setQuotes(quotesRes);
      setInsights(insightsRes);

      // Cascade fetch linked details (tasks, skills, courses, chapters) for all goals
      const allTasks: GoalTask[] = [];
      const allSkills: Skill[] = [];
      const allCourses: Course[] = [];
      const allChapters: Chapter[] = [];

      await Promise.all(
        goalsRes.map(async (g: Goal) => {
          const [gt, sk, co] = await Promise.all([
            apiFetch(`/api/goals/${g.id}/tasks`),
            apiFetch(`/api/goals/${g.id}/skills`),
            apiFetch(`/api/goals/${g.id}/courses`),
          ]);
          allTasks.push(...gt);
          allSkills.push(...sk);
          allCourses.push(...co);

          // Fetch chapters for these courses
          await Promise.all(
            co.map(async (c: Course) => {
              const ch = await apiFetch(`/api/courses/${c.id}/chapters`);
              allChapters.push(...ch);
            })
          );
        })
      );

      setTasks(allTasks);
      setSkills(allSkills);
      setCourses(allCourses);
      setChapters(allChapters);

      // Fetch linked project subtasks
      const allProjectTasks: ProjectTask[] = [];
      await Promise.all(
        projectsRes.map(async (p: Project) => {
          const pt = await apiFetch(`/api/projects/${p.id}/tasks`);
          allProjectTasks.push(...pt);
        })
      );
      setProjectTasks(allProjectTasks);

    } catch (err) {
      console.error("Critical syncing error:", err);
    } finally {
      setApiLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      syncApplicationData();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Auth commands
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        const res = await apiFetch("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email: authEmail,
            password: authPassword,
            name: authName,
          }),
        });
        localStorage.setItem("gt_token", res.token);
        setToken(res.token);
      } else {
        const res = await apiFetch("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: authEmail,
            password: authPassword,
          }),
        });
        localStorage.setItem("gt_token", res.token);
        setToken(res.token);
      }
    } catch (err: any) {
      setAuthError(err.error || "Authentication failed.");
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "demo@goaltracker.com",
          password: "password",
        }),
      });
      localStorage.setItem("gt_token", res.token);
      setToken(res.token);
    } catch (err: any) {
      setAuthError("Failed to auto boot demo user: " + (err.error || ""));
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}
    localStorage.removeItem("gt_token");
    setToken(null);
    setActiveUser(null);
    setGoals([]);
    setTasks([]);
    setSkills([]);
    setCourses([]);
    setChapters([]);
    setProjects([]);
    setProjectTasks([]);
    setDailies([]);
    setActivities([]);
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(profileForm),
      });
      setActiveUser(res.user);
      setShowProfileModal(false);
    } catch (err: any) {
      alert("Error updating profile settings: " + err.error);
    }
  };

  // --- DATA ACTIONS API PASS-THROUGHS WITH LOCAL AUTO SYNC ---

  // Goals
  const handleAddGoal = async (gForm: Partial<Goal>) => {
    const fresh = await apiFetch("/api/goals", {
      method: "POST",
      body: JSON.stringify(gForm),
    });
    setGoals((prev) => [...prev, fresh]);
    await syncApplicationData();
  };

  const handleUpdateGoal = async (id: string, gForm: Partial<Goal>) => {
    const updated = await apiFetch(`/api/goals/${id}`, {
      method: "PUT",
      body: JSON.stringify(gForm),
    });
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    await syncApplicationData();
  };

  const handleDeleteGoal = async (id: string) => {
    await apiFetch(`/api/goals/${id}`, { method: "DELETE" });
    setGoals((prev) => prev.filter((g) => g.id !== id));
    await syncApplicationData();
  };

  // Checklist Tasks
  const handleAddTask = async (goalId: string, tForm: Partial<GoalTask>) => {
    const fresh = await apiFetch(`/api/goals/${goalId}/tasks`, {
      method: "POST",
      body: JSON.stringify(tForm),
    });
    setTasks((prev) => [...prev, fresh]);
    await syncApplicationData();
  };

  const handleUpdateTask = async (id: string, tForm: Partial<GoalTask>) => {
    const updated = await apiFetch(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(tForm),
    });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    await syncApplicationData();
  };

  const handleDeleteTask = async (id: string) => {
    await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await syncApplicationData();
  };

  const handleToggleCompleteTask = async (id: string) => {
    const res = await apiFetch(`/api/tasks/${id}/toggle_complete`, { method: "POST" });
    setTasks((prev) => prev.map((t) => (t.id === id ? res : t)));
    await syncApplicationData();
  };

  const handleToggleInProgressTask = async (id: string) => {
    const res = await apiFetch(`/api/tasks/${id}/toggle_inprogress`, { method: "POST" });
    setTasks((prev) => prev.map((t) => (t.id === id ? res : t)));
    await syncApplicationData();
  };

  // Skills
  const handleAddSkill = async (goalId: string, sForm: Partial<Skill>) => {
    const fresh = await apiFetch(`/api/goals/${goalId}/skills`, {
      method: "POST",
      body: JSON.stringify(sForm),
    });
    setSkills((prev) => [...prev, fresh]);
    await syncApplicationData();
  };

  const handleUpdateSkill = async (id: string, sForm: Partial<Skill>) => {
    const updated = await apiFetch(`/api/skills/${id}`, {
      method: "PUT",
      body: JSON.stringify(sForm),
    });
    setSkills((prev) => prev.map((s) => (s.id === id ? updated : s)));
    await syncApplicationData();
  };

  const handleDeleteSkill = async (id: string) => {
    await apiFetch(`/api/skills/${id}`, { method: "DELETE" });
    setSkills((prev) => prev.filter((s) => s.id !== id));
    await syncApplicationData();
  };

  // Courses & Chapters
  const handleAddCourse = async (goalId: string, cForm: Partial<Course>) => {
    const fresh = await apiFetch(`/api/goals/${goalId}/courses`, {
      method: "POST",
      body: JSON.stringify(cForm),
    });
    setCourses((prev) => [...prev, fresh]);
    await syncApplicationData();
  };

  const handleUpdateCourse = async (id: string, cForm: Partial<Course>) => {
    const updated = await apiFetch(`/api/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(cForm),
    });
    setCourses((prev) => prev.map((c) => (c.id === id ? updated : c)));
    await syncApplicationData();
  };

  const handleDeleteCourse = async (id: string) => {
    await apiFetch(`/api/courses/${id}`, { method: "DELETE" });
    setCourses((prev) => prev.filter((c) => c.id !== id));
    await syncApplicationData();
  };

  const handleTogglePauseCourse = async (id: string) => {
    const res = await apiFetch(`/api/courses/${id}/toggle_pause`, { method: "POST" });
    setCourses((prev) => prev.map((c) => (c.id === id ? res : c)));
    await syncApplicationData();
  };

  const handleAddChapter = async (courseId: string, chapForm: Partial<Chapter>) => {
    const fresh = await apiFetch(`/api/courses/${courseId}/chapters`, {
      method: "POST",
      body: JSON.stringify(chapForm),
    });
    setChapters((prev) => [...prev, fresh]);
    await syncApplicationData();
  };

  const handleUpdateChapter = async (id: string, chapForm: Partial<Chapter>) => {
    const updated = await apiFetch(`/api/chapters/${id}`, {
      method: "PUT",
      body: JSON.stringify(chapForm),
    });
    setChapters((prev) => prev.map((chap) => (chap.id === id ? updated : chap)));
    await syncApplicationData();
  };

  const handleDeleteChapter = async (id: string) => {
    await apiFetch(`/api/chapters/${id}`, { method: "DELETE" });
    setChapters((prev) => prev.filter((chap) => chap.id !== id));
    await syncApplicationData();
  };

  // Projects & Tasks
  const handleAddProject = async (pForm: Partial<Project>) => {
    const fresh = await apiFetch("/api/projects", {
      method: "POST",
      body: JSON.stringify(pForm),
    });
    setProjects((prev) => [...prev, fresh]);
    await syncApplicationData();
  };

  const handleUpdateProject = async (id: string, pForm: Partial<Project>) => {
    const updated = await apiFetch(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(pForm),
    });
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    await syncApplicationData();
  };

  const handleDeleteProject = async (id: string) => {
    await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p.id !== id));
    await syncApplicationData();
  };

  const handleAddProjectTask = async (projectId: string, ptForm: Partial<ProjectTask>) => {
    const fresh = await apiFetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(ptForm),
    });
    setProjectTasks((prev) => [...prev, fresh]);
    await syncApplicationData();
  };

  const handleUpdateProjectTask = async (id: string, ptForm: Partial<ProjectTask>) => {
    const updated = await apiFetch(`/api/project-tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(ptForm),
    });
    setProjectTasks((prev) => prev.map((pt) => (pt.id === id ? updated : pt)));
    await syncApplicationData();
  };

  const handleDeleteProjectTask = async (id: string) => {
    await apiFetch(`/api/project-tasks/${id}`, { method: "DELETE" });
    setProjectTasks((prev) => prev.filter((pt) => pt.id !== id));
    await syncApplicationData();
  };

  // Habit routines
  const handleAddDaily = async (dForm: Partial<DailyTask>) => {
    const fresh = await apiFetch("/api/dailies", {
      method: "POST",
      body: JSON.stringify(dForm),
    });
    setDailies((prev) => [...prev, fresh]);
    await syncApplicationData();
  };

  const handleDeleteDaily = async (id: string) => {
    await apiFetch(`/api/dailies/${id}`, { method: "DELETE" });
    setDailies((prev) => prev.filter((d) => d.id !== id));
    await syncApplicationData();
  };

  const handleCompleteDaily = async (id: string) => {
    const updated = await apiFetch(`/api/dailies/${id}/complete`, { method: "POST" });
    setDailies((prev) => prev.map((d) => (d.id === id ? updated : d)));
    await syncApplicationData();
  };

  const handleMissDaily = async (id: string) => {
    const updated = await apiFetch(`/api/dailies/${id}/miss`, { method: "POST" });
    setDailies((prev) => prev.map((d) => (d.id === id ? updated : d)));
    await syncApplicationData();
  };

  const handleResetDaily = async (id: string) => {
    const updated = await apiFetch(`/api/dailies/${id}/reset`, { method: "POST" });
    setDailies((prev) => prev.map((d) => (d.id === id ? updated : d)));
    await syncApplicationData();
  };

  const handleToggleQuoteFavorite = async (id: string) => {
    const res = await apiFetch(`/api/quotes/${id}/favorite`, { method: "POST" });
    // Toggle state locally
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isFavorite: res.isFavorite } : q))
    );
  };

  const handleRecalculateInsights = async () => {
    setApiLoading(true);
    try {
      const res = await apiFetch("/api/insights/recalculate", { method: "POST" });
      setInsights(res);
    } catch (err) {
      console.error("Failed to recalculate index:", err);
    } finally {
      setApiLoading(false);
    }
  };

  const handleLogMood = async (mood: "Motivated" | "Happy" | "Neutral" | "Stressed" | "Tired") => {
    setApiLoading(true);
    try {
      await apiFetch("/api/mood", {
        method: "POST",
        body: JSON.stringify({ mood }),
      });
      const fresh = await apiFetch("/api/insights");
      setInsights(fresh);
    } catch (err) {
      console.error("Failed to update daily mood:", err);
    } finally {
      setApiLoading(false);
    }
  };


  // --- COMPREHENSIVE SEARCH INDEX ENGINE MATCH DETAILS ---
  const getSearchedResults = () => {
    const query = globalSearchToken.toLowerCase().trim();
    if (!query) return [];

    const matches: { id: string; category: string; title: string; desc: string; linkScreen: "goals" | "projects" | "habits" }[] = [];

    // Goals Search
    goals.forEach((g) => {
      if (g.title.toLowerCase().includes(query) || g.description.toLowerCase().includes(query)) {
        matches.push({
          id: `match_g_${g.id}`,
          category: "Objective target",
          title: g.title,
          desc: `Deadline: ${g.targetDate || "N/A"} • Priority: ${g.priority}`,
          linkScreen: "goals",
        });
      }
    });

    // Checkpoints Tasks
    tasks.forEach((t) => {
      if (t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)) {
        matches.push({
          id: `match_t_${t.id}`,
          category: "Goal task checklist",
          title: t.title,
          desc: t.description || "In-progress task checklist item",
          linkScreen: "goals",
        });
      }
    });

    // Skills
    skills.forEach((s) => {
      if (s.skillName.toLowerCase().includes(query) || s.notes.toLowerCase().includes(query)) {
        matches.push({
          id: `match_s_${s.id}`,
          category: "Required competence",
          title: s.skillName,
          desc: `Level confidence: ${s.confidenceLevel}/5 • Status: ${s.status}`,
          linkScreen: "goals",
        });
      }
    });

    // Courses
    courses.forEach((c) => {
      if (c.courseName.toLowerCase().includes(query) || c.instructor.toLowerCase().includes(query)) {
        matches.push({
          id: `match_c_${c.id}`,
          category: "Course syllabus",
          title: c.courseName,
          desc: `Instructor: ${c.instructor} • Platform: ${c.platform} (${c.progressPercentage}% done)`,
          linkScreen: "goals",
        });
      }
    });

    // Chapters
    chapters.forEach((chap) => {
      if (chap.chapterName.toLowerCase().includes(query) || chap.description.toLowerCase().includes(query)) {
        matches.push({
          id: `match_ch_${chap.id}`,
          category: "Course chapter note",
          title: chap.chapterName,
          desc: chap.description || "Course level chapter details",
          linkScreen: "goals",
        });
      }
    });

    // Projects
    projects.forEach((p) => {
      if (p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)) {
        matches.push({
          id: `match_p_${p.id}`,
          category: "Hands-on Project",
          title: p.title,
          desc: p.description,
          linkScreen: "projects",
        });
      }
    });

    // Dailies Habits
    dailies.forEach((d) => {
      if (d.title.toLowerCase().includes(query) || d.description.toLowerCase().includes(query)) {
        matches.push({
          id: `match_d_${d.id}`,
          category: "Daily Habit Routine",
          title: d.title,
          desc: `Streak: ${d.streakCount} days • Scheduled: ${d.repeatType}`,
          linkScreen: "habits",
        });
      }
    });

    return matches;
  };

  const rawSearchResults = getSearchedResults();

  // Apply quick filters onto lists
  const filteredSearchResults = rawSearchResults.filter((item) => {
    // Basic filter overrides
    if (filterPriority !== "All" && !item.desc.toLowerCase().includes(filterPriority.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <h2 className="text-sm font-extrabold text-slate-800 font-display">Synchronizing GoalTracker engine...</h2>
          <p className="text-xs text-slate-400 mt-1">Downloading persistent cloud schemas & statistics diaries.</p>
        </div>
      </div>
    );
  }

  // Auth Guard
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        
        {/* Decorative dynamic vector designs */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-xl max-w-md w-full z-10 text-center animate-scaleUp">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-indigo-100">
            <Target className="w-6 h-6 animate-pulse" />
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display tracking-tight leading-tight">
            GoalTracker App
          </h1>
          <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
            PWA-enabled platform to track DevOps, SRE, systems learning progress and habits.
          </p>

          <form onSubmit={handleAuthSubmit} className="space-y-4 mt-6 text-left">
            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 font-medium">
                {authError}
              </div>
            )}

            {isRegistering && (
              <div>
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abhilash"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="e.g. info@goaltracker.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
            >
              {isRegistering ? "Register custom account" : "Enter Secure Console"}
            </button>
          </form>

          {/* Toggle registration */}
          <p className="text-[11px] text-slate-500 mt-4">
            {isRegistering ? (
              <>
                Already configured?{" "}
                <button onClick={() => setIsRegistering(false)} className="text-indigo-600 font-bold hover:underline">
                  Sign in
                </button>
              </>
            ) : (
              <>
                Need custom account?{" "}
                <button onClick={() => setIsRegistering(true)} className="text-indigo-600 font-bold hover:underline">
                  Sign up
                </button>
              </>
            )}
          </p>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <span className="relative bg-white px-2.5 text-[10px] font-mono text-slate-400 uppercase">OR EXPLORE DIRECTLY</span>
          </div>

          {/* Demo Login Button */}
          <button
            onClick={handleDemoLogin}
            className="w-full text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <KeyRound className="w-4 h-4 text-slate-500" />
            Explore with Demo Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col justify-between">
      
      {/* Dynamic Header container */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm">
              <Target className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-left select-none">
              <h1 className="text-sm font-extrabold text-slate-900 dark:text-white font-display uppercase tracking-wider">
                GoalTracker
              </h1>
              <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 block">
                INTERVIEW & SYLLABUS PANEL
              </span>
            </div>
          </div>

          {/* Responsive Desktop Navigator toolbar */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setCurrentScreen("dashboard")}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                currentScreen === "dashboard"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-800"
              }`}
            >
              <BarChart4 className="w-4 h-4" /> Dashboard
            </button>
            <button
              onClick={() => setCurrentScreen("goals")}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                currentScreen === "goals"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-800"
              }`}
            >
              <Target className="w-4 h-4" /> Goal Console
            </button>
            <button
              onClick={() => setCurrentScreen("projects")}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                currentScreen === "projects"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-800"
              }`}
            >
              <Code2 className="w-4 h-4" /> Code Projects
            </button>
            <button
              onClick={() => setCurrentScreen("habits")}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                currentScreen === "habits"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-800"
              }`}
            >
              <Flame className="w-4 h-4" /> Habit routines
            </button>
            <button
              onClick={() => setCurrentScreen("insights")}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                currentScreen === "insights"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-800"
              }`}
            >
              <Brain className="w-4 h-4" /> AI Insights
            </button>
            <button
              onClick={() => setCurrentScreen("ai-coach")}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                currentScreen === "ai-coach"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-800"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-550 animate-pulse" /> AI Coach Room
            </button>
            <button
              onClick={() => setCurrentScreen("search")}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                currentScreen === "search"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-800"
              }`}
            >
              <Search className="w-4 h-4" /> Search & Stats
            </button>
          </nav>

          {/* Profile metadata + notifications + Logouts */}
          <div className="flex items-center gap-2">
            
            {/* Auto sync status indicator */}
            {apiLoading && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0 hidden sm:inline" />}

            {/* Notifications center integrated with dynamic state items */}
            <NotificationsCenter goals={goals} tasks={tasks} courses={courses} dailies={dailies} />

            {/* Profile Avatar trigger */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 hover:scale-105 transition-all shadow-sm cursor-pointer"
              title="Click to view/edit user profile settings"
            >
              <img
                src={activeUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                alt="Profile avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 transition-all cursor-pointer"
              title="Log out securely from application session"
            >
              <LogOut className="w-5 h-5" />
            </button>

            {/* Mobile menu burger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1.5 animate-fadeIn">
            <button
              onClick={() => { setCurrentScreen("dashboard"); setMobileMenuOpen(false); }}
              className="text-xs font-bold p-3 rounded-lg text-left hover:bg-slate-50 flex items-center gap-2"
            >
              <BarChart4 className="w-4 h-4 text-slate-500" /> Dashboard
            </button>
            <button
              onClick={() => { setCurrentScreen("goals"); setMobileMenuOpen(false); }}
              className="text-xs font-bold p-3 rounded-lg text-left hover:bg-slate-50 flex items-center gap-2"
            >
              <Target className="w-4 h-4 text-slate-500" /> Goal Console
            </button>
            <button
              onClick={() => { setCurrentScreen("projects"); setMobileMenuOpen(false); }}
              className="text-xs font-bold p-3 rounded-lg text-left hover:bg-slate-50 flex items-center gap-2"
            >
              <Code2 className="w-4 h-4 text-slate-500" /> Code Projects
            </button>
            <button
              onClick={() => { setCurrentScreen("habits"); setMobileMenuOpen(false); }}
              className="text-xs font-bold p-3 rounded-lg text-left hover:bg-slate-50 flex items-center gap-2"
            >
              <Flame className="w-4 h-4 text-slate-500" /> Habit routines
            </button>
             <button
              onClick={() => { setCurrentScreen("insights"); setMobileMenuOpen(false); }}
              className="text-xs font-bold p-3 rounded-lg text-left hover:bg-slate-50 flex items-center gap-2"
            >
              <Brain className="w-4 h-4 text-slate-500" /> AI Insights
            </button>
            <button
              onClick={() => { setCurrentScreen("ai-coach"); setMobileMenuOpen(false); }}
              className="text-xs font-bold p-3 rounded-lg text-left hover:bg-slate-50 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> AI Coach Room
            </button>
            <button
              onClick={() => { setCurrentScreen("search"); setMobileMenuOpen(false); }}
              className="text-xs font-bold p-3 rounded-lg text-left hover:bg-slate-50 flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-slate-500" /> Search & Stats
            </button>
          </div>
        )}
      </header>

      {/* Main app body viewport window */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 flex-1 w-full relative">
        
        {/* PWA installed shell diagnostic bar */}
        <PWAInstallPrompt />

        {/* SCREEN 1: DASHBOARD HOME WIDGETS */}
        {currentScreen === "dashboard" && (
          <div className="space-y-6 animate-fadeIn" id="dashboard-layout">
            
            {/* Header profile welcome metrics */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/95 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 md:p-8 text-left shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-md transition-all duration-300">
              <div className="flex items-center gap-5 flex-1">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                  <img
                    src={activeUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                    alt="Active portrait"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white leading-normal font-display tracking-tight">
                    Welcome back, {activeUser?.name}!
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-2.5">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-350">{activeUser?.email}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span>Zone: <span className="font-mono text-slate-600 dark:text-slate-300">{activeUser?.timezone}</span></span>
                  </p>
                </div>
              </div>

              {/* Quick high level status numbers row */}
              <div className="grid grid-cols-3 gap-6 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-5 sm:pt-0 sm:pl-8 w-full sm:w-auto shrink-0">
                <div className="text-center sm:text-left select-none">
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider block">Active Goals</span>
                  <span className="text-base sm:text-lg font-extrabold text-indigo-600 dark:text-indigo-400 block font-mono mt-0.5">{goals.filter(g => g.status === "In Progress").length}</span>
                </div>
                <div className="text-center sm:text-left select-none">
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider block">Syllabus Courses</span>
                  <span className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 block font-mono mt-0.5">
                    {courses.filter(c => !c.pausedStatus && c.completedLessons < c.totalLessons).length}
                  </span>
                </div>
                <div className="text-center sm:text-left select-none">
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider block">Max Streak</span>
                  <span className="text-base sm:text-lg font-extrabold text-orange-600 block font-mono flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                    <Flame className="w-4 h-4 fill-orange-500 text-orange-600 animate-pulse" />
                    {Math.max(...dailies.map(d => d.streakCount || 0), 0)}d
                  </span>
                </div>
              </div>
            </div>

            {/* Quotes card slider */}
            <DailyQuotes quotes={quotes} onToggleFavorite={handleToggleQuoteFavorite} />

            {/* GitHub style calendar heatmap matrix */}
            <ActivityHeatmap activities={activities} />

            {/* Dynamic Dashboard widgets grid details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Widget 1: Goal Progress overview */}
              <div className="premium-card p-6 text-left flex flex-col justify-between min-h-[240px]">
                <div>
                  <h3 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4 select-none">
                    <span className="p-1 px-1.5 rounded-lg bg-indigo-50 dark:bg-slate-800 text-indigo-500">
                      <Target className="w-4 h-4" />
                    </span>
                    Interview Goal indices
                  </h3>

                  {goals.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic py-4">No targets declared yet. Visit goal console.</p>
                  ) : (
                    <div className="space-y-4 max-h-40 overflow-y-auto pr-1">
                      {goals.slice(0, 3).map((g) => (
                        <div key={g.id} className="text-xs">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{g.title}</span>
                            <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{g.progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-350" style={{ width: `${g.progressPercentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setCurrentScreen("goals")}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold self-start hover:text-indigo-700 hover:underline mt-4 cursor-pointer flex items-center gap-1 group"
                >
                  Adjust interview goals <span className="transform group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              </div>

              {/* Widget 2: Habit Streaks Consistency Widget */}
              <div className="premium-card p-6 text-left flex flex-col justify-between min-h-[240px]">
                <div>
                  <h3 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4 select-none">
                    <span className="p-1 px-1.5 rounded-lg bg-orange-50 dark:bg-slate-800 text-orange-500">
                      <Flame className="w-4 h-4" />
                    </span>
                    Routine Streak logs
                  </h3>

                  {dailies.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic py-4">No recurring habits declared. Visited habits console.</p>
                  ) : (
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                      {dailies.slice(0, 3).map((d) => (
                        <div key={d.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50/50 dark:bg-slate-850 border border-slate-100/50 dark:border-slate-800 text-xs transition-hover">
                          <span className="font-bold text-slate-750 dark:text-slate-200 truncate flex-1">{d.title}</span>
                          <div className="flex items-center gap-1 text-orange-600 font-mono font-bold shrink-0">
                            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-600" />
                            <span>{d.streakCount || 0}d</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setCurrentScreen("habits")}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold self-start hover:text-indigo-700 hover:underline mt-4 cursor-pointer flex items-center gap-1 group"
                >
                  Configure active streaks <span className="transform group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              </div>

              {/* Widget 3: SRE Readiness score metric calculation */}
              <div className="premium-card p-6 text-left flex flex-col justify-between min-h-[240px] md:col-span-2 lg:col-span-1">
                <div>
                  <h3 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4 select-none">
                    <span className="p-1 px-1.5 rounded-lg bg-amber-50 dark:bg-slate-800 text-amber-500">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    Skill Confidence levels
                  </h3>

                  {skills.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic py-4">Develop confidence levels inside the goals console.</p>
                  ) : (
                    <div className="space-y-3.5 max-h-40 overflow-y-auto pr-1">
                      {skills.slice(0, 3).map((s) => (
                        <div key={s.id} className="text-xs">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate">{s.skillName}</span>
                            <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">{s.confidenceLevel}/5</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, inX) => (
                              <div
                                key={inX}
                                className={`w-2.5 h-1.5 rounded-sm transition-all ${
                                  inX < s.confidenceLevel ? "bg-amber-400 dark:bg-amber-500 shadow-xs" : "bg-slate-200 dark:bg-slate-850"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setCurrentScreen("goals")}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold self-start hover:text-indigo-700 hover:underline mt-4 cursor-pointer flex items-center gap-1 group"
                >
                  Verify skills growth <span className="transform group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              </div>
            </div>

            {/* High-fidelity Visual SVG chart reports panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-visualizer-graphs">
              {/* Analytics 1: habit consistency dial */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl text-left flex flex-col sm:flex-row items-center gap-6 shadow-sm">
                <div className="relative w-36 h-36 shrink-0" id="habit-dial-gauge">
                  {/* Dynamic SVG radial progress ring */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="56" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                    <circle
                      cx="72"
                      cy="72"
                      r="56"
                      stroke="#6366f1"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray="351.8"
                      strokeDashoffset={
                        351.8 -
                        (351.8 *
                          (dailies.length > 0
                            ? Math.round(
                                (dailies.reduce((acc, current) => acc + (current.completedCount || 0), 0) /
                                  Math.max(
                                    dailies.reduce(
                                      (acc, current) => acc + (current.completedCount || 0) + (current.missedCount || 0),
                                      0
                                    ),
                                    1
                                  )) * 100
                              )
                            : 0)) /
                          100
                      }
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-extrabold text-slate-800 dark:text-white font-mono">
                      {dailies.length > 0
                        ? Math.round(
                            (dailies.reduce((acc, current) => acc + (current.completedCount || 0), 0) /
                              Math.max(
                                dailies.reduce(
                                  (acc, current) => acc + (current.completedCount || 0) + (current.missedCount || 0),
                                  0
                                ),
                                1
                              )) * 100
                          )
                        : 0}%
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Consistency</span>
                  </div>
                </div>

                <div className="text-left flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Discipline Score</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    This index represents completed occurrences vs scheduled target routines. Higher ratios safeguard streaks.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100/50">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Aggregate Done</span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block font-mono">
                        {dailies.reduce((acc, current) => acc + (current.completedCount || 0), 0)} checks
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100/50">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Aggregate Missed</span>
                      <span className="text-sm font-extrabold text-rose-600 block font-mono">
                        {dailies.reduce((acc, current) => acc + (current.missedCount || 0), 0)} missed
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics 2: Learning Timeline completion bar ranges */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl text-left shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-3">
                    <GraduationCap className="w-5 h-5 text-indigo-500" />
                    Syllabus Chapters Completion Rate
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-400">
                    Progress of completed lessons over multiple active courses.
                  </p>

                  <div className="space-y-3 mt-5">
                    {courses.slice(0, 3).map((c) => (
                      <div key={c.id}>
                        <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1">
                          <span className="truncate max-w-[240px] font-bold">{c.courseName}</span>
                          <span>{c.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full transition-all"
                            style={{ width: `${c.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {courses.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-4">No enrolled courses logged yet inside the database.</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3.5 mt-4 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>AGGREGATED STUDY ANALYTICS</span>
                  <span>UPDATED RECENTLY</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* SCREEN 2: GOALS & CHAPTERS ACTIONS CONSOLE */}
        {currentScreen === "goals" && (
          <div className="animate-fadeIn">
            <GoalConsole
              goals={goals}
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
              tasks={tasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onToggleCompleteTask={handleToggleCompleteTask}
              onToggleInProgressTask={handleToggleInProgressTask}
              skills={skills}
              onAddSkill={handleAddSkill}
              onUpdateSkill={handleUpdateSkill}
              onDeleteSkill={handleDeleteSkill}
              courses={courses}
              chapters={chapters}
              onAddCourse={handleAddCourse}
              onUpdateCourse={handleUpdateCourse}
              onDeleteCourse={handleDeleteCourse}
              onTogglePauseCourse={handleTogglePauseCourse}
              onAddChapter={handleAddChapter}
              onUpdateChapter={handleUpdateChapter}
              onDeleteChapter={handleDeleteChapter}
            />
          </div>
        )}

        {/* SCREEN 3: PROJECTS REPOSITORY BOARD */}
        {currentScreen === "projects" && (
          <div className="animate-fadeIn">
            <ProjectBoard
              projects={projects}
              onAddProject={handleAddProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              projectTasks={projectTasks}
              onAddProjectTask={handleAddProjectTask}
              onUpdateProjectTask={handleUpdateProjectTask}
              onDeleteProjectTask={handleDeleteProjectTask}
            />
          </div>
        )}

        {/* SCREEN 4: DAILY HABITS RECURRENCE ENGINE */}
        {currentScreen === "habits" && (
          <div className="animate-fadeIn">
            <DailiesPlanner
              dailies={dailies}
              onAddDaily={handleAddDaily}
              onDeleteDaily={handleDeleteDaily}
              onCompleteDaily={handleCompleteDaily}
              onMissDaily={handleMissDaily}
              onResetDaily={handleResetDaily}
            />
          </div>
        )}

        {/* SCREEN 5: SEARCH INDEX GLOBAL DIRECTORY */}
        {currentScreen === "search" && (
          <div className="space-y-6 text-left animate-fadeIn" id="search-console">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-50">
                Global Search Directory
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Lookup any goals, tasks, skill sets, courses, project repositories, or habit schedules instantly.
              </p>
            </div>

            {/* Input card with filters */}
            <div className="premium-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-left">
              <div className="flex flex-col md:flex-row items-center gap-4">
                
                {/* Search Input */}
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-450" />
                  <input
                    type="text"
                    placeholder="Search query across all modules..."
                    value={globalSearchToken}
                    onChange={(e) => setGlobalSearchToken(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 dark:bg-slate-850 dark:border-slate-800 rounded-xl pl-10 pr-12 py-3 text-xs font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none transition-all duration-150"
                  />
                  {globalSearchToken && (
                    <button
                      onClick={() => setGlobalSearchToken("")}
                      className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filters selection */}
                <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto shrink-0 pb-1 pt-1">
                  <div className="flex items-center gap-1 text-slate-400 text-xs font-mono">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Quick Filter:</span>
                  </div>
                  
                  {/* Priority selector */}
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="bg-slate-50 border border-slate-150 rounded-xl px-2.5 py-1.5 text-[11px] focus:outline-none"
                  >
                    <option value="All">All Priorities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Matching items display */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                Matched Directory Indexes ({filteredSearchResults.length})
              </h3>

              {globalSearchToken && filteredSearchResults.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 rounded-3xl p-10 text-center shadow-sm">
                  <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No objects match your search key query. Clear filters or verify typos.</p>
                </div>
              ) : !globalSearchToken ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-150 rounded-3xl p-10 text-center py-16 shadow-none">
                  <Search className="w-12 h-12 text-slate-350 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-xs text-slate-500">Please enter a search key query above to seek matching workspace variables.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredSearchResults.map((it) => (
                    <div
                      key={it.id}
                      onClick={() => setCurrentScreen(it.linkScreen)}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-left cursor-pointer hover:border-indigo-250 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-indigo-400">
                          {it.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Navigate →
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                        {it.title}
                      </h4>
                      <p className="text-[11px] text-slate-450 mt-1 lines-clamp-2 leading-relaxed">
                        {it.desc}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* SCREEN 6: PREDICTIVE ML INSIGHTS DASHBOARD */}
        {currentScreen === "insights" && (
          <div className="animate-fadeIn">
            <InsightsDashboard
              insights={insights}
              onRecalculate={handleRecalculateInsights}
              onLogMood={handleLogMood}
              isLoading={apiLoading}
              goals={goals}
              dailies={dailies}
              skills={skills}
              courses={courses}
              chapters={chapters}
              projects={projects}
            />
          </div>
        )}

        {/* SCREEN 7: QWEN AI COACH PANEL MODULE */}
        {currentScreen === "ai-coach" && (
          <div className="animate-fadeIn">
            <AICoachPanel
              token={token}
              goals={goals}
              tasks={tasks}
              skills={skills}
              courses={courses}
              chapters={chapters}
              projects={projects}
              projectTasks={projectTasks}
              dailies={dailies}
              syncData={syncApplicationData}
            />
          </div>
        )}

      </main>


      {/* Profile Edit Settings dialogmodal popup */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl w-full max-w-sm animate-scaleUp">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5 text-left">
                <UserIcon className="w-4 h-4 text-indigo-500" />
                Profile Settings
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-650 transition-colors cursor-pointer animate-fadeIn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-left">
              <div>
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">User Name *</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  value={profileForm.avatar}
                  onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Timezone</label>
                  <input
                    type="text"
                    value={profileForm.timezone}
                    onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Reminder Time</label>
                  <input
                    type="text"
                    placeholder="HH:MM"
                    value={profileForm.preferredReminderTime}
                    onChange={(e) => setProfileForm({ ...profileForm, preferredReminderTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl transition-all shadow-sm cursor-pointer mt-2"
              >
                Save Profile Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic responsive footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 px-4 py-4 sm:px-6 text-center text-[11px] font-mono text-slate-400 mt-6 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>GOALTRACKER INTERVIEW SYSTEM v1.3.1</span>
          <span>CURATED COMPLIANCE • OFFLINE ACTIVE</span>
        </div>
      </footer>

    </div>
  );
}
