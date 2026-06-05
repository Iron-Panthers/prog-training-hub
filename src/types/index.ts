// Profile Type (from Supabase)
export interface Profile {
  id: string;
  name: string | null;
  role: "student" | "teacher" | "admin";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "reminder" | "update" | "important";
  image_url: string;
  author_id: string;
  is_pinned: boolean;
  is_published: boolean;
  created_at: string;
}

export interface ProjectAdminComments {
  id: string;
  line_number: number;
  comment: string;
  author_id: string;
  created_at: string;
}

export interface ProjectSubmission {
  id: string;
  student_id: string;
  unit_id: string;
  code: string;
  notes: string;
  status: "submitted" | "reviewed" | "approved" | "needs_revision";
  admin_comments: ProjectAdminComments[];
  grade: number;
  created_at: string;
}

export interface QuizSubmission {
  id: string;
  unit_id: string;
  answers: string[];
  score: number;
  total_questions: number;
}

export interface StudentProgress {
  student_id: string;
  unit_id: string;
  slideshow_completed: boolean;
  exercises_completed: string[];
  quiz_attempts: number;
  quiz_completed: number;
  project_submitted: boolean;
  overall_progress: number;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  starter_code: string;
  solution_code: string;
  instructions: string;
}

export interface QuizQuestion { // should be updated to handle frq?
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface ProjectStarter {
  title: string;
  description: string;
  requirements: string[];
  starter_code: string;
}

export interface Unit {
  title: string;
  description: string;
  topic: "java" | "robo" | "frc";
  order: number;
  is_published: boolean;
  slideshow_url: string;
  slideshow_embed: string;
  exercises: Exercise[];
  quiz_questions: QuizQuestion[]
  project: ProjectStarter;
}