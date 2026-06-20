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

export interface MoodLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mood: "Motivated" | "Happy" | "Neutral" | "Stressed" | "Tired";
}

export interface HabitSuccessScore {
  habitId: string;
  title: string;
  probability: number;
  streak: number;
  reason: string;
}

export interface HabitFailureRisk {
  habitId: string;
  title: string;
  riskLevel: "High" | "Medium" | "Low";
  message: string;
  recommendation: string;
}

export interface ProductivityPatterns {
  peakDays: string[];
  peakHours: string;
  weekendConsistency: "lower" | "similar" | "higher";
  message: string;
}

export interface StreakWarning {
  habitId: string;
  title: string;
  message: string;
}

export interface GoalForecast {
  goalId: string;
  title: string;
  progress: number;
  progressRate: number; // velocity per week
  estimatedCompletionDate: string;
  confidence: "High" | "Medium" | "Low";
  reason: string;
}

export interface LearningVelocity {
  chaptersThisWeek: number;
  tasksThisWeek: number;
  courseCompletedCount: number;
  message: string;
  changePercentage: number;
}

export interface SkillReadiness {
  skillId: string;
  skillName: string;
  score: number;
  status: string;
  confidenceLevel: number;
}

export interface InterviewReadiness {
  score: number;
  status: "Beginner" | "Intermediate" | "Advanced" | "Interview Ready";
  checklist: string[];
  details: string;
}

export interface BurnoutScore {
  score: number;
  riskLevel: "Low" | "Medium" | "High";
  indicators: string[];
  recommendations: string[];
}

export interface SmartRecommendation {
  id: string;
  text: string;
  type: "course" | "habit" | "schedule" | "general";
}

export interface MoodAnalytics {
  last7Days: { date: string; mood: string; productivityRating: number }[];
  correlationMessage: string;
}

export interface InsightsData {
  habitSuccess: HabitSuccessScore[];
  failureRisk: HabitFailureRisk[];
  productivityPatterns: ProductivityPatterns;
  streakWarnings: StreakWarning[];
  goalForecasts: GoalForecast[];
  learningVelocity: LearningVelocity;
  skillReadiness: SkillReadiness[];
  interviewReadiness: InterviewReadiness;
  burnout: BurnoutScore;
  smartRecommendations: SmartRecommendation[];
  moodAnalytics: MoodAnalytics;
  lastUpdated: string;
}

