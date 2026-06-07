import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Unit, ProjectSubmission, executeJava } from "@/api/entities";
import CodeMirror, { oneDark } from "@uiw/react-codemirror";
import { java } from "@codemirror/lang-java";
import FileTabs from "@/components/FileTabs";
import { Play, Loader2, ArrowLeft, Send, List, Rocket, CheckCircle, Code2 } from "lucide-react";

export default function ProjectIDEPage({ user }) {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const storageKey = `project-files-${unitId}`;

  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([{ name: "Main.java", code: "" }]);
  const [activeFile, setActiveFile] = useState(0);
  const [output, setOutput] = useState("");
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmingSubmit, setConfirmingSubmit] = useState(false);

  useEffect(() => {
    Unit.filter({ id: unitId }).then(data => {
      if (data.length > 0) {
        setUnit(data[0]);
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            setFiles(JSON.parse(saved));
            setLoading(false);
            return;
          }
        } catch {}
        const starterCode = data[0].project?.starter_code || `public class Project {\n    public static void main(String[] args) {\n        // Your project code here\n    }\n}`;
        setFiles([{ name: "Main.java", code: starterCode }]);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [unitId]);

  const updateFiles = (newFiles) => {
    setFiles(newFiles);
    try { localStorage.setItem(storageKey, JSON.stringify(newFiles)); } catch {}
  };

  const addFile = () => {
    const n = files.length + 1;
    const newFile = { name: `Class${n}.java`, code: `public class Class${n} {\n    \n}\n` };
    const newFiles = [...files, newFile];
    updateFiles(newFiles);
    setActiveFile(newFiles.length - 1);
  };

  const deleteFile = (i) => {
    if (files.length <= 1) return;
    const newFiles = files.filter((_, idx) => idx !== i);
    updateFiles(newFiles);
    setActiveFile(prev => {
      if (prev < i) return prev;
      if (prev === i) return Math.max(0, i - 1);
      return prev - 1;
    });
  };

  const renameFile = (i, name) => {
    updateFiles(files.map((f, idx) => idx === i ? { ...f, name } : f));
  };

  const updateCode = (val) => {
    updateFiles(files.map((f, i) => i === activeFile ? { ...f, code: val } : f));
  };

  const runCode = async () => {
    setRunning(true);
    setError(null);
    setOutput("⚙️ Compiling and running...");
    try {
      const result = await executeJava(files);
      if (result.compileError) { setError(result.compileError); setOutput(""); }
      else if (result.stderr) { setError(result.stderr); setOutput(result.stdout || ""); }
      else { setOutput(result.stdout || "(no output)"); }
    } catch {
      setError("Execution failed. Please try again.");
      setOutput("");
    }
    setRunning(false);
  };

  const handleSubmit = async () => {
    const mainCode = files[0]?.code || "";
    if (!mainCode.trim()) return;
    const code = files.length === 1
      ? files[0].code
      : files.map(f => `// ===== ${f.name} =====\n${f.code}`).join("\n\n");
    setSubmitting(true);
    try {
      await ProjectSubmission.create({
        student_id: user.id,
        unit_id: unitId,
        code,
        notes,
        status: "submitted",
        created_at: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch {
      setError("Submission failed. Please try again.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-orange" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Project Submitted!</h2>
        <p className="text-muted-foreground text-sm">Your teachers will review it and leave feedback soon.</p>
        <button
          onClick={() => navigate(`/units/${unitId}`)}
          className="text-orange hover:underline text-sm flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Unit
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-navy border-b border-white/10 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/units/${unitId}`)}
            className="text-white/40 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="w-px h-4 bg-white/20" />
          <Rocket className="w-4 h-4 text-orange" />
          <div>
            <h1 className="text-white font-black text-sm">{unit?.project?.title || "Project"}</h1>
            <p className="text-white/30 text-xs">{unit?.title}</p>
          </div>
        </div>
        <button
          onClick={runCode}
          disabled={running}
          className="flex items-center gap-1.5 bg-orange hover:bg-orange-light text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-orange/30"
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {running ? "Running..." : "Run Code"}
        </button>
      </div>

      {/* IDE Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-4 py-2 bg-[#181825] flex items-center gap-2 flex-shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
          </div>
          <FileTabs
            files={files}
            activeFile={activeFile}
            onSwitch={setActiveFile}
            onAdd={addFile}
            onDelete={deleteFile}
            onRename={renameFile}
          />
          <div className="flex-1 overflow-hidden">
            <CodeMirror
              value={files[activeFile]?.code || ""}
              onChange={updateCode}
              extensions={[java()]}
              theme={oneDark}
              height="100%"
              basicSetup={{ tabSize: 4 }}
              style={{ height: "100%" }}
            />
          </div>
        </div>

        {/* Right panel */}
        <div className="md:w-80 bg-[#11111b] border-t md:border-t-0 md:border-l border-white/10 flex flex-col min-h-0">
          {/* Requirements */}
          {unit?.project?.requirements?.length > 0 && (
            <div className="p-4 border-b border-white/10 flex-shrink-0">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                <List className="w-3.5 h-3.5" /> Requirements
              </p>
              <ul className="space-y-1.5">
                {unit.project.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange flex-shrink-0 mt-1" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Console output */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-2.5 bg-[#181825] border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <span className="text-white/40 text-xs font-mono">Console Output</span>
              {output && <button onClick={() => setOutput("")} className="text-white/20 hover:text-white/50 text-xs">clear</button>}
            </div>
            <div className="flex-1 p-4 overflow-auto">
              {running && <div className="flex items-center gap-2 text-white/40 text-xs"><Loader2 className="w-3 h-3 animate-spin" /> Running...</div>}
              {!running && error && <pre className="text-red-400 text-xs font-mono whitespace-pre-wrap">{error}</pre>}
              {!running && output && !error && <pre className="text-xs font-mono whitespace-pre-wrap text-[#a6e3a1]">{output}</pre>}
              {!running && !output && !error && (
                <div className="text-white/20 text-xs text-center mt-8">
                  <Code2 className="w-6 h-6 mx-auto mb-2 opacity-30" />
                  <p>Run your code to see output</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="p-4 border-t border-white/10 flex-shrink-0">
            <label className="text-xs font-semibold text-white/60 mb-2 block">Notes for teachers (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes about your approach..."
              className="w-full bg-[#1e1e2e] border border-white/10 rounded-lg p-2.5 text-xs text-white/70 placeholder-white/20 focus:outline-none focus:border-orange/50 resize-none h-16 mb-3"
            />
            {confirmingSubmit ? (
              <div className="space-y-2">
                <p className="text-xs text-center text-white/50">Submit your project? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setConfirmingSubmit(false); handleSubmit(); }}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-orange hover:bg-orange-light disabled:opacity-40 text-white font-bold py-2 rounded-lg transition-all text-xs"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {submitting ? "Submitting..." : "Yes, Submit"}
                  </button>
                  <button
                    onClick={() => setConfirmingSubmit(false)}
                    className="flex-1 py-2 rounded-lg border border-white/20 text-white/50 hover:text-white/80 hover:border-white/40 font-semibold text-xs transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingSubmit(true)}
                disabled={submitting || !files[0]?.code.trim()}
                className="w-full flex items-center justify-center gap-2 bg-orange hover:bg-orange-light disabled:opacity-40 text-white font-bold py-2.5 rounded-lg transition-all text-sm"
              >
                <Send className="w-4 h-4" /> Submit Project
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
