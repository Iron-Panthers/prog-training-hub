import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Play, RotateCcw, CheckCircle, Loader2 } from "lucide-react";

export default function JavaIDE({ initialCode = "", onComplete, showCompleteButton = true, height = "300px" }) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(null);

  const runCode = async () => {
    setRunning(true);
    setError(null);
    setOutput("Running...");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Java code executor simulator. Execute the following Java code and return what the output would be. Only return the console output, nothing else. If there's a compilation error, return it as it would appear in the console. If the code runs successfully with no output, return "(no output)".

Java code:
\`\`\`java
${code}
\`\`\``,
      });
      setOutput(res);
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
          <span className="ml-2 text-white/30 text-xs font-mono">Main.java</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCode(initialCode)}
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs px-2 py-1 rounded-md hover:bg-white/10 transition-all"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
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

      {/* Editor */}
      <div className="relative">
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          className="w-full bg-[#1e1e2e] text-[#cdd6f4] font-mono text-sm p-4 focus:outline-none resize-none"
          style={{ height, lineHeight: "1.6", tabSize: 4 }}
          spellCheck={false}
          onKeyDown={e => {
            if (e.key === "Tab") {
              e.preventDefault();
              const start = e.target.selectionStart;
              const end = e.target.selectionEnd;
              const newCode = code.substring(0, start) + "    " + code.substring(end);
              setCode(newCode);
              setTimeout(() => {
                e.target.selectionStart = start + 4;
                e.target.selectionEnd = start + 4;
              }, 0);
            }
          }}
        />
      </div>

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