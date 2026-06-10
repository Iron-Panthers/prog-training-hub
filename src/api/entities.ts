import { supabase } from '../lib/supabase';
import type {
  Announcement as AnnouncementType,
  ProjectSubmission as ProjectSubmissionType,
  QuizSubmission as QuizSubmissionType,
  StudentProgress as StudentProgressType,
  Unit as UnitType,
  Exercise,
  QuizQuestion,
  ProjectStarter,
  ProjectAdminComments,
} from '../types';

function parseSortOrder(sortStr?: string | null) {
  if (!sortStr) return null;
  const desc = sortStr.startsWith('-');
  const column = desc ? sortStr.slice(1) : sortStr;
  return { column, ascending: !desc };
}

function parseJSON<T>(value: unknown, fallback: T): T {
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  if (value != null) return value as T;
  return fallback;
}

function entityAPI<T>(table: string, parse: (row: unknown) => T = (r) => r as T) {
  return {
    async list(sortStr?: string, limit?: number): Promise<T[]> {
      let q = supabase.from(table).select('*');
      const sort = parseSortOrder(sortStr);
      if (sort) q = q.order(sort.column, { ascending: sort.ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(parse);
    },

    async filter(filterObj?: Record<string, unknown>, sortStr?: string, limit?: number): Promise<T[]> {
      let q = supabase.from(table).select('*');
      if (filterObj) {
        Object.entries(filterObj).forEach(([k, v]) => {
          q = q.eq(k, v);
        });
      }
      const sort = parseSortOrder(sortStr);
      if (sort) q = q.order(sort.column, { ascending: sort.ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(parse);
    },

    async create(data: Partial<T>): Promise<T> {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return parse(result);
    },

    async update(id: string, data: Partial<T>): Promise<T> {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return parse(result);
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

function parseUnit(row: unknown): UnitType {
  const r = row as Record<string, unknown>;
  return {
    ...r,
    exercises: parseJSON<Exercise[]>(r.exercises, []),
    quiz_questions: parseJSON<QuizQuestion[]>(r.quiz_questions, []),
    project: parseJSON<ProjectStarter>(r.project, { title: '', description: '', requirements: [], starter_code: '' }),
  } as UnitType;
}

function parseProjectSubmission(row: unknown): ProjectSubmissionType {
  const r = row as Record<string, unknown>;
  return {
    ...r,
    admin_comments: parseJSON<ProjectAdminComments[]>(r.admin_comments, []),
  } as ProjectSubmissionType;
}

function parseQuizSubmission(row: unknown): QuizSubmissionType {
  const r = row as Record<string, unknown>;
  return {
    ...r,
    answers: parseJSON<string[]>(r.answers, []),
  } as QuizSubmissionType;
}

function parseStudentProgress(row: unknown): StudentProgressType {
  const r = row as Record<string, unknown>;
  return {
    ...r,
    exercises_completed: parseJSON<string[]>(r.exercises_completed, []),
  } as StudentProgressType;
}

export const Unit = entityAPI<UnitType>('units', parseUnit);
export const Announcement = entityAPI<AnnouncementType>('announcements');
export const StudentProgress = entityAPI<StudentProgressType>('student_progress', parseStudentProgress);
export const ProjectSubmission = entityAPI<ProjectSubmissionType>('project_submissions', parseProjectSubmission);
export const QuizSubmission = entityAPI<QuizSubmissionType>('quiz_submissions', parseQuizSubmission);

export async function uploadFile(file: File, bucket = 'uploads'): Promise<string> {
  const path = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl;
}

export async function invokeLLM(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'LLM request failed');
  return data.content[0].text;
}

export interface JavaFile {
  name: string;
  code: string;
}

export interface JavaExecutionResult {
  stdout: string;
  stderr: string;
  compileError: string;
}

export async function executeJava(files: JavaFile[]): Promise<JavaExecutionResult> {
  const [mainFile, ...otherFiles] = files;
  // Wandbox always uses prog.java for the main file, so rename the public class to match
  const classMatch = mainFile.code.match(/public\s+class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : 'Main';
  const renameMain = (code: string) =>
    classMatch ? code.replace(new RegExp(`\\b${className}\\b`, 'g'), 'prog') : code;

  const body: Record<string, unknown> = {
    compiler: 'openjdk-jdk-22+36',
    code: renameMain(mainFile.code),
  };
  if (otherFiles.length > 0) {
    body.codes = otherFiles.map(f => ({ file: f.name, code: renameMain(f.code) }));
  }

  const response = await fetch('https://wandbox.org/api/compile.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Wandbox API error: ${response.status}`);
  const data = await response.json();
  const fixName = (s: string) => s.replace(/prog\.java/g, `${className}.java`);
  return {
    stdout: data.program_output ?? '',
    stderr: fixName(data.program_error ?? ''),
    compileError: fixName(data.compiler_error ?? ''),
  };
}
