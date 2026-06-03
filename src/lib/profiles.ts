import { supabase } from "./supabase";
import type { Profile } from "../types";

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) {
    console.error("Error updating profile:", error);
    return false;
  }

  return true;
}

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string | null> {
  // Delete all existing avatar files for this user so storage stays clean
  // and the new URL will be different (busting the browser cache)
  const { data: existingFiles } = await supabase.storage
    .from("avatars")
    .list(userId);

  if (existingFiles && existingFiles.length > 0) {
    const filePaths = existingFiles.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from("avatars").remove(filePaths);
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/avatar_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file);

  if (uploadError) {
    console.error("Error uploading avatar:", uploadError);
    return null;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = data.publicUrl;

  await updateProfile(userId, { avatar_url: publicUrl });
  return publicUrl;
}

export async function createProfile(
  userId: string,
  name: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .insert([
      {
        id: userId,
        name,
        role: "student",
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating profile:", error);
    return null;
  }

  return data;
}
