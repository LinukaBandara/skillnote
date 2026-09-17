export type Role = "student" | "teacher" | "institute_admin" | "platform_admin";
export type Medium = "english" | "sinhala" | "tamil";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  avatar_url: string | null;
  institute_id: string | null;
  al_year: number | null;
  medium: Medium | null;
  created_at: string;
}

export interface Institute {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Stream {
  id: string;
  name: string;
  created_at: string;
}

export interface Subject {
  id: string;
  stream_id: string | null;
  name: string;
  created_at: string;
}

export interface SyllabusUnit {
  id: string;
  subject_id: string;
  syllabus_version_id: string | null;
  title: string;
  position: number;
}

export interface SyllabusTopic {
  id: string;
  unit_id: string;
  title: string;
  position: number;
}

export type TopicStatus = "not_started" | "in_progress" | "completed" | "needs_revision" | "weak";

export interface TopicProgress {
  student_id: string;
  topic_id: string;
  status: TopicStatus;
  percent: number;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  published: boolean;
  created_by: string | null;
  subject_id: string | null;
  institute_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  position: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  position: number;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at: string | null;
}

export interface LessonProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface Quiz {
  id: string;
  module_id: string;
  title: string;
  passing_score: number;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_index: number;
  position: number;
}

export interface QuizAttempt {
  id: string;
  student_id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  answers: number[];
  attempted_at: string;
}

export interface Certificate {
  id: string;
  student_id: string;
  course_id: string;
  issued_at: string;
  certificate_code: string;
}

export interface DiscussionThread {
  id: string;
  course_id: string;
  student_id: string;
  title: string;
  created_at: string;
}

export interface DiscussionComment {
  id: string;
  thread_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface ModuleWithContent extends Module {
  lessons: Lesson[];
  quizzes: Quiz[];
}

export interface CourseWithModules extends Course {
  modules: ModuleWithContent[];
}
