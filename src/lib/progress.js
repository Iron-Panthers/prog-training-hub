import { StudentProgress } from "@/api/entities";

/**
 * Percentage of a unit a student has completed. Every piece of content the
 * unit actually has counts as one slot: the slideshow, the exercises as a
 * group, the quiz, and then each project individually.
 */
export function computeUnitProgress(unit, progress) {
  if (!unit) return 0;
  let score = 0;
  let total = 0;

  if (unit.slideshow_pdf || unit.slideshow_embed || unit.slideshow_url) {
    total++;
    if (progress?.slideshow_completed) score++;
  }

  const exCount = unit.exercises?.length || 0;
  if (exCount > 0) {
    total++;
    if ((progress?.exercises_completed?.length || 0) >= exCount) score++;
  }

  if (unit.quiz_questions?.length > 0) {
    total++;
    if (progress?.quiz_completed) score++;
  }

  const submitted = progress?.projects_submitted || [];
  (unit.projects || []).forEach(proj => {
    total++;
    if (submitted.includes(proj.id)) score++;
  });

  return total > 0 ? Math.round((score / total) * 100) : 0;
}

/** Add a project id to a student's submitted list without duplicating it. */
export function withProjectSubmitted(progress, projectId) {
  const submitted = progress?.projects_submitted || [];
  return submitted.includes(projectId) ? submitted : [...submitted, projectId];
}

/**
 * Record that a student submitted one of a unit's projects, creating their
 * progress row if they don't have one yet. Returns the updated row.
 */
export async function markProjectSubmitted(unit, studentId, projectId) {
  const [existing] = await StudentProgress.filter({ student_id: studentId, unit_id: unit.id });
  const projects_submitted = withProjectSubmitted(existing, projectId);
  const overall_progress = computeUnitProgress(unit, { ...existing, projects_submitted });

  if (existing?.id) {
    return StudentProgress.update(existing.id, { projects_submitted, overall_progress });
  }
  return StudentProgress.create({
    student_id: studentId,
    unit_id: unit.id,
    projects_submitted,
    overall_progress,
  });
}
