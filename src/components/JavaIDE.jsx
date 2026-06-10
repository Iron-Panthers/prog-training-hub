import { useState } from "react";
import { executeJava } from "@/api/entities";
import { Play, RotateCcw, CheckCircle, Loader2 } from "lucide-react";
import CodeMirror, { oneDark } from "@uiw/react-codemirror";
import { java } from "@codemirror/lang-java";
import FileTabs from "@/components/FileTabs";

export default function JavaIDE({
  initialCode = "",
  onComplete,
  showCompleteButton = true,
  height = "300px",
  storageKey = null,
  expandUrl = null,
  onFilesChange = null,
}) {
  const [files, setFiles] = useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [{ name: "Main.java", code: initialCode }];
  });
  const [activeFile, setActiveFile] = useState(0);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const updateFiles = (newFiles) => {
    setFiles(newFiles);
    if (storageKey) {
      try { localStorage.setItem(storageKey, JSON.stringify(newFiles)); } catch {}
    }
    onFilesChange?.(newFiles);
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
    setOutput("Running...");
    try {
      const result = await executeJava(files);
      if (result.compileError) {
        setError(result.compileError);
        setOutput("");
      } else if (result.stderr) {
        setError(result.stderr);
        setOutput(result.stdout || "");
      } else {
        setOutput(result.stdout || "(no output)");
      }
    } catch (e) {
      setError("Failed to run code. Try again.");
      setOutput("");
    }
    setRunning(false);
  };

  const handleComplete = () => {
    setCompleted(true);
    onComplete?.();
  };

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-[#1e1e2e]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#181825] border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <div className="flex items-center gap-2">
          {confirmingReset ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-white/40">Reset all files?</span>
              <button
                onClick={() => { setConfirmingReset(false); updateFiles([{ name: "Main.java", code: initialCode }]); setActiveFile(0); }}
                className="text-red-400 hover:text-red-300 font-semibold transition-colors"
              >Yes</button>
              <button
                onClick={() => setConfirmingReset(false)}
                className="text-white/40 hover:text-white/70 transition-colors"
              >No</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingReset(true)}
              className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs px-2 py-1 rounded-md hover:bg-white/10 transition-all"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
          <button
            onClick={runCode}
            disabled={running}
            className="flex items-center gap-1.5 bg-orange hover:bg-orange-light text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-all disabled:opacity-50"
          >
            {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            {running ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      {/* File tabs */}
      <FileTabs
        files={files}
        activeFile={activeFile}
        onSwitch={setActiveFile}
        onAdd={addFile}
        onDelete={deleteFile}
        onRename={renameFile}
        expandUrl={expandUrl}
      />

      {/* Editor */}
      <CodeMirror
        value={files[activeFile]?.code || ""}
        onChange={updateCode}
        extensions={[java()]}
        theme={oneDark}
        height={height}
        basicSetup={{ tabSize: 4 }}
      />

      {/* Output */}
      {(output || error) && (
        <div className="border-t border-white/10">
          <div className="px-4 py-2 bg-[#181825] flex items-center justify-between">
            <span className="text-xs text-white/30 font-mono">Output</span>
            <button onClick={() => { setOutput(""); setError(null); }} className="text-white/20 hover:text-white/50 text-xs">clear</button>
          </div>
          <div className={`px-4 py-3 font-mono text-xs whitespace-pre-wrap max-h-48 overflow-auto ${error ? "text-red-400" : "text-[#a6e3a1]"}`}>
            {error || output}
          </div>
        </div>
      )}

      {/* Complete button */}
      {showCompleteButton && !completed && (
        <div className="px-4 py-3 bg-[#181825] border-t border-white/10">
          <button
            onClick={handleComplete}
            className="flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-green-400 transition-colors"
          >
            <CheckCircle className="w-4 h-4" /> Mark exercise as complete
          </button>
        </div>
      )}
      {completed && (
        <div className="px-4 py-3 bg-green-500/10 border-t border-green-500/20 flex items-center gap-2 text-green-400 text-xs font-semibold">
          <CheckCircle className="w-4 h-4" /> Exercise completed!
        </div>
      )}
    </div>
  );
}
