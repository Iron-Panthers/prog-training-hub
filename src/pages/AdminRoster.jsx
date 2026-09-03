import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Unit, StudentProgress, ProjectSubmission, QuizSubmission } from "@/api/entities";
import { getProfile } from "@/lib/profiles";
import CosmeticAvatar from "@/components/CosmeticAvatar";
import { computeUnitProgress } from "@/lib/progress";
import {
  loadReportData, groupBy, countBuckets, bucketMeta, statusBucket,
  quizPercent, gradeQuiz, completedExerciseIds, isStudent,
} from "@/lib/reports";
import { formatDateValue } from "@/utils";
import {
  ArrowLeft, Users, Search, ChevronRight, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Circle, ClipboardList, HelpCircle, TrendingUp, BookOpen,
} from "lucide-react";

const ProgressBar = ({ value, className = "bg-orange" }) => (
  <div className="h-1.5 bg-muted rounded-full overflow-hidden min-w-[3rem]">
    <div className={`h-full ${className} rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
  </div>
);

const StatusPill = ({ status }) => {
  const meta = bucketMeta(statusBucket(status));
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${meta.pill}`}>
      {meta.label}
    </span>
  );
};

/* ------------------------------------------------------------------ roster */

const COLUMNS = [
  { key: "name", label: "Student", align: "text-left" },
  { key: "overall", label: "Progress", align: "text-left" },
  { key: "unitsComplete", label: "Units Done", align: "text-left" },
  { key: "exercisesDone", label: "Exercises", align: "text-left" },
  { key: "projectCount", label: "Projects", align: "text-left" },
  { key: "quizCount", label: "Quizzes", align: "text-left" },
];

function RosterList() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });

  useEffect(() => { loadReportData().then(setData); }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const units = data.units.filter(u => u.is_published);
    const progressByStudent = groupBy(data.progress, "student_id");
    const projectsByStudent = groupBy(data.projects, "student_id");
    const quizzesByStudent = groupBy(data.quizzes, "student_id");

    return data.profiles.map(profile => {
      const byUnit = new Map((progressByStudent.get(profile.id) || []).map(p => [p.unit_id, p]));
      const perUnit = units.map(u => computeUnitProgress(u, byUnit.get(u.id)));
      const projects = projectsByStudent.get(profile.id) || [];
      const quizzes = quizzesByStudent.get(profile.id) || [];

      return {
        profile,
        name: profile.name || profile.id,
        overall: perUnit.length ? Math.round(perUnit.reduce((a, b) => a + b, 0) / perUnit.length) : 0,
        unitsComplete: perUnit.filter(p => p === 100).length,
        unitCount: units.length,
        exercisesDone: units.reduce((n, u) => n + completedExerciseIds(u, byUnit.get(u.id)).length, 0),
        exercisesTotal: units.reduce((n, u) => n + (u.exercises?.length || 0), 0),
        projectCount: projects.length,
        buckets: countBuckets(projects),
        quizCount: quizzes.length,
        quizAvg: quizzes.length ? Math.round(quizzes.reduce((a, q) => a + quizPercent(q), 0) / quizzes.length) : null,
      };
    });
  }, [data]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = rows.filter(r => !term || r.name.toLowerCase().includes(term));
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sort.key === "name") return a.name.localeCompare(b.name) * dir;
      return ((a[sort.key] || 0) - (b[sort.key] || 0)) * dir;
    });
  }, [rows, search, sort]);

  const toggleSort = (key) => setSort(s => ({
    key,
    // Names read best A→Z first, numbers read best highest-first.
    dir: s.key === key ? (s.dir === "asc" ? "desc" : "asc") : (key === "name" ? "asc" : "desc"),
  }));

  const students = rows.filter(r => isStudent(r.profile));
  const stats = [
    { label: "Students", value: students.length, icon: Users, color: "text-blue-400" },
    {
      label: "Avg Progress",
      value: students.length ? `${Math.round(students.reduce((a, r) => a + r.overall, 0) / students.length)}%` : "0%",
      icon: TrendingUp, color: "text-orange",
    },
    { label: "Pending Reviews", value: rows.reduce((n, r) => n + r.buckets.pending, 0), icon: ClipboardList, color: "text-yellow-400" },
    { label: "Quiz Submissions", value: rows.reduce((n, r) => n + r.quizCount, 0), icon: HelpCircle, color: "text-purple-400" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-navy px-6 py-8 md:px-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-orange" /> Student Roster
          </h1>
          <p className="text-white/40 text-sm mt-1">Progress across every published unit</p>
          <div className="relative mt-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange/60"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {stats.map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                <p className="text-2xl font-black text-white">{data ? s.value : "—"}</p>
                <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
        {!data ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="bg-card border border-border rounded-xl h-16 animate-pulse" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No students found</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {COLUMNS.map(col => (
                    <th key={col.key} className={`${col.align} font-semibold text-muted-foreground text-xs px-5 py-3 whitespace-nowrap`}>
                      <button onClick={() => toggleSort(col.key)} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        {col.label}
                        {sort.key === col.key && (sort.dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </button>
                    </th>
                  ))}
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {visible.map(r => (
                  <tr
                    key={r.profile.id}
                    onClick={() => navigate(`/admin/roster/${r.profile.id}`)}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <Link to={`/admin/roster/${r.profile.id}`} className="flex items-center gap-3">
                        <CosmeticAvatar avatarUrl={r.profile.avatar_url} userName={r.name} size="sm" />
                        <span className="font-semibold text-foreground group-hover:text-orange transition-colors whitespace-nowrap">
                          {r.name}
                        </span>
                        {!isStudent(r.profile) && (
                          <span className="text-xs px-2 py-0.5 rounded-full border border-gold/30 bg-gold/10 text-gold font-semibold capitalize">
                            {r.profile.role}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={r.overall} />
                        <span className="text-xs font-semibold text-foreground w-9">{r.overall}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{r.unitsComplete}/{r.unitCount}</td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{r.exercisesDone}/{r.exercisesTotal}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-foreground font-semibold">{r.projectCount}</span>
                      {r.projectCount > 0 && (
                        <span className="text-muted-foreground text-xs"> · {r.buckets.approved} approved, {r.buckets.pending} pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-foreground font-semibold">{r.quizCount}</span>
                      {r.quizAvg !== null && <span className="text-muted-foreground text-xs"> · {r.quizAvg}% avg</span>}
                    </td>
                    <td className="px-3 py-3">
                      <Link to={`/admin/roster/${r.profile.id}`} className="block text-muted-foreground group-hover:text-orange transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- student report */

function QuizAttempt({ unit, submission, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const graded = gradeQuiz(unit, submission);
  const pct = quizPercent(submission);

  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors">
        <span className="text-sm text-muted-foreground">
          {formatDateValue(submission.created_at)}
        </span>
        <span className="flex items-center gap-3">
          <span className={`text-sm font-black ${pct >= 70 ? "text-green-400" : "text-red-400"}`}>{pct}%</span>
          <span className="text-xs text-muted-foreground">{submission.score}/{submission.total_questions}</span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border">
          {graded.length === 0 && (
            <p className="text-xs text-muted-foreground pt-3">This unit no longer has quiz questions to grade against.</p>
          )}
          {graded.map((g, i) => (
            <div key={g.question.id || i} className={`rounded-xl border p-4 ${g.isCorrect ? "border-green-500/30" : "border-red-500/30"}`}>
              <div className="flex items-start gap-2 mb-3">
                {g.isCorrect
                  ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                <p className="text-foreground text-sm font-medium">
                  <span className="text-orange mr-1">Q{i + 1}.</span>{g.question.question}
                </p>
              </div>
              <div className="space-y-1.5 ml-6">
                {(g.question.options || []).map((opt, oi) => (
                  <div key={oi} className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                    oi === g.correctIndex ? "bg-green-500/20 text-green-400" :
                    oi === g.chosen ? "bg-red-500/20 text-red-400" :
                    "text-muted-foreground"
                  }`}>
                    <span className="font-mono">{String.fromCharCode(65 + oi)}.</span>
                    <span className="flex-1">{opt || "—"}</span>
                    {oi === g.chosen && <span className="font-semibold">Chose</span>}
                    {oi === g.correctIndex && oi !== g.chosen && <span className="font-semibold">Correct</span>}
                  </div>
                ))}
              </div>
              {g.chosen === null && <p className="text-xs text-muted-foreground mt-2 ml-6">No answer recorded.</p>}
              {g.question.explanation && <p className="mt-3 text-xs text-muted-foreground italic ml-6">{g.question.explanation}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UnitBreakdown({ unit, progress, projects, quizzes }) {
  const [open, setOpen] = useState(false);
  const pct = computeUnitProgress(unit, progress);
  const exercises = unit.exercises || [];
  const doneExercises = completedExerciseIds(unit, progress);
  const hasSlideshow = !!(unit.slideshow_pdf || unit.slideshow_embed || unit.slideshow_url);
  const bestQuiz = quizzes.reduce((best, q) => (best && quizPercent(best) >= quizPercent(q) ? best : q), null);
  // Resubmissions mean there can be more submissions than the unit has
  // projects, so the chip counts the distinct projects they answered.
  const projectsCovered = new Set(projects.map(p => p.project_id)).size;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full px-5 py-4 flex items-center gap-4 hover:bg-muted transition-colors text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground text-sm truncate">
              Unit {unit.order}: {unit.title}
            </h3>
            {!unit.is_published && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">Unpublished</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            {hasSlideshow && (
              <span className="flex items-center gap-1">
                {progress?.slideshow_completed ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Circle className="w-3 h-3" />}
                Slideshow
              </span>
            )}
            {exercises.length > 0 && <span>Exercises {doneExercises.length}/{exercises.length}</span>}
            {(unit.quiz_questions?.length > 0) && (
              <span>Quiz {quizzes.length === 0 ? "not taken" : `${quizPercent(bestQuiz)}% best of ${quizzes.length}`}</span>
            )}
            {(unit.projects?.length > 0) && (
              <span>Projects {Math.min(projectsCovered, unit.projects.length)}/{unit.projects.length} submitted</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-24 hidden sm:block"><ProgressBar value={pct} /></div>
          <span className="text-sm font-semibold text-foreground w-10 text-right">{pct}%</span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-4 space-y-5 border-t border-border">
          {exercises.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Exercises</h4>
              <div className="space-y-1.5">
                {exercises.map((ex, i) => {
                  const done = doneExercises.includes(ex.id || String(i));
                  return (
                    <div key={ex.id || i} className="flex items-center gap-2 text-sm">
                      {done ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                      <span className={done ? "text-foreground" : "text-muted-foreground"}>{ex.title || `Exercise ${i + 1}`}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Project Submissions</h4>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing submitted yet.</p>
            ) : (
              <div className="space-y-2">
                {projects.map(sub => {
                  const project = unit.projects?.find(p => p.id === sub.project_id);
                  return (
                    <Link
                      key={sub.id}
                      to={`/admin/submissions/${sub.id}`}
                      className="bg-background border border-border hover:border-orange/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:text-orange transition-colors truncate">
                          {project?.title || "Removed project"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDateValue(sub.created_at)} · {sub.admin_comments?.length || 0} comments
                        </p>
                      </div>
                      <StatusPill status={sub.status} />
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {(unit.quiz_questions?.length > 0 || quizzes.length > 0) && (
            <section>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Quiz Attempts ({quizzes.length})
              </h4>
              {quizzes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Quiz not attempted yet.</p>
              ) : (
                <div className="space-y-2">
                  {quizzes.map((q, i) => (
                    <QuizAttempt key={q.id} unit={unit} submission={q} defaultOpen={i === 0} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function StudentReport() {
  const { studentId } = useParams();
  const [state, setState] = useState(null);

  useEffect(() => {
    (async () => {
      const [units, profile, progress, projects, quizzes] = await Promise.all([
        Unit.list("order", 200),
        getProfile(studentId),
        StudentProgress.filter({ student_id: studentId }),
        ProjectSubmission.filter({ student_id: studentId }, "-created_at", 500),
        QuizSubmission.filter({ student_id: studentId }, "-created_at", 500),
      ]);
      setState({ units, profile, progress, projects, quizzes });
    })();
  }, [studentId]);

  if (!state) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-orange rounded-full animate-spin" />
      </div>
    );
  }
  if (!state.profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Student not found.</p>
      </div>
    );
  }

  const { units, profile, progress, projects, quizzes } = state;
  const progressByUnit = new Map(progress.map(p => [p.unit_id, p]));
  const projectsByUnit = groupBy(projects, "unit_id");
  const quizzesByUnit = groupBy(quizzes, "unit_id");

  // Unpublished units are still shown when this student has work in them, so
  // nothing they submitted disappears from the report.
  const relevant = units.filter(u =>
    u.is_published || progressByUnit.has(u.id) || projectsByUnit.has(u.id) || quizzesByUnit.has(u.id));
  const published = units.filter(u => u.is_published);
  const perUnit = published.map(u => computeUnitProgress(u, progressByUnit.get(u.id)));
  const overall = perUnit.length ? Math.round(perUnit.reduce((a, b) => a + b, 0) / perUnit.length) : 0;
  const buckets = countBuckets(projects);
  const quizAvg = quizzes.length ? Math.round(quizzes.reduce((a, q) => a + quizPercent(q), 0) / quizzes.length) : null;

  const stats = [
    { label: "Overall Progress", value: `${overall}%`, icon: TrendingUp, color: "text-orange" },
    { label: "Units Completed", value: `${perUnit.filter(p => p === 100).length}/${published.length}`, icon: BookOpen, color: "text-blue-400" },
    { label: "Projects Submitted", value: projects.length, icon: ClipboardList, color: "text-green-400" },
    { label: "Quiz Average", value: quizAvg === null ? "—" : `${quizAvg}%`, icon: HelpCircle, color: "text-purple-400" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-navy px-6 py-8 md:px-10">
        <div className="max-w-5xl mx-auto">
          <Link to="/admin/roster" className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-4 w-fit transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to roster
          </Link>
          <div className="flex items-center gap-4">
            <CosmeticAvatar avatarUrl={profile.avatar_url} userName={profile.name} size="lg" />
            <div>
              <h1 className="text-2xl font-black text-white">{profile.name || studentId}</h1>
              <p className="text-white/40 text-sm mt-0.5 capitalize">
                {profile.role} · {buckets.approved} approved, {buckets.returned} returned, {buckets.pending} pending
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {stats.map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-orange" /> Unit by Unit
        </h2>
        {relevant.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No units to report on yet.</div>
        ) : (
          <div className="space-y-3">
            {relevant.map(unit => (
              <UnitBreakdown
                key={unit.id}
                unit={unit}
                progress={progressByUnit.get(unit.id)}
                projects={projectsByUnit.get(unit.id) || []}
                quizzes={quizzesByUnit.get(unit.id) || []}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { RosterList, StudentReport };
export default RosterList;
