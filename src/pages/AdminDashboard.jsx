import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Unit, Announcement, ProjectSubmission, QuizSubmission } from "@/api/entities";
import { BookOpen, Megaphone, ClipboardList, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { formatDateValue } from "@/utils";

export default function AdminDashboard({ user }) {
  const [stats, setStats] = useState({ units: 0, announcements: 0, submissions: 0, quizzes: 0 });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      Unit.list(),
      Announcement.list(),
      ProjectSubmission.list("-created_at", 5),
      QuizSubmission.list("-created_at", 5),
    ]).then(([units, ann, subs, quizzes]) => {
      setStats({ units: units.length, announcements: ann.length, submissions: subs.length, quizzes: quizzes.length });
      setRecentSubmissions(subs);
      setLoading(false);
    });
  }, []);

  const statCards = [
    { label: "Total Units", value: stats.units, icon: BookOpen, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Announcements", value: stats.announcements, icon: Megaphone, color: "text-orange", bg: "bg-orange/10 border-orange/20" },
    { label: "Project Submissions", value: stats.submissions, icon: ClipboardList, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
    { label: "Quiz Submissions", value: stats.quizzes, icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  ];

  const statusIcon = (status) => {
    if (status === "approved") return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (status === "needs_revision") return <AlertCircle className="w-4 h-4 text-red-400" />;
    return <Clock className="w-4 h-4 text-yellow-400" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-navy px-6 py-8 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-gold/20 border border-gold/30 text-gold text-xs font-bold px-3 py-1 rounded-full">⚡ ADMIN</span>
          </div>
          <h1 className="text-3xl font-black text-white">
            Admin Dashboard
          </h1>
          <p className="text-white/40 text-sm mt-1">Iron Panthers Programming Training Hub</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {statCards.map(s => (
              <div key={s.label} className={`border rounded-2xl p-4 ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                <p className="text-2xl font-black text-white">{loading ? "—" : s.value}</p>
                <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 space-y-8">
        {/* Quick actions */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/admin/announcements" className="bg-card border border-border hover:border-orange/40 rounded-2xl p-6 transition-all group hover:shadow-lg hover:shadow-orange/10">
              <Megaphone className="w-8 h-8 text-orange mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-foreground mb-1">Post Announcement</h3>
              <p className="text-muted-foreground text-sm">Share updates, reminders, and news with students</p>
            </Link>
            <Link to="/admin/submissions" className="bg-card border border-border hover:border-orange/40 rounded-2xl p-6 transition-all group hover:shadow-lg hover:shadow-orange/10">
              <ClipboardList className="w-8 h-8 text-orange mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-foreground mb-1">Review Submissions</h3>
              <p className="text-muted-foreground text-sm">View and comment on student project submissions</p>
            </Link>
            <Link to="/admin/units" className="bg-card border border-border hover:border-orange/40 rounded-2xl p-6 transition-all group hover:shadow-lg hover:shadow-orange/10">
              <BookOpen className="w-8 h-8 text-orange mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-foreground mb-1">Manage Units</h3>
              <p className="text-muted-foreground text-sm">Create and edit training units and content</p>
            </Link>
          </div>
        </section>

        {/* Recent submissions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-orange" /> Recent Project Submissions
            </h2>
            <Link to="/admin/submissions" className="text-orange text-sm font-medium hover:underline">View all →</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : recentSubmissions.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center">
              <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No submissions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map(sub => (
                <Link
                  key={sub.id}
                  to={`/admin/submissions/${sub.id}`}
                  className="bg-card border border-border hover:border-orange/30 rounded-xl p-4 flex items-center justify-between transition-all group block"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {statusIcon(sub.status)}
                      <span className="font-semibold text-foreground text-sm group-hover:text-orange transition-colors">
                        {sub.student_name}
                      </span>
                      <span className="text-muted-foreground text-xs">— {sub.unit_title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                      {formatDateValue(sub.created_at)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${
                    sub.status === "approved" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                    sub.status === "needs_revision" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  }`}>
                    {sub.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
