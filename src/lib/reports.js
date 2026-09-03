import { Unit, StudentProgress, ProjectSubmission, QuizSubmission } from "@/api/entities";
import { listProfiles } from "@/lib/profiles";

/**
 * The four project statuses collapse into the three buckets a reviewer
 * actually cares about. Rows written before the status list settled still say
 * "returned" rather than "needs_revision", so both land in the same bucket.
 */
export const STATUS_BUCKETS = [
  { key: "approved", label: "Approved", bar: "bg-green-500/70", pill: "bg-green-500/10 text-green-400 border-green-500/20" },
  { key: "returned", label: "Returned", bar: "bg-red-500/70", pill: "bg-red-500/10 text-red-400 border-red-500/20" },
  { key: "pending", label: "Pending", bar: "bg-yellow-500/70", pill: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  { key: "none", label: "", bar: "", pill: "" },
];

export function statusBucket(status) {
  if (status === "approved") return "approved";
  if (status === "returned" || status === "needs_revision") return "returned";
  return "pending";
}

export function bucketMeta(key) {
  return STATUS_BUCKETS.find(b => b.key === key) || STATUS_BUCKETS[2];
}

export function countBuckets(submissions) {
  const counts = { approved: 0, returned: 0, pending: 0 };
  (submissions || []).forEach(s => { counts[statusBucket(s.status)] += 1; });
  return counts;
}

export function percent(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export function quizPercent(submission) {
  return percent(submission?.score || 0, submission?.total_questions || 0);
}

/**
 * Quiz answers are stored positionally — the nth answer belongs to the nth
 * question as the quiz stood when it was taken — so grading walks both lists
 * together and reports a null choice for questions added since.
 */
export function gradeQuiz(unit, submission) {
  const answers = submission?.answers || [];
  return (unit?.quiz_questions || []).map((question, i) => {
    const raw = answers[i];
    const chosen = raw === undefined || raw === null || raw === "" ? null : Number(raw);
    const answered = chosen !== null && !Number.isNaN(chosen);
    return {
      question,
      chosen: answered ? chosen : null,
      correctIndex: question.correct_index,
      isCorrect: answered && chosen === question.correct_index,
    };
  });
}

/** Ids in `exercises_completed` that the unit still has an exercise for. */
export function completedExerciseIds(unit, progress) {
  const done = new Set(progress?.exercises_completed || []);
  return (unit?.exercises || [])
    .map((ex, i) => ex.id || String(i))
    .filter(id => done.has(id));
}

export function groupBy(rows, key) {
  const map = new Map();
  (rows || []).forEach(row => {
    const k = typeof key === "function" ? key(row) : row[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(row);
  });
  return map;
}

export const isStudent = (profile) => profile?.role === "student";

/** Everything the roster and unit reports read, fetched in one round trip. */
export async function loadReportData() {
  const [units, profiles, progress, projects, quizzes] = await Promise.all([
    Unit.list("order", 200),
    listProfiles(),
    StudentProgress.list(undefined, 2000),
    ProjectSubmission.list("-created_at", 2000),
    QuizSubmission.list("-created_at", 2000),
  ]);
  return { units, profiles, progress, projects, quizzes };
}
