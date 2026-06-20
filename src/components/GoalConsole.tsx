import React, { useState, useEffect } from "react";
import { Goal, GoalTask, Skill, Course, Chapter } from "../types";
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  PlayCircle,
  PauseCircle,
  GraduationCap,
  Sparkles,
  ExternalLink,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Edit2,
  Calendar,
  AlertTriangle,
  X,
  FileText,
  BadgeAlert,
  Search,
  SlidersHorizontal
} from "lucide-react";

interface GoalConsoleProps {
  goals: Goal[];
  onAddGoal: (goal: Partial<Goal>) => Promise<void>;
  onUpdateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;

  // Tasks
  tasks: GoalTask[];
  onAddTask: (goalId: string, task: Partial<GoalTask>) => Promise<void>;
  onUpdateTask: (id: string, task: Partial<GoalTask>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onToggleCompleteTask: (id: string) => Promise<void>;
  onToggleInProgressTask: (id: string) => Promise<void>;

  // Skills
  skills: Skill[];
  onAddSkill: (goalId: string, skill: Partial<Skill>) => Promise<void>;
  onUpdateSkill: (id: string, skill: Partial<Skill>) => Promise<void>;
  onDeleteSkill: (id: string) => Promise<void>;

  // Courses & Chapters
  courses: Course[];
  chapters: Chapter[];
  onAddCourse: (goalId: string, course: Partial<Course>) => Promise<void>;
  onUpdateCourse: (id: string, course: Partial<Course>) => Promise<void>;
  onDeleteCourse: (id: string) => Promise<void>;
  onTogglePauseCourse: (id: string) => Promise<void>;

  onAddChapter: (courseId: string, chapter: Partial<Chapter>) => Promise<void>;
  onUpdateChapter: (id: string, chapter: Partial<Chapter>) => Promise<void>;
  onDeleteChapter: (id: string) => Promise<void>;
}

export default function GoalConsole({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleCompleteTask,
  onToggleInProgressTask,
  skills,
  onAddSkill,
  onUpdateSkill,
  onDeleteSkill,
  courses,
  chapters,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onTogglePauseCourse,
  onAddChapter,
  onUpdateChapter,
  onDeleteChapter,
}: GoalConsoleProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tasks" | "skills" | "courses">("tasks");

  // Local creation forms
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    targetDate: "",
    priority: "Medium" as "Low" | "Medium" | "High" | "Critical",
    status: "In Progress" as "Not Started" | "In Progress" | "Completed" | "Archived",
    progressPercentage: 0,
  });

  // Task creation forms
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "Medium" as "Low" | "Medium" | "High" | "Critical",
  });

  // Skill Creation Forms
  const [skillForm, setSkillForm] = useState({
    skillName: "",
    confidenceLevel: 3,
    status: "Learning" as "Not Started" | "Learning" | "Practicing" | "Confident" | "Mastered",
    notes: "",
    resourceUrl: "",
  });

  // Course Creation Forms
  const [courseForm, setCourseForm] = useState({
    courseName: "",
    platform: "Udemy",
    courseUrl: "",
    instructor: "",
    due_date: "",
    totalLessons: 5,
  });

  // Chapter Creation Forms
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [chapterForm, setChapterForm] = useState({
    chapterName: "",
    description: "",
    googleDocsNotesUrl: "",
    externalResourceUrl: "",
  });

  // Course business boundaries alerts
  const [courseLimitError, setCourseLimitError] = useState<string | null>(null);

  // Set default selected goal
  useEffect(() => {
    if (goals.length > 0 && !selectedGoalId) {
      setSelectedGoalId(goals[0].id);
    }
  }, [goals, selectedGoalId]);

  const activeGoal = goals.find((g) => g.id === selectedGoalId) || null;

  // Filter linked models
  const goalTasks = tasks.filter((t) => t.goalId === selectedGoalId);
  const goalSkills = skills.filter((s) => s.goalId === selectedGoalId);
  const goalCourses = courses.filter((c) => c.goalId === selectedGoalId);

  // Reordering index functions (Moving positions up/down)
  const handleMoveTask = async (task: GoalTask, direction: "up" | "down") => {
    const list = [...goalTasks].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const currIdx = list.findIndex((t) => t.id === task.id);
    if (currIdx === -1) return;

    if (direction === "up" && currIdx > 0) {
      const neighbor = list[currIdx - 1];
      const tempIndex = task.orderIndex;
      await onUpdateTask(task.id, { orderIndex: neighbor.orderIndex });
      await onUpdateTask(neighbor.id, { orderIndex: tempIndex });
    } else if (direction === "down" && currIdx < list.length - 1) {
      const neighbor = list[currIdx + 1];
      const tempIndex = task.orderIndex;
      await onUpdateTask(task.id, { orderIndex: neighbor.orderIndex });
      await onUpdateTask(neighbor.id, { orderIndex: tempIndex });
    }
  };

  const handleOpenGoalModal = (g: Goal | null) => {
    if (g) {
      setEditingGoal(g);
      setGoalForm({
        title: g.title,
        description: g.description,
        targetDate: g.targetDate,
        priority: g.priority,
        status: g.status,
        progressPercentage: g.progressPercentage,
      });
    } else {
      setEditingGoal(null);
      setGoalForm({
        title: "",
        description: "",
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: "Medium",
        status: "In Progress",
        progressPercentage: 0,
      });
    }
    setShowGoalModal(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalForm.title.trim()) return;

    if (editingGoal) {
      await onUpdateGoal(editingGoal.id, goalForm);
    } else {
      await onAddGoal(goalForm);
    }
    setShowGoalModal(false);
  };

  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || !taskForm.title.trim()) return;
    await onAddTask(selectedGoalId, taskForm);
    setTaskForm({ title: "", description: "", dueDate: "", priority: "Medium" });

    // recalculate Goal Progress briefly base on percentage
    triggerGoalProgressSync();
  };

  const handleAddSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || !skillForm.skillName.trim()) return;
    await onAddSkill(selectedGoalId, skillForm);
    setSkillForm({ skillName: "", confidenceLevel: 3, status: "Learning", notes: "", resourceUrl: "" });
  };

  const handleAddCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || !courseForm.courseName.trim()) return;
    setCourseLimitError(null);
    try {
      await onAddCourse(selectedGoalId, courseForm);
      setCourseForm({
        courseName: "",
        platform: "Udemy",
        courseUrl: "",
        instructor: "",
        due_date: "",
        totalLessons: 5,
      });
    } catch (err: any) {
      setCourseLimitError(err.response?.data?.error || "Maximum of 4 active courses allowed. Please complete or pause an existing course before starting a new one.");
    }
  };

  const handleTogglePause = async (id: string) => {
    setCourseLimitError(null);
    try {
      await onTogglePauseCourse(id);
    } catch (err: any) {
      setCourseLimitError(err.response?.data?.error || "Maximum of 4 active courses allowed. Please complete or pause an existing course before activating this one.");
    }
  };

  const handleAddChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !chapterForm.chapterName.trim()) return;
    await onAddChapter(selectedCourseId, chapterForm);
    setChapterForm({ chapterName: "", description: "", googleDocsNotesUrl: "", externalResourceUrl: "" });
  };

  // Aggressive sync for Goal score calculation based on task completion %
  const triggerGoalProgressSync = () => {
    if (!activeGoal) return;
    const related = tasks.filter((t) => t.goalId === activeGoal.id);
    if (related.length === 0) return;
    const completed = related.filter((t) => t.completed).length;
    const pct = Math.round((completed / related.length) * 100);
    onUpdateGoal(activeGoal.id, { progressPercentage: pct });
  };

  const getPriorityBadgeClass = (p: string) => {
    switch (p) {
      case "Critical": return "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400";
      case "High": return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400";
      case "Medium": return "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400";
      default: return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6" id="goal-console-wrapper">
      
      {/* 1. Goals sidebar selectors */}
      <div className="xl:col-span-1 flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-500" />
            Interview Objectives
          </h3>
          <button
            onClick={() => handleOpenGoalModal(null)}
            className="p-1 px-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800/80 rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-indigo-100 dark:border-slate-800"
          >
            <Plus className="w-3.5 h-3.5" /> Launch Goal
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 text-center shadow-sm py-10">
            <Target className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400">No active goals found yet.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] xl:max-h-[600px] overflow-y-auto pr-1">
            {goals.map((g) => {
              const isSelected = g.id === selectedGoalId;
              const relatedTasks = tasks.filter((t) => t.goalId === g.id);
              const completedCount = relatedTasks.filter((t) => t.completed).length;

              return (
                <div
                  key={g.id}
                  onClick={() => setSelectedGoalId(g.id)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border shrink-0 text-left relative ${
                    isSelected
                      ? "bg-slate-900 border-slate-950 text-white shadow-md dark:bg-slate-800 dark:border-slate-700"
                      : "bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800 hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${getPriorityBadgeClass(g.priority)}`}>
                      {g.priority} Priority
                    </span>
                    <span className={`text-[10px] font-bold ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                      {g.status}
                    </span>
                  </div>

                  <h4 className={`text-xs font-bold leading-tight ${isSelected ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>
                    {g.title}
                  </h4>

                  {/* Micro custom Progress linear bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[9px] font-mono mb-1 text-slate-400">
                      <span>Progress</span>
                      <span>{g.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full transition-all duration-300"
                        style={{ width: `${g.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Days remaining indicator */}
                  {g.targetDate && (
                    <p className={`text-[10px] font-mono mt-2.5 flex items-center gap-1 ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                      <Calendar className="w-3 h-3" /> Target: {g.targetDate}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Detailed Goal dashboard controls console */}
      <div className="xl:col-span-3 flex flex-col gap-4">
        {activeGoal ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-left">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-gray-100 dark:border-slate-800/80 pb-5" id="active-goal-header">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${getPriorityBadgeClass(activeGoal.priority)}`}>
                    {activeGoal.priority} Priority
                  </span>
                  <span className="text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-2.5 py-0.5 rounded-full">
                    Goal Index Score: {activeGoal.progressPercentage}% Completed
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                  {activeGoal.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {activeGoal.description || "No strategic overview details attached to this key target metric. Click edit below to add summary context notes."}
                </p>
              </div>

              {/* Action items */}
              <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                <button
                  onClick={() => handleOpenGoalModal(activeGoal)}
                  className="p-2 rounded-xl border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="Edit Goal"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Goal
                </button>
                <button
                  onClick={async () => {
                    if (confirm("Are you sure you want to delete this Goal and all its tasks/skills/courses cascaded packages?")) {
                      await onDeleteGoal(activeGoal.id);
                      setSelectedGoalId(null);
                    }
                  }}
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="Delete Goal"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>

            {/* Inner modular tabs */}
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/40 mt-4 pb-2" id="console-sub-tabs">
              <button
                onClick={() => setActiveTab("tasks")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "tasks"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Tasks ({goalTasks.length})
              </button>
              <button
                onClick={() => setActiveTab("skills")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "skills"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Required Skills ({goalSkills.length})
              </button>
              <button
                onClick={() => setActiveTab("courses")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "courses"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Courses & Syllabus ({goalCourses.length})
              </button>
            </div>

            {/* Tab: Tasks panel lists */}
            {activeTab === "tasks" && (
              <div className="mt-5 animate-fadeIn">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: tasks list */}
                  <div className="lg:col-span-2 flex flex-col gap-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                      Task Checklist List
                    </h3>

                    {goalTasks.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-800/40 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl p-6 text-center py-10">
                        <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">No tasks logged on this goal. Use the planner form on the right.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {goalTasks.sort((a,b) => (a.orderIndex || 0) - (b.orderIndex || 0)).map((t, idx) => (
                          <div
                            key={t.id}
                            className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                              t.completed
                                ? "bg-slate-50/50 border-slate-100 text-slate-400 dark:bg-slate-850 dark:border-slate-800/40"
                                : "bg-white border-slate-100 dark:bg-slate-850 dark:border-slate-800 hover:shadow-sm"
                            }`}
                          >
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <button
                                onClick={async () => {
                                  await onToggleCompleteTask(t.id);
                                  triggerGoalProgressSync();
                                }}
                                className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                              >
                                {t.completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${getPriorityBadgeClass(t.priority)}`}>
                                  {t.priority}
                                </span>
                                <h4 className={`text-xs font-bold leading-snug mt-1.5 ${t.completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"}`}>
                                  {t.title}
                                </h4>
                                <p className="text-[11px] text-slate-400 dark:text-slate-450 mt-1 truncate">
                                  {t.description || "No supplemental details provided."}
                                </p>
                                {t.dueDate && (
                                  <span className="text-[9px] font-mono text-slate-450 bg-slate-50 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded mt-2 inline-block">
                                    Due: {t.dueDate}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Position ordering mechanics + State triggers */}
                            <div className="flex items-center gap-1shrink-0">
                              <button
                                onClick={() => handleMoveTask(t, "up")}
                                disabled={idx === 0}
                                className="p-1 rounded bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-25 transition-colors cursor-pointer"
                                title="Move task Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveTask(t, "down")}
                                disabled={idx === goalTasks.length - 1}
                                className="p-1 rounded bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-25 transition-colors cursor-pointer"
                                title="Move task Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  await onToggleInProgressTask(t.id);
                                  triggerGoalProgressSync();
                                }}
                                className={`p-1 rounded text-xs px-2 font-mono ${
                                  t.inProgress
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 font-bold"
                                    : "bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-755"
                                }`}
                                title={t.inProgress ? "In Progress" : "Pending study state"}
                              >
                                {t.inProgress ? "In Progress" : "Pending"}
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm("Delete this checklist task?")) {
                                    await onDeleteTask(t.id);
                                    triggerGoalProgressSync();
                                  }
                                }}
                                className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: task compiler form */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-indigo-500" />
                      Add Goal Task
                    </h3>
                    <form onSubmit={handleAddTaskSubmit} className="space-y-3">
                      <div>
                        <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Task Title *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Solve network subnet packet Capture"
                          value={taskForm.title}
                          onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Details (Optional)</label>
                        <textarea
                          placeholder="Supplemental tools or steps..."
                          value={taskForm.description}
                          onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-150 h-16 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Due Date</label>
                          <input
                            type="date"
                            value={taskForm.dueDate}
                            onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Priority</label>
                          <select
                            value={taskForm.priority}
                            onChange={(e: any) => setTaskForm({ ...taskForm, priority: e.target.value })}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 py-2 rounded-xl transition-all shadow-sm cursor-pointer mt-2"
                      >
                        Push Task onto goal
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Required Skills list */}
            {activeTab === "skills" && (
              <div className="mt-5 animate-fadeIn">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left list */}
                  <div className="lg:col-span-2 flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                      Target Competence Map
                    </h3>

                    {goalSkills.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-800/40 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl p-6 text-center py-10">
                        <Sparkles className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">No targeted skills. Declare a necessary container technology on the form.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {goalSkills.map((s) => (
                          <div
                            key={s.id}
                            className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-left relative flex flex-col justify-between hover:shadow-sm transition-all"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                                  {s.status}
                                </span>
                                <button
                                  onClick={async () => {
                                    if (confirm("Delete this skill?")) await onDeleteSkill(s.id);
                                  }}
                                  className="p-1 text-slate-300 hover:text-rose-500 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {s.skillName}
                              </h4>
                              <p className="text-[11px] text-slate-400 dark:text-slate-450 mt-1 lines-clamp-2">
                                {s.notes || "No practice study notes attached."}
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/60">
                              {/* Confidence levels star index */}
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-mono">Confidence Level</span>
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, st) => (
                                    <div
                                      key={st}
                                      onClick={async () => {
                                        await onUpdateSkill(s.id, { confidenceLevel: st + 1 });
                                      }}
                                      className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${
                                        st < s.confidenceLevel
                                          ? "bg-amber-400"
                                          : "bg-slate-200 dark:bg-slate-700"
                                      }`}
                                      title={`Set confidence to ${st + 1}`}
                                    />
                                  ))}
                                </div>
                              </div>

                              {s.resourceUrl && (
                                <a
                                  href={s.resourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-indigo-500 flex items-center gap-1 mt-3 font-semibold hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" /> External Learning Guide
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right creator */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-indigo-500" />
                      Add Required Skill
                    </h3>
                    <form onSubmit={handleAddSkillSubmit} className="space-y-3">
                      <div>
                        <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Skill Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Terraform remote locking backends"
                          value={skillForm.skillName}
                          onChange={(e) => setSkillForm({ ...skillForm, skillName: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Status</label>
                        <select
                          value={skillForm.status}
                          onChange={(e: any) => setSkillForm({ ...skillForm, status: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="Learning">Learning</option>
                          <option value="Practicing">Practicing</option>
                          <option value="Confident">Confident</option>
                          <option value="Mastered">Mastered</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Confidence (1-5)</label>
                          <select
                            value={skillForm.confidenceLevel}
                            onChange={(e) => setSkillForm({ ...skillForm, confidenceLevel: Number(e.target.value) })}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="1">1 - Decent</option>
                            <option value="2">2 - Basic</option>
                            <option value="3">3 - Intermediate</option>
                            <option value="4">4 - Advanced</option>
                            <option value="5">5 - Expert/Pro</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Ref Reference URL</label>
                          <input
                            type="url"
                            placeholder="Docs URL"
                            value={skillForm.resourceUrl}
                            onChange={(e) => setSkillForm({ ...skillForm, resourceUrl: e.target.value })}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Practice Notes Summary</label>
                        <textarea
                          placeholder="What did you build or read to exercise this?"
                          value={skillForm.notes}
                          onChange={(e) => setSkillForm({ ...skillForm, notes: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-150 h-16 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        Declare Skill Needed
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Courses and chapter structures (with limits checks!) */}
            {activeTab === "courses" && (
              <div className="mt-5 animate-fadeIn">
                
                {/* 4 Active Course Boundary Alarm */}
                {courseLimitError && (
                  <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-950 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-450">
                    <BadgeAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block">Boundary Rule Breached:</span>
                      <span className="font-mono mt-0.5 block leading-relaxed">{courseLimitError}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left layout: courses & chapter lists */}
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Assigned Study Syllabus
                      </h3>
                      <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                        Active Courses: {courses.filter(c => !c.pausedStatus && c.completedLessons < c.totalLessons).length} / 4 Allowed
                      </span>
                    </div>

                    {goalCourses.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-800/40 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl p-6 text-center py-10">
                        <GraduationCap className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">No active/paused syllabus enrolled. Complete enrolling form details.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {goalCourses.map((c) => {
                          const isActive = !c.pausedStatus && c.completedLessons < c.totalLessons;
                          const courseChapters = chapters.filter((chap) => chap.courseId === c.id);

                          return (
                            <div
                              key={c.id}
                              className={`bg-white dark:bg-slate-850 rounded-2xl border p-4 text-left relative transition-all ${
                                isActive
                                  ? "border-indigo-100 shadow-sm"
                                  : "border-slate-100 dark:border-slate-800 opacity-80"
                              }`}
                            >
                              {/* Course Summary line */}
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-50 dark:border-slate-800/60">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-20 py-0.5 font-bold rounded">
                                      {c.platform}
                                    </span>
                                    {c.instructor && (
                                      <span className="text-[10px] font-mono text-slate-400">
                                        by {c.instructor}
                                      </span>
                                    )}
                                    {isActive ? (
                                      <span className="text-[9px] font-mono font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                                        ACTIVE STUDY
                                      </span>
                                    ) : c.completedLessons >= c.totalLessons && c.totalLessons > 0 ? (
                                      <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                                        COMPLETED
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 px-1.5 py-0.5 rounded">
                                        PAUSED STALL
                                      </span>
                                    )}
                                  </div>

                                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">
                                    {c.courseName}
                                  </h4>

                                  {c.courseUrl && (
                                    <a
                                      href={c.courseUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] text-indigo-500 font-semibold hover:underline flex items-center gap-1.5 mt-2"
                                    >
                                      Visit course path <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-1.5">
                                  {/* Pause/Resume toggles */}
                                  {c.completedLessons < c.totalLessons && (
                                    <button
                                      onClick={() => handleTogglePause(c.id)}
                                      className={`p-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                        c.pausedStatus
                                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100"
                                          : "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100"
                                      }`}
                                      title={c.pausedStatus ? "Resume Course Study" : "Pause Course Study"}
                                    >
                                      {c.pausedStatus ? (
                                        <><PlayCircle className="w-4 h-4" /> Resume</>
                                      ) : (
                                        <><PauseCircle className="w-4 h-4" /> Pause</>
                                      )}
                                    </button>
                                  )}
                                  <button
                                    onClick={async () => {
                                      if (confirm("Delete this Course registration along with all chapter progresses?")) {
                                        await onDeleteCourse(c.id);
                                        if (selectedCourseId === c.id) setSelectedCourseId(null);
                                      }
                                    }}
                                    className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Progress bar info */}
                              <div className="my-3 py-1">
                                <div className="flex items-center justify-between text-[9px] font-mono text-slate-450 mb-1">
                                  <span>Chapter Completion Rate</span>
                                  <span>{c.progressPercentage}% ({c.completedLessons}/{c.totalLessons} lessons)</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-full transition-all duration-300"
                                    style={{ width: `${c.progressPercentage}%` }}
                                  />
                                </div>
                              </div>

                              {/* Chapters sub-accordions list */}
                              <div className="mt-3.5 pt-3 border-t border-dashed border-slate-50 dark:border-slate-800/40">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 tracking-wider">
                                    Chapters Level Progress
                                  </span>
                                  <button
                                    onClick={() => setSelectedCourseId(selectedCourseId === c.id ? null : c.id)}
                                    className="text-[10px] font-bold text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    {selectedCourseId === c.id ? "Minimize Form" : "+ Add Chapter"}
                                  </button>
                                </div>

                                {/* Dynamic create chapter form inside context */}
                                {selectedCourseId === c.id && (
                                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-3 animate-fadeIn">
                                    <h5 className="text-[10px] font-mono font-bold text-slate-500 mb-2">ADD CHAPTER UNIT</h5>
                                    <form onSubmit={handleAddChapterSubmit} className="space-y-2">
                                      <input
                                        type="text"
                                        required
                                        placeholder="Chapter Name (e.g. VPC Gateways)"
                                        value={chapterForm.chapterName}
                                        onChange={(e) => setChapterForm({ ...chapterForm, chapterName: e.target.value })}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-150 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                      />
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <input
                                          type="url"
                                          placeholder="Google Docs Notes URL"
                                          value={chapterForm.googleDocsNotesUrl}
                                          onChange={(e) => setChapterForm({ ...chapterForm, googleDocsNotesUrl: e.target.value })}
                                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-150 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                        />
                                        <input
                                          type="url"
                                          placeholder="Ref external reference link"
                                          value={chapterForm.externalResourceUrl}
                                          onChange={(e) => setChapterForm({ ...chapterForm, externalResourceUrl: e.target.value })}
                                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-150 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                        />
                                      </div>
                                      <div className="flex gap-1.5 justify-end mt-2">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedCourseId(null)}
                                          className="text-[10px] font-bold px-2 py-1 border rounded-lg bg-white dark:bg-slate-900 text-slate-450 hover:bg-slate-100"
                                        >
                                          Close
                                        </button>
                                        <button
                                          type="submit"
                                          className="text-[10px] font-bold px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
                                        >
                                          Add Lesson Chapter
                                        </button>
                                      </div>
                                    </form>
                                  </div>
                                )}

                                {/* Chapters items stack list */}
                                {courseChapters.length === 0 ? (
                                  <p className="text-[10px] text-slate-400 italic">No chapters defined. Click '+ Add Chapter' above to list lesson milestones.</p>
                                ) : (
                                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                                    {courseChapters.map((chap) => (
                                      <div
                                        key={chap.id}
                                        className="flex items-center justify-between gap-3.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-all"
                                      >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <button
                                            onClick={async () => {
                                              await onUpdateChapter(chap.id, { completedStatus: !chap.completedStatus });
                                            }}
                                            className="shrink-0 text-slate-450 hover:text-emerald-500 transition-colors"
                                          >
                                            {chap.completedStatus ? (
                                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                              <Circle className="w-4 h-4" />
                                            )}
                                          </button>
                                          <div className="flex-1 min-w-0">
                                            <h5 className={`font-bold leading-none truncate ${chap.completedStatus ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-750 dark:text-slate-200"}`}>
                                              {chap.chapterName}
                                            </h5>
                                          </div>
                                        </div>

                                        {/* Reference links for Google Docs & external repositories */}
                                        <div className="flex items-center gap-1.5">
                                          {chap.googleDocsNotesUrl && (
                                            <a
                                              href={chap.googleDocsNotesUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-1 rounded bg-[#F1F3F4] text-[#1A73E8] hover:bg-indigo-50 transition-colors flex items-center gap-0.5 text-[10px]"
                                              title="Open Google Doc notes file"
                                            >
                                              <FileText className="w-3.5 h-3.5" />
                                              <span className="hidden sm:inline">Notes</span>
                                            </a>
                                          )}
                                          {chap.externalResourceUrl && (
                                            <a
                                              href={chap.externalResourceUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-1 rounded bg-[#EBF0FF] text-[#1E3A8A] hover:bg-indigo-50 transition-colors"
                                              title="External references"
                                            >
                                              <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                          )}
                                          <button
                                            onClick={async () => {
                                              if (confirm("Delete this chapter?")) await onDeleteChapter(chap.id);
                                            }}
                                            className="p-1 text-slate-300 hover:text-rose-500 rounded transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right creator */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-indigo-500" />
                      Enroll Course
                    </h3>
                    <form onSubmit={handleAddCourseSubmit} className="space-y-3">
                      <div>
                        <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Course Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. AWS Solutions Architect Professional"
                          value={courseForm.courseName}
                          onChange={(e) => setCourseForm({ ...courseForm, courseName: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Platform</label>
                          <input
                            type="text"
                            placeholder="Udemy, Coursera etc."
                            value={courseForm.platform}
                            onChange={(e) => setCourseForm({ ...courseForm, platform: e.target.value })}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Instructor</label>
                          <input
                            type="text"
                            placeholder="Name"
                            value={courseForm.instructor}
                            onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Target Link URL</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={courseForm.courseUrl}
                          onChange={(e) => setCourseForm({ ...courseForm, courseUrl: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Due Completion Date</label>
                          <input
                            type="date"
                            value={courseForm.due_date}
                            onChange={(e) => setCourseForm({ ...courseForm, due_date: e.target.value })}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-[11px] text-slate-800 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Est. chapters</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={courseForm.totalLessons}
                            onChange={(e) => setCourseForm({ ...courseForm, totalLessons: Number(e.target.value) })}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        Enroll Syllabus Item
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-10 text-center shadow-sm">
            <Target className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Goal Selected</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Please choose a specific objective from the left panel sidebar of the objectives console, or click "Launch Goal" to structure a new targeted path.
            </p>
          </div>
        )}
      </div>

      {/* 3. Goal Launcher Dialog Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xl w-full max-w-md animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800/80 mb-4">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5 text-left">
                <Target className="w-4 h-4 text-indigo-500" />
                {editingGoal ? `Edit Goal Details` : `Launch New Target Goal`}
              </h3>
              <button
                onClick={() => setShowGoalModal(false)}
                className="p-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4 text-left">
              <div>
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Objective Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Solutions Architect Professional"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Target Overview Details</label>
                <textarea
                  placeholder="Document focus fields, certification codes, reference requirements..."
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-150 h-24 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Target Date</label>
                  <input
                    type="date"
                    value={goalForm.targetDate}
                    onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Priority</label>
                  <select
                    value={goalForm.priority}
                    onChange={(e: any) => setGoalForm({ ...goalForm, priority: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Status</label>
                  <select
                    value={goalForm.status}
                    onChange={(e: any) => setGoalForm({ ...goalForm, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
                {editingGoal && (
                  <div>
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Progress Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={goalForm.progressPercentage}
                      onChange={(e) => setGoalForm({ ...goalForm, progressPercentage: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl transition-all shadow-sm cursor-pointer mt-3"
              >
                {editingGoal ? "Save Goal Changes" : "Launch Target Path"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
