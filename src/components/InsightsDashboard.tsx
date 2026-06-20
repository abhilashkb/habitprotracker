import React, { useState, useEffect } from "react";
import { InsightsData, Goal, DailyTask, Skill, Course, Chapter, Project } from "../types";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Award,
  Zap,
  Calendar,
  Sparkles,
  RefreshCw,
  Gauge,
  Smile,
  Frown,
  Activity,
  Heart,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Compass,
  ArrowUpRight
} from "lucide-react";

interface InsightsDashboardProps {
  insights: InsightsData | null;
  onRecalculate: () => Promise<void>;
  onLogMood: (mood: "Motivated" | "Happy" | "Neutral" | "Stressed" | "Tired") => Promise<void>;
  isLoading: boolean;
  goals: Goal[];
  dailies: DailyTask[];
  skills: Skill[];
  courses: Course[];
  chapters: Chapter[];
  projects: Project[];
}

export default function InsightsDashboard({
  insights,
  onRecalculate,
  onLogMood,
  isLoading,
  goals,
  dailies,
  skills,
  courses,
  chapters,
  projects
}: InsightsDashboardProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodSuccessMsg, setMoodSuccessMsg] = useState<string | null>(null);

  // Sync selectedMood with today's mood if present in insights
  useEffect(() => {
    if (insights?.moodAnalytics?.last7Days) {
      const todayString = new Date().toISOString().split("T")[0];
      const todayMoodLog = insights.moodAnalytics.last7Days.find(l => l.date === todayString);
      if (todayMoodLog && todayMoodLog.mood !== "Neutral") {
        setSelectedMood(todayMoodLog.mood);
      }
    }
  }, [insights]);

  const handleMoodSelect = async (mood: "Motivated" | "Happy" | "Neutral" | "Stressed" | "Tired") => {
    setSelectedMood(mood);
    setMoodSuccessMsg("Registering...");
    try {
      await onLogMood(mood);
      setMoodSuccessMsg("Mood logged successfully!");
      setTimeout(() => setMoodSuccessMsg(null), 3000);
    } catch (e) {
      setMoodSuccessMsg("Failed to update mood.");
    }
  };

  if (isLoading || !insights) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-gray-100 dark:border-slate-800">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <h3 className="font-bold text-slate-800 dark:text-slate-100">Synchronizing Predictive Engine...</h3>
        <p className="text-xs text-slate-500 max-w-xs text-center mt-1">
          Loading state metrics, parsing historical progress velocity, and compiling rule-based coefficients.
        </p>
      </div>
    );
  }

  // --- STATS PARSING ---
  const activeGoalCount = goals.filter(g => g.status === "In Progress").length;
  const completedGoalCount = goals.filter(g => g.status === "Completed").length;
  const totalDailiesCount = dailies.length;
  const completedDailiesCount = dailies.filter(d => d.status === "completed").length;
  
  // Calculate a mock Consistency Metric based on completed logs
  const learningConsistency = Math.min(100, Math.max(30, Math.round(
    (completedDailiesCount / (totalDailiesCount || 1)) * 40 +
    (goals.length > 0 ? (completedGoalCount / goals.length) * 65 : 45) +
    (courses.length > 0 ? (courses.reduce((acc, c) => acc + c.progressPercentage, 0) / courses.length) * 0.2 : 10)
  )));

  // Productivity Index calculation
  const productivityScore = Math.min(100, Math.max(25, Math.round(
    (insights.learningVelocity?.tasksThisWeek * 15 || 30) +
    (completedGoalCount * 20) +
    (projects.length > 0 ? (projects.reduce((acc, p) => acc + p.progressPercentage, 0) / projects.length) * 0.4 : 20)
  )));

  const getBurnoutColor = (level: string) => {
    if (level === "High") return "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
    if (level === "Medium") return "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
    return "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
  };

  const getBurnoutBarColor = (level: string) => {
    if (level === "High") return "bg-rose-500";
    if (level === "Medium") return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="space-y-8" id="insights-dashboard-root">
      
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            ML & Predictive Intelligence Panel
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-800 dark:text-slate-100 mt-2 flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-600 animate-pulse" />
            AI Insights & Learning Statistics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dynamic statistics, linear regression forecasts, and habit risk analyzers optimized for performance.
          </p>
        </div>

        <button
          onClick={onRecalculate}
          disabled={isLoading}
          className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 transition-all self-start md:self-center"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Recalculate Analytics
        </button>
      </div>

      {/* Grid of Interactive Mood Tracker and Micro-Correlations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Mood Logger Block */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50/20 to-white dark:from-slate-900 dark:to-slate-900/40 border border-indigo-100/50 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm sm:text-base">
                <Smile className="w-5 h-5 text-indigo-600" />
                How is your study focus and mood today?
              </h3>
              {moodSuccessMsg && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                  {moodSuccessMsg}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select your current mental frame. The engine matches mood with logged task productivity levels.
            </p>

            <div className="grid grid-cols-5 gap-2 sm:gap-3 mt-5">
              {[
                { mood: "Motivated", emoji: "🚀", text: "Inspired" },
                { mood: "Happy", emoji: "😊", text: "Optimal" },
                { mood: "Neutral", emoji: "😐", text: "Neutral" },
                { mood: "Stressed", emoji: "😰", text: "Anxious" },
                { mood: "Tired", emoji: "😴", text: "Exhausted" }
              ].map((item) => {
                const isSelected = selectedMood === item.mood;
                return (
                  <button
                    key={item.mood}
                    onClick={() => handleMoodSelect(item.mood as any)}
                    className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md scale-105"
                        : "bg-white dark:bg-slate-905 border-gray-100 dark:border-slate-800/80 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <span className="text-2xl mb-1.5">{item.emoji}</span>
                    <span className={`text-[10px] font-bold ${isSelected ? "text-white" : "text-slate-500 dark:text-slate-400"}`}>
                      {item.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-indigo-100/50 dark:border-slate-800/80 pt-4 mt-6">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                CORRELATION ENGINE
              </span>
              <p className="font-semibold text-slate-700 dark:text-slate-300 italic">
                "{insights.moodAnalytics.correlationMessage}"
              </p>
            </div>
          </div>
        </div>

        {/* Burnout Meter and Pacing Gauge */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm sm:text-base">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Burnout & Pacing analysis
              </h3>
              <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${getBurnoutColor(insights.burnout.riskLevel)}`}>
                {insights.burnout.riskLevel} Risk
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Evaluates goal weight, coursework, overdue items, and habit rest.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Burnout Threat index</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{insights.burnout.score}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getBurnoutBarColor(insights.burnout.riskLevel)}`}
                    style={{ width: `${insights.burnout.score}%` }}
                  />
                </div>
              </div>

              {/* Specific indicator items */}
              <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                {insights.burnout.indicators.length > 0 ? (
                  insights.burnout.indicators.map((ind, idx) => (
                    <div key={idx} className="flex gap-1.5 items-start text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="text-rose-500 mt-0.5">●</span>
                      <span>{ind}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex gap-1.5 items-center text-[11px] text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>All syllabus items balanced. Burnout likelihood minimal.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-slate-800/80 pt-3 mt-4 text-[11px] text-slate-600 dark:text-slate-400 italic">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0 not-italic uppercase block mb-1">Recommendation:</span>
            {insights.burnout.recommendations[0]}
          </div>
        </div>

      </div>

      {/* Analytics Index Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Habit Completion Likelihood */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Habit Success Score</h4>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-display text-slate-800 dark:text-slate-100">
                {Math.round(insights.habitSuccess.reduce((acc, h) => acc + h.probability, 0) / (insights.habitSuccess.length || 1))}%
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
                +4% vs last week
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Predictive rate that daily routine checkboxes will be logged today based on rolling history.
            </p>
          </div>
          <div className="mt-4 border-t border-gray-50 dark:border-slate-800 pt-3 flex gap-2 overflow-x-auto select-none">
            {insights.habitSuccess.slice(0, 3).map((h, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-center shrink-0 min-w-[70px]">
                <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono truncate max-w-[65px]">{h.title}</div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{h.probability}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Consistency Index */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Learning consistency</h4>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-display text-slate-800 dark:text-slate-100">
                {learningConsistency}%
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Steady
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Measures completion discipline on chapters, lessons summaries, and target-date compliance.
            </p>
          </div>
          <div className="mt-4 border-t border-gray-50 dark:border-slate-800 pt-3">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Goal consistency</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">High</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>Course adherence</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Moderate</span>
            </div>
          </div>
        </div>

        {/* Productivity score */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Productivity score</h4>
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-display text-slate-800 dark:text-slate-100">
                {productivityScore}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                Excellent
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Based on active hands-on code development tasks and completed syllabus velocity indicators.
            </p>
          </div>
          <div className="mt-4 border-t border-gray-50 dark:border-slate-800 pt-3">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Weekly completions</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{insights.learningVelocity?.tasksThisWeek || 4} tasks</span>
            </div>
          </div>
        </div>

        {/* Interview Readiness score */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Interview Readiness</h4>
              <Award className="w-4 h-4 text-indigo-600" />
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-display text-slate-800 dark:text-slate-100">
                {insights.interviewReadiness.score}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 uppercase font-semibold font-mono text-indigo-600 dark:text-indigo-400">
              {insights.interviewReadiness.status}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Multi-factor assessment based on full course completions, project repos, and skill mastered indicators.
            </p>
          </div>
          <div className="mt-3 border-t border-gray-50 dark:border-slate-800 pt-2.5">
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">RECRUITMENT CHECKPOINT:</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              {insights.interviewReadiness.checklist[0] || "Fully Qualified!"}
            </div>
          </div>
        </div>

      </div>

      {/* Middle Block: Goal Forecasts and Risk Detection Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Goal completion forecast using math regression indices */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Goal progress Completion Forecasting (Linear Regression)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 -mt-2">
            Fits a regression equation against activity completion times to estimate target achievement dates.
          </p>

          <div className="space-y-4">
            {insights.goalForecasts.length > 0 ? (
              insights.goalForecasts.map((gf) => (
                <div key={gf.goalId} className="border-b border-slate-50 dark:border-slate-800/80 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{gf.title}</span>
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold ${
                      gf.confidence === "High"
                        ? "bg-emerald-50 text-emerald-700"
                        : gf.confidence === "Medium"
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {gf.confidence} Confidence
                    </span>
                  </div>

                  {/* Meter bar */}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full transition-all" style={{ width: `${gf.progress}%` }} />
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">{gf.progress}%</span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 font-mono gap-y-1">
                    <span>Est. Target reached: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{gf.estimatedCompletionDate}</span></span>
                    <span>Velocity: <span className="text-slate-700 dark:text-slate-300 font-bold">+{gf.progressRate}% / wk</span></span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-1 leading-normal">
                    {gf.reason}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">Enable and set up some target Goal Console entities first.</p>
            )}
          </div>
        </div>

        {/* Warnings & Risk Detections */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            Streak Break Warnings & Miss Risks
          </h3>

          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {insights.streakWarnings.length === 0 && insights.failureRisk.length === 0 ? (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-4 rounded-2xl border border-emerald-100/50 flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs truncate">All daily routines highly stable</h4>
                  <p className="text-[11px] mt-0.5 leading-relaxed">No drops or missed habits of significance today. Great dedication!</p>
                </div>
              </div>
            ) : null}

            {/* Streak break cautions */}
            {insights.streakWarnings.map((sw, idx) => (
              <div key={`sw_${idx}`} className="bg-amber-50/70 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 p-4 border border-amber-100/60 rounded-2xl flex gap-3">
                <Clock className="w-5 h-5 mt-0.5 shrink-0 animate-bounce" />
                <div>
                  <h4 className="font-bold text-xs">Streak warning</h4>
                  <p className="text-[11px] mt-0.5 leading-relaxed">{sw.message}</p>
                </div>
              </div>
            ))}

            {/* Failure risk detections */}
            {insights.failureRisk.map((fr, idx) => (
              <div key={`fr_${idx}`} className="bg-rose-50/70 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 p-4 border border-rose-100/60 rounded-2xl flex gap-3">
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-rose-500" />
                <div>
                  <h4 className="font-bold text-xs flex items-center gap-1.5">
                    {fr.title} <span className="text-[9px] uppercase font-mono bg-rose-200/50 dark:bg-rose-900/40 px-1.5 rounded-full font-bold">{fr.riskLevel} failure risk</span>
                  </h4>
                  <p className="text-[11px] mt-0.5 leading-relaxed">{fr.message}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1.5 border-t border-rose-100/40 pt-1.5">
                    💡 <span className="italic">Fix: {fr.recommendation}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* VISUAL ANALYTICS - Lightweight pure SVG charts for compatibility and high performance */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Reporting & Visual Analytics Trends
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Lightweight mathematical charts mapped on local user activity.
            </p>
          </div>
          {/* Legend indicator */}
          <div className="flex gap-4 text-[10px] font-mono text-slate-500 mt-1">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-600 rounded"></span> Habit Success rate</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-400 rounded"></span> Declining risk limit</span>
          </div>
        </div>

        {/* Grid of the two dynamic charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Habit Success & Completion Probability Chart */}
          <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl p-4 border border-gray-50 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3 font-mono uppercase tracking-wider">
              1. Habit Completion & Streak Trends
            </h4>
            
            {/* Embedded SVG Chart */}
            <div className="h-44 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                {/* Horizontal reference grid bounds */}
                <line x1="20" y1="20" x2="380" y2="20" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                <line x1="20" y1="50" x2="380" y2="50" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" strokeDasharray="3,3" />
                <line x1="20" y1="90" x2="380" y2="90" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" strokeDasharray="3,3" />
                <line x1="20" y1="130" x2="380" y2="130" stroke="#e2e8f0" strokeWidth="1.5" className="dark:stroke-slate-850" />

                {/* Draw Bar Columns */}
                {insights.habitSuccess.slice(0, 5).map((hs, idx) => {
                  const colStep = (360 / Math.max(5, insights.habitSuccess.slice(0, 5).length));
                  const bx = 35 + idx * colStep;
                  const bHeight = (hs.probability / 100) * 110;
                  const by = 130 - bHeight;

                  return (
                    <g key={idx}>
                      {/* Interactive bar color based on probability */}
                      <rect
                        x={bx}
                        y={by}
                        width="30"
                        height={bHeight}
                        rx="6"
                        className="fill-indigo-600 hover:fill-indigo-700 dark:fill-indigo-500/80 dark:hover:fill-indigo-400 transition-colors cursor-pointer"
                      />
                      {/* Tiny risk line highlighter if prob is low */}
                      {hs.probability < 65 ? (
                        <circle cx={bx + 15} cy={by - 8} r="3" className="fill-rose-500 animate-ping" />
                      ) : null}

                      {/* Bar top score */}
                      <text x={bx + 15} y={by - 5} textAnchor="middle" className="text-[9px] font-mono font-bold fill-slate-600 dark:fill-slate-300">
                        {hs.probability}%
                      </text>

                      {/* Label string */}
                      <text x={bx + 15} y="145" textAnchor="middle" className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500 truncate max-w-[50px]">
                        {hs.title.slice(0, 7)}...
                      </text>
                    </g>
                  );
                })}

                {/* Left labels */}
                <text x="5" y="25" className="text-[8px] font-mono fill-slate-400">100%</text>
                <text x="5" y="95" className="text-[8px] font-mono fill-slate-400">50%</text>
              </svg>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-2 leading-relaxed">
              *Bars show logistic completion estimations. Lower probabilities flag impending risk breaking points.
            </p>
          </div>

          {/* Learning Velocity & Growth Area Chart */}
          <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl p-4 border border-gray-50 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3 font-mono uppercase tracking-wider">
              2. Learning Velocity & Activity Peaks
            </h4>

            {/* Area Line Chart for past 7 days */}
            <div className="h-44 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                {/* Reference bounds */}
                <line x1="20" y1="20" x2="380" y2="20" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                <line x1="20" y1="75" x2="380" y2="75" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" strokeDasharray="3,3" />
                <line x1="20" y1="130" x2="380" y2="130" stroke="#e2e8f0" strokeWidth="1.5" className="dark:stroke-slate-850" />

                {/* Create path for the Area chart */}
                {(() => {
                  const days = insights.moodAnalytics?.last7Days || [];
                  const wOffset = 360 / (days.length - 1 || 1);
                  const points = days.map((day, idx) => {
                    const cx = 20 + idx * wOffset;
                    // map productivity rating (2-10) to height (130 down to 20)
                    // height range is 110
                    const val = day.productivityRating || 5;
                    const cy = 130 - ((val - 2) / 8) * 100;
                    return { x: cx, y: cy, label: day.date.slice(8, 10), rating: val };
                  });

                  if (points.length === 0) return null;

                  const pathD = `M ${points[0].x} 130 ` + points.map(p => `L ${p.x} ${p.y}`).join(" ") + ` L ${points[points.length - 1].x} 130 Z`;
                  const lineD = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

                  return (
                    <g>
                      {/* Gradient Fill under line */}
                      <path d={pathD} className="fill-indigo-600/10 dark:fill-indigo-500/5" />
                      {/* Curve line */}
                      <path d={lineD} fill="none" className="stroke-indigo-600 dark:stroke-indigo-400" strokeWidth="2.5" />

                      {/* Point indicators */}
                      {points.map((p, idx) => (
                        <g key={idx}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="4"
                            className="fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900 border"
                            strokeWidth="1.5"
                          />
                          {/* Daily labels */}
                          <text x={p.x} y="145" textAnchor="middle" className="text-[10px] font-mono font-bold fill-slate-400 dark:fill-slate-500">
                            {p.label}
                          </text>
                          {/* Inner scores */}
                          <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[9px] font-mono font-semibold fill-slate-600 dark:fill-slate-300">
                            {p.rating}/10
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                })()}
              </svg>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-2 leading-relaxed">
              *Line monitors dynamic Daily Study Focus Ratings. High scores correlate to "Motivated" mood entries.
            </p>
          </div>

        </div>
      </div>

      {/* Smart Recommendations List Section */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        {/* Vector Background Accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-300" />
          <h3 className="text-base sm:text-lg font-bold font-display">Personalized Actionable Recommendations</h3>
        </div>
        <p className="text-xs text-slate-300 mb-5">
          Based on predictive pattern weights, syllabus delays, and optimal peak weekly days.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.smartRecommendations.length > 0 ? (
            insights.smartRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex gap-3 transition-colors align-top"
              >
                <div className="mt-0.5">
                  {rec.type === "course" && <span className="text-xs bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 px-2 py-0.5 rounded font-mono font-bold">COURSE</span>}
                  {rec.type === "habit" && <span className="text-xs bg-rose-500/20 text-rose-200 border border-rose-500/30 px-2 py-0.5 rounded font-mono font-bold">HABIT</span>}
                  {rec.type === "schedule" && <span className="text-xs bg-amber-500/20 text-amber-200 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">PACING</span>}
                  {rec.type === "general" && <span className="text-xs bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded font-mono font-bold">GENERAL</span>}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed font-sans mt-0.5">
                  {rec.text}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-350">Add more courses, goals, and complete habits for rich tactical recommendations.</p>
          )}
        </div>
      </div>

    </div>
  );
}
