import { Unit, StudentProgress, ProjectSubmission, Announcement } from "@/api/entities";
import { computeUnitProgress } from "@/lib/progress";

/**
 * One-time migration: recompute every StudentProgress row so that
 *   1. `projects_approved` is populated from actual approved ProjectSubmissions
 *   2. `overall_progress` reflects the new per-exercise + approved-only formula
 *
 * Usage — call from the browser console or a temporary admin button:
 *   import { migrateAllProgress } from "@/lib/migrateProgress";
 *   await migrateAllProgress();
 */
export async function migrateAllProgress() {
  const [units, allProgress, allSubmissions] = await Promise.all([
    Unit.list("order", 200),
    StudentProgress.list(undefined, 5000),
    ProjectSubmission.list(undefined, 5000),
  ]);

  const unitMap = new Map(units.map(u => [u.id, u]));

  // Build a lookup: (student_id, unit_id) → [approved project_ids]
  const approvedMap = new Map();
  for (const sub of allSubmissions) {
    if (sub.status !== "approved") continue;
    const key = `${sub.student_id}::${sub.unit_id}`;
    if (!approvedMap.has(key)) approvedMap.set(key, []);
    const list = approvedMap.get(key);
    if (!list.includes(sub.project_id)) list.push(sub.project_id);
  }

  let updated = 0;
  let skipped = 0;

  for (const prog of allProgress) {
    const unit = unitMap.get(prog.unit_id);
    if (!unit) {
      skipped++;
      continue;
    }

    const key = `${prog.student_id}::${prog.unit_id}`;
    const projects_approved = approvedMap.get(key) || [];
    const patched = { ...prog, projects_approved };
    const overall_progress = computeUnitProgress(unit, patched);

    await StudentProgress.update(prog.id, { projects_approved, overall_progress });
    updated++;
  }

  // Create notifications for all returned/needs_revision projects
  let notified = 0;
  const returnedSubs = allSubmissions.filter(
    s => s.status === "needs_revision" || s.status === "returned"
  );

  for (const sub of returnedSubs) {
    const unit = unitMap.get(sub.unit_id);
    const unitTitle = unit?.title || "a unit";
    const project = unit?.projects?.find(p => p.id === sub.project_id);
    const projectTitle = project?.title || "a project";
    const lastComment = sub.admin_comments?.length
      ? sub.admin_comments[sub.admin_comments.length - 1]
      : null;

    await Announcement.create({
      title: `${projectTitle} needs revision`,
      content: lastComment
        ? `Your submission for <b>${unitTitle} — ${projectTitle}</b> needs revision. Latest feedback: "${lastComment.comment}"`
        : `Your submission for <b>${unitTitle} — ${projectTitle}</b> has been returned for revision.`,
      type: "reminder",
      author_name: lastComment?.author_name || "Admin",
      student_id: sub.student_id,
      is_pinned: false,
      is_published: true,
    });
    notified++;
  }

  console.log(`Migration complete: ${updated} rows updated, ${skipped} skipped, ${notified} notifications created.`);
  return { updated, skipped, notified };
}
