import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Unit, StudentProgress } from "@/api/entities";
import { ArrowLeft, BookOpen, Code2, HelpCircle, Rocket, CheckCircle } from "lucide-react";
import JavaIDE from "@/components/JavaIDE";
import QuizSection from "@/components/QuizSection";
import ProjectSection from "@/components/ProjectSection";

const TABS = [
  { key: "slideshow", label: "Slideshow", icon: BookOpen },
  { key: "exercises", label: "Exercises", icon: Code2 },
  { key: "quiz", label: "Quiz", icon: HelpCircle },
  { key: "project", label: "Project", icon: Rocket },
];

export default function UnitDetail({ user }) {
  const params = useParams();
  const id = params.id;
  const [unit, setUnit] = useState(null);
  const [progress, setProgress] = useState(null);
  const [activeTab, setActiveTab] = useState("slideshow");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      Unit.filter({ id }),
      StudentProgress.filter({ student_id: user.id, unit_id: id }),
    ]).then(([units, progs]) => {
      setUnit(units[0] || null);
      setProgress(progs[0] || null);
      setLoading(false);
    });
  }, [id, user]);

  const markSlideshowComplete = async () => {
    if (progress?.slideshow_completed) return;
    const updated = await upsertProgress({ slideshow_completed: true });
    recalcProgress(updated);
  };

  const upsertProgress = async (data) => {
    if (progress?.id) {
      const updated = await StudentProgress.update(progress.id, { ...progress, ...data });
      setProgress(updated);
      return updated;
    } else {
      const created = await StudentProgress.create({
        student_id: user.id,
        unit_id: id,
        ...data,
      });
      setProgress(created);
      return created;
    }
  };

  const recalcProgress = (p) => {
    if (!unit) return;
    let score = 0;
    let total = 0;
    if (unit.slideshow_embed || unit.slideshow_url) { total++; if (p.slideshow_completed) score++; }
    const exCount = unit.exercises?.length || 0;
    if (exCount > 0) { total++; if ((p.exercises_completed?.length || 0) >= exCount) score++; }
    if (unit.quiz_questions?.length > 0) { total++; if (p.quiz_completed) score++; }
    if (unit.project?.title) { total++; if (p.project_submitted) score++; }
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    StudentProgress.update(p.id, { overall_progress: pct });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-orange rounded-full animate-spin" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Unit not found.</p>
          <Link to="/units" className="text-orange mt-2 inline-block hover:underline">Back to units</Link>
        </div>
      </div>
    );
  }

  const overallProg = progress?.overall_progress || 0;

  const availableTabs = TABS.filter(t => {
    if (t.key === "slideshow") return unit.slideshow_embed || unit.slideshow_url;
    if (t.key === "exercises") return unit.exercises?.length > 0;
    if (t.key === "quiz") return unit.quiz_questions?.length > 0;
    if (t.key === "project") return unit.project?.title;
    return false;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-navy px-6 py-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <Link to="/units" className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-4 transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to Units
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black text-white">{unit.title}</h1>
              <p className="text-white/40 text-sm mt-1">{unit.description}</p>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-white/40 text-xs mb-1">Progress</p>
              <p className="text-2xl font-black text-orange">{overallProg}%</p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange to-orange-light rounded-full transition-all duration-700"
              style={{ width: `${overallProg}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <div className="flex gap-1 overflow-x-auto">
            {availableTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? "border-orange text-orange"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.key === "slideshow" && progress?.slideshow_completed && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                {tab.key === "quiz" && progress?.quiz_completed && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                {tab.key === "project" && progress?.project_submitted && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
        {activeTab === "slideshow" && (
          <div className="animate-fade-in">
            {unit.slideshow_embed ? (
              <>
                <div className="bg-card border border-border rounded-2xl overflow-hidden aspect-video">
                  <iframe
                    src={unit.slideshow_embed}
                    className="w-full h-full"
                    title="Slideshow"
                    allowFullScreen
                  />
                </div>
                {!progress?.slideshow_completed && (
                  <button
                    onClick={markSlideshowComplete}
                    className="mt-4 flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 font-semibold px-5 py-2.5 rounded-xl transition-all"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark as Completed
                  </button>
                )}
                {progress?.slideshow_completed && (
                  <div className="mt-4 flex items-center gap-2 text-green-400 text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" /> Slideshow completed!
                  </div>
                )}
              </>
            ) : unit.slideshow_url ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <BookOpen className="w-10 h-10 text-orange mx-auto mb-3" />
                <p className="text-foreground font-semibold mb-2">External Slideshow</p>
                <a
                  href={unit.slideshow_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange hover:underline text-sm"
                >
                  Open Slideshow →
                </a>
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">No slideshow available for this unit.</div>
            )}
          </div>
        )}

        {activeTab === "exercises" && (
          <div className="animate-fade-in space-y-6">
            {unit.exercises?.map((ex, i) => (
              <div key={ex.id || i} className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange/20 text-orange text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    {ex.title}
                  </h3>
                  {progress?.exercises_completed?.includes(ex.id || String(i)) && (
                    <span className="text-green-400 text-xs font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Completed
                    </span>
                  )}
                </div>
                {ex.instructions && (
                  <p className="text-muted-foreground text-sm mb-4 whitespace-pre-wrap">{ex.instructions}</p>
                )}
                <JavaIDE
                  key={ex.id || i}
                  initialCode={ex.starter_code || `public class Exercise${i + 1} {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}`}
                  onComplete={() => {
                    const exId = ex.id || String(i);
                    const completed = [...(progress?.exercises_completed || [])];
                    if (!completed.includes(exId)) {
                      completed.push(exId);
                      upsertProgress({ exercises_completed: completed }).then(recalcProgress);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === "quiz" && unit.quiz_questions?.length > 0 && (
          <QuizSection
            unit={unit}
            user={user}
            progress={progress}
            onComplete={(score, total) => {
              upsertProgress({
                quiz_score: score,
                quiz_completed: true,
                quiz_attempts: (progress?.quiz_attempts || 0) + 1,
              }).then(recalcProgress);
            }}
          />
        )}

        {activeTab === "project" && unit.project?.title && (
          <ProjectSection
            unit={unit}
            user={user}
            progress={progress}
            onSubmit={() => {
              upsertProgress({ project_submitted: true }).then(recalcProgress);
            }}
          />
        )}
      </div>
    </div>
  );
}
