import { supabase } from '@/lib/supabase';

function parseSortOrder(sortStr) {
  if (!sortStr) return null;
  const desc = sortStr.startsWith('-');
  const column = desc ? sortStr.slice(1) : sortStr;
  return { column, ascending: !desc };
}

function entityAPI(table) {
  return {
    async list(sortStr, limit) {
      let q = supabase.from(table).select('*');
      const sort = parseSortOrder(sortStr);
      if (sort) q = q.order(sort.column, { ascending: sort.ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },

    async filter(filterObj, sortStr, limit) {
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
      return data || [];
    },

    async create(data) {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    async update(id, data) {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

export const Unit = entityAPI('units');
export const Announcement = entityAPI('announcements');
export const StudentProgress = entityAPI('student_progress');
export const ProjectSubmission = entityAPI('project_submissions');
export const QuizSubmission = entityAPI('quiz_submissions');

export async function uploadFile(file, bucket = 'uploads') {
  const path = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl;
}

export async function invokeLLM(prompt) {
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
