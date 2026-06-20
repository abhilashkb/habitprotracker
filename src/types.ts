export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  timezone: string;
  preferredReminderTime: string;
  favoriteQuotes: string[];
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetDate: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Not Started" | "In Progress" | "Completed" | "Archived";
  progressPercentage: number;
}

export interface GoalTask {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  progressPercentage: number;
  completed: boolean;
  inProgress: boolean;
  orderIndex: number;
}

export interface Skill {
  id: string;
  goalId: string;
  userId: string;
  skillName: string;
  confidenceLevel: number; // 1-5
  status: "Not Started" | "Learning" | "Practicing" | "Confident" | "Mastered";
  notes: string;
  resourceUrl: string;
}

export interface Course {
  id: string;
  goalId: string;
  userId: string;
  courseName: string;
  platform: string;
  courseUrl: string;
  instructor: string;
  totalLessons: number;
  completedLessons: number;
  dueDate: string;
  pausedStatus: boolean;
  progressPercentage: number;
}

export interface Chapter {
  id: string;
  courseId: string;
  userId: string;
  chapterName: string;
  description: string;
  progressPercentage: number;
  completedStatus: boolean;
  googleDocsNotesUrl: string;
  externalResourceUrl: string;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: "Planning" | "In Progress" | "Review" | "Completed" | "Archived";
  progressPercentage: number;
  repositoryUrl: string;
  liveDemoUrl: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  description: string;
  status: "Pending" | "In Progress" | "Completed";
  completed: boolean;
  inProgress: boolean;
  taskResourceUrl: string;
  documentationUrl: string;
  githubCommitUrl: string;
  githubPrUrl: string;
}

export interface DailyTask {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High";
  status: "pending" | "completed" | "missed";
  streakCount: number;
  longestStreak: number;
  completedCount: number;
  missedCount: number;
  lastCompletedDate: string | null;
  lastMissedDate: string | null;
  isRecurring: boolean;
  repeatType: "daily" | "weekdays" | "weekends" | "custom";
  repeatDays: string[];
}

export interface Activity {
  id: string;
  userId: string;
  activityType: string;
  description: string;
  timestamp: string;
}

export interface Quote {
  id: string;
  quote: string;
  author: string;
  category: string;
  isFavorite?: boolean;
}
