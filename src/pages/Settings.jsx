import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { uploadAvatar, updateProfile } from "@/lib/profiles";
import CosmeticAvatar from "@/components/CosmeticAvatar";
import { Camera, Save, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user, profile, getAvatarUrl, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile?.name]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const url = await uploadAvatar(user.id, file);
    if (url) await refreshProfile();
    setUploading(false);
    e.target.value = "";
  };

  const handleSaveName = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const ok = await updateProfile(user.id, { name: name.trim() });
    if (ok) {
      await refreshProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-black text-white mb-8">Settings</h1>

        {/* Avatar */}
        <div className="bg-navy rounded-2xl p-6 mb-4 border border-white/10">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-5">
            Profile Photo
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <CosmeticAvatar
                avatarUrl={getAvatarUrl()}
                userName={profile?.name || "User"}
                size="lg"
              />
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-orange text-white rounded-lg text-sm font-semibold hover:bg-orange/80 transition-colors disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Upload Photo"}
              </button>
              <p className="text-white/40 text-xs mt-2">JPG, PNG or GIF</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Name */}
        <div className="bg-navy rounded-2xl p-6 border border-white/10">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-5">
            Display Name
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange/50 focus:ring-1 focus:ring-orange/30 placeholder:text-white/20"
              placeholder="Your name"
            />
            <button
              onClick={handleSaveName}
              disabled={saving || !name.trim()}
              className="px-4 py-2 bg-orange text-white rounded-lg text-sm font-semibold hover:bg-orange/80 transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[80px] justify-center"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {saveSuccess ? "Saved!" : "Save"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
