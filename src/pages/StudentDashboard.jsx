import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Announcement, Unit, StudentProgress } from "@/api/entities";
import { BookOpen, Code2, TrendingUp, Bell, ChevronRight, Pin, Zap, Trophy, Clock } from "lucide-react";
import CosmeticAvatar from "../components/CosmeticAvatar";

const topicColors = {
  "java": "bg-red-500/20 text-red-400 border-red-500/30",
  "robo": "bg-red-500/20 text-red-400 border-red-500/30",
  "frc": "bg-red-500/20 text-red-400 border-red-500/30"
};

const topicLabels = {
  "java": "Java",
  "robo": "Robocode",
  "frc": "FRC"
};

export default function StudentDashboard({ user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [units, setUnits] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      Announcement.filter({ is_published: true }, "-created_at", 5),
      Unit.filter({ is_published: true }, "order", 20),
      StudentProgress.filter({ student_id: user.id }),
    ]).then(([ann, u, prog]) => {
      setAnnouncements(ann);
      setUnits(u);
      setProgress(prog);
      setLoading(false);
    });
  }, [user]);

  const getUnitProgress = (unitId) => {
    const p = progress.find(p => p.unit_id === unitId);
    return p?.overall_progress || 0;
  };

  const totalProgress = units.length > 0
    ? Math.round(units.reduce((sum, u) => sum + getUnitProgress(u.id), 0) / units.length)
    : 0;

  const completedUnits = units.filter(u => getUnitProgress(u.id) === 100).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-navy px-6 py-8 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="animate-fade-in">
              <CosmeticAvatar
                avatarUrl={user.avatarUrl}
                userName={user.name}
              />
              <p className="text-white/50 text-sm font-medium mb-1">Welcome back,</p>
              <h1 className="text-3xl font-black text-white">
                {user?.name?.split(" ")[0]} <span className="text-orange">🐾</span>
              </h1>
              <p className="text-white/40 text-sm mt-1">Ready to write some Java?</p>
            </div>
            <Link
              to="/sandbox"
              className="hidden md:flex items-center gap-2 bg-orange hover:bg-orange-light text-white font-semibold px-5 py-2.5 rounded-xl transition-all hover:scale-105 shadow-lg shadow-orange/30"
            >
              <Code2 className="w-4 h-4" />
              Open Sandbox
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { label: "Overall Progress", value: `${totalProgress}%`, icon: TrendingUp, color: "text-orange" },
              { label: "Units Completed", value: `${completedUnits}/${units.length}`, icon: Trophy, color: "text-gold" },
              { label: "Active Units", value: `${units.length - completedUnits}`, icon: BookOpen, color: "text-blue-400" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 space-y-8">
        {/* Announcements */}
        {announcements.length > 0 && (
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange" />
                Updates & Reminders
              </h2>
            </div>
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`bg-card border rounded-xl p-4 flex gap-4 items-start ${
                    ann.is_pinned ? "border-orange/40 bg-orange/5" : "border-border"
                  }`}
                >
                  {ann.is_pinned && <Pin className="w-4 h-4 text-orange flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        ann.type === "important" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                        ann.type === "reminder" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                        "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      }`}>
                        {ann.type?.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">{ann.author_name}</span>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm">{ann.title}</h3>
                    <div className="text-muted-foreground text-sm mt-1 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: ann.content }} />
                    {ann.image_url && (
                      <img src={ann.image_url} alt="" className="mt-3 rounded-lg max-h-40 object-cover" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Units */}
        <section className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange" />
              Training Units
            </h2>
            <Link to="/units" className="text-orange text-sm font-medium hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-3 bg-muted rounded w-full mb-2" />
                  <div className="h-2 bg-muted rounded w-full mt-4" />
                </div>
              ))}
            </div>
          ) : units.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No units published yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.slice(0, 6).map((unit) => {
                const prog = getUnitProgress(unit.id);
                return (
                  <Link
                    key={unit.id}
                    to={`/units/${unit.id}`}
                    className="bg-card border border-border hover:border-orange/40 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-orange/10 group block"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${topicColors[unit.topic] || topicColors["basics"]}`}>
                        {topicLabels[unit.topic] || unit.topic}
                      </span>
                      {prog === 100 && (
                        <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> Done
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-foreground group-hover:text-orange transition-colors mb-1">
                      {unit.title}
                    </h3>
                    <p className="text-muted-foreground text-xs line-clamp-2 mb-4">
                      {unit.description}
                    </p>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground">Progress</span>
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
        </section>

        {/* Quick actions */}
        <section className="animate-fade-in">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link to="/sandbox" className="bg-navy hover:bg-navy-light border border-white/10 hover:border-orange/30 rounded-2xl p-5 transition-all group">
              <Code2 className="w-7 h-7 text-orange mb-3" />
              <p className="text-white font-bold text-sm">Sandbox IDE</p>
              <p className="text-white/40 text-xs mt-1">Write & run Java code</p>
            </Link>
            <Link to="/units" className="bg-card hover:bg-secondary border border-border hover:border-orange/30 rounded-2xl p-5 transition-all group">
              <BookOpen className="w-7 h-7 text-orange mb-3" />
              <p className="text-foreground font-bold text-sm">All Units</p>
              <p className="text-muted-foreground text-xs mt-1">Browse training material</p>
            </Link>
            <div className="bg-card border border-border rounded-2xl p-5">
              <Clock className="w-7 h-7 text-muted-foreground mb-3" />
              <p className="text-foreground font-bold text-sm">Coming Soon</p>
              <p className="text-muted-foreground text-xs mt-1">More features on the way</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
