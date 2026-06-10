import { useState, useEffect, useRef } from "react";
import { Announcement, uploadFile } from "@/api/entities";
import { Plus, Trash2, Pin, Eye, EyeOff, Image, Send, X, Loader2, Edit2 } from "lucide-react";

const TYPES = ["update", "reminder", "important"];

export default function AdminAnnouncements({ user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", type: "update", is_pinned: false, image_url: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const ann = await Announcement.list("-created_at", 30);
    setAnnouncements(ann);
    setLoading(false);
    console.log(ann)
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setSubmitting(true);
    let imageUrl = form.image_url;
    if (imageFile) {
      imageUrl = await uploadFile(imageFile, 'announcements');
    }
    try {
      if (editingId) {
        await Announcement.update(editingId, {
          ...form,
          image_url: imageUrl,
        });
      } else {
        await Announcement.create({
          ...form,
          image_url: imageUrl,
          author_id: user.id,
          is_published: true,
        });
      }
    } finally {
      setForm({ title: "", content: "", type: "update", is_pinned: false, image_url: "" });
      setImageFile(null);
      setImagePreview("");
      setEditingId(null);
      setShowForm(false);
      setSubmitting(false);
      load();
    }
  };

  const startEdit = (ann) => {
    setForm({
      title: ann.title || "",
      content: ann.content || "",
      type: ann.type || "update",
      is_pinned: !!ann.is_pinned,
      image_url: ann.image_url || "",
    });
    setImageFile(null);
    setImagePreview(ann.image_url || "");
    setEditingId(ann.id);
    setShowForm(true);
  };

  const togglePin = async (ann) => {
    await Announcement.update(ann.id, { is_pinned: !ann.is_pinned });
    load();
  };

  const togglePublish = async (ann) => {
    await Announcement.update(ann.id, { is_published: !ann.is_published });
    load();
  };

  const deleteAnn = async (id) => {
    await Announcement.delete(id);
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-navy px-6 py-8 md:px-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Announcements</h1>
            <p className="text-white/40 text-sm mt-1">Post updates & reminders</p>
          </div>
          <button
            onClick={() => { setEditingId(null); setForm({ title: "", content: "", type: "update", is_pinned: false, image_url: "" }); setImageFile(null); setImagePreview(""); setShowForm(!showForm); }}
            className="flex items-center gap-2 bg-orange hover:bg-orange-light text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-orange/30"
          >
            <Plus className="w-4 h-4" /> New Post
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-10 py-8 space-y-6">
        {/* Form */}
        {showForm && (
          <div className="bg-card border border-orange/30 rounded-2xl p-6 shadow-lg animate-fade-in">
            <h3 className="font-bold text-foreground mb-4">{editingId ? 'Edit Announcement' : 'New Announcement'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Title"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-orange/50"
                required
              />
              <div className="flex gap-3">
                {TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
                      form.type === t ? "bg-orange border-orange text-white" : "border-border text-muted-foreground hover:border-orange/40"
                    }`}
                  >
                    {t}
                  </button>
                ))}
                <label className="flex items-center gap-2 ml-auto cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_pinned}
                    onChange={e => setForm({ ...form, is_pinned: e.target.checked })}
                    className="accent-orange"
                  />
                  <span className="text-xs text-muted-foreground">Pin post</span>
                </label>
              </div>
              <textarea
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                placeholder="Write your announcement here... HTML is supported for rich formatting."
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-orange/50 resize-none h-32"
                required
              />
              {/* Image upload */}
              <div>
                <input ref={fileRef} type="file" accept="image/*,.gif" onChange={handleImageSelect} className="hidden" />
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="" className="rounded-xl max-h-40 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(""); }}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current.click()}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-orange/40 rounded-xl px-4 py-2.5 transition-all"
                  >
                    <Image className="w-4 h-4" /> Attach image or GIF
                  </button>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); setForm({ title: "", content: "", type: "update", is_pinned: false, image_url: "" }); setImageFile(null); setImagePreview(""); }}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-orange hover:bg-orange-light disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl transition-all text-sm"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {submitting ? (editingId ? "Updating..." : "Posting...") : (editingId ? "Update" : "Post")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-card border border-border rounded-2xl p-5 h-24 animate-pulse" />)}
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No announcements yet. Create one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map(ann => (
              <div
                key={ann.id}
                className={`bg-card border rounded-2xl p-5 ${ann.is_pinned ? "border-orange/40" : "border-border"} ${!ann.is_published ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${
                        ann.type === "important" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                        ann.type === "reminder" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                        "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      }`}>
                        {ann.type}
                      </span>
                      {ann.is_pinned && <span className="text-xs text-orange font-medium">📌 Pinned</span>}
                      {!ann.is_published && <span className="text-xs text-muted-foreground">(Draft)</span>}
                    </div>
                    <h3 className="font-bold text-foreground text-sm">{ann.title}</h3>
                    <div className="text-muted-foreground text-xs mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: ann.content }} />
                    {ann.image_url && <img src={ann.image_url} alt="" className="mt-2 rounded-lg max-h-32 object-cover" />}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(ann)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => togglePin(ann)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-orange transition-all" title="Toggle pin">
                      <Pin className="w-4 h-4" />
                    </button>
                    <button onClick={() => togglePublish(ann)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all" title="Toggle publish">
                      {ann.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteAnn(ann.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
