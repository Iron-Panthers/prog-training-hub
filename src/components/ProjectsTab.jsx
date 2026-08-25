import { useState } from "react";
import { CheckCircle, Rocket } from "lucide-react";
import ProjectSection from "@/components/ProjectSection";

export default function ProjectsTab({ unit, user, progress, onSubmit }) {
  const projects = unit.projects || [];
  // Open the first project they still owe rather than one they've finished.
  const [selectedId, setSelectedId] = useState(() => (
    projects.find(p => !progress?.projects_submitted?.includes(p.id)) || projects[0]
  )?.id);

  const project = projects.find(p => p.id === selectedId) || projects[0];
  if (!project) return null;

  const isSubmitted = (id) => progress?.projects_submitted?.includes(id);

  return (
    <div className="space-y-6">
      {projects.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {projects.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border whitespace-nowrap transition-all ${
                p.id === project.id
                  ? "bg-orange/10 border-orange text-orange"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-orange/40"
              }`}
            >
              <Rocket className="w-3.5 h-3.5" />
              {p.title || `Project ${i + 1}`}
              {isSubmitted(p.id) && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
            </button>
          ))}
        </div>
      )}

      {/* Keyed so switching projects remounts the editor with the new project's files */}
      <ProjectSection
        key={project.id}
        unit={unit}
        project={project}
        user={user}
        progress={progress}
        onSubmit={() => onSubmit?.(project.id)}
      />
    </div>
  );
}
