import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Unit, StudentProgress } from "@/api/entities";
import { BookOpen, Search, Trophy, TrendingUp } from "lucide-react";

const topicColors = {
  "basics": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "oop": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "data-structures": "bg-green-500/20 text-green-400 border-green-500/30",
  "algorithms": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "frc-specific": "bg-orange/20 text-orange border-orange/30",
  "advanced": "bg-red-500/20 text-red-400 border-red-500/30",
};

const topicLabels = {
  "basics": "Java Basics",
  "oop": "OOP",
  "data-structures": "Data Structures",
  "algorithms": "Algorithms",
  "frc-specific": "FRC Specific",
  "advanced": "Advanced",
};

const topics = ["all", "basics", "oop", "data-structures", "algorithms", "frc-specific", "advanced"];

export default function UnitsPage({ user }) {
  const [units, setUnits] = useState([]);
  const [progress, setProgress] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      Unit.filter({ is_published: true }, "order", 50),
      StudentProgress.filter({ student_id: user.id }),
    ]).then(([u, p]) => {
      setUnits(u);
      setProgress(p);
      setLoading(false);
    });
  }, [user]);

  const getProgress = (unitId) => {
    const p = progress.find(p => p.unit_id === unitId);
    return p?.overall_progress || 0;
  };

  const filtered = units.filter(u => {
    const matchTopic = filter === "all" || u.topic === filter;
    const matchSearch = u.title.toLowerCase().includes(search.toLowerCase()) ||
      u.description?.toLowerCase().includes(search.toLowerCase());
    return matchTopic && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-navy px-6 py-8 md:px-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-orange" /> Training Units
          </h1>
          <p className="text-white/40 text-sm">Your complete Java programming curriculum</p>
          <div className="relative mt-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search units..."
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange/60"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-6">
        {/* Topic filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          {topics.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filter === t
                  ? "bg-orange border-orange text-white"
                  : "bg-card border-border text-muted-foreground hover:border-orange/40 hover:text-foreground"
              }`}
            >
              {t === "all" ? "All Topics" : topicLabels[t]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No units found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((unit, i) => {
              const prog = getProgress(unit.id);
              const hasSlideshow = !!unit.slideshow_embed || !!unit.slideshow_url;
              const hasQuiz = unit.quiz_questions?.length > 0;
              const hasProject = !!unit.project?.title;
              const exerciseCount = unit.exercises?.length || 0;
              return (
                <Link
                  key={unit.id}
                  to={`/units/${unit.id}`}
                  className="bg-card border border-border hover:border-orange/40 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-orange/10 group block animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${topicColors[unit.topic] || topicColors["basics"]}`}>
                      {topicLabels[unit.topic] || unit.topic}
                    </span>
                    {prog === 100 && (
                      <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> Complete
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-foreground group-hover:text-orange transition-colors mb-1 text-base">
                    Unit {unit.order || i + 1}: {unit.title}
                  </h3>
                  <p className="text-muted-foreground text-xs line-clamp-2 mb-4">
                    {unit.description}
                  </p>

                  {/* Content tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {hasSlideshow && <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20">📊 Slideshow</span>}
                    {exerciseCount > 0 && <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-400 rounded-md border border-green-500/20">💻 {exerciseCount} Exercise{exerciseCount > 1 ? "s" : ""}</span>}
                    {hasQuiz && <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-md border border-purple-500/20">📝 Quiz</span>}
                    {hasProject && <span className="text-xs px-2 py-0.5 bg-orange/10 text-orange rounded-md border border-orange/20">🚀 Project</span>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Progress
                      </span>
                      <span className="text-xs font-semibold text-foreground">{prog}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange to-orange-light rounded-full transition-all duration-500"
                        style={{ width: `${prog}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
