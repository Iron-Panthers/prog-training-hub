import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, Save, X, ChevronDown, ChevronUp } from "lucide-react";

const TOPICS = ["basics", "oop", "data-structures", "algorithms", "frc-specific", "advanced"];
const TOPIC_LABELS = {
  "basics": "Java Basics", "oop": "OOP", "data-structures": "Data Structures",
  "algorithms": "Algorithms", "frc-specific": "FRC Specific", "advanced": "Advanced",
};

const emptyUnit = {
  title: "", description: "", topic: "basics", order: 1, is_published: false,
  slideshow_embed: "", slideshow_url: "", exercises: [], quiz_questions: [],
  project: { title: "", description: "", requirements: [], starter_code: "" }
};

export default function AdminUnits() {
  const [units, setUnits] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyUnit);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState("basic");

  useEffect(() => { load(); }, []);

  const load = async () => {
    const u = await base44.entities.Unit.list("order", 50);
    setUnits(u);
    setLoading(false);
  };

  const startEdit = (unit) => {
    setEditing(unit.id);
    setForm({ ...emptyUnit, ...unit });
    setExpandedSection("basic");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startNew = () => {
    setEditing("new");
    setForm({ ...emptyUnit, order: units.length + 1 });
    setExpandedSection("basic");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    setSaving(true);
    if (editing === "new") {
      await base44.entities.Unit.create(form);
    } else {
      await base44.entities.Unit.update(editing, form);
    }
    setEditing(null);
    setSaving(false);
    load();
  };

  const togglePublish = async (unit) => {
    await base44.entities.Unit.update(unit.id, { is_published: !unit.is_published });
    load();
  };

  const deleteUnit = async (id) => {
    await base44.entities.Unit.delete(id);
    load();
  };

  const addExercise = () => {
    setForm({ ...form, exercises: [...(form.exercises || []), { id: Date.now().toString(), title: "", instructions: "", starter_code: "" }] });
  };

  const updateExercise = (i, data) => {
    const exs = [...(form.exercises || [])];
    exs[i] = { ...exs[i], ...data };
    setForm({ ...form, exercises: exs });
  };

  const removeExercise = (i) => {
    setForm({ ...form, exercises: form.exercises.filter((_, idx) => idx !== i) });
  };

  const addQuestion = () => {
    setForm({ ...form, quiz_questions: [...(form.quiz_questions || []), { id: Date.now().toString(), question: "", options: ["", "", "", ""], correct_index: 0, explanation: "" }] });
  };

  const updateQuestion = (i, data) => {
    const qs = [...(form.quiz_questions || [])];
    qs[i] = { ...qs[i], ...data };
    setForm({ ...form, quiz_questions: qs });
  };

  const removeQuestion = (i) => {
    setForm({ ...form, quiz_questions: form.quiz_questions.filter((_, idx) => idx !== i) });
  };

  const Section = ({ id, title, children }) => (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-foreground hover:bg-muted transition-colors"
        onClick={() => setExpandedSection(expandedSection === id ? "" : id)}
      >
        {title}
        {expandedSection === id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {expandedSection === id && <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">{children}</div>}
    </div>
  );

  const inputClass = "w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-orange/50";
  const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5";

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-navy px-6 py-8 md:px-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Manage Units</h1>
            <p className="text-white/40 text-sm mt-1">Create and edit training content</p>
          </div>
          <button
            onClick={startNew}
            className="flex items-center gap-2 bg-orange hover:bg-orange-light text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-orange/30"
          >
            <Plus className="w-4 h-4" /> New Unit
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
        {/* Edit form */}
        {editing && (
          <div className="bg-card border border-orange/30 rounded-2xl p-6 mb-8 shadow-lg animate-fade-in space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-black text-foreground text-lg">
                {editing === "new" ? "Create New Unit" : "Edit Unit"}
              </h2>
              <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <Section id="basic" title="📋 Basic Info">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Title</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Unit title" />
                </div>
                <div>
                  <label className={labelClass}>Topic</label>
                  <select value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} className={inputClass}>
                    {TOPICS.map(t => <option key={t} value={t}>{TOPIC_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputClass} h-20 resize-none`} placeholder="Brief description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Order #</label>
                  <input type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) })} className={inputClass} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} className="accent-orange w-4 h-4" />
                    <span className="text-sm text-foreground font-medium">Published</span>
                  </label>
                </div>
              </div>
            </Section>

            <Section id="slideshow" title="📊 Slideshow">
              <div>
                <label className={labelClass}>Embed URL (Google Slides, etc.)</label>
                <input value={form.slideshow_embed || ""} onChange={e => setForm({ ...form, slideshow_embed: e.target.value })} className={inputClass} placeholder="https://docs.google.com/presentation/d/..." />
              </div>
              <div>
                <label className={labelClass}>Or External URL</label>
                <input value={form.slideshow_url || ""} onChange={e => setForm({ ...form, slideshow_url: e.target.value })} className={inputClass} placeholder="https://..." />
              </div>
            </Section>

            <Section id="exercises" title={`💻 Exercises (${form.exercises?.length || 0})`}>
              {form.exercises?.map((ex, i) => (
                <div key={ex.id || i} className="border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Exercise {i + 1}</span>
                    <button onClick={() => removeExercise(i)} className="text-muted-foreground hover:text-red-400"><X className="w-4 h-4" /></button>
                  </div>
                  <input value={ex.title} onChange={e => updateExercise(i, { title: e.target.value })} className={inputClass} placeholder="Exercise title" />
                  <textarea value={ex.instructions || ""} onChange={e => updateExercise(i, { instructions: e.target.value })} className={`${inputClass} h-20 resize-none font-mono`} placeholder="Instructions for the student" />
                  <textarea value={ex.starter_code || ""} onChange={e => updateExercise(i, { starter_code: e.target.value })} className={`${inputClass} h-28 resize-none font-mono`} placeholder="Starter code (Java)" />
                </div>
              ))}
              <button onClick={addExercise} className="flex items-center gap-2 text-sm text-orange hover:text-orange-light font-semibold">
                <Plus className="w-4 h-4" /> Add Exercise
              </button>
            </Section>

            <Section id="quiz" title={`📝 Quiz Questions (${form.quiz_questions?.length || 0})`}>
              {form.quiz_questions?.map((q, i) => (
                <div key={q.id || i} className="border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Question {i + 1}</span>
                    <button onClick={() => removeQuestion(i)} className="text-muted-foreground hover:text-red-400"><X className="w-4 h-4" /></button>
                  </div>
                  <input value={q.question} onChange={e => updateQuestion(i, { question: e.target.value })} className={inputClass} placeholder="Question text" />
                  <div className="space-y-2">
                    {(q.options || ["", "", "", ""]).map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${i}`}
                          checked={q.correct_index === oi}
                          onChange={() => updateQuestion(i, { correct_index: oi })}
                          className="accent-green-500"
                        />
                        <input
                          value={opt}
                          onChange={e => {
                            const opts = [...(q.options || [])];
                            opts[oi] = e.target.value;
                            updateQuestion(i, { options: opts });
                          }}
                          className={`${inputClass} flex-1`}
                          placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        />
                      </div>
                    ))}
                  </div>
                  <input value={q.explanation || ""} onChange={e => updateQuestion(i, { explanation: e.target.value })} className={inputClass} placeholder="Explanation (shown after quiz)" />
                </div>
              ))}
              <button onClick={addQuestion} className="flex items-center gap-2 text-sm text-orange hover:text-orange-light font-semibold">
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </Section>

            <Section id="project" title="🚀 Project">
              <input value={form.project?.title || ""} onChange={e => setForm({ ...form, project: { ...form.project, title: e.target.value } })} className={inputClass} placeholder="Project title" />
              <textarea value={form.project?.description || ""} onChange={e => setForm({ ...form, project: { ...form.project, description: e.target.value } })} className={`${inputClass} h-20 resize-none`} placeholder="Project description" />
              <textarea
                value={form.project?.requirements?.join("\n") || ""}
                onChange={e => setForm({ ...form, project: { ...form.project, requirements: e.target.value.split("\n") } })}
                className={`${inputClass} h-24 resize-none`}
                placeholder="Requirements (one per line)"
              />
              <textarea value={form.project?.starter_code || ""} onChange={e => setForm({ ...form, project: { ...form.project, starter_code: e.target.value } })} className={`${inputClass} h-32 resize-none font-mono`} placeholder="Starter code" />
            </Section>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl transition-all">Cancel</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-orange hover:bg-orange-light disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl transition-all text-sm">
                {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Unit"}
              </button>
            </div>
          </div>
        )}

        {/* Units list */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-card border border-border rounded-xl p-4 h-16 animate-pulse" />)}</div>
        ) : units.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No units yet. Create one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {units.map(unit => (
              <div key={unit.id} className={`bg-card border rounded-xl p-4 flex items-center justify-between ${!unit.is_published ? "opacity-60 border-border" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange/20 flex items-center justify-center text-orange font-black text-sm flex-shrink-0">
                    {unit.order || "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">{unit.title}</span>
                      {!unit.is_published && <span className="text-xs text-muted-foreground">(Draft)</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{TOPIC_LABELS[unit.topic]} · {unit.exercises?.length || 0} exercises · {unit.quiz_questions?.length || 0} questions</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => togglePublish(unit)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                    {unit.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => startEdit(unit)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-orange transition-all">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteUnit(unit.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}