import { useState } from "react";
import { Plus, X, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FileTabs({ files, activeFile, onSwitch, onAdd, onDelete, onRename, expandUrl }) {
  const navigate = useNavigate();
  const [renamingIndex, setRenamingIndex] = useState(-1);
  const [renameValue, setRenameValue] = useState("");

  const commit = (i) => {
    const v = renameValue.trim();
    if (v) onRename(i, v.endsWith(".java") ? v : v + ".java");
    setRenamingIndex(-1);
  };

  return (
    <div className="flex items-stretch bg-[#13131f] border-b border-white/10 overflow-x-auto flex-shrink-0 min-h-[32px]">
      {files.map((file, i) => (
        <div
          key={i}
          onClick={() => onSwitch(i)}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-mono cursor-pointer border-b-2 flex-shrink-0 group transition-colors ${
            i === activeFile
              ? "border-orange text-white bg-[#1e1e2e]"
              : "border-transparent text-white/40 hover:text-white/70 hover:bg-white/5"
          }`}
        >
          {renamingIndex === i ? (
            <input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={() => commit(i)}
              onKeyDown={e => {
                if (e.key === "Enter") commit(i);
                if (e.key === "Escape") setRenamingIndex(-1);
              }}
              className="bg-transparent border-none outline-none w-28 text-white text-xs font-mono"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span
              onDoubleClick={e => {
                e.stopPropagation();
                setRenamingIndex(i);
                setRenameValue(file.name);
              }}
            >
              {file.name}
            </span>
          )}
          {files.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(i); }}
              className="text-white/0 group-hover:text-white/40 hover:!text-red-400 transition-colors ml-0.5 leading-none"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}

      <button
        onClick={onAdd}
        title="New file"
        className="px-2.5 flex items-center text-white/30 hover:text-white/70 flex-shrink-0 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {expandUrl && (
        <button
          onClick={() => navigate(expandUrl)}
          title="Open in full-page IDE"
          className="ml-auto px-2.5 flex items-center text-white/30 hover:text-white/70 flex-shrink-0 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
