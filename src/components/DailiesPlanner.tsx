import React, { useState } from "react";
import { DailyTask } from "../types";
import {
  Flame,
  Plus,
  Trash2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  Sparkles,
  Award,
  BookOpen
} from "lucide-react";

interface DailiesPlannerProps {
  dailies: DailyTask[];
  onAddDaily: (daily: Partial<DailyTask>) => Promise<void>;
  onDeleteDaily: (id: string) => Promise<void>;
  onCompleteDaily: (id: string) => Promise<void>;
  onMissDaily: (id: string) => Promise<void>;
  onResetDaily: (id: string) => Promise<void>;
}

export default function DailiesPlanner({
  dailies,
  onAddDaily,
  onDeleteDaily,
  onCompleteDaily,
  onMissDaily,
  onResetDaily,
}: DailiesPlannerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [dailyForm, setDailyForm] = useState({
    title: "",
    description: "",
    priority: "Medium" as "Low" | "Medium" | "High",
    isRecurring: true,
    repeatType: "daily" as "daily" | "weekdays" | "weekends" | "custom",
    repeatDays: [] as string[],
  });

  const availableDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const handleToggleDay = (day: string) => {
    setDailyForm((prev) => {
      const idx = prev.repeatDays.indexOf(day);
      const updated = [...prev.repeatDays];
      if (idx > -1) {
        updated.splice(idx, 1);
      } else {
        updated.push(day);
      }
      return { ...prev, repeatDays: updated };
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyForm.title.trim()) return;

    await onAddDaily({
      ...dailyForm,
      // If repeat type is not custom, keep repeatDays empty
      repeatDays: dailyForm.repeatType === "custom" ? dailyForm.repeatDays : [],
    });

    setDailyForm({
      title: "",
      description: "",
      priority: "Medium",
      isRecurring: true,
      repeatType: "daily",
      repeatDays: [],
    });
    setShowAddForm(false);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "High": return "text-orange-500 fill-orange-50 bg-orange-50 dark:bg-orange-950/20";
      case "Medium": return "text-indigo-500 fill-indigo-50 bg-indigo-50 dark:bg-indigo-950/20";
      default: return "text-slate-400 fill-slate-50 bg-slate-50 dark:bg-slate-800/20";
    }
  };

  const formatScheduleText = (task: DailyTask) => {
    if (!task.isRecurring) return "Single Occurrence (Today)";
    if (task.repeatType === "daily") return "Scheduled Every Day";
    if (task.repeatType === "weekdays") return "Weekdays (Mon - Fri)";
    if (task.repeatType === "weekends") return "Weekends (Sat - Sun)";
    if (task.repeatType === "custom") {
      return `Custom: ${task.repeatDays?.join(", ")}`;
    }
    return "Schedules";
  };

  const isScheduledToday = (task: DailyTask) => {
    if (!task.isRecurring) return true;
    const dayIndex = new Date().getDay(); // 0 is Sunday, 6 is Saturday
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = dayNames[dayIndex];

    if (task.repeatType === "daily") return true;
    if (task.repeatType === "weekdays") return dayIndex >= 1 && dayIndex <= 5;
    if (task.repeatType === "weekends") return dayIndex === 0 || dayIndex === 6;
    if (task.repeatType === "custom") {
      return task.repeatDays && task.repeatDays.includes(dayName);
    }
    return false;
  };

  const sortedDailies = [...dailies].sort((a, b) => {
    // Scheduled today goes up
    const schedA = isScheduledToday(a) ? 1 : 0;
    const schedB = isScheduledToday(b) ? 1 : 0;
    return schedB - schedA;
  });

  return (
    <div className="space-y-6 text-left" id="dailies-planner-section">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-50">
            Daily Tasks & Habits Planner
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Build discipline via recurring routines with strict scheduled strike rules.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add Habit
        </button>
      </div>

      {/* Grid: 2 columns list + statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Habits Cards Stack */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
            Habit Routines Checklist
          </h3>

          {sortedDailies.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-10 text-center py-16 shadow-none">
              <Flame className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-xs text-slate-500">No recurring habits added yet. Click Add Habit above to create your first discipline.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedDailies.map((d) => {
                const todayScheduled = isScheduledToday(d);
                return (
                  <div
                    key={d.id}
                    className={`p-4 rounded-2xl border transition-all text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      d.status === "completed"
                        ? "bg-emerald-50/20 border-emerald-100 text-slate-450 dark:bg-slate-900 dark:border-slate-800/45 dark:opacity-85"
                        : d.status === "missed"
                          ? "bg-rose-50/20 border-rose-100 text-slate-450 dark:bg-slate-900 dark:border-slate-800/45"
                          : todayScheduled
                            ? "bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800 shadow-sm"
                            : "bg-gray-50/60 border-slate-100 opacity-60 dark:bg-slate-900 dark:border-slate-850"
                    }`}
                  >
                    {/* Left: Metadata details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          d.priority === "High" ? "bg-orange-50 text-orange-700 dark:bg-orange-950/20" : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20"
                        }`}>
                          {d.priority} Priority
                        </span>
                        
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded flex items-center gap-1.5">
                          <Calendar className="w-3" />
                          {formatScheduleText(d)}
                        </span>

                        {!todayScheduled && (
                          <span className="text-[9px] font-bold font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                            UNSCHEDULED TODAY
                          </span>
                        )}
                      </div>

                      <h4 className={`text-xs font-bold leading-snug ${
                        d.status === "completed" ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"
                      }`}>
                        {d.title}
                      </h4>
                      <p className="text-[11px] text-slate-450 dark:text-slate-500 leading-snug mt-1 max-w-md truncate">
                        {d.description || "No description provided."}
                      </p>

                      {/* Streaks counters inline details */}
                      <div className="flex items-center gap-3.5 mt-3 pt-2.5 border-t border-slate-100/50 dark:border-slate-800/30 flex-wrap">
                        <div className="flex items-center gap-1 text-orange-600 text-[10px] font-bold font-mono">
                          <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-600" />
                          <span>STREAK: {d.streakCount || 0}d</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Award className="w-3 text-amber-500" />
                          <span>BEST: {d.longestStreak || 0}d</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <CheckCircle className="w-3 text-emerald-500" />
                          <span>Done: {d.completedCount || 0}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <AlertCircle className="w-3 text-rose-500" />
                          <span>Missed: {d.missedCount || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: triggers buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 justify-end self-end sm:self-center">
                      {d.status === "pending" ? (
                        <>
                          <button
                            onClick={() => onCompleteDaily(d.id)}
                            disabled={!todayScheduled}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-1 cursor-pointer shadow-sm ${
                              todayScheduled
                                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed opacity-50"
                            }`}
                            title={todayScheduled ? "Completed today!" : "This habit is not scheduled for today"}
                          >
                            <CheckCircle className="w-4 h-4" /> Complete
                          </button>
                          <button
                            onClick={() => onMissDaily(d.id)}
                            disabled={!todayScheduled}
                            className={`px-2 py-1.5 text-xs text-rose-600 font-bold hover:bg-rose-50 rounded-xl transition-all cursor-pointer ${
                              todayScheduled ? "opacity-100" : "opacity-30 pointer-events-none"
                            }`}
                          >
                            Missed (Didn't Do)
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg ${
                            d.status === "completed"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/20"
                          }`}>
                            {d.status === "completed" ? "✓ Done Today" : "✗ Missed Today"}
                          </span>
                          <button
                            onClick={() => onResetDaily(d.id)}
                            className="p-1 rounded bg-slate-50 dark:bg-slate-800 text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-semibold cursor-pointer py-1 px-2 hover:bg-slate-100"
                            title="Revert back to Pending"
                          >
                            Reset Status
                          </button>
                        </div>
                      )}

                      <button
                        onClick={async () => {
                          if (confirm("Delete this habit tracking framework? All accumulated history will vanish.")) {
                            await onDeleteDaily(d.id);
                          }
                        }}
                        className="p-1.5 text-slate-350 hover:text-rose-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Side statistics panel details */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-4">
              <Award className="w-4 h-4 text-orange-500" />
              Streak Engine Diagnostics
            </h4>
            
            <div className="space-y-3">
              {/* Stat Card 1 */}
              <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-left">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Active Streak Champion</span>
                <span className="text-lg font-extrabold text-orange-600 block mt-1 flex items-center gap-1.5 font-mono">
                  <Flame className="w-5 h-5 fill-orange-500 text-orange-600 animate-pulse" />
                  {Math.max(...dailies.map((da) => da.streakCount || 0), 0)} scheduled Days
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Keep completing targets on scheduled days to preserve high multipliers.
                </p>
              </div>

              {/* Stat Card 2 */}
              <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-left">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Aggregate Completion Rate</span>
                <span className="text-lg font-extrabold text-indigo-600 block mt-1 font-mono">
                  {dailies.length > 0 
                    ? Math.round(
                        (dailies.reduce((acc, current) => acc + (current.completedCount || 0), 0) /
                          Math.max(
                            dailies.reduce((acc, current) => acc + (current.completedCount || 0) + (current.missedCount || 0), 0),
                            1
                          )) * 100
                      )
                    : 0}%
                </span>
                <p className="text-[10px] text-slate-500 mt-1">
                  Ratio of completed scheduled occurrences vs missed.
                </p>
              </div>
            </div>

            {/* Instruction list */}
            <div className="bg-white/40 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800 mt-4 text-left">
              <h5 className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wide mb-2">Rules of the engine:</h5>
              <ul className="text-[11px] text-slate-500 dark:text-slate-450 list-disc list-inside space-y-1">
                <li>Ignored non-scheduled days do NOT reset counts.</li>
                <li>Failing a scheduled day resets active streak to 0.</li>
                <li>Reset is available to fix errors before day ends.</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 mt-4 text-[10px] font-mono text-slate-400">
            STRICT REGISTRAR COMPLIANCE
          </div>
        </div>
      </div>

      {/* Habits Launcher Drawer */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xl w-full max-w-md animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5 text-left">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                Add Habit routine
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-left">
              <div>
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Habit Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Algorithmic System design challenge"
                  value={dailyForm.title}
                  onChange={(e) => setDailyForm({ ...dailyForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Routines Details</label>
                <textarea
                  placeholder="e.g. Focus on sliding windows puzzles, binary searches..."
                  value={dailyForm.description}
                  onChange={(e) => setDailyForm({ ...dailyForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Priority</label>
                  <select
                    value={dailyForm.priority}
                    onChange={(e: any) => setDailyForm({ ...dailyForm, priority: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-850 dark:border-slate-850 dark:border-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-150 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Schedules Interval</label>
                  <select
                    value={dailyForm.repeatType}
                    onChange={(e: any) => setDailyForm({ ...dailyForm, repeatType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-150 focus:outline-none"
                  >
                    <option value="daily">Daily recurrence</option>
                    <option value="weekdays">Weekdays (Mon-Fri)</option>
                    <option value="weekends">Weekends only</option>
                    <option value="custom">Custom Pick Days</option>
                  </select>
                </div>
              </div>

              {/* Day Picking fields for Custom schedules */}
              {dailyForm.repeatType === "custom" && (
                <div className="animate-fadeIn p-3.5 rounded-2xl bg-slate-50 border border-slate-100/80">
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-2">CUSTOM SCHEDULE DAYS</span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableDays.map((d) => {
                      const isSelected = dailyForm.repeatDays.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handleToggleDay(d)}
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          {d.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl transition-all shadow-sm cursor-pointer mt-3"
              >
                Launch routine Schedule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
