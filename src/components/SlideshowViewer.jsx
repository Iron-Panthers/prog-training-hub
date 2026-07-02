import { useState, useRef, useEffect, useCallback } from "react";
import { BookOpen, CheckCircle, Maximize2, Minimize2, Code2 } from "lucide-react";
import JavaIDE from "@/components/JavaIDE";

// Renders a unit's slideshow. A directly-embeddable source (uploaded PDF or an
// embed URL) is shown inline automatically, and can be opened in a fullscreen
// "present" mode with a Java IDE docked alongside so concepts can be tried out
// live during the slideshow.
export default function SlideshowViewer({ unit, completed, onComplete }) {
  const pdfUrl = unit.slideshow_pdf;
  const embedUrl = unit.slideshow_embed;
  const externalUrl = unit.slideshow_url;

  // Source that can be shown inside an iframe/embed without a click-through.
  const inlineSrc = pdfUrl
    ? `${pdfUrl}#toolbar=1&view=FitH`
    : embedUrl || null;

  const containerRef = useRef(null);
  const [presenting, setPresenting] = useState(false);
  const [showIde, setShowIde] = useState(true);
  const [idePercent, setIdePercent] = useState(42);
  const dragging = useRef(false);

  // Keep local state in sync with the browser's fullscreen state (e.g. Esc key).
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setPresenting(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const enterPresent = async () => {
    setPresenting(true);
    try {
      await containerRef.current?.requestFullscreen?.();
    } catch {
      // Fullscreen can be blocked; the overlay still renders on its own.
    }
  };

  const exitPresent = async () => {
    setPresenting(false);
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch {}
    }
  };

  const onDragStart = (e) => {
    dragging.current = true;
    e.preventDefault();
  };

  const onDragMove = useCallback((e) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((rect.right - e.clientX) / rect.width) * 100;
    setIdePercent(Math.min(70, Math.max(20, pct)));
  }, []);

  const onDragEnd = useCallback(() => { dragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
    return () => {
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", onDragEnd);
    };
  }, [onDragMove, onDragEnd]);

  const completeButton = !completed ? (
    <button
      onClick={onComplete}
      className="mt-4 flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 font-semibold px-5 py-2.5 rounded-xl transition-all"
    >
      <CheckCircle className="w-4 h-4" /> Mark as Completed
    </button>
  ) : (
    <div className="mt-4 flex items-center gap-2 text-green-400 text-sm font-semibold">
      <CheckCircle className="w-4 h-4" /> Slideshow completed!
    </div>
  );

  // No embeddable source: fall back to an external link (or empty state).
  if (!inlineSrc) {
    if (externalUrl) {
      return (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <BookOpen className="w-10 h-10 text-orange mx-auto mb-3" />
          <p className="text-foreground font-semibold mb-2">External Slideshow</p>
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange hover:underline text-sm"
          >
            Open Slideshow →
          </a>
          {completeButton}
        </div>
      );
    }
    return <div className="text-center py-16 text-muted-foreground">No slideshow available for this unit.</div>;
  }

  const slideFrame = (title) => (
    pdfUrl ? (
      <iframe src={inlineSrc} className="w-full h-full" title={title} />
    ) : (
      <iframe src={inlineSrc} className="w-full h-full" title={title} allowFullScreen />
    )
  );

  return (
    <div ref={containerRef} className={presenting ? "fixed inset-0 z-50 bg-[#11111b] flex flex-col" : ""}>
      {presenting ? (
        <>
          {/* Present-mode toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#181825] border-b border-white/10 flex-shrink-0">
            <span className="text-white/60 text-sm font-semibold truncate">{unit.title}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowIde(v => !v)}
                className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-white/10 transition-all"
              >
                <Code2 className="w-3.5 h-3.5" /> {showIde ? "Hide IDE" : "Show IDE"}
              </button>
              <button
                onClick={exitPresent}
                className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-white/10 transition-all"
              >
                <Minimize2 className="w-3.5 h-3.5" /> Exit
              </button>
            </div>
          </div>

          {/* Slide + IDE split */}
          <div className="flex-1 flex min-h-0">
            <div className="min-w-0 flex-1 bg-black">
              {slideFrame("Slideshow")}
            </div>
            {showIde && (
              <>
                <div
                  onMouseDown={onDragStart}
                  className="w-1.5 cursor-col-resize bg-white/10 hover:bg-orange/60 transition-colors flex-shrink-0"
                />
                <div
                  className="flex-shrink-0 overflow-auto bg-[#181825] p-3"
                  style={{ width: `${idePercent}%` }}
                >
                  <JavaIDE
                    storageKey={`slideshow-ide-${unit.id}`}
                    showCompleteButton={false}
                    height="calc(100vh - 220px)"
                    initialCode={`public class Main {\n    public static void main(String[] args) {\n        \n    }\n}`}
                  />
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="bg-card border border-border rounded-2xl overflow-hidden aspect-video">
            {slideFrame("Slideshow")}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={enterPresent}
              className="flex items-center gap-2 bg-orange hover:bg-orange-light text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-orange/30"
            >
              <Maximize2 className="w-4 h-4" /> Present with IDE
            </button>
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange hover:underline text-sm"
              >
                Open original →
              </a>
            )}
          </div>
          {completeButton}
        </>
      )}
    </div>
  );
}
