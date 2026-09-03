import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Unit, StudentProgress, ProjectSubmission, QuizSubmission } from "@/api/entities";
import { listProfiles } from "@/lib/profiles";
import { computeUnitProgress } from "@/lib/progress";
import {
  loadReportData, groupBy, countBuckets, completedExerciseIds,
  percent, quizPercent, isStudent, STATUS_BUCKETS,
} from "@/lib/reports";
import {
  ArrowLeft, BarChart3, Search, ChevronRight, BookOpen,
  ClipboardList, HelpCircle, Users, Code2, Presentation,
} from "lucide-react";

const SegmentBar = ({ counts, total }) => (
  <div className="h-2 rounded-full bg-muted overflow-hidden flex">
    {STATUS_BUCKETS.map(b => counts[b.key] > 0 && (
      <div key={b.key} className={b.bar} style={{ width: `${percent(counts[b.key], total)}%` }} />
    ))}
  </div>
);

const SegmentLegend = ({ counts, total }) => (
  <div className="flex gap-2 flex-wrap mt-2">
    {STATUS_BUCKETS.map(b => (
      <span key={b.key} className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${b.pill}`}>
        {b.label} {percent(counts[b.key], total)}% ({counts[b.key]})
      </span>
    ))}
  </div>
);

const RateBar = ({ value }) => (
  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
    <div className="h-full bg-orange rounded-full transition-all duration-500" style={{ width: `${value}%` }} />
  </div>
);

/**
 * Every rate on these pages is measured against the student roster, so work
 * done by staff accounts while testing a unit never skews the numbers.
 */
function studentRows(rows, studentIds) {
  return (rows || []).filter(r => studentIds.has(r.student_id));
}

function unitSummary(unit, studentIds, { progress, projects, quizzes }) {
  const total = studentIds.size;
  const perStudent = [...studentIds].map(id => {
    const p = progress.find(row => row.student_id === id);
    return computeUnitProgress(unit, p);
  });

  const projectStudents = new Set(projects.map(p => p.student_id));
  const quizStudents = new Set(quizzes.map(q => q.student_id));

  return {
    total,
    avgProgress: total ? Math.round(perStudent.reduce((a, b) => a + b, 0) / total) : 0,
    projectCount: projects.length,
    projectStudents: projectStudents.size,
    projectRate: percent(projectStudents.size, total),
    buckets: countBuckets(projects),
    quizCount: quizzes.length,
    quizStudents: quizStudents.size,
    quizRate: percent(quizStudents.size, total),
    quizAvg: quizzes.length ? Math.round(quizzes.reduce((a, q) => a + quizPercent(q), 0) / quizzes.length) : null,
  };
}

/* ------------------------------------------------------------------- list */

function UnitReportsList() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => { loadReportData().then(setData); }, []);

  const units = useMemo(() => {
    if (!data) return [];
    const studentIds = new Set(data.profiles.filter(isStudent).map(p => p.id));
    const progressByUnit = groupBy(studentRows(data.progress, studentIds), "unit_id");
    const projectsByUnit = groupBy(studentRows(data.projects, studentIds), "unit_id");
    const quizzesByUnit = groupBy(studentRows(data.quizzes, studentIds), "unit_id");

    return data.units.map(unit => ({
      unit,
      summary: unitSummary(unit, studentIds, {
        progress: progressByUnit.get(unit.id) || [],
        projects: projectsByUnit.get(unit.id) || [],
        quizzes: quizzesByUnit.get(unit.id) || [],
      }),
    }));
  }, [data]);

  const term = search.trim().toLowerCase();
  const visible = units.filter(({ unit }) => !term || unit.title?.toLowerCase().includes(term));

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-navy px-6 py-8 md:px-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange" /> Unit Reports
          </h1>
          <p className="text-white/40 text-sm mt-1">How students are responding to each unit</p>
          <div className="relative mt-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search units..."
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange/60"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
        {!data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="bg-card border border-border rounded-2xl h-48 animate-pulse" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No units found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visible.map(({ unit, summary }) => (
              <Link
                key={unit.id}
                to={`/admin/unit-reports/${unit.id}`}
                className="bg-card border border-border hover:border-orange/40 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-orange/10 group block"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-foreground group-hover:text-orange transition-colors text-base">
                    Unit {unit.order}: {unit.title}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-orange transition-colors flex-shrink-0 mt-1" />
                </div>
                {!unit.is_published && (
                  <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">Unpublished</span>
                )}

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">Average progress</span>
                      <span className="text-xs font-semibold text-foreground">{summary.avgProgress}%</span>
                    </div>
                    <RateBar value={summary.avgProgress} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">
                        Projects submitted{unit.projects?.length ? "" : " (no projects)"}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {summary.projectRate}% · {summary.projectCount} submissions
                      </span>
                    </div>
                    {summary.projectCount > 0
                      ? <SegmentBar counts={summary.buckets} total={summary.projectCount} />
                      : <RateBar value={0} />}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">
                        Quiz submitted{unit.quiz_questions?.length ? "" : " (no quiz)"}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {summary.quizRate}%{summary.quizAvg !== null && ` · ${summary.quizAvg}% avg`}
                      </span>
                    </div>
                    <RateBar value={summary.quizRate} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- detail */

function QuestionBreakdown({ question, index, submissions }) {
  const options = question.options || [];
  const counts = options.map(() => 0);
  let unanswered = 0;

  submissions.forEach(sub => {
    const raw = sub.answers?.[index];
    const chosen = raw === undefined || raw === null || raw === "" ? null : Number(raw);
    if (chosen === null || Number.isNaN(chosen) || chosen < 0 || chosen >= options.length) unanswered += 1;
    else counts[chosen] += 1;
  });

  const answered = submissions.length - unanswered;
  const correctRate = percent(counts[question.correct_index] || 0, submissions.length);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <p className="text-foreground text-sm font-semibold">
          <span className="text-orange mr-1">Q{index + 1}.</span>{question.question}
        </p>
        <div className="text-right flex-shrink-0">
          <p className={`text-lg font-black ${correctRate >= 70 ? "text-green-400" : "text-red-400"}`}>{correctRate}%</p>
          <p className="text-xs text-muted-foreground">correct</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {options.map((opt, oi) => {
          const correct = oi === question.correct_index;
          const share = percent(counts[oi], submissions.length);
          return (
            <div key={oi}>
              <div className="flex items-center gap-2 text-xs mb-1">
                <span className={`font-mono ${correct ? "text-green-400" : "text-muted-foreground"}`}>
                  {String.fromCharCode(65 + oi)}.
                </span>
                <span className={`flex-1 ${correct ? "text-green-400 font-medium" : "text-foreground"}`}>
                  {opt || "—"}
                </span>
                {correct && <span className="text-green-400 font-semibold">Correct</span>}
                <span className="text-muted-foreground w-20 text-right">{share}% ({counts[oi]})</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${correct ? "bg-green-500/70" : "bg-orange/60"}`}
                  style={{ width: `${share}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        {answered} of {submissions.length} attempts answered this question
        {unanswered > 0 && ` · ${unanswered} left it blank or answered before the options changed`}
      </p>
      {question.explanation && (
        <p className="text-xs text-muted-foreground italic mt-1">{question.explanation}</p>
      )}
    </div>
  );
}

function UnitReport() {
  const { unitId } = useParams();
  const [state, setState] = useState(null);

  useEffect(() => {
    (async () => {
      const [units, profiles, progress, projects, quizzes] = await Promise.all([
        Unit.filter({ id: unitId }),
        listProfiles(),
        StudentProgress.filter({ unit_id: unitId }),
        ProjectSubmission.filter({ unit_id: unitId }, "-created_at", 1000),
        QuizSubmission.filter({ unit_id: unitId }, "-created_at", 1000),
      ]);
      setState({ unit: units[0] || null, profiles, progress, projects, quizzes });
    })();
  }, [unitId]);

  if (!state) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-orange rounded-full animate-spin" />
      </div>
    );
  }
  if (!state.unit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Unit not found.</p>
      </div>
    );
  }

  const { unit } = state;
  const studentIds = new Set(state.profiles.filter(isStudent).map(p => p.id));
  const progress = studentRows(state.progress, studentIds);
  const projects = studentRows(state.projects, studentIds);
  const quizzes = studentRows(state.quizzes, studentIds);
  const summary = unitSummary(unit, studentIds, { progress, projects, quizzes });

  const hasSlideshow = !!(unit.slideshow_pdf || unit.slideshow_embed || unit.slideshow_url);
  const slideshowRate = percent(progress.filter(p => p.slideshow_completed).length, summary.total);
  const exercises = unit.exercises || [];
  const projectsByProject = groupBy(projects, "project_id");
  const questions = unit.quiz_questions || [];

  const stats = [
    { label: "Students", value: summary.total, icon: Users, color: "text-blue-400" },
    { label: "Avg Progress", value: `${summary.avgProgress}%`, icon: BarChart3, color: "text-orange" },
    { label: "Projects Submitted", value: `${summary.projectRate}%`, icon: ClipboardList, color: "text-green-400" },
    { label: "Quiz Submitted", value: `${summary.quizRate}%`, icon: HelpCircle, color: "text-purple-400" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-navy px-6 py-8 md:px-10">
        <div className="max-w-5xl mx-auto">
          <Link to="/admin/unit-reports" className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-4 w-fit transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to unit reports
          </Link>
          <h1 className="text-2xl font-black text-white">Unit {unit.order}: {unit.title}</h1>
          <p className="text-white/40 text-sm mt-1">
            Measured across {summary.total} student{summary.total === 1 ? "" : "s"}
            {!unit.is_published && " · unpublished"}
          </p>
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

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-8">
        {(hasSlideshow || exercises.length > 0) && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Presentation className="w-5 h-5 text-orange" /> Material
            </h2>
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              {hasSlideshow && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-foreground">Slideshow marked complete</span>
                    <span className="text-xs font-semibold text-foreground">
                      {slideshowRate}% ({progress.filter(p => p.slideshow_completed).length}/{summary.total})
                    </span>
                  </div>
                  <RateBar value={slideshowRate} />
                </div>
              )}
              {exercises.map((ex, i) => {
                const done = progress.filter(p => completedExerciseIds(unit, p).includes(ex.id || String(i))).length;
                const rate = percent(done, summary.total);
                return (
                  <div key={ex.id || i}>
                    <div className="flex items-center justify-between mb-1.5 gap-3">
                      <span className="text-sm text-foreground flex items-center gap-2 min-w-0">
                        <Code2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{ex.title || `Exercise ${i + 1}`}</span>
                      </span>
                      <span className="text-xs font-semibold text-foreground flex-shrink-0">
                        {rate}% ({done}/{summary.total})
                      </span>
                    </div>
                    <RateBar value={rate} />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-orange" /> Projects
          </h2>
          {(unit.projects?.length || 0) === 0 && projects.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground text-sm">
              This unit has no projects.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-foreground">All projects</span>
                  <span className="text-xs text-muted-foreground">
                    {summary.projectStudents}/{summary.total} students submitted ({summary.projectRate}%) · {summary.projectCount} submissions
                  </span>
                </div>
                <SegmentBar counts={summary.buckets} total={summary.projectCount} />
                <SegmentLegend counts={summary.buckets} total={summary.projectCount} />
              </div>

              {(unit.projects || []).map(project => {
                const subs = projectsByProject.get(project.id) || [];
                const students = new Set(subs.map(s => s.student_id));
                const buckets = countBuckets(subs);
                return (
                  <div key={project.id} className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-sm font-semibold text-foreground truncate">{project.title || "Untitled project"}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {students.size}/{summary.total} submitted ({percent(students.size, summary.total)}%)
                      </span>
                    </div>
                    {subs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No submissions yet.</p>
                    ) : (
                      <>
                        <SegmentBar counts={buckets} total={subs.length} />
                        <SegmentLegend counts={buckets} total={subs.length} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-orange" /> Quiz
          </h2>
          {questions.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground text-sm">
              This unit has no quiz questions.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-foreground">Participation</span>
                  <span className="text-xs text-muted-foreground">
                    {summary.quizStudents}/{summary.total} students ({summary.quizRate}%) · {summary.quizCount} attempts
                    {summary.quizAvg !== null && ` · ${summary.quizAvg}% average score`}
                  </span>
                </div>
                <RateBar value={summary.quizRate} />
              </div>

              {quizzes.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground text-sm">
                  No quiz attempts to break down yet.
                </div>
              ) : (
                questions.map((q, i) => (
                  <QuestionBreakdown key={q.id || i} question={q} index={i} submissions={quizzes} />
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export { UnitReportsList, UnitReport };
export default UnitReportsList;
