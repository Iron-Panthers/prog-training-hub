import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ProjectSubmission, QuizSubmission, Unit } from "@/api/entities";
import { getProfile } from "@/lib/profiles";
import JavaIDE from "@/components/JavaIDE";
import { ArrowLeft, MessageSquare, CheckCircle, AlertCircle, Clock, Send, Loader2 } from "lucide-react";
import { formatDateValue } from "@/utils";

function SubmissionsList({ user }) {
  const [submissions, setSubmissions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [tab, setTab] = useState("projects");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, q] = await Promise.all([
        ProjectSubmission.list("-created_at", 50),
        QuizSubmission.list("-created_at", 50),
      ]);

      const subs = await Promise.all(s.map(async (sub) => {
        const profile = sub.student_id ? await getProfile(sub.student_id) : null;
        let unitTitle = sub.unit_title;
        if (!unitTitle && sub.unit_id) {
          const u = await Unit.filter({ id: sub.unit_id });
          unitTitle = u?.[0]?.title || "";
        }
        return { ...sub, student_name: profile?.name || sub.student_id, unit_title: unitTitle };
      }));

      const quizzes = await Promise.all(q.map(async (qq) => {
        const profile = qq.student_id ? await getProfile(qq.student_id) : null;
        let unitTitle = qq.unit_title;
        if (!unitTitle && qq.unit_id) {
          const u = await Unit.filter({ id: qq.unit_id });
          unitTitle = u?.[0]?.title || "";
        }
        return { ...qq, student_name: profile?.name || qq.student_id, unit_title: unitTitle };
      }));

      setSubmissions(subs);
      setQuizzes(quizzes);
      setLoading(false);
    })();
  }, []);

  const statusIcon = (s) => {
    if (s === "approved") return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (s === "needs_revision") return <AlertCircle className="w-4 h-4 text-red-400" />;
    return <Clock className="w-4 h-4 text-yellow-400" />;
  };

  const filteredSubs = submissions.filter(s => filter === "all" || s.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-navy px-6 py-8 md:px-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-black text-white">Student Submissions</h1>
          <p className="text-white/40 text-sm mt-1">Review projects and quizzes</p>
          <div className="flex gap-4 mt-5">
            {["projects", "quizzes"].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
                  tab === t ? "bg-orange text-white" : "bg-white/10 text-white/60 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
        {tab === "projects" && (
          <>
            <div className="flex gap-2 mb-5 flex-wrap">
              {["all", "submitted", "reviewed", "approved", "needs_revision"].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
                    filter === s ? "bg-orange border-orange text-white" : "border-border text-muted-foreground hover:border-orange/40"
                  }`}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="bg-card border border-border rounded-xl p-4 h-16 animate-pulse" />)}
              </div>
            ) : filteredSubs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">No submissions yet.</div>
            ) : (
              <div className="space-y-3">
                {filteredSubs.map(sub => (
                  <Link
                    key={sub.id}
                    to={`/admin/submissions/${sub.id}`}
                    className="bg-card border border-border hover:border-orange/30 rounded-xl p-4 flex items-center justify-between transition-all group block"
                  >
                    <div className="flex items-center gap-3">
                      {statusIcon(sub.status)}
                      <div>
                        <span className="font-semibold text-foreground text-sm group-hover:text-orange transition-colors">
                          {sub.student_name}
                        </span>
                        <span className="text-muted-foreground text-sm"> — {sub.unit_title}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDateValue(sub.created_at)} · {sub.admin_comments?.length || 0} comments
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border font-semibold capitalize flex-shrink-0 ${
                      sub.status === "approved" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                      sub.status === "needs_revision" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    }`}>
                      {sub.status?.replace("_", " ")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "quizzes" && (
          <div className="space-y-3">
            {quizzes.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">No quiz submissions yet.</div>
            ) : quizzes.map(q => (
              <div key={q.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground text-sm">{q.student_name}</span>
                    <span className="text-muted-foreground text-sm"> — {q.unit_title}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDateValue(q.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-black ${q.percentage >= 70 ? "text-green-400" : "text-red-400"}`}>{q.percentage}%</span>
                    <p className="text-xs text-muted-foreground">{q.score}/{q.total_questions} correct</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SubmissionReview({ user }) {
  const { id } = useParams();
  const [sub, setSub] = useState(null);
  const [newComment, setNewComment] = useState({ line_number: "", comment: "" });
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ProjectSubmission.filter({ id }).then(([s]) => {
      setSub(s || null);
      setStatus(s?.status || "submitted");
      setLoading(false);
    });
  }, [id]);

  const addComment = async () => {
    if (!newComment.comment) return;
    setAdding(true);
    const comment = {
      id: Date.now().toString(),
      line_number: parseInt(newComment.line_number) || null,
      comment: newComment.comment,
      author_name: user.name,
      created_at: new Date().toISOString(),
    };
    const updated = await ProjectSubmission.update(sub.id, {
      admin_comments: [...(sub.admin_comments || []), comment],
      status: status,
    });
    setSub(updated);
    setNewComment({ line_number: "", comment: "" });
    setAdding(false);
  };

  const updateStatus = async (s) => {
    setStatus(s);
    await ProjectSubmission.update(sub.id, { status: s });
    setSub({ ...sub, status: s });
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-muted border-t-orange rounded-full animate-spin" /></div>;
  if (!sub) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Submission not found.</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-navy px-6 py-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <Link to="/admin/submissions" className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-4 w-fit transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to submissions
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black text-white">{sub.student_id}'s Submission</h1>
              <p className="text-white/40 text-sm mt-0.5">{sub.unit_title}</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              {["submitted", "reviewed", "approved", "needs_revision"].map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all capitalize ${
                    status === s ? "bg-orange border-orange text-white" : "border-white/20 text-white/60 hover:text-white"
                  }`}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <JavaIDE
              key={sub.id}
              initialCode={sub.code || ""}
              showCompleteButton={false}
              height="520px"
              storageKey={null}
            />
            {sub.notes && (
              <div className="mt-4 bg-card border border-border rounded-xl p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Student's Notes</p>
                <p className="text-sm text-foreground">{sub.notes}</p>
              </div>
            )}
          </div>

          {/* Comments panel */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-orange" /> Leave a Comment
              </h3>
              <input
                type="number"
                value={newComment.line_number}
                onChange={e => setNewComment({ ...newComment, line_number: e.target.value })}
                placeholder="Line # (optional)"
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange/50 mb-3"
              />
              <textarea
                value={newComment.comment}
                onChange={e => setNewComment({ ...newComment, comment: e.target.value })}
                placeholder="Write your feedback..."
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange/50 resize-none h-24 mb-3"
              />
              <button
                onClick={addComment}
                disabled={adding || !newComment.comment}
                className="w-full flex items-center justify-center gap-2 bg-orange hover:bg-orange-light disabled:opacity-40 text-white font-semibold py-2 rounded-xl transition-all text-sm"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Add Comment
              </button>
            </div>

            {/* Existing comments */}
            {sub.admin_comments?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Comments ({sub.admin_comments.length})</h4>
                {sub.admin_comments.map((c) => (
                  <div key={c.id} className="bg-card border border-border rounded-xl p-4">
                    {c.line_number && (
                      <span className="text-xs bg-orange/20 text-orange px-2 py-0.5 rounded font-mono mb-2 inline-block">
                        Line {c.line_number}
                      </span>
                    )}
                    <p className="text-sm text-foreground">{c.comment}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">{c.author_name} · {formatDateValue(c.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { SubmissionsList, SubmissionReview };
export default SubmissionsList;
