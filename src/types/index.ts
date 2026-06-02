// Profile Type (from Supabase)
export interface Profile {
  id: string;
  name: string | null;
  role: "student" | "teacher" | "admin";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}