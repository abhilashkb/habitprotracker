import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { calculateUserInsights } from "./analytics-engine";
import { InsightsData } from "./src/types";
import {
  getAICoachReport,
  getDailyAISummary,
  getWeeklyAISummary,
  getMonthlyReview,
  getSmartGoalPlan,
  getRoadmapPlan,
  getProjectIdeas,
  getMockInterview,
  getSkillGapAnalysis,
  getResumeAssistance,
  getHabitImprovementAdvisor,
  getStudyNotesSummary,
  getProjectReview,
  getBurnoutAdvice,
  getChatResponse,
  performNaturalSearch,
  getAINotificationContent,
  clearAICoachCache
} from "./ai-coach-service";

const resolvedDirname = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

const DB_FILE = process.env.DATABASE_PATH || path.resolve(resolvedDirname, "db.json");

// Ensure database directory exists
const dbDir = path.dirname(DB_FILE);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- TYPES ---
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar: string;
  timezone: string;
  preferredReminderTime: string;
  favoriteQuotes: string[];
}

interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetDate: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Not Started" | "In Progress" | "Completed" | "Archived";
  progressPercentage: number;
}

interface GoalTask {
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

interface Skill {
  id: string;
  goalId: string;
  userId: string;
  skillName: string;
  confidenceLevel: number; // 1-5
  status: "Not Started" | "Learning" | "Practicing" | "Confident" | "Mastered";
  notes: string;
  resourceUrl: string;
}

interface Course {
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

interface Chapter {
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

interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: "Planning" | "In Progress" | "Review" | "Completed" | "Archived";
  progressPercentage: number;
  repositoryUrl: string;
  liveDemoUrl: string;
}

interface ProjectSubtask {
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

interface DailyTask {
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
  previousStreakCount?: number;
  isRecurring: boolean;
  repeatType: "daily" | "weekdays" | "weekends" | "custom";
  repeatDays: string[]; // e.g. ["Monday", "Wednesday"]
}

interface Activity {
  id: string;
  userId: string;
  activityType: string;
  description: string;
  timestamp: string; // ISO String
}

interface Quote {
  id: string;
  quote: string;
  author: string;
  category: string;
}

interface DbStructure {
  users: User[];
  goals: Goal[];
  tasks: GoalTask[];
  skills: Skill[];
  courses: Course[];
  chapters: Chapter[];
  projects: Project[];
  projectTasks: ProjectSubtask[];
  dailies: DailyTask[];
  activities: Activity[];
  quotes: Quote[];
  sessions: { [token: string]: string }; // token -> userId
  moodLogs: MoodLog[];
  analyticsCache: { [userId: string]: any };
}

interface MoodLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mood: "Motivated" | "Happy" | "Neutral" | "Stressed" | "Tired";
}

// --- GLOBAL STATE IN-MEMORY + STICKY JSON WRITING ---
let db: DbStructure = {
  users: [],
  goals: [],
  tasks: [],
  skills: [],
  courses: [],
  chapters: [],
  projects: [],
  projectTasks: [],
  dailies: [],
  activities: [],
  quotes: [],
  sessions: {},
  moodLogs: [],
  analyticsCache: {},
};

// Seeding Default Quotes
const DEFAULT_QUOTES: Quote[] = [
  { id: "q1", quote: "The secret of getting ahead is getting started.", author: "Mark Twain", category: "Motivation" },
  { id: "q2", quote: "It is not that I am so smart, it is just that I stay with problems longer.", author: "Albert Einstein", category: "Problem Solving" },
  { id: "q3", quote: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma", category: "Discipline" },
  { id: "q4", quote: "First, solve the problem. Then, write the code.", author: "John Johnson", category: "Coding" },
  { id: "q5", quote: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde", category: "Learning" },
  { id: "q6", quote: "Make it work, make it right, make it fast.", author: "Kent Beck", category: "Coding" },
  { id: "q7", quote: "Consistency is the companion of success.", author: "Author Unknown", category: "Discipline" },
  { id: "q8", quote: "Expect things to fail, and design your architectures with resiliency from day one.", author: "Reliability Rules", category: "Focus" },
  { id: "q9", quote: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin", category: "Learning" },
  { id: "q10", quote: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln", category: "Discipline" },
];

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(content);
      // Ensure all fields exist
      if (!db.users) db.users = [];
      if (!db.goals) db.goals = [];
      if (!db.tasks) db.tasks = [];
      if (!db.skills) db.skills = [];
      if (!db.courses) db.courses = [];
      if (!db.chapters) db.chapters = [];
      if (!db.projects) db.projects = [];
      if (!db.projectTasks) db.projectTasks = [];
      if (!db.dailies) db.dailies = [];
      if (!db.activities) db.activities = [];
      if (!db.quotes || db.quotes.length === 0) db.quotes = DEFAULT_QUOTES;
      if (!db.sessions) db.sessions = {};
      if (!db.moodLogs) db.moodLogs = [];
      if (!db.analyticsCache) db.analyticsCache = {};
    } else {
      db.quotes = DEFAULT_QUOTES;
      saveDb();
    }
  } catch (err) {
    console.error("Error loading database:", err);
    db.quotes = DEFAULT_QUOTES;
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database:", err);
  }
}

loadDb();

// Seed Demo User email: demo@goaltracker.com passcode: password
const demoUserId = "user_demo_123";
const existingDemoUser = db.users.find((u) => u.email === "demo@goaltracker.com");
if (!existingDemoUser) {
  const demoUser: User = {
    id: demoUserId,
    name: "Abhilash Kumar",
    email: "demo@goaltracker.com",
    passwordHash: "password", // Clear text/simple for AI Studio Sandbox environment check
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    timezone: "America/Los_Angeles",
    preferredReminderTime: "08:30",
    favoriteQuotes: ["q1", "q4"],
  };

  db.users.push(demoUser);

  // Seed demo goals
  const ssaGoalId = "goal_ssa_001";
  const devopsGoalId = "goal_devops_002";
  db.goals.push(
    {
      id: ssaGoalId,
      userId: demoUserId,
      title: "AWS Solutions Architect Professional Certification",
      description: "Master Cloud architecture, VPC design, high availability mechanisms, IAM governance schemes, and Cost Management.",
      targetDate: "2026-08-30",
      priority: "High",
      status: "In Progress",
      progressPercentage: 45,
    },
    {
      id: devopsGoalId,
      userId: demoUserId,
      title: "Senior DevOps / SRE General Interview Prep",
      description: "System design preparation, active troubleshooting drills, networking benchmarks, and advanced CI/CD setup drills.",
      targetDate: "2026-07-25",
      priority: "Critical",
      status: "In Progress",
      progressPercentage: 60,
    }
  );

  // Seed tasks
  db.tasks.push(
    {
      id: "task_1",
      goalId: ssaGoalId,
      userId: demoUserId,
      title: "Design high-availability multi-region VPC architectures",
      description: "Implement transition gateways, secure subnet partitioning, and private linkage endpoint setups.",
      dueDate: "2026-06-25",
      priority: "High",
      progressPercentage: 100,
      completed: true,
      inProgress: false,
      orderIndex: 0,
    },
    {
      id: "task_2",
      goalId: ssaGoalId,
      userId: demoUserId,
      title: "Deep dive AWS IAM Authorization Rules & Control Policies",
      description: "Define Service Control Policies (SCPs) and permissions boundaries for enterprise organizational hierarchy.",
      dueDate: "2026-07-05",
      priority: "Medium",
      progressPercentage: 100,
      completed: true,
      inProgress: false,
      orderIndex: 1,
    },
    {
      id: "task_3",
      goalId: ssaGoalId,
      userId: demoUserId,
      title: "Solve 5 Professional Mock Exams on Udemy",
      description: "Acquire >= 80% marks on all simulated trials. Document any missed answers inside workspace study journal.",
      dueDate: "2026-08-20",
      priority: "Critical",
      progressPercentage: 20,
      completed: false,
      inProgress: true,
      orderIndex: 2,
    },
    {
      id: "task_4",
      goalId: devopsGoalId,
      userId: demoUserId,
      title: "Configure GitHub Actions dynamic build nodes on scalable Kubernetes pods",
      description: "Connect customized runners securely to target clusters and run linting tasks dynamically.",
      dueDate: "2026-06-22",
      priority: "Critical",
      progressPercentage: 100,
      completed: true,
      inProgress: false,
      orderIndex: 0,
    },
    {
      id: "task_5",
      goalId: devopsGoalId,
      userId: demoUserId,
      title: "Practice SRE Linux Networking Troubleshooting",
      description: "Solve diagnostic tests covering iptables rules, network packet capture tools, socket issues, and route setups.",
      dueDate: "2026-07-15",
      priority: "High",
      progressPercentage: 40,
      completed: false,
      inProgress: true,
      orderIndex: 1,
    }
  );

  // Seed skills
  db.skills.push(
    {
      id: "skill_1",
      goalId: ssaGoalId,
      userId: demoUserId,
      skillName: "VPC Transit Gateway routing",
      confidenceLevel: 4,
      status: "Practicing",
      notes: "Configured hub-and-spoke mesh topology. Must master route propagation rules.",
      resourceUrl: "https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html",
    },
    {
      id: "skill_2",
      goalId: devopsGoalId,
      userId: demoUserId,
      skillName: "Linux TCP diagnostics",
      confidenceLevel: 5,
      status: "Mastered",
      notes: "Highly confident in strace, tcpdump, ss, ip utility arguments.",
      resourceUrl: "https://linux.die.net/man/8/tcpdump",
    },
    {
      id: "skill_3",
      goalId: devopsGoalId,
      userId: demoUserId,
      skillName: "Terraform State Management Structures",
      confidenceLevel: 3,
      status: "Learning",
      notes: "Understanding locking rules with S3 backends and DynamoDB tables. Working with workspaces.",
      resourceUrl: "https://developer.hashicorp.com/terraform/language/state",
    }
  );

  // Seed courses
  const course1 = "course_sa_001";
  const course2 = "course_devops_002";
  db.courses.push(
    {
      id: course1,
      goalId: ssaGoalId,
      userId: demoUserId,
      courseName: "Ultimate AWS Certified Solutions Architect Professional Course",
      platform: "Udemy",
      courseUrl: "https://www.udemy.com/aws-solutions-architect-professional/",
      instructor: "Stephane Maarek",
      totalLessons: 4,
      completedLessons: 2,
      dueDate: "2026-08-10",
      pausedStatus: false,
      progressPercentage: 50,
    },
    {
      id: course2,
      goalId: devopsGoalId,
      userId: demoUserId,
      courseName: "Docker and Kubernetes SRE Bootcamp",
      platform: "Coursera",
      courseUrl: "https://www.coursera.org/learn/kubernetes-sre/",
      instructor: "Nigel Poulton",
      totalLessons: 2,
      completedLessons: 1,
      dueDate: "2026-07-20",
      pausedStatus: false,
      progressPercentage: 50,
    }
  );

  // Seed Chapters
  db.chapters.push(
    {
      id: "chap_1",
      courseId: course1,
      userId: demoUserId,
      chapterName: "Multi-Account IAM Organization Setup",
      description: "Implementing Service Control Policies (SCPs) and unified billing architectures.",
      progressPercentage: 100,
      completedStatus: true,
      googleDocsNotesUrl: "https://docs.google.com/document/d/1demo-iam-notes/edit",
      externalResourceUrl: "https://aws.amazon.com/organizations/",
    },
    {
      id: "chap_2",
      courseId: course1,
      userId: demoUserId,
      chapterName: "Enterprise transit VPC routing design",
      description: "Designing zero-trust cross-account routing topologies.",
      progressPercentage: 100,
      completedStatus: true,
      googleDocsNotesUrl: "https://docs.google.com/document/d/1demo-vpc-notes/edit",
      externalResourceUrl: "https://aws.amazon.com/transit-gateway/",
    },
    {
      id: "chap_3",
      courseId: course1,
      userId: demoUserId,
      chapterName: "S3 Versioning, Replication, and Cross-Region Policies",
      description: "Managing bucket safety constraints, kms replication settings, and object life-cycles.",
      progressPercentage: 0,
      completedStatus: false,
      googleDocsNotesUrl: "",
      externalResourceUrl: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html",
    },
    {
      id: "chap_4",
      courseId: course2,
      userId: demoUserId,
      chapterName: "Container networking overlays & flannel settings",
      description: "Inspecting docker internal host-bridges, overlay models, and flannel routing configuration details.",
      progressPercentage: 100,
      completedStatus: true,
      googleDocsNotesUrl: "https://docs.google.com/document/d/1demo-flannel-notes/edit",
      externalResourceUrl: "https://github.com/flannel-io/flannel",
    }
  );

  // Seed projects
  const proj1 = "proj_001";
  db.projects.push({
    id: proj1,
    userId: demoUserId,
    title: "Multi-Region Cloud Infrastructure Auto-Deployer",
    description: "Built a Go based executable that interacts with AWS API, provision secure VPC subnet configurations, validates IAM policies, and deploys scalable Dockerized health check containers.",
    status: "In Progress",
    progressPercentage: 66,
    repositoryUrl: "https://github.com/demo/cloud-auto-deployer",
    liveDemoUrl: "https://deployer-demo.goaltracker.io",
  });

  // Seed project tasks
  db.projectTasks.push(
    {
      id: "ptask_1",
      projectId: proj1,
      userId: demoUserId,
      title: "Implement secure JWT Bearer validation middleware in Go",
      description: "Decoded tokens, validated asymmetric RS256 authorization keys, and set up simple unit tests.",
      status: "Completed",
      completed: true,
      inProgress: false,
      taskResourceUrl: "https://jwt.io",
      documentationUrl: "https://github.com/demo/cloud-auto-deployer/wiki/Authentication",
      githubCommitUrl: "https://github.com/demo/cloud-auto-deployer/commit/a2b8e",
      githubPrUrl: "https://github.com/demo/cloud-auto-deployer/pull/12",
    },
    {
      id: "ptask_2",
      projectId: proj1,
      userId: demoUserId,
      title: "Write multi-tier Dockerfiles with high-cache affinity",
      description: "Optimized layers, cut deployment boundaries, and trimmed base image footprint sizes to < 15MB.",
      status: "Completed",
      completed: true,
      inProgress: false,
      taskResourceUrl: "https://docs.docker.com/develop/develop-images/multistage-build/",
      documentationUrl: "",
      githubCommitUrl: "https://github.com/demo/cloud-auto-deployer/commit/bc14d5",
      githubPrUrl: "https://github.com/demo/cloud-auto-deployer/pull/15",
    },
    {
      id: "ptask_3",
      projectId: proj1,
      userId: demoUserId,
      title: "Introduce Helm chart deployments and testing scripts",
      description: "Create Kubernetes services with ingress routes to point to deployed containers dynamically, verifying health status.",
      status: "In Progress",
      completed: false,
      inProgress: true,
      taskResourceUrl: "https://helm.sh/docs/",
      documentationUrl: "https://github.com/demo/cloud-auto-deployer/wiki/Helm-Configuration",
      githubCommitUrl: "",
      githubPrUrl: "",
    }
  );

  // Seed dailies
  db.dailies.push(
    {
      id: "daily_1",
      userId: demoUserId,
      title: "Solve LeetCode System Design / Algorithmic puzzle",
      description: "Focus on hash map problems, dynamic sizing structures, arrays, or binary tree traversals.",
      dueDate: "2026-06-20",
      priority: "High",
      status: "pending",
      streakCount: 14,
      longestStreak: 18,
      completedCount: 45,
      missedCount: 3,
      lastCompletedDate: "2026-06-19",
      lastMissedDate: "2026-05-30",
      isRecurring: true,
      repeatType: "daily",
      repeatDays: [],
    },
    {
      id: "daily_2",
      userId: demoUserId,
      title: "Practice VPC Setup and Subnetting Calculations",
      description: "Solve micro net CIDR partitions in cloud notebooks.",
      dueDate: "2026-06-20",
      priority: "Medium",
      status: "pending",
      streakCount: 6,
      longestStreak: 6,
      completedCount: 22,
      missedCount: 1,
      lastCompletedDate: "2026-06-19", // completed yesterday (Friday)
      lastMissedDate: "2026-06-10",
      isRecurring: true,
      repeatType: "custom",
      repeatDays: ["Monday", "Wednesday", "Friday", "Saturday"], // Saturday 20th is today
    },
    {
      id: "daily_3",
      userId: demoUserId,
      title: "Review daily technical stack alerts & news",
      description: "Follow SRE feeds, Kubernetes releases, AWS enhancements.",
      dueDate: "2026-06-20",
      priority: "Low",
      status: "pending",
      streakCount: 2,
      longestStreak: 10,
      completedCount: 12,
      missedCount: 4,
      lastCompletedDate: "2026-06-18",
      lastMissedDate: "2026-06-19",
      isRecurring: true,
      repeatType: "weekdays",
      repeatDays: [],
    }
  );

  // Seed Activity logs over the last 30 days to build a beautiful Git style commits calendar heatmap!
  // To avoid performance fatigue, let's write dates programmatically
  const todayDateObj = new Date("2026-06-20");
  const activityTemplates = [
    { type: "Goal Created", desc: "Initiated AWS Solutions Architect objective" },
    { type: "Task Completed", desc: "Solved cloud configuration subnetting" },
    { type: "Skill Updated", desc: "Upgraded competence on transit routing algorithms" },
    { type: "Course Completed", desc: "Completed S3 replication chapter tests" },
    { type: "Project Updated", desc: "Pushed clean codebase edits to GitHub repo" },
    { type: "Habit Completed", desc: "Solved daily engineering puzzle" },
    { type: "Skill Updated", desc: "Configured multi-region Kubernetes testing nodes" },
  ];

  // Distribute 45 activity logs over the previous 30 days
  for (let d = 0; d < 30; d++) {
    const activityDate = new Date(todayDateObj);
    activityDate.setDate(todayDateObj.getDate() - d);
    const dateStr = activityDate.toISOString().split("T")[0];

    // Seed 1-3 activities on most days to show an awesome, highly visual heatmap grid
    const numActivities = d % 5 === 0 ? 0 : (d % 3 === 0 ? 3 : 1);
    for (let k = 0; k < numActivities; k++) {
      const template = activityTemplates[(d + k) % activityTemplates.length];
      db.activities.push({
        id: `act_${d}_${k}`,
        userId: demoUserId,
        activityType: template.type,
        description: template.desc,
        timestamp: `${dateStr}T14:${10 + k * 12}:00Z`,
      });
    }
  }

  saveDb();
}

// Helper to log user actions in the activity feed
function logActivity(userId: string, type: string, description: string) {
  const newActivity: Activity = {
    id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId,
    activityType: type,
    description,
    timestamp: new Date().toISOString(),
  };
  db.activities.unshift(newActivity); // newest first
  saveDb();
}

// --- SECURE CUSTOM SESSION VERIFICATION MIDDLEWARE ---
function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Missing authorization token" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Invalid token format" });
  }

  const userId = db.sessions[token];
  if (!userId) {
    return res.status(401).json({ error: "Invalid or expired session token" });
  }

  req.userId = userId;
  next();
}

// --- AUTH API ENDPOINTS ---

// Register
app.post("/api/auth/register", (req, res) => {
  const { email, password, name, avatar, timezone, preferredReminderTime } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password, and name are required." });
  }

  const exists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const newUser: User = {
    id: `user_${Date.now()}`,
    name,
    email: email.toLowerCase(),
    passwordHash: password, // Store password simply for dev sandbox
    avatar: avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    timezone: timezone || "America/Los_Angeles",
    preferredReminderTime: preferredReminderTime || "09:00",
    favoriteQuotes: [],
  };

  db.users.push(newUser);

  // Initialize a few tasks for the new user, including some habits so they don't look blank
  db.dailies.push(
    {
      id: `daily_${Date.now()}_1`,
      userId: newUser.id,
      title: "LeetCode Dynamic Problem Drill",
      description: "Solve a hard string array problem.",
      dueDate: new Date().toISOString().split("T")[0],
      priority: "High",
      status: "pending",
      streakCount: 0,
      longestStreak: 0,
      completedCount: 0,
      missedCount: 0,
      lastCompletedDate: null,
      lastMissedDate: null,
      isRecurring: true,
      repeatType: "daily",
      repeatDays: [],
    },
    {
      id: `daily_${Date.now()}_2`,
      userId: newUser.id,
      title: "Review System Design Patterns",
      description: "Read about cache strategies.",
      dueDate: new Date().toISOString().split("T")[0],
      priority: "Medium",
      status: "pending",
      streakCount: 0,
      longestStreak: 0,
      completedCount: 0,
      missedCount: 0,
      lastCompletedDate: null,
      lastMissedDate: null,
      isRecurring: true,
      repeatType: "weekdays",
      repeatDays: [],
    }
  );

  const token = `token_${Math.random().toString(36).substr(2, 10)}${Date.now()}`;
  db.sessions[token] = newUser.id;
  saveDb();

  logActivity(newUser.id, "Account Created", `User ${name} joined GoalTracker.`);

  res.status(201).json({
    message: "Registration successful",
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      avatar: newUser.avatar,
      timezone: newUser.timezone,
      preferredReminderTime: newUser.preferredReminderTime,
      favoriteQuotes: newUser.favoriteQuotes,
    },
  });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = `token_${Math.random().toString(36).substr(2, 10)}${Date.now()}`;
  db.sessions[token] = user.id;
  saveDb();

  logActivity(user.id, "Login", `User ${user.name} logged in.`);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      timezone: user.timezone,
      preferredReminderTime: user.preferredReminderTime,
      favoriteQuotes: user.favoriteQuotes,
    },
  });
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    if (token && db.sessions[token]) {
      const uId = db.sessions[token];
      logActivity(uId, "Logout", "Logged out securely.");
      delete db.sessions[token];
      saveDb();
    }
  }
  res.json({ message: "Logout successful" });
});

// Refresh token wrapper
app.post("/api/auth/refresh", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Missing token" });
  const oldToken = authHeader.split(" ")[1];
  const userId = db.sessions[oldToken];

  if (!userId) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const newToken = `token_ref_${Math.random().toString(36).substr(2, 10)}${Date.now()}`;
  db.sessions[newToken] = userId;
  delete db.sessions[oldToken];
  saveDb();

  res.json({ token: newToken });
});

// Get/Edit Profile
app.get("/api/auth/profile", authenticate, (req: any, res) => {
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.put("/api/auth/profile", authenticate, (req: any, res) => {
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { name, avatar, timezone, preferredReminderTime } = req.body;
  if (name) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;
  if (timezone) user.timezone = timezone;
  if (preferredReminderTime) user.preferredReminderTime = preferredReminderTime;

  saveDb();
  res.json({
    message: "Profile updated successfully.",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      timezone: user.timezone,
      preferredReminderTime: user.preferredReminderTime,
      favoriteQuotes: user.favoriteQuotes,
    },
  });
});

// --- GOALS CRUD ---
app.get("/api/goals", authenticate, (req: any, res) => {
  const userGoals = db.goals.filter((g) => g.userId === req.userId);
  res.json(userGoals);
});

app.post("/api/goals", authenticate, (req: any, res) => {
  const { title, description, targetDate, priority, status } = req.body;
  if (!title) return res.status(400).json({ error: "Goal title is required" });

  const newGoal: Goal = {
    id: `goal_${Date.now()}`,
    userId: req.userId,
    title,
    description: description || "",
    targetDate: targetDate || "",
    priority: priority || "Medium",
    status: status || "Not Started",
    progressPercentage: 0,
  };

  db.goals.push(newGoal);
  saveDb();
  logActivity(req.userId, "Goal Created", `New Goal Created: "${title}"`);
  res.status(201).json(newGoal);
});

app.put("/api/goals/:id", authenticate, (req: any, res) => {
  const goal = db.goals.find((g) => g.id === req.params.id && g.userId === req.userId);
  if (!goal) return res.status(404).json({ error: "Goal not found" });

  const { title, description, targetDate, priority, status, progressPercentage } = req.body;
  if (title) goal.title = title;
  if (description !== undefined) goal.description = description;
  if (targetDate !== undefined) goal.targetDate = targetDate;
  if (priority) goal.priority = priority;
  if (status) goal.status = status;
  if (progressPercentage !== undefined) goal.progressPercentage = Number(progressPercentage);

  saveDb();
  logActivity(req.userId, "Goal Updated", `Goal Updated: "${goal.title}" (${goal.status})`);
  res.json(goal);
});

app.delete("/api/goals/:id", authenticate, (req: any, res) => {
  const idx = db.goals.findIndex((g) => g.id === req.params.id && g.userId === req.userId);
  if (idx === -1) return res.status(404).json({ error: "Goal not found" });

  const title = db.goals[idx].title;
  db.goals.splice(idx, 1);

  // Cascade delete associated items
  db.tasks = db.tasks.filter((t) => t.goalId !== req.params.id);
  db.skills = db.skills.filter((s) => s.goalId !== req.params.id);
  db.courses = db.courses.filter((c) => c.goalId !== req.params.id);

  saveDb();
  logActivity(req.userId, "Goal Deleted", `Deleted Goal: "${title}" and cascaded items.`);
  res.json({ message: "Goal deleted successfully" });
});

// --- GOAL TASKS CRUD ---
app.get("/api/goals/:goalId/tasks", authenticate, (req: any, res) => {
  const goalTasks = db.tasks.filter((t) => t.goalId === req.params.goalId && t.userId === req.userId);
  // Sort by orderIndex
  goalTasks.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  res.json(goalTasks);
});

app.post("/api/goals/:goalId/tasks", authenticate, (req: any, res) => {
  const { title, description, dueDate, priority, progressPercentage } = req.body;
  if (!title) return res.status(400).json({ error: "Task title is required" });

  const siblings = db.tasks.filter((t) => t.goalId === req.params.goalId && t.userId === req.userId);

  const newTask: GoalTask = {
    id: `task_${Date.now()}`,
    goalId: req.params.goalId,
    userId: req.userId,
    title,
    description: description || "",
    dueDate: dueDate || "",
    priority: priority || "Medium",
    progressPercentage: Number(progressPercentage || 0),
    completed: false,
    inProgress: false,
    orderIndex: siblings.length,
  };

  db.tasks.push(newTask);
  saveDb();
  logActivity(req.userId, "Task Created", `Created goal task: "${title}"`);
  res.status(201).json(newTask);
});

app.put("/api/tasks/:id", authenticate, (req: any, res) => {
  const task = db.tasks.find((t) => t.id === req.params.id && t.userId === req.userId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const { title, description, dueDate, priority, progressPercentage, completed, inProgress, orderIndex } = req.body;
  if (title) task.title = title;
  if (description !== undefined) task.description = description;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (priority) task.priority = priority;
  if (progressPercentage !== undefined) {
    task.progressPercentage = Number(progressPercentage);
    if (task.progressPercentage === 100) {
      task.completed = true;
      task.inProgress = false;
    } else if (task.progressPercentage > 0) {
      task.completed = false;
      task.inProgress = true;
    }
  }
  if (completed !== undefined) {
    task.completed = completed;
    if (completed) {
      task.progressPercentage = 100;
      task.inProgress = false;
    } else {
      task.progressPercentage = 0;
    }
  }
  if (inProgress !== undefined) {
    task.inProgress = inProgress;
    if (inProgress) {
      task.completed = false;
      task.progressPercentage = task.progressPercentage || 25;
    }
  }
  if (orderIndex !== undefined) {
    task.orderIndex = Number(orderIndex);
  }

  saveDb();
  res.json(task);
});

app.delete("/api/tasks/:id", authenticate, (req: any, res) => {
  const idx = db.tasks.findIndex((t) => t.id === req.params.id && t.userId === req.userId);
  if (idx === -1) return res.status(404).json({ error: "Task not found" });

  const t = db.tasks[idx];
  db.tasks.splice(idx, 1);
  saveDb();
  logActivity(req.userId, "Task Deleted", `Removed task: "${t.title}"`);
  res.json({ message: "Task deleted successfully" });
});

app.post("/api/tasks/:id/toggle_complete", authenticate, (req: any, res) => {
  const task = db.tasks.find((t) => t.id === req.params.id && t.userId === req.userId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  task.completed = !task.completed;
  if (task.completed) {
    task.progressPercentage = 100;
    task.inProgress = false;
    logActivity(req.userId, "Task Completed", `Completed task: "${task.title}"`);
  } else {
    task.progressPercentage = 0;
    logActivity(req.userId, "Task Status Reverted", `Reverted completion: "${task.title}"`);
  }

  saveDb();
  res.json(task);
});

app.post("/api/tasks/:id/toggle_inprogress", authenticate, (req: any, res) => {
  const task = db.tasks.find((t) => t.id === req.params.id && t.userId === req.userId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  task.inProgress = !task.inProgress;
  if (task.inProgress) {
    task.completed = false;
    task.progressPercentage = (task.progressPercentage && task.progressPercentage < 100) ? task.progressPercentage : 25;
    logActivity(req.userId, "Task In Progress", `Marked In Progress: "${task.title}"`);
  } else {
    task.progressPercentage = 0;
  }

  saveDb();
  res.json(task);
});

// --- SKILLS CRUD ---
app.get("/api/goals/:goalId/skills", authenticate, (req: any, res) => {
  const skills = db.skills.filter((s) => s.goalId === req.params.goalId && s.userId === req.userId);
  res.json(skills);
});

app.post("/api/goals/:goalId/skills", authenticate, (req: any, res) => {
  const { skillName, confidenceLevel, status, notes, resourceUrl } = req.body;
  if (!skillName) return res.status(400).json({ error: "Skill name is required" });

  const newSkill: Skill = {
    id: `skill_${Date.now()}`,
    goalId: req.params.goalId,
    userId: req.userId,
    skillName,
    confidenceLevel: Number(confidenceLevel || 3),
    status: status || "Learning",
    notes: notes || "",
    resourceUrl: resourceUrl || "",
  };

  db.skills.push(newSkill);
  saveDb();
  logActivity(req.userId, "Skill Updated", `Started learning skill: "${skillName}"`);
  res.status(201).json(newSkill);
});

app.put("/api/skills/:id", authenticate, (req: any, res) => {
  const skill = db.skills.find((s) => s.id === req.params.id && s.userId === req.userId);
  if (!skill) return res.status(404).json({ error: "Skill not found" });

  const { skillName, confidenceLevel, status, notes, resourceUrl } = req.body;
  if (skillName) skill.skillName = skillName;
  if (confidenceLevel !== undefined) skill.confidenceLevel = Number(confidenceLevel);
  if (status) skill.status = status;
  if (notes !== undefined) skill.notes = notes;
  if (resourceUrl !== undefined) skill.resourceUrl = resourceUrl;

  saveDb();
  logActivity(req.userId, "Skill Updated", `Updated Skill: "${skill.skillName}" confidence: ${skill.confidenceLevel}/5`);
  res.json(skill);
});

app.delete("/api/skills/:id", authenticate, (req: any, res) => {
  const idx = db.skills.findIndex((s) => s.id === req.params.id && s.userId === req.userId);
  if (idx === -1) return res.status(404).json({ error: "Skill not found" });

  const s = db.skills[idx];
  db.skills.splice(idx, 1);
  saveDb();
  logActivity(req.userId, "Skill Deleted", `Removed Skill: "${s.skillName}"`);
  res.json({ message: "Skill deleted successfully" });
});

// --- COURSES CRUD & BUSINESS RULE BOUNDARY ---
// Rule: Max 4 active/in-progress courses per user.
app.get("/api/goals/:goalId/courses", authenticate, (req: any, res) => {
  const courses = db.courses.filter((c) => c.goalId === req.params.goalId && c.userId === req.userId);
  res.json(courses);
});

app.post("/api/goals/:goalId/courses", authenticate, (req: any, res) => {
  const { courseName, platform, courseUrl, instructor, totalLessons, due_date, pausedStatus } = req.body;
  if (!courseName) return res.status(400).json({ error: "Course name is required" });

  const activeCount = db.courses.filter(
    (c) => c.userId === req.userId && c.pausedStatus === false && c.completedLessons < c.totalLessons
  ).length;

  // If trying to create a newly active course, block it
  const isCreatingActive = pausedStatus === undefined ? true : !pausedStatus;
  if (isCreatingActive && activeCount >= 4) {
    return res.status(400).json({
      error: "Maximum of 4 active courses allowed. Please pause or complete an existing course before starting a new one.",
    });
  }

  const newCourse: Course = {
    id: `course_${Date.now()}`,
    goalId: req.params.goalId,
    userId: req.userId,
    courseName,
    platform: platform || "Udemy",
    courseUrl: courseUrl || "",
    instructor: instructor || "",
    totalLessons: Number(totalLessons || 10),
    completedLessons: 0,
    dueDate: due_date || "",
    pausedStatus: isCreatingActive ? false : true,
    progressPercentage: 0,
  };

  db.courses.push(newCourse);
  saveDb();
  logActivity(req.userId, "Course Enrolled", `Enrolled in Course: "${courseName}"`);
  res.status(201).json(newCourse);
});

app.put("/api/courses/:id", authenticate, (req: any, res) => {
  const course = db.courses.find((c) => c.id === req.params.id && c.userId === req.userId);
  if (!course) return res.status(404).json({ error: "Course not found" });

  const { courseName, platform, courseUrl, instructor, totalLessons, completedLessons, due_date, pausedStatus } = req.body;

  // If user tries to transition Course from Paused -> Active, check boundary limits!
  if (pausedStatus !== undefined && pausedStatus === false && course.pausedStatus === true) {
    const activeCount = db.courses.filter(
      (c) => c.userId === req.userId && c.pausedStatus === false && c.completedLessons < c.totalLessons
    ).length;
    if (activeCount >= 4) {
      return res.status(400).json({
        error: "Maximum of 4 active courses allowed. Please pause or complete an existing course before activating this one.",
      });
    }
  }

  if (courseName) course.courseName = courseName;
  if (platform !== undefined) course.platform = platform;
  if (courseUrl !== undefined) course.courseUrl = courseUrl;
  if (instructor !== undefined) course.instructor = instructor;
  if (totalLessons !== undefined) course.totalLessons = Number(totalLessons);
  if (completedLessons !== undefined) {
    course.completedLessons = Number(completedLessons);
    course.progressPercentage = Math.round((course.completedLessons / course.totalLessons) * 100);
  }
  if (due_date !== undefined) course.dueDate = due_date;
  if (pausedStatus !== undefined) course.pausedStatus = pausedStatus;

  saveDb();
  res.json(course);
});

app.delete("/api/courses/:id", authenticate, (req: any, res) => {
  const idx = db.courses.findIndex((c) => c.id === req.params.id && c.userId === req.userId);
  if (idx === -1) return res.status(404).json({ error: "Course not found" });

  const c = db.courses[idx];
  db.courses.splice(idx, 1);

  // Cascade delete Chapters
  db.chapters = db.chapters.filter((chap) => chap.courseId !== req.params.id);

  saveDb();
  logActivity(req.userId, "Course Deleted", `Deleted Course: "${c.courseName}"`);
  res.json({ message: "Course deleted successfully" });
});

app.post("/api/courses/:id/toggle_pause", authenticate, (req: any, res) => {
  const course = db.courses.find((c) => c.id === req.params.id && c.userId === req.userId);
  if (!course) return res.status(404).json({ error: "Course not found" });

  // Toggling to resumed (pausedStatus becomes false)
  if (course.pausedStatus) {
    // Check boundary
    const activeCount = db.courses.filter(
      (c) => c.userId === req.userId && c.pausedStatus === false && c.completedLessons < c.totalLessons
    ).length;
    if (activeCount >= 4) {
      return res.status(400).json({
        error: "Maximum of 4 active/in-progress courses allowed. Pause or complete another course first.",
      });
    }
  }

  course.pausedStatus = !course.pausedStatus;
  saveDb();
  logActivity(
    req.userId,
    course.pausedStatus ? "Course Paused" : "Course Resumed",
    course.pausedStatus ? `Paused: "${course.courseName}"` : `Resumed study: "${course.courseName}"`
  );
  res.json(course);
});

// --- CHAPTERS CRUD ---
app.get("/api/courses/:courseId/chapters", authenticate, (req: any, res) => {
  const chapters = db.chapters.filter((chap) => chap.courseId === req.params.courseId && chap.userId === req.userId);
  res.json(chapters);
});

app.post("/api/courses/:courseId/chapters", authenticate, (req: any, res) => {
  const { chapterName, description, googleDocsNotesUrl, externalResourceUrl } = req.body;
  if (!chapterName) return res.status(400).json({ error: "Chapter name is required" });

  const newChap: Chapter = {
    id: `chap_${Date.now()}`,
    courseId: req.params.courseId,
    userId: req.userId,
    chapterName,
    description: description || "",
    progressPercentage: 0,
    completedStatus: false,
    googleDocsNotesUrl: googleDocsNotesUrl || "",
    externalResourceUrl: externalResourceUrl || "",
  };

  db.chapters.push(newChap);

  // Recalculate lessons counts on Course
  const course = db.courses.find((c) => c.id === req.params.courseId);
  if (course) {
    const courseChaps = db.chapters.filter((ch) => ch.courseId === course.id);
    course.totalLessons = courseChaps.length;
    course.completedLessons = courseChaps.filter((ch) => ch.completedStatus).length;
    course.progressPercentage = Math.round((course.completedLessons / course.totalLessons) * 100) || 0;
  }

  saveDb();
  res.status(201).json(newChap);
});

app.put("/api/chapters/:id", authenticate, (req: any, res) => {
  const chap = db.chapters.find((ch) => ch.id === req.params.id && ch.userId === req.userId);
  if (!chap) return res.status(404).json({ error: "Chapter not found" });

  const { chapterName, description, completedStatus, googleDocsNotesUrl, externalResourceUrl, progressPercentage } = req.body;

  if (chapterName) chap.chapterName = chapterName;
  if (description !== undefined) chap.description = description;
  if (completedStatus !== undefined) {
    chap.completedStatus = completedStatus;
    chap.progressPercentage = completedStatus ? 100 : 0;
  }
  if (progressPercentage !== undefined) {
    chap.progressPercentage = Number(progressPercentage);
    chap.completedStatus = chap.progressPercentage === 100;
  }
  if (googleDocsNotesUrl !== undefined) chap.googleDocsNotesUrl = googleDocsNotesUrl;
  if (externalResourceUrl !== undefined) chap.externalResourceUrl = externalResourceUrl;

  // Reset/sync quantities
  const course = db.courses.find((c) => c.id === chap.courseId);
  if (course) {
    const courseChaps = db.chapters.filter((ch) => ch.courseId === course.id);
    course.totalLessons = courseChaps.length;
    course.completedLessons = courseChaps.filter((ch) => ch.completedStatus).length;
    course.progressPercentage = Math.round((course.completedLessons / course.totalLessons) * 100) || 0;

    if (completedStatus) {
      logActivity(req.userId, "Lesson Completed", `Studied lesson: "${chap.chapterName}" under "${course.courseName}"`);
    }
  }

  saveDb();
  res.json(chap);
});

app.delete("/api/chapters/:id", authenticate, (req: any, res) => {
  const idx = db.chapters.findIndex((ch) => ch.id === req.params.id && ch.userId === req.userId);
  if (idx === -1) return res.status(404).json({ error: "Chapter not found" });

  const chap = db.chapters[idx];
  db.chapters.splice(idx, 1);

  // Sync course percentage
  const course = db.courses.find((c) => c.id === chap.courseId);
  if (course) {
    const courseChaps = db.chapters.filter((ch) => ch.courseId === course.id);
    course.totalLessons = courseChaps.length;
    course.completedLessons = courseChaps.filter((ch) => ch.completedStatus).length;
    course.progressPercentage = Math.round((course.completedLessons / course.totalLessons) * 100) || 0;
  }

  saveDb();
  res.json({ message: "Chapter deleted successfully" });
});

// --- PROJECTS CRUD ---
app.get("/api/projects", authenticate, (req: any, res) => {
  const projs = db.projects.filter((p) => p.userId === req.userId);
  res.json(projs);
});

app.post("/api/projects", authenticate, (req: any, res) => {
  const { title, description, status, repositoryUrl, liveDemoUrl } = req.body;
  if (!title) return res.status(400).json({ error: "Project Title is required" });

  const newProj: Project = {
    id: `proj_${Date.now()}`,
    userId: req.userId,
    title,
    description: description || "",
    status: status || "Planning",
    progressPercentage: 0,
    repositoryUrl: repositoryUrl || "",
    liveDemoUrl: liveDemoUrl || "",
  };

  db.projects.push(newProj);
  saveDb();
  logActivity(req.userId, "Project Updated", `Initiated portfolio project: "${title}"`);
  res.status(201).json(newProj);
});

app.put("/api/projects/:id", authenticate, (req: any, res) => {
  const proj = db.projects.find((p) => p.id === req.params.id && p.userId === req.userId);
  if (!proj) return res.status(404).json({ error: "Project not found" });

  const { title, description, status, progressPercentage, repositoryUrl, liveDemoUrl } = req.body;
  if (title) proj.title = title;
  if (description !== undefined) proj.description = description;
  if (status) proj.status = status;
  if (progressPercentage !== undefined) proj.progressPercentage = Number(progressPercentage);
  if (repositoryUrl !== undefined) proj.repositoryUrl = repositoryUrl;
  if (liveDemoUrl !== undefined) proj.liveDemoUrl = liveDemoUrl;

  saveDb();
  logActivity(req.userId, "Project Updated", `Updated Project: "${proj.title}" (${proj.status})`);
  res.json(proj);
});

app.delete("/api/projects/:id", authenticate, (req: any, res) => {
  const idx = db.projects.findIndex((p) => p.id === req.params.id && p.userId === req.userId);
  if (idx === -1) return res.status(404).json({ error: "Project not found" });

  const title = db.projects[idx].title;
  db.projects.splice(idx, 1);

  // Cascade delete associated Project Tasks
  db.projectTasks = db.projectTasks.filter((pt) => pt.projectId !== req.params.id);

  saveDb();
  logActivity(req.userId, "Project Deleted", `Removed Project: "${title}"`);
  res.json({ message: "Project deleted successfully" });
});

// --- PROJECT TASKS (SUBTASKS) ---
app.get("/api/projects/:projectId/tasks", authenticate, (req: any, res) => {
  const tasks = db.projectTasks.filter((pt) => pt.projectId === req.params.projectId && pt.userId === req.userId);
  res.json(tasks);
});

app.post("/api/projects/:projectId/tasks", authenticate, (req: any, res) => {
  const { title, description, taskResourceUrl, documentationUrl, githubCommitUrl, githubPrUrl } = req.body;
  if (!title) return res.status(400).json({ error: "Project Task title is required" });

  const newPTask: ProjectSubtask = {
    id: `ptask_${Date.now()}`,
    projectId: req.params.projectId,
    userId: req.userId,
    title,
    description: description || "",
    status: "Pending",
    completed: false,
    inProgress: false,
    taskResourceUrl: taskResourceUrl || "",
    documentationUrl: documentationUrl || "",
    githubCommitUrl: githubCommitUrl || "",
    githubPrUrl: githubPrUrl || "",
  };

  db.projectTasks.push(newPTask);

  // Recalculate Project Progress based on subtasks
  const proj = db.projects.find((p) => p.id === req.params.projectId);
  if (proj) {
    const sibs = db.projectTasks.filter((pt) => pt.projectId === proj.id);
    const completed = sibs.filter((pt) => pt.completed).length;
    proj.progressPercentage = Math.round((completed / sibs.length) * 100) || 0;
  }

  saveDb();
  res.status(201).json(newPTask);
});

app.put("/api/project-tasks/:id", authenticate, (req: any, res) => {
  const ptask = db.projectTasks.find((pt) => pt.id === req.params.id && pt.userId === req.userId);
  if (!ptask) return res.status(404).json({ error: "Project subtask not found" });

  const { title, description, status, completed, inProgress, taskResourceUrl, documentationUrl, githubCommitUrl, githubPrUrl } = req.body;

  if (title) ptask.title = title;
  if (description !== undefined) ptask.description = description;

  if (completed !== undefined) {
    ptask.completed = completed;
    ptask.status = completed ? "Completed" : "Pending";
    ptask.inProgress = completed ? false : ptask.inProgress;
  }
  if (inProgress !== undefined) {
    ptask.inProgress = inProgress;
    ptask.status = inProgress ? "In Progress" : ptask.completed ? "Completed" : "Pending";
    if (inProgress) ptask.completed = false;
  }
  if (status !== undefined) {
    ptask.status = status;
    ptask.completed = status === "Completed";
    ptask.inProgress = status === "In Progress";
  }

  if (taskResourceUrl !== undefined) ptask.taskResourceUrl = taskResourceUrl;
  if (documentationUrl !== undefined) ptask.documentationUrl = documentationUrl;
  if (githubCommitUrl !== undefined) ptask.githubCommitUrl = githubCommitUrl;
  if (githubPrUrl !== undefined) ptask.githubPrUrl = githubPrUrl;

  // Auto sync project percentage
  const proj = db.projects.find((p) => p.id === ptask.projectId);
  if (proj) {
    const sibs = db.projectTasks.filter((pt) => pt.projectId === proj.id);
    const completedCount = sibs.filter((pt) => pt.completed).length;
    proj.progressPercentage = Math.round((completedCount / sibs.length) * 100) || 0;

    if (ptask.completed) {
      logActivity(req.userId, "Project Updated", `Solved Project Subtask: "${ptask.title}" under "${proj.title}"`);
    }
  }

  saveDb();
  res.json(ptask);
});

app.delete("/api/project-tasks/:id", authenticate, (req: any, res) => {
  const idx = db.projectTasks.findIndex((pt) => pt.id === req.params.id && pt.userId === req.userId);
  if (idx === -1) return res.status(404).json({ error: "Project task not found" });

  const t = db.projectTasks[idx];
  db.projectTasks.splice(idx, 1);

  // Sync parent project progress
  const proj = db.projects.find((p) => p.id === t.projectId);
  if (proj) {
    const sibs = db.projectTasks.filter((pt) => pt.projectId === proj.id);
    const completedCount = sibs.filter((pt) => pt.completed).length;
    proj.progressPercentage = sibs.length ? Math.round((completedCount / sibs.length) * 100) : 0;
  }

  saveDb();
  res.json({ message: "Project subtask deleted successfully" });
});

// --- DAILY TASKS & HABITS TRACKING ---
// Supporting: Recurring custom days schedules (Monday...Sunday, weekends, weekdays)
// Streak increment, missed counting, reset to pending, ignore unscheduled.
function isScheduledOnToday(task: DailyTask, todayDateStr: string): boolean {
  if (!task.isRecurring) return true;
  const dateObj = new Date(todayDateStr + "T12:00:00"); // Avoid timezone shifting to previous day
  const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dateObj.getDay()];
  const dayIdx = dateObj.getDay(); // 0 is Sun, 6 is Sat

  if (task.repeatType === "daily") return true;
  if (task.repeatType === "weekdays") return dayIdx >= 1 && dayIdx <= 5;
  if (task.repeatType === "weekends") return dayIdx === 0 || dayIdx === 6;
  if (task.repeatType === "custom") {
    return task.repeatDays && task.repeatDays.includes(dayName);
  }
  return false;
}

app.get("/api/dailies", authenticate, (req: any, res) => {
  const dailies = db.dailies.filter((d) => d.userId === req.userId);
  res.json(dailies);
});

app.post("/api/dailies", authenticate, (req: any, res) => {
  const { title, description, priority, isRecurring, repeatType, repeatDays } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required for daily task" });

  const defaultRepeatDays = repeatDays || [];

  const newDaily: DailyTask = {
    id: `daily_${Date.now()}`,
    userId: req.userId,
    title,
    description: description || "",
    dueDate: new Date().toISOString().split("T")[0],
    priority: priority || "Medium",
    status: "pending",
    streakCount: 0,
    longestStreak: 0,
    completedCount: 0,
    missedCount: 0,
    lastCompletedDate: null,
    lastMissedDate: null,
    isRecurring: isRecurring || false,
    repeatType: repeatType || "daily",
    repeatDays: defaultRepeatDays,
  };

  db.dailies.push(newDaily);
  saveDb();
  logActivity(req.userId, "Habit Created", `Created Daily Habit: "${title}"`);
  res.status(201).json(newDaily);
});

app.put("/api/dailies/:id", authenticate, (req: any, res) => {
  const daily = db.dailies.find((d) => d.id === req.params.id && d.userId === req.userId);
  if (!daily) return res.status(404).json({ error: "Daily task not found" });

  const { title, description, priority, isRecurring, repeatType, repeatDays } = req.body;
  if (title) daily.title = title;
  if (description !== undefined) daily.description = description;
  if (priority) daily.priority = priority;
  if (isRecurring !== undefined) daily.isRecurring = isRecurring;
  if (repeatType !== undefined) daily.repeatType = repeatType;
  if (repeatDays !== undefined) daily.repeatDays = repeatDays;

  saveDb();
  res.json(daily);
});

app.delete("/api/dailies/:id", authenticate, (req: any, res) => {
  const idx = db.dailies.findIndex((d) => d.id === req.params.id && d.userId === req.userId);
  if (idx === -1) return res.status(404).json({ error: "Daily task not found" });

  const title = db.dailies[idx].title;
  db.dailies.splice(idx, 1);
  saveDb();
  logActivity(req.userId, "Habit Deleted", `Removed habit: "${title}"`);
  res.json({ message: "Daily task deleted successfully" });
});

// STREAK COMPLETE TRIGGER
app.post("/api/dailies/:id/complete", authenticate, (req: any, res) => {
  const daily = db.dailies.find((d) => d.id === req.params.id && d.userId === req.userId);
  if (!daily) return res.status(404).json({ error: "Daily task not found" });

  const user = db.users.find((u) => u.id === req.userId);
  const tz = user?.timezone || "America/Los_Angeles";

  // Calculate local "today" date string in YYYY-MM-DD
  const userTimeStr = new Date().toLocaleString("en-US", { timeZone: tz });
  const userDate = new Date(userTimeStr);
  const year = userDate.getFullYear();
  const month = String(userDate.getMonth() + 1).padStart(2, "0");
  const day = String(userDate.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  if (daily.lastCompletedDate === todayStr) {
    // Already completed today, return
    return res.json(daily);
  }

  // Backup current state for pending resets!
  daily.previousStreakCount = daily.streakCount;

  // Streak calculations:
  // Find last scheduled date before "todayStr"
  let lastScheduledStr: string | null = null;
  let seekDate = new Date(`${todayStr}T12:00:00`);

  // Search backward up to 30 days to locate previous scheduled day
  for (let i = 1; i <= 30; i++) {
    seekDate.setDate(seekDate.getDate() - 1);
    const tempYear = seekDate.getFullYear();
    const tempMonth = String(seekDate.getMonth() + 1).padStart(2, "0");
    const tempDay = String(seekDate.getDate()).padStart(2, "0");
    const tempStr = `${tempYear}-${tempMonth}-${tempDay}`;

    if (isScheduledOnToday(daily, tempStr)) {
      lastScheduledStr = tempStr;
      break;
    }
  }

  let finalStreak = daily.streakCount;
  if (!lastScheduledStr) {
    // No previous day found scheduled, streak is 1
    finalStreak = 1;
  } else {
    // If the last scheduled day is completed, increment
    if (daily.lastCompletedDate === lastScheduledStr) {
      finalStreak += 1;
    } else {
      // Habit was missed on previous scheduled day, so streak resets
      finalStreak = 1;
    }
  }

  daily.streakCount = finalStreak;
  daily.longestStreak = Math.max(daily.longestStreak || 0, finalStreak);
  daily.status = "completed";
  daily.completedCount = (daily.completedCount || 0) + 1;
  daily.lastCompletedDate = todayStr;

  saveDb();
  logActivity(req.userId, "Habit Completed", `Completed habit: "${daily.title}". Streak is now ${daily.streakCount} days.`);
  res.json(daily);
});

// MISS HABIT TRIGGER
app.post("/api/dailies/:id/miss", authenticate, (req: any, res) => {
  const daily = db.dailies.find((d) => d.id === req.params.id && d.userId === req.userId);
  if (!daily) return res.status(404).json({ error: "Daily task not found" });

  const user = db.users.find((u) => u.id === req.userId);
  const tz = user?.timezone || "America/Los_Angeles";
  const userTimeStr = new Date().toLocaleString("en-US", { timeZone: tz });
  const userDate = new Date(userTimeStr);
  const year = userDate.getFullYear();
  const month = String(userDate.getMonth() + 1).padStart(2, "0");
  const day = String(userDate.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  // Save previous streak for reverting safely
  daily.previousStreakCount = daily.streakCount;

  daily.status = "missed";
  daily.streakCount = 0;
  daily.missedCount = (daily.missedCount || 0) + 1;
  daily.lastMissedDate = todayStr;

  saveDb();
  logActivity(req.userId, "Habit Missed", `Missed today's habit: "${daily.title}". Streak reset to 0.`);
  res.json(daily);
});

// RESET TRIGGER (Back to Pending)
app.post("/api/dailies/:id/reset", authenticate, (req: any, res) => {
  const daily = db.dailies.find((d) => d.id === req.params.id && d.userId === req.userId);
  if (!daily) return res.status(404).json({ error: "Daily task not found" });

  const formerStatus = daily.status;

  // Restore the streak to its pre-action count if it was completes/missed today
  if (daily.previousStreakCount !== undefined) {
    daily.streakCount = daily.previousStreakCount;
  }

  if (formerStatus === "completed") {
    daily.completedCount = Math.max(0, (daily.completedCount || 1) - 1);
    daily.lastCompletedDate = null;
  } else if (formerStatus === "missed") {
    daily.missedCount = Math.max(0, (daily.missedCount || 1) - 1);
    daily.lastMissedDate = null;
  }

  daily.status = "pending";
  saveDb();
  logActivity(req.userId, "Habit Reset", `Reset status of habit: "${daily.title}" back to pending.`);
  res.json(daily);
});

// --- ACTIVITIES API ---
app.get("/api/activities", authenticate, (req: any, res) => {
  const feed = db.activities.filter((a) => a.userId === req.userId);
  res.json(feed);
});

// --- QUOTES API ---
app.get("/api/quotes", authenticate, (req: any, res) => {
  const user = db.users.find((u) => u.id === req.userId);
  const favorites = user?.favoriteQuotes || [];
  const withFavorites = db.quotes.map((q) => ({
    ...q,
    isFavorite: favorites.includes(q.id),
  }));
  res.json(withFavorites);
});

// Toggle Favorite Quotes
app.post("/api/quotes/:id/favorite", authenticate, (req: any, res) => {
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const quoteId = req.params.id;
  const exists = db.quotes.some((q) => q.id === quoteId);
  if (!exists) return res.status(404).json({ error: "Quote not found" });

  if (!user.favoriteQuotes) user.favoriteQuotes = [];
  const idx = user.favoriteQuotes.indexOf(quoteId);

  if (idx > -1) {
    user.favoriteQuotes.splice(idx, 1);
  } else {
    user.favoriteQuotes.push(quoteId);
  }

  saveDb();
  res.json({
    favoriteQuotes: user.favoriteQuotes,
    isFavorite: user.favoriteQuotes.includes(quoteId),
  });
});

// --- PREDICTIVE INSIGHTS & MOOD TRACKING API ---

// Support scheduled background calculation by periodically running calculations for cached entries
// Background calculation job runner simulating every hour loop
setInterval(() => {
  console.log("[GoalTracker Engine] Triggering background calculation of predictive analytics cache...");
  const uniqueUserIds = [...new Set(db.users.map((u) => u.id))];
  uniqueUserIds.forEach((uId) => {
    try {
      const result = calculateUserInsights(
        uId,
        db.goals,
        db.tasks,
        db.skills,
        db.courses,
        db.chapters,
        db.projects,
        db.projectTasks,
        db.dailies,
        db.activities,
        db.moodLogs
      );
      db.analyticsCache[uId] = result;
    } catch (e) {
      console.error(`Background job failed for user ${uId}:`, e);
    }
  });
  saveDb();
}, 1000 * 60 * 60);

app.get("/api/insights", authenticate, (req: any, res) => {
  try {
    let cached = db.analyticsCache[req.userId];
    if (!cached || !cached.lastUpdated) {
      cached = calculateUserInsights(
        req.userId,
        db.goals,
        db.tasks,
        db.skills,
        db.courses,
        db.chapters,
        db.projects,
        db.projectTasks,
        db.dailies,
        db.activities,
        db.moodLogs
      );
      db.analyticsCache[req.userId] = cached;
      saveDb();
    }
    res.json(cached);
  } catch (err: any) {
    console.error("Insights calculation error:", err);
    res.status(500).json({ error: "Could not calculate analytical metrics yet. Try adding some activities, goals, or direct daily habits." });
  }
});

app.post("/api/insights/recalculate", authenticate, (req: any, res) => {
  try {
    const updated = calculateUserInsights(
      req.userId,
      db.goals,
      db.tasks,
      db.skills,
      db.courses,
      db.chapters,
      db.projects,
      db.projectTasks,
      db.dailies,
      db.activities,
      db.moodLogs
    );
    db.analyticsCache[req.userId] = updated;
    saveDb();
    res.json(updated);
  } catch (err: any) {
    console.error("Insights database recalculate error:", err);
    res.status(500).json({ error: "Failed to force recalculation index." });
  }
});

app.get("/api/mood/history", authenticate, (req: any, res) => {
  const userMoods = db.moodLogs.filter((m) => m.userId === req.userId);
  res.json(userMoods);
});

app.post("/api/mood", authenticate, (req: any, res) => {
  const { mood, date } = req.body;
  if (!mood) {
    return res.status(400).json({ error: "Mood selection index is required" });
  }

  const validMoods = ["Motivated", "Happy", "Neutral", "Stressed", "Tired"];
  if (!validMoods.includes(mood)) {
    return res.status(400).json({ error: "Provided mood key is invalid" });
  }

  let entryDate = date;
  if (!entryDate) {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    entryDate = `${year}-${month}-${day}`;
  }

  // Update existing or push new entry
  const existingIdx = db.moodLogs.findIndex((m) => m.userId === req.userId && m.date === entryDate);
  if (existingIdx > -1) {
    db.moodLogs[existingIdx].mood = mood;
  } else {
    db.moodLogs.push({
      id: `mood_${Date.now()}`,
      userId: req.userId,
      date: entryDate,
      mood,
    });
  }

  // Recalculate cache instantly
  try {
    const refreshed = calculateUserInsights(
      req.userId,
      db.goals,
      db.tasks,
      db.skills,
      db.courses,
      db.chapters,
      db.projects,
      db.projectTasks,
      db.dailies,
      db.activities,
      db.moodLogs
    );
    db.analyticsCache[req.userId] = refreshed;
  } catch (e) {
    console.warn("Recalculate index fallback warn:", e);
  }

  saveDb();
  res.json({ success: true, date: entryDate, mood });
});


// ==========================================
// --- QWEN-POWERED AI ASSISTANT & COACH API ---
// ==========================================

// Helper to retrieve user analytics context dynamically
function getInsightsContext(userId: string, refresh = false): InsightsData {
  let insights = db.analyticsCache[userId];
  if (!insights || refresh) {
    insights = calculateUserInsights(
      userId,
      db.goals,
      db.tasks,
      db.skills,
      db.courses,
      db.chapters,
      db.projects,
      db.projectTasks,
      db.dailies,
      db.activities,
      db.moodLogs
    );
    db.analyticsCache[userId] = insights;
  }
  return insights;
}

// AI coach general report
app.get("/api/ai/coach", authenticate, async (req: any, res) => {
  try {
    const refresh = req.query.refresh === "true";
    if (refresh) {
      clearAICoachCache(req.userId);
    }
    const insights = getInsightsContext(req.userId, refresh);
    const data = {
      goals: db.goals,
      tasks: db.tasks,
      skills: db.skills,
      courses: db.courses,
      chapters: db.chapters,
      projects: db.projects,
      projectTasks: db.projectTasks,
      dailies: db.dailies,
      activities: db.activities
    };
    const report = await getAICoachReport(req.userId, data, insights);
    res.json({ report });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate coach report" });
  }
});

// Daily AI summary
app.get("/api/ai/daily-summary", authenticate, async (req: any, res) => {
  try {
    const refresh = req.query.refresh === "true";
    if (refresh) {
      clearAICoachCache(req.userId);
    }
    const insights = getInsightsContext(req.userId, refresh);
    const data = {
      goals: db.goals,
      tasks: db.tasks,
      skills: db.skills,
      courses: db.courses,
      chapters: db.chapters,
      projects: db.projects,
      projectTasks: db.projectTasks,
      dailies: db.dailies,
      activities: db.activities
    };
    const summary = await getDailyAISummary(req.userId, data, insights);
    res.json({ summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate daily summary" });
  }
});

// Weekly review
app.get("/api/ai/weekly-review", authenticate, async (req: any, res) => {
  try {
    const refresh = req.query.refresh === "true";
    if (refresh) {
      clearAICoachCache(req.userId);
    }
    const insights = getInsightsContext(req.userId, refresh);
    const data = {
      goals: db.goals,
      tasks: db.tasks,
      skills: db.skills,
      courses: db.courses,
      chapters: db.chapters,
      projects: db.projects,
      projectTasks: db.projectTasks,
      dailies: db.dailies,
      activities: db.activities
    };
    const review = await getWeeklyAISummary(req.userId, data, insights);
    res.json({ review });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate weekly review" });
  }
});

// Monthly review
app.get("/api/ai/monthly-review", authenticate, async (req: any, res) => {
  try {
    const refresh = req.query.refresh === "true";
    if (refresh) {
      clearAICoachCache(req.userId);
    }
    const insights = getInsightsContext(req.userId, refresh);
    const data = {
      goals: db.goals,
      tasks: db.tasks,
      skills: db.skills,
      courses: db.courses,
      chapters: db.chapters,
      projects: db.projects,
      projectTasks: db.projectTasks,
      dailies: db.dailies,
      activities: db.activities
    };
    const review = await getMonthlyReview(req.userId, data, insights);
    res.json({ review });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate monthly review" });
  }
});

// Smart Goal planning
app.post("/api/ai/plan-goal", authenticate, async (req: any, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: "Topic query is required" });
    const plan = await getSmartGoalPlan(req.userId, topic);
    res.json({ plan });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to plan goal" });
  }
});

// AI Roadmap
app.post("/api/ai/roadmap", authenticate, async (req: any, res) => {
  try {
    const { track } = req.body;
    if (!track) return res.status(400).json({ error: "Roadmap track parameter is required (e.g. DevOps)" });
    const plan = await getRoadmapPlan(req.userId, track);
    res.json({ plan });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to build roadmap" });
  }
});

// AI Project Ideas
app.post("/api/ai/project", authenticate, async (req: any, res) => {
  try {
    const { goalsQuery } = req.body;
    if (!goalsQuery) return res.status(400).json({ error: "Goals context query is required" });
    const plan = await getProjectIdeas(req.userId, goalsQuery);
    res.json({ plan });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate portfolio projects" });
  }
});

// Mock interview
app.post("/api/ai/mock-interview", authenticate, async (req: any, res) => {
  try {
    const { skillName } = req.body;
    if (!skillName) return res.status(400).json({ error: "skillName is required" });
    const questionsText = await getMockInterview(req.userId, skillName);
    res.json({ questions: questionsText });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate interview questions" });
  }
});

// Skill gap analysis
app.post("/api/ai/skill-gap", authenticate, async (req: any, res) => {
  try {
    const { desiredRole } = req.body;
    if (!desiredRole) return res.status(400).json({ error: "desiredRole is required" });
    const userSkills = db.skills.filter(s => s.userId === req.userId).map(s => s.skillName);
    const analysis = await getSkillGapAnalysis(req.userId, desiredRole, userSkills);
    res.json({ analysis });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to perform gap analysis" });
  }
});

// Resume prep
app.get("/api/ai/resume-helper", authenticate, async (req: any, res) => {
  try {
    const data = {
      projects: db.projects.filter(p => p.userId === req.userId),
      skills: db.skills.filter(s => s.userId === req.userId)
    };
    const response = await getResumeAssistance(req.userId, data);
    res.json({ recommendations: response });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate resume suggestions" });
  }
});

// Habit advice
app.get("/api/ai/habit-advisor", authenticate, async (req: any, res) => {
  try {
    const insights = getInsightsContext(req.userId);
    const data = {
      dailies: db.dailies.filter(d => d.userId === req.userId)
    };
    const recommendations = await getHabitImprovementAdvisor(req.userId, data, insights);
    res.json({ recommendations });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch habit tips" });
  }
});

// Study Notes summary based on chapter ID
app.post("/api/ai/study-notes", authenticate, async (req: any, res) => {
  try {
    const { chapterId } = req.body;
    if (!chapterId) return res.status(400).json({ error: "chapterId is required" });
    const chapter = db.chapters.find(c => c.id === chapterId && c.userId === req.userId);
    if (!chapter) return res.status(404).json({ error: "Chapter not found" });

    const notesSummary = await getStudyNotesSummary(req.userId, chapter);
    res.json({ notesSummary });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to summarize study notes" });
  }
});

// Project helper review
app.post("/api/ai/project-reviewer", authenticate, async (req: any, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ error: "projectId is required" });
    const project = db.projects.find(p => p.id === projectId && p.userId === req.userId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const tasks = db.projectTasks.filter(pt => pt.projectId === projectId);
    const review = await getProjectReview(req.userId, project, tasks);
    res.json({ review });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to audit project progress" });
  }
});

// Burnout advice
app.get("/api/ai/burnout-coach", authenticate, async (req: any, res) => {
  try {
    const insights = getInsightsContext(req.userId);
    const recommendations = await getBurnoutAdvice(req.userId, insights);
    res.json({ recommendations });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch burnout assistance" });
  }
});

// Conversational Coach chat
app.post("/api/ai/chat", authenticate, async (req: any, res) => {
  try {
    const { query, history } = req.body;
    if (!query) return res.status(400).json({ error: "User message query is required" });
    const insights = getInsightsContext(req.userId);
    const data = {
      goals: db.goals,
      tasks: db.tasks,
      skills: db.skills,
      courses: db.courses,
      projects: db.projects
    };
    const response = await getChatResponse(req.userId, data, insights, history || [], query);
    res.json({ response });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Chat failed" });
  }
});

// Natural language search endpoint
app.post("/api/ai/search", authenticate, async (req: any, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Natural language query is required" });
    const insights = getInsightsContext(req.userId);
    const data = {
      goals: db.goals,
      tasks: db.tasks,
      skills: db.skills,
      courses: db.courses,
      projects: db.projects,
      dailies: db.dailies
    };
    const results = performNaturalSearch(req.userId, query, data, insights);
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Natural Search failed" });
  }
});

// Notification generator
app.post("/api/ai/notification-gen", authenticate, async (req: any, res) => {
  try {
    const { itemName, type } = req.body;
    if (!itemName) return res.status(400).json({ error: "itemName is required" });
    const content = await getAINotificationContent(itemName, type || "task");
    res.json({ content });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate notification body" });
  }
});

// Import entities (Smart Import pipeline!)
app.post("/api/ai/import-entities", authenticate, async (req: any, res) => {
  try {
    const { goals, skills, tasks, project } = req.body;
    const createdGoals: any[] = [];
    const timestamp = new Date().toISOString();

    // 1. Create Goals & map their temporary references
    if (goals && Array.isArray(goals)) {
      for (const g of goals) {
        const goalId = "goal_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
        const newGoal = {
          id: goalId,
          userId: req.userId,
          title: g.title,
          description: g.description || "Auto-imported by Qwen AI Assistant.",
          targetDate: g.targetDate || new Date(Date.now() + (g.targetDays || 30) * 24 * 3600 * 1000).toISOString().split("T")[0],
          priority: g.priority || "High",
          status: "In Progress" as const,
          progressPercentage: 0
        };
        db.goals.push(newGoal);
        createdGoals.push(newGoal);

        // Also create any associated tasks if they are child tasks
        if (tasks && Array.isArray(tasks)) {
          for (const t of tasks) {
            db.tasks.push({
              id: "task_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
              goalId: goalId,
              userId: req.userId,
              title: t.title,
              description: t.description || "",
              dueDate: t.dueDate || newGoal.targetDate,
              priority: t.priority || "Medium",
              progressPercentage: 0,
              completed: false,
              inProgress: false,
              orderIndex: db.tasks.length
            });
          }
        }
      }
    }

    // 2. Create isolated general goal skills
    if (skills && Array.isArray(skills)) {
      const associatedGoalId = createdGoals.length > 0 ? createdGoals[0].id : "";
      for (const skName of skills) {
        db.skills.push({
          id: "skill_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
          goalId: associatedGoalId,
          userId: req.userId,
          skillName: skName,
          confidenceLevel: 1,
          status: "Learning",
          notes: "Generated by DevOps AI Roadmap Assistant",
          resourceUrl: ""
        });
      }
    }

    // 3. Create standalone project & subtasks
    if (project) {
      const projId = "project_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
      const newProj = {
        id: projId,
        userId: req.userId,
        title: project.title,
        description: project.description || "Portfolio project recommended by AI Coach.",
        status: "Planning" as const,
        progressPercentage: 0,
        repositoryUrl: "",
        liveDemoUrl: ""
      };
      db.projects.push(newProj);

      if (project.tasks && Array.isArray(project.tasks)) {
        for (const t of project.tasks) {
          db.projectTasks.push({
            id: "ptask_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
            projectId: projId,
            userId: req.userId,
            title: t.title,
            description: t.description || "",
            status: "Pending",
            completed: false,
            inProgress: false,
            taskResourceUrl: "",
            documentationUrl: "",
            githubCommitUrl: "",
            githubPrUrl: ""
          });
        }
      }
    }

    // Log Activity
    db.activities.push({
      id: "act_" + Date.now(),
      userId: req.userId,
      activityType: "Completed AI Import",
      description: "Successfully imported items from your AI Roadmap / Study Advisor plan.",
      timestamp
    });

    // Save DB state and force instant analytics refresh
    saveDb();
    try {
      const refreshed = calculateUserInsights(
        req.userId,
        db.goals,
        db.tasks,
        db.skills,
        db.courses,
        db.chapters,
        db.projects,
        db.projectTasks,
        db.dailies,
        db.activities,
        db.moodLogs
      );
      db.analyticsCache[req.userId] = refreshed;
    } catch (_) {}

    res.json({ success: true, message: "Entities successfully imported into GoalTracker database!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to complete AI auto-import sequence" });
  }
});

// ==========================================


// --- MAIN AND VITE DEV MIDDLEWARE HANDLER ---

// Start server listening
async function startServer() {
  // If the server is in development mode (no NODE_ENV="production"), load Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Let Express use Vite middleware to serve static React index assets and handle Hot Client modules
    app.use(vite.middlewares);
  } else {
    // If in production mode, serve built files inside the dist directory
    const distPath = resolvedDirname.endsWith("dist")
      ? resolvedDirname
      : path.resolve(resolvedDirname, "dist");
    app.use(express.static(distPath));
    // Serve index.html globally as fallback for client-side routing
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[GoalTracker] Full-stack application engine bound on http://0.0.0.0:${PORT}`);
  });
}

startServer();
