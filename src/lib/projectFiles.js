import { LEGACY_PROJECT_ID } from "@/api/entities";

/** localStorage slot holding a student's in-progress files for one project. */
export function projectStorageKey(unitId, projectId) {
  return `project-files-${unitId}-${projectId}`;
}

/**
 * Projects used to share a single slot per unit, before a unit could hold more
 * than one. Move that saved work across the first time the student opens the
 * project it belonged to, so nobody loses uncommitted code.
 */
export function resolveProjectStorageKey(unitId, projectId) {
  const key = projectStorageKey(unitId, projectId);
  if (projectId !== LEGACY_PROJECT_ID) return key;
  try {
    if (!localStorage.getItem(key)) {
      const previous = localStorage.getItem(`project-files-${unitId}`);
      if (previous) localStorage.setItem(key, previous);
    }
  } catch { /* storage unavailable — fall through to the fresh key */ }
  return key;
}
