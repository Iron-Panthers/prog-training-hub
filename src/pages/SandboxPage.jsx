import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Play, RotateCcw, Save, Loader2, Code2, ChevronDown } from "lucide-react";

const SNIPPETS = [
  { label: "Hello World", code: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Iron Panthers! 🐾");\n    }\n}` },
  { label: "For Loop", code: `public class Main {\n    public static void main(String[] args) {\n        for (int i = 1; i <= 5; i++) {\n            System.out.println("Lap " + i);\n        }\n    }\n}` },
  { label: "Array Example", code: `public class Main {\n    public static void main(String[] args) {\n        int[] motors = {100, 75, 50, 25};\n        for (int speed : motors) {\n            System.out.println("Motor speed: " + speed + "%");\n        }\n    }\n}` },
  { label: "Class Example", code: `public class Robot {\n    private String name;\n    private int speed;\n\n    public Robot(String name, int speed) {\n        this.name = name;\n        this.speed = speed;\n    }\n\n    public void drive() {\n        System.out.println(name + " driving at " + speed + "%");\n    }\n\n    public static void main(String[] args) {\n        Robot r = new Robot("Iron Panther", 85);\n        r.drive();\n    }\n}` },
  { label: "FRC Motor", code: `// FRC-style motor control simulation\npublic class DriveSubsystem {\n    private double leftSpeed = 0.0;\n    private double rightSpeed = 0.0;\n\n    public void arcadeDrive(double speed, double rotation) {\n        leftSpeed = speed + rotation;\n        rightSpeed = speed - rotation;\n        // Clamp to [-1, 1]\n        leftSpeed = Math.max(-1.0, Math.min(1.0, leftSpeed));\n        rightSpeed = Math.max(-1.0, Math.min(1.0, rightSpeed));\n        System.out.println("Left: " + leftSpeed + " Right: " + rightSpeed);\n    }\n\n    public static void main(String[] args) {\n        DriveSubsystem drive = new DriveSubsystem();\n        drive.arcadeDrive(0.8, 0.2);\n        drive.arcadeDrive(-0.5, 0.0);\n    }\n}` },
];

const DEFAULT_CODE = `public class Main {\n    public static void main(String[] args) {\n        // Start coding here!\n        System.out.println("Hello, FRC Team 5026! 🐾");\n    }\n}`;

export default function SandboxPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [showSnippets, setShowSnippets] = useState(false);

  const runCode = async () => {
    setRunning(true);
    setError(null);
    setOutput("⚙️ Compiling and running...");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Java code executor simulator. Execute the following Java code and return ONLY the console output, exactly as it would appear. If there's a compilation error, return it in standard Java compiler error format. If the code runs successfully with no output, return "(no output)".

Java code:
\`\`\`java
${code}
\`\`\``,
      });
      setOutput(res);
    } catch (e) {
      setError("Execution failed. Please try again.");
      setOutput("");
    }
    setRunning(false);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-navy border-b border-white/10 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Code2 className="w-5 h-5 text-orange" />
          <div>
            <h1 className="text-white font-black text-sm">Java Sandbox IDE</h1>
            <p className="text-white/30 text-xs">Iron Panthers — FRC Team 5026</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowSnippets(!showSnippets)}
              className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-lg transition-all"
            >
              Snippets <ChevronDown className="w-3 h-3" />
            </button>
            {showSnippets && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-[#1e1e2e] border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden">
                {SNIPPETS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => { setCode(s.code); setShowSnippets(false); setOutput(""); }}
                    className="w-full text-left px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/10 text-xs transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => { setCode(DEFAULT_CODE); setOutput(""); setError(null); }}
            className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-lg transition-all"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
          <button
            onClick={runCode}
            disabled={running}
            className="flex items-center gap-1.5 bg-orange hover:bg-orange-light text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-orange/30"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {running ? "Running..." : "Run Code"}
          </button>
        </div>
      </div>

      {/* IDE Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col bg-[#1e1e2e] min-h-0">
          <div className="px-4 py-2 bg-[#181825] border-b border-white/10 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-white/30 text-xs font-mono ml-2">Main.java</span>
          </div>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            className="flex-1 bg-[#1e1e2e] text-[#cdd6f4] font-mono text-sm p-5 focus:outline-none resize-none"
            style={{ lineHeight: "1.7", tabSize: 4 }}
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

        {/* Output panel */}
        <div className="md:w-80 bg-[#11111b] border-t md:border-t-0 md:border-l border-white/10 flex flex-col min-h-0">
          <div className="px-4 py-2.5 bg-[#181825] border-b border-white/10 flex items-center justify-between">
            <span className="text-white/40 text-xs font-mono">Console Output</span>
            {output && (
              <button onClick={() => setOutput("")} className="text-white/20 hover:text-white/50 text-xs">clear</button>
            )}
          </div>
          <div className="flex-1 p-4 overflow-auto">
            {running && (
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" /> Running...
              </div>
            )}
            {!running && error && (
              <pre className="text-red-400 text-xs font-mono whitespace-pre-wrap">{error}</pre>
            )}
            {!running && output && !error && (
              <pre className={`text-xs font-mono whitespace-pre-wrap ${output.toLowerCase().includes("error") ? "text-red-400" : "text-[#a6e3a1]"}`}>
                {output}
              </pre>
            )}
            {!running && !output && !error && (
              <div className="text-white/20 text-xs text-center mt-8">
                <Code2 className="w-6 h-6 mx-auto mb-2 opacity-30" />
                <p>Run your code to see output</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}