import React, { useState } from "react";
import { Activity } from "../types";
import { Calendar, CheckCircle2, Clock } from "lucide-react";

interface ActivityHeatmapProps {
  activities: Activity[];
}

export default function ActivityHeatmap({ activities }: ActivityHeatmapProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Helper to generate the past 120 days of data in rolling weeks
  // Starting from 120 days ago up to today
  const getPastDays = () => {
    const arr = [];
    const today = new Date();
    for (let i = 119; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      arr.push({
        date: dateStr,
        dayOfWeek: d.getDay(),
        dateObj: d,
      });
    }
    return arr;
  };

  const pastDays = getPastDays();

  // Group activities by date string
  const activityMap: { [dateStr: string]: Activity[] } = {};
  activities.forEach((act) => {
    const actDate = act.timestamp.split("T")[0];
    if (!activityMap[actDate]) {
      activityMap[actDate] = [];
    }
    activityMap[actDate].push(act);
  });

  // Calculate maximum activity density to scale colors
  const maxIntensity = Math.max(
    ...pastDays.map((day) => activityMap[day.date]?.length || 0),
    1
  );

  // Map intensity count to GitHub green classes
  const getColorClass = (count: number) => {
    if (count === 0) return "bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-black/5";
    if (count <= 1) return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200";
    if (count <= 2) return "bg-emerald-300 text-emerald-900 hover:bg-emerald-400 border border-emerald-400";
    if (count <= 4) return "bg-emerald-500 text-white hover:bg-emerald-600 border border-emerald-600";
    return "bg-emerald-700 text-white hover:bg-emerald-800 border border-emerald-800";
  };

  const selectedDateActivities = selectedDate ? activityMap[selectedDate] || [] : [];

  // Group days into columns (weeks)
  const columns: typeof pastDays[] = [];
  let currentWeek: typeof pastDays = [];

  pastDays.forEach((day) => {
    currentWeek.push(day);
    if (day.dayOfWeek === 6 || currentWeek.length === 7) {
      columns.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    columns.push(currentWeek);
  }

  const formatHeaderDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6" id="heatmap-header">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-5 h-5" />
            </span>
            Activity Matrix
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dynamic tracking of courses, goals, hands-on tasks, and habit consistency.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 self-start sm:self-center">
          <span>Less</span>
          <div className="w-3.5 h-3.5 rounded bg-gray-100 dark:bg-slate-800 border border-black/5"></div>
          <div className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-200"></div>
          <div className="w-3.5 h-3.5 rounded bg-emerald-300 border border-emerald-400"></div>
          <div className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-600"></div>
          <div className="w-3.5 h-3.5 rounded bg-emerald-700 border border-emerald-800"></div>
          <span>More</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex gap-1 min-w-[550px]" style={{ direction: "ltr" }}>
          {/* Day of Week Labels */}
          <div className="flex flex-col justify-between text-[10px] text-slate-400 dark:text-slate-500 pr-2 pt-4 pb-1 select-none font-mono">
            <span>Sun</span>
            <span>Tue</span>
            <span>Thu</span>
            <span>Sat</span>
          </div>

          <div className="flex gap-1 flex-1">
            {columns.map((column, colIdx) => {
              // Show month label above first column of new month
              const firstDayOfCol = column[0]?.dateObj;
              const showMonthLabel = firstDayOfCol && firstDayOfCol.getDate() <= 7;
              const monthLabel = firstDayOfCol
                ? firstDayOfCol.toLocaleDateString("en-US", { month: "short" })
                : "";

              return (
                <div key={colIdx} className="flex flex-col gap-1">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 h-4 leading-3 select-none truncate max-w-[28px]">
                    {showMonthLabel ? monthLabel : ""}
                  </span>
                  
                  {/* Fill empty cells if first column is aligned */}
                  {colIdx === 0 && column[0].dayOfWeek > 0 && (
                    Array.from({ length: column[0].dayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-3.5 h-3.5 opacity-0 pointer-events-none" />
                    ))
                  )}

                  {column.map((day) => {
                    const dayActivities = activityMap[day.date] || [];
                    const count = dayActivities.length;
                    const tooltipText = `${count} ${count === 1 ? "activity" : "activities"} on ${day.date}`;

                    return (
                      <button
                        key={day.date}
                        className={`w-3.5 h-3.5 rounded transition-all cursor-pointer relative group shrink-0 ${getColorClass(
                          count
                        )} ${selectedDate === day.date ? "ring-2 ring-emerald-600 ring-offset-2 dark:ring-offset-slate-900 scale-105 shadow-sm" : ""}`}
                        title={tooltipText}
                        onClick={() => setSelectedDate(day.date)}
                      >
                        {/* Custom Tooltip */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap z-30 shadow-md">
                          {count} logs • {day.date}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Activities List */}
      {selectedDate && (
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-800 animate-fadeIn" id="heatmap-activities">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Activities on {formatHeaderDate(selectedDate)}
            </h4>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium"
            >
              Clear filter
            </button>
          </div>

          {selectedDateActivities.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
              No historical learning, habit consistency, or development activity logged on this date.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {selectedDateActivities.map((act) => {
                const timeStr = new Date(act.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={act.id}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100/50 dark:border-slate-800/40 text-xs"
                  >
                    <div className="p-1 rounded bg-white dark:bg-slate-700 text-slate-500 shadow-sm shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {act.activityType}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate mt-0.5">
                        {act.description}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 pt-0.5">
                      {timeStr}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
