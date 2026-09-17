export interface SyllabusVersion {
  id: string;
  code: string;
  name: string;
  academic_year_from: number | null;
  academic_year_to: number | null;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface SyllabusVersionSubject {
  id: string;
  syllabus_version_id: string;
  subject_id: string;
  created_at: string;
}

export interface SyllabusCompetency {
  id: string;
  syllabus_version_id: string;
  subject_id: string;
  code: string;
  title: string;
  description: string | null;
  position: number;
  created_at: string;
}

export interface SyllabusCompetencyLevel {
  id: string;
  competency_id: string;
  syllabus_version_id: string;
  subject_id: string;
  code: string;
  title: string;
  description: string | null;
  position: number;
  created_at: string;
}

export interface SyllabusSubtopic {
  id: string;
  topic_id: string;
  title: string;
  description: string | null;
  position: number;
  created_at: string;
}

export interface SyllabusLearningOutcome {
  id: string;
  subtopic_id: string;
  competency_id: string | null;
  competency_level_id: string | null;
  code: string | null;
  statement: string;
  position: number;
  created_at: string;
}

export interface SyllabusUnitWithVersion extends SyllabusUnitReference {
  syllabus_version_id: string | null;
}

interface SyllabusUnitReference {
  id: string;
  subject_id: string;
  title: string;
  position: number;
}
