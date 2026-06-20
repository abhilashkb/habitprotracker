import React, { useState } from "react";
import { Goal, GoalTask, Course, DailyTask } from "../types";
import { Bell, AlertTriangle, Flame, Clock, Calendar, CheckSquare, X, GraduationCap, Sparkles } from "lucide-react";

interface NotificationsCenterProps {
  goals: Goal[];
  tasks: GoalTask[];
  courses: Course[];
  dailies: DailyTask[];
}

interface AlertItem {
  id: string;
  type: "warning" | "info" | "success" | "streak";
  title: string;
  description: string;
  timeLabel?: string;
}

export default function NotificationsCenter({
  goals,
  tasks,
  courses,
  dailies,
}: NotificationsCenterProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Generate dynamic alert messages
  const getAlerts = (): AlertItem[] => {
    const list: AlertItem[] = [];
    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Goal deadlines approaching (within 15 days) and status != Completed
    goals.forEach((g) => {
      if (g.status !== "Completed" && g.targetDate) {
        const targetTime = new Date(g.targetDate).getTime();
        const diffDays = Math.ceil((targetTime - Date.now()) / (24 * 60 * 60 * 1000));
        if (diffDays >= 0 && diffDays <= 15) {
          list.push({
            id: `g_alert_${g.id}`,
            type: "warning",
            title: "Objective Deadline Near",
            description: `"${g.title}" target date is in ${diffDays} days! Master remaining chapters.`,
            timeLabel: `Target: ${g.targetDate}`,
          });
        } else if (diffDays < 0) {
          list.push({
            id: `g_alert_over_${g.id}`,
            type: "warning",
            title: "Overdue Goal Deadline",
            description: `"${g.title}" target date was on ${g.targetDate}. Re-strategize schedules.`,
            timeLabel: "Overdue Target",
          });
        }
      }
    });

    // 2. Overdue tasks (dueDate is in the past and not completed)
    tasks.forEach((t) => {
      if (!t.completed && t.dueDate) {
        const timeDiff = new Date(t.dueDate).getTime() - Date.now();
        if (timeDiff < 0) {
          list.push({
            id: `t_alert_${t.id}`,
            type: "warning",
            title: "Checklist Task Overdue",
            description: `"${t.title}" is overdue. Push status to working state now.`,
            timeLabel: `Due: ${t.dueDate}`,
          });
        }
      }
    });

    // 3. Courses approaching deadlines
    courses.forEach((c) => {
      if (c.completedLessons < c.totalLessons && c.dueDate) {
        const diffDays = Math.ceil((new Date(c.dueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        if (diffDays >= 0 && diffDays <= 7) {
          list.push({
            id: `c_alert_${c.id}`,
            type: "info",
            title: "Course Milestone Deadline",
            description: `"${c.courseName}" target wrapper ends in ${diffDays} days!`,
            timeLabel: `Due: ${c.dueDate}`,
          });
        }
      }
    });

    // 4. Streak warnings: Recurring dailies scheduled today that remain pending
    dailies.forEach((d) => {
      const isScheduledToday = () => {
        if (!d.isRecurring) return true;
        const dayIdx = new Date().getDay();
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayName = days[dayIdx];
        if (d.repeatType === "daily") return true;
        if (d.repeatType === "weekdays") return dayIdx >= 1 && dayIdx <= 5;
        if (d.repeatType === "weekends") return dayIdx === 0 || dayIdx === 6;
        if (d.repeatType === "custom") return d.repeatDays && d.repeatDays.includes(dayName);
        return false;
      };

      if (d.status === "pending" && isScheduledToday()) {
        list.push({
          id: `d_alert_${d.id}`,
          type: "streak",
          title: "Protect Your Active Streak",
          description: `"${d.title}" is pending today! Completed routines protect your ${d.streakCount}-day streak.`,
          timeLabel: "Action Required",
        });
      }
    });

    return list;
  };

  const alerts = getAlerts();

  return (
    <div className="relative" id="notifications-wrapper">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-200 hover:bg-slate-100 transition-all cursor-pointer relative"
        title="View system diagnostic notifications"
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
            {alerts.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xl w-[320px] max-w-[90vw] z-50 text-left animate-scaleUp">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-850 mb-3">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-indigo-500" />
              Notifications Center
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-0.5"
            >
              <X className="w-3.5 h-3.5" /> Close
            </button>
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">No warnings active! You are ahead of schedule.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {alerts.map((al) => (
                <div
                  key={al.id}
                  className={`p-3 rounded-2xl text-xs border flex items-start gap-2.5 text-left transition-all hover:bg-slate-50/50 ${
                    al.type === "warning"
                      ? "bg-rose-50/50 border-rose-100/50 text-rose-850 dark:bg-rose-950/20 dark:border-rose-950"
                      : al.type === "streak"
                        ? "bg-orange-50/50 border-orange-100/50 text-orange-850 dark:bg-orange-950/20 dark:border-orange-950"
                        : "bg-indigo-50/50 border-indigo-100/50 text-indigo-850 dark:bg-indigo-950/20 dark:border-indigo-950"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {al.type === "warning" && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                    {al.type === "streak" && <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />}
                    {al.type === "info" && <GraduationCap className="w-4 h-4 text-indigo-500" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="font-extrabold block text-[11px] text-slate-800 dark:text-slate-200">{al.title}</span>
                    <span className="text-slate-500 dark:text-slate-400 leading-normal block text-[10.5px] mt-0.5">
                      {al.description}
                    </span>
                    {al.timeLabel && (
                      <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded mt-2 inline-block">
                        {al.timeLabel}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 dark:border-slate-800 pt-3 mt-3 flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span>STREAK SAFE-GUARD ACTIVE</span>
            <span>AUTO-SYNC</span>
          </div>
        </div>
      )}
    </div>
  );
}
