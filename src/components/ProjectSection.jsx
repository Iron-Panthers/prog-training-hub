import { useState } from "react";
import { ProjectSubmission } from "@/api/entities";
import { Rocket, CheckCircle, Send, List } from "lucide-react";
import JavaIDE from "@/components/JavaIDE";

export default function ProjectSection({ unit, user, progress, onSubmit }) {
  const [code, setCode] = useState(unit.project?.starter_code || `public class Project {\n    public static void main(String[] args) {\n        // Your project code here\n    }\n}`);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(progress?.project_submitted || false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    await ProjectSubmission.create({
      student_id: user.id,
      student_name: user.name,
      unit_id: unit.id,
      unit_title: unit.title,
      code,
      notes,
      status: "submitted",
    });
    setSubmitted(true);
    onSubmit?.();
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-black text-foreground mb-2">Project Submitted!</h3>
        <p className="text-muted-foreground text-sm">Your mentor will review it and leave feedback soon.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-bold text-foreground text-lg mb-1 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-orange" /> {unit.project.title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4">{unit.project.description}</p>
        {unit.project.requirements?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <List className="w-3.5 h-3.5" /> Requirements
            </p>
            <ul className="space-y-1">
              {unit.project.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange flex-shrink-0 mt-1.5" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <JavaIDE
        initialCode={code}
        showCompleteButton={false}
        height="380px"
      />

      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">Notes for your mentor (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Anything you want to mention about your approach or questions you have..."
          className="w-full bg-card border border-border rounded-xl p-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-orange/50 resize-none h-24"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || !code.trim()}
        className="w-full flex items-center justify-center gap-2 bg-orange hover:bg-orange-light disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-all"
      >
        {submitting ? (
          <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Submitting...</>
        ) : (
          <><Send className="w-4 h-4" /> Submit Project</>
        )}
      </button>
    </div>
  );
}
