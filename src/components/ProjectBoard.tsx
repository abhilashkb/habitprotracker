import React, { useState } from "react";
import { Project, ProjectTask } from "../types";
import {
  Code2,
  GitFork,
  Link,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  ExternalLink,
  GitBranch,
  Edit2,
  ChevronDown,
  ChevronUp,
  FileText,
  Github,
  X
} from "lucide-react";

interface ProjectBoardProps {
  projects: Project[];
  onAddProject: (project: Partial<Project>) => Promise<void>;
  onUpdateProject: (id: string, project: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;

  projectTasks: ProjectTask[];
  onAddProjectTask: (projectId: string, task: Partial<ProjectTask>) => Promise<void>;
  onUpdateProjectTask: (id: string, task: Partial<ProjectTask>) => Promise<void>;
  onDeleteProjectTask: (id: string) => Promise<void>;
}

export default function ProjectBoard({
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  projectTasks,
  onAddProjectTask,
  onUpdateProjectTask,
  onDeleteProjectTask,
}: ProjectBoardProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Forms
  const [showProjModal, setShowProjModal] = useState(false);
  const [editingProj, setEditingProj] = useState<Project | null>(null);
  const [projForm, setProjForm] = useState({
    title: "",
    description: "",
    status: "Planning" as "Planning" | "In Progress" | "Review" | "Completed" | "Archived",
    repositoryUrl: "",
    liveDemoUrl: "",
  });

  const [ptaskForm, setPtaskForm] = useState({
    title: "",
    description: "",
    taskResourceUrl: "",
    documentationUrl: "",
    githubCommitUrl: "",
    githubPrUrl: "",
  });

  // Expanded task indexes accordion
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);

  const handleToggleTaskExpand = (id: string) => {
    setExpandedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleOpenProjModal = (p: Project | null) => {
    if (p) {
      setEditingProj(p);
      setProjForm({
        title: p.title,
        description: p.description,
        status: p.status,
        repositoryUrl: p.repositoryUrl,
        liveDemoUrl: p.liveDemoUrl,
      });
    } else {
      setEditingProj(null);
      setProjForm({
        title: "",
        description: "",
        status: "Planning",
        repositoryUrl: "",
        liveDemoUrl: "",
      });
    }
    setShowProjModal(true);
  };

  const handleSaveProj = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projForm.title.trim()) return;

    if (editingProj) {
      await onUpdateProject(editingProj.id, projForm);
    } else {
      await onAddProject(projForm);
    }
    setShowProjModal(false);
  };

  const handleAddPTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !ptaskForm.title.trim()) return;

    await onAddProjectTask(selectedProjectId, ptaskForm);
    setPtaskForm({
      title: "",
      description: "",
      taskResourceUrl: "",
      documentationUrl: "",
      githubCommitUrl: "",
      githubPrUrl: "",
    });
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId) || null;
  const activeProjTasks = projectTasks.filter((t) => t.projectId === selectedProjectId);

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "Completed": return "bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400";
      case "In Progress": return "bg-indigo-50 text-indigo-800 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400";
      case "Review": return "bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400";
      default: return "bg-gray-50 text-gray-800 border-gray-150 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6" id="projects-board-wrapper">
      
      {/* Sidebar selection */}
      <div className="xl:col-span-1 flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-500" />
            Hands-on Projects
          </h3>
          <button
            onClick={() => handleOpenProjModal(null)}
            className="p-1 px-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800/80 rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-indigo-100 dark:border-slate-800"
          >
            <Plus className="w-3.5 h-3.5" /> Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 text-center py-12">
            <Code2 className="w-10 h-10 text-slate-350 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">No projects added yet.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] xl:max-h-[600px] overflow-y-auto pr-1">
            {projects.map((p) => {
              const isSelected = p.id === selectedProjectId;
              const completedTasks = projectTasks.filter(t => t.projectId === p.id && t.completed).length;
              const allTasks = projectTasks.filter(t => t.projectId === p.id).length;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border text-left shrink-0 ${
                    isSelected
                      ? "bg-slate-900 border-slate-950 text-white shadow-md dark:bg-slate-800 dark:border-slate-700"
                      : "bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800 hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getStatusBadge(p.status)}`}>
                      {p.status}
                    </span>
                    <span className={`text-[10px] font-bold ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                      {p.progressPercentage}%
                    </span>
                  </div>

                  <h4 className="text-xs font-bold leading-tight line-clamp-2">
                    {p.title}
                  </h4>

                  <div className="mt-3">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full transition-all"
                        style={{ width: `${p.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  <p className={`text-[10px] font-mono mt-2 flex items-center gap-1 ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                    <GitFork className="w-3.5 h-3.5" /> Tasks: {completedTasks}/{allTasks} done
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main detail area */}
      <div className="xl:col-span-3">
        {activeProject ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-left">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-gray-100 dark:border-slate-800/85 pb-5" id="active-project-header">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getStatusBadge(activeProject.status)}`}>
                    {activeProject.status} State
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    Integration Index: {activeProject.progressPercentage}% complete
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                  {activeProject.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {activeProject.description || "No supplemental readme file description exists."}
                </p>

                {/* Micro external URLs */}
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  {activeProject.repositoryUrl && (
                    <a
                      href={activeProject.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800/60"
                    >
                      <Github className="w-4 h-4 text-slate-800 dark:text-slate-100 text-slate-600 dark:text-slate-300" /> Repository Path
                    </a>
                  )}
                  {activeProject.liveDemoUrl && (
                    <a
                      href={activeProject.liveDemoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800/60"
                    >
                      <Link className="w-4 h-4 text-indigo-500" /> Active Live Demo
                    </a>
                  )}
                </div>
              </div>

              {/* Action indicators */}
              <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                <button
                  onClick={() => handleOpenProjModal(activeProject)}
                  className="p-2 rounded-xl border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Project
                </button>
                <button
                  onClick={async () => {
                    if (confirm("Delete this portfolio project along with all associated subtask units?")) {
                      await onDeleteProject(activeProject.id);
                      setSelectedProjectId(null);
                    }
                  }}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>

            {/* Subtasks sections split */}
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Subtask list checklist with details URLS */}
              <div className="lg:col-span-2 flex flex-col gap-2.5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                  Subtask Milestones List
                </h3>

                {activeProjTasks.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-dashed border-gray-200 dark:border-slate-800/65 rounded-2xl p-6 text-center py-10">
                    <GitBranch className="w-6 h-6 text-slate-350 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No project task milestones defined inside this framework sandbox.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeProjTasks.map((t) => {
                      const isExpanded = expandedTaskIds.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          className={`border rounded-xl p-3.5 transition-all text-left flex flex-col ${
                            t.completed
                              ? "bg-slate-50/60 border-slate-100 text-slate-400 dark:bg-slate-850 dark:border-slate-800/40"
                              : "bg-white border-slate-100 dark:bg-slate-850 dark:border-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <button
                                onClick={async () => {
                                  await onUpdateProjectTask(t.id, { completed: !t.completed });
                                }}
                                className="shrink-0 text-slate-300 hover:text-emerald-500 transition-colors cursor-pointer"
                              >
                                {t.completed ? (
                                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                                ) : (
                                  <Clock className="w-5 h-5 text-slate-400" />
                                )}
                              </button>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-xs font-bold leading-tight ${t.completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"}`}>
                                  {t.title}
                                </h4>
                                <span className={`text-[8px] font-mono font-bold uppercase rounded px-1.5 py-0.5 inline-block mt-1 ${
                                  t.completed 
                                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20" 
                                    : t.inProgress 
                                      ? "bg-indigo-50 text-indigo-800" 
                                      : "bg-slate-50 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                }`}>
                                  {t.completed ? "Completed" : t.inProgress ? "In Progress" : "Pending"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={async () => {
                                  await onUpdateProjectTask(t.id, { inProgress: !t.inProgress });
                                }}
                                className={`p-1.5 rounded text-[10px] font-mono font-bold ${
                                  t.inProgress ? "bg-amber-100 text-amber-800" : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-500"
                                }`}
                              >
                                {t.inProgress ? "Working" : "Work"}
                              </button>
                              <button
                                onClick={() => handleToggleTaskExpand(t.id)}
                                className="p-1.5 rounded bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-450 cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm("Delete project subtask?")) await onDeleteProjectTask(t.id);
                                }}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Details context */}
                          {isExpanded && (
                            <div className="mt-3.5 pt-3 border-t border-slate-50 dark:border-slate-800/60 text-xs animate-fadeIn text-left">
                              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                                {t.description || "No specific design requirements document comments attached."}
                              </p>
                              
                              {/* External anchors resources links */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 pt-1">
                                {t.githubPrUrl && (
                                  <a
                                    href={t.githubPrUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded bg-amber-50 text-amber-800 border border-amber-100 hover:bg-amber-100/50 flex items-center gap-1 font-mono text-[9px]"
                                  >
                                    <GitFork className="w-3.5 h-3.5" /> PR Link: {t.githubPrUrl.slice(0, 32)}...
                                  </a>
                                )}
                                {t.githubCommitUrl && (
                                  <a
                                    href={t.githubCommitUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded bg-[#EBF5FF] text-[#1D4ED8] hover:bg-[#EBF5FF]/50 flex items-center gap-1 font-mono text-[9px]"
                                  >
                                    <GitBranch className="w-3.5 h-3.5" /> Commit: {t.githubCommitUrl.slice(0, 32)}...
                                  </a>
                                )}
                                {t.documentationUrl && (
                                  <a
                                    href={t.documentationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100/50 flex items-center gap-1 font-mono text-[9px]"
                                  >
                                    <FileText className="w-3.5 h-3.5" /> Doc Reference Wiki
                                  </a>
                                )}
                                {t.taskResourceUrl && (
                                  <a
                                    href={t.taskResourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-100 hover:bg-indigo-100/50 flex items-center gap-1 font-mono text-[9px]"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" /> Resource Anchor
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right creation anchor builder */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-500" />
                  Add Subtask Milestone
                </h3>
                <form onSubmit={handleAddPTask} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Subtask Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Set up dynamic ingress router rules"
                      value={ptaskForm.title}
                      onChange={(e) => setPtaskForm({ ...ptaskForm, title: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Details Context</label>
                    <textarea
                      placeholder="e.g. Connect Helm secrets correctly..."
                      value={ptaskForm.description}
                      onChange={(e) => setPtaskForm({ ...ptaskForm, description: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs h-16 focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Google/Wiki Ref Doc Link</label>
                    <input
                      type="url"
                      placeholder="https://gdocs/..."
                      value={ptaskForm.documentationUrl}
                      onChange={(e) => setPtaskForm({ ...ptaskForm, documentationUrl: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">GitHub PR Thread</label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={ptaskForm.githubPrUrl}
                      onChange={(e) => setPtaskForm({ ...ptaskForm, githubPrUrl: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">GitHub Commit SHA URL</label>
                    <input
                      type="url"
                      placeholder="https://github/commits/..."
                      value={ptaskForm.githubCommitUrl}
                      onChange={(e) => setPtaskForm({ ...ptaskForm, githubCommitUrl: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    Add Subtask Point
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-10 text-center shadow-sm">
            <Code2 className="w-12 h-12 text-slate-350 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Project Outlined</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Choose an active hands-on portfolio item from the left selection panel, or press "Project +" to structure a new architectural development repository.
            </p>
          </div>
        )}
      </div>

      {/* 4. Edit dialog modal */}
      {showProjModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xl w-full max-w-md animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800/80 mb-4">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5 text-left">
                <Code2 className="w-4 h-4 text-indigo-500" />
                {editingProj ? `Edit Project Metrics` : `Initiate Code Project`}
              </h3>
              <button
                onClick={() => setShowProjModal(false)}
                className="p-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProj} className="space-y-4 text-left">
              <div>
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Auto-Provisioner Daemon"
                  value={projForm.title}
                  onChange={(e) => setProjForm({ ...projForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Description / Goals</label>
                <textarea
                  placeholder="Goals, requirements, technical stack specifications..."
                  value={projForm.description}
                  onChange={(e) => setProjForm({ ...projForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs h-24 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">State status</label>
                <select
                  value={projForm.status}
                  onChange={(e: any) => setProjForm({ ...projForm, status: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-350 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Repository path</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={projForm.repositoryUrl}
                    onChange={(e) => setProjForm({ ...projForm, repositoryUrl: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-1">Demo link destination</label>
                  <input
                    type="url"
                    placeholder="https://deployer.app/..."
                    value={projForm.liveDemoUrl}
                    onChange={(e) => setProjForm({ ...projForm, liveDemoUrl: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl transition-all shadow-sm cursor-pointer mt-3"
              >
                {editingProj ? "Save Portfolio Item" : "Launch portfolio Repository"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
