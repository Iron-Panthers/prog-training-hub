import { useState } from "react";
import { executeJava } from "@/api/entities";
import { Play, RotateCcw, Loader2, Code2, ChevronDown } from "lucide-react";
import CodeMirror, { oneDark } from "@uiw/react-codemirror";
import { java } from "@codemirror/lang-java";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { nord } from "@uiw/codemirror-theme-nord";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { tokyoNight } from "@uiw/codemirror-theme-tokyo-night";
import FileTabs from "@/components/FileTabs";

const SNIPPETS = [
  { label: "Hello World", code: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Iron Panthers!");\n    }\n}` },
  { label: "For Loop", code: `public class Main {\n    public static void main(String[] args) {\n        for (int i = 1; i <= 5; i++) {\n            System.out.println("Lap " + i);\n        }\n    }\n}` },
  { label: "Array Example", code: `public class Main {\n    public static void main(String[] args) {\n        int[] motors = {100, 75, 50, 25};\n        for (int speed : motors) {\n            System.out.println("Motor speed: " + speed + "%");\n        }\n    }\n}` },
  { label: "Class Example", code: `public class Robot {\n    private String name;\n    private int speed;\n\n    public Robot(String name, int speed) {\n        this.name = name;\n        this.speed = speed;\n    }\n\n    public void drive() {\n        System.out.println(name + " driving at " + speed + "%");\n    }\n\n    public static void main(String[] args) {\n        Robot r = new Robot("Iron Panther", 85);\n        r.drive();\n    }\n}` },
  { label: "FRC Motor", code: `// FRC-style motor control simulation\npublic class DriveSubsystem {\n    private double leftSpeed = 0.0;\n    private double rightSpeed = 0.0;\n\n    public void arcadeDrive(double speed, double rotation) {\n        leftSpeed = speed + rotation;\n        rightSpeed = speed - rotation;\n        // Clamp to [-1, 1]\n        leftSpeed = Math.max(-1.0, Math.min(1.0, leftSpeed));\n        rightSpeed = Math.max(-1.0, Math.min(1.0, rightSpeed));\n        System.out.println("Left: " + leftSpeed + " Right: " + rightSpeed);\n    }\n\n    public static void main(String[] args) {\n        DriveSubsystem drive = new DriveSubsystem();\n        drive.arcadeDrive(0.8, 0.2);\n        drive.arcadeDrive(-0.5, 0.0);\n    }\n}` },
];

const DEFAULT_CODE = `public class Main {\n    public static void main(String[] args) {\n        // Start coding here!\n        System.out.println("Hello, FRC Team 5026!");\n    }\n}`;

const THEMES = {
  oneDark:     { label: "One Dark",     theme: oneDark },
  dracula:     { label: "Dracula",      theme: dracula },
  tokyoNight:  { label: "Tokyo Night",  theme: tokyoNight },
  nord:        { label: "Nord",         theme: nord },
  githubDark:  { label: "GitHub Dark",  theme: githubDark },
  githubLight: { label: "GitHub Light", theme: githubLight },
  vscodeDark:  { label: "VS Code Dark", theme: vscodeDark },
};

export default function SandboxPage() {
  const [files, setFiles] = useState([{ name: "Main.java", code: DEFAULT_CODE }]);
  const [activeFile, setActiveFile] = useState(0);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [showSnippets, setShowSnippets] = useState(false);
  const [themeName, setThemeName] = useState("oneDark");
  const [confirmingReset, setConfirmingReset] = useState(false);

  const updateFiles = (newFiles) => setFiles(newFiles);

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
            <p className="text-white/30 text-xs">Write and test your code</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={themeName}
            onChange={e => setThemeName(e.target.value)}
            className="text-white/50 text-xs border border-white/20 bg-navy px-2 py-1.5 rounded-lg cursor-pointer hover:border-white/40 transition-all"
          >
            {Object.entries(THEMES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

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
                    onClick={() => {
                      setFiles([{ name: "Main.java", code: s.code }]);
                      setActiveFile(0);
                      setShowSnippets(false);
                      setOutput("");
                      setError(null);
                    }}
                    className="w-full text-left px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/10 text-xs transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {confirmingReset ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-white/40">Reset all files?</span>
              <button
                onClick={() => { setConfirmingReset(false); setFiles([{ name: "Main.java", code: DEFAULT_CODE }]); setActiveFile(0); setOutput(""); setError(null); }}
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
              className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-lg transition-all"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
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
              theme={THEMES[themeName].theme}
              height="100%"
              basicSetup={{ tabSize: 4 }}
              style={{ height: "100%" }}
            />
          </div>
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
