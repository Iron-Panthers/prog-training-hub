import { useState } from "react";
import { QuizSubmission } from "@/api/entities";
import { CheckCircle, XCircle, Trophy, RotateCcw } from "lucide-react";

export default function QuizSection({ unit, user, progress, onComplete }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isRetaking, setIsRetaking] = useState(false);

  const questions = unit.quiz_questions || [];

  const handleAnswer = (qIdx, optIdx) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) return;
    let s = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_index) s++;
    });
    setScore(s);
    setSubmitted(true);
    const pct = Math.round((s / questions.length) * 100);
    await QuizSubmission.create({
      student_id: user.id,
      unit_id: unit.id,
      answers: Object.values(answers),
      score: s,
      total_questions: questions.length,
      created_at: new Date().toISOString(),
    });
    onComplete?.(s, questions.length);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setIsRetaking(true);
  };

  if (progress?.quiz_completed && !submitted && !isRetaking) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <Trophy className="w-14 h-14 text-gold mx-auto mb-4" />
        <h3 className="text-xl font-black text-foreground mb-2">Quiz Completed!</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Previous score: {progress.quiz_score}/{questions.length}
        </p>
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 bg-orange hover:bg-orange-light text-white font-semibold px-5 py-2.5 rounded-xl transition-all mx-auto"
        >
          <RotateCcw className="w-4 h-4" /> Retake Quiz
        </button>
      </div>
    );
  }

  if (submitted) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="animate-fade-in">
        <div className={`rounded-2xl p-8 text-center mb-6 ${pct >= 70 ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"}`}>
          <div className="text-5xl font-black mb-2" style={{ color: pct >= 70 ? "#4ade80" : "#f87171" }}>
            {pct}%
          </div>
          <p className="text-foreground font-semibold">{score}/{questions.length} correct</p>
          <p className="text-muted-foreground text-sm mt-1">{pct >= 70 ? "Great job! 🎉" : "Keep practicing!"}</p>
          <button onClick={handleRetry} className="mt-4 flex items-center gap-2 bg-orange hover:bg-orange-light text-white font-semibold px-5 py-2.5 rounded-xl transition-all mx-auto">
            <RotateCcw className="w-4 h-4" /> Retry
          </button>
        </div>
        <div className="space-y-4">
          {questions.map((q, i) => {
            const correct = answers[i] === q.correct_index;
            return (
              <div key={i} className={`bg-card border rounded-xl p-5 ${correct ? "border-green-500/30" : "border-red-500/30"}`}>
                <div className="flex items-start gap-2 mb-3">
                  {correct ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                  <p className="text-foreground text-sm font-medium">{q.question}</p>
                </div>
                <div className="space-y-1.5 ml-6">
                  {q.options?.map((opt, oi) => (
                    <div key={oi} className={`text-xs px-3 py-1.5 rounded-lg ${
                      oi === q.correct_index ? "bg-green-500/20 text-green-400" :
                      oi === answers[i] && !correct ? "bg-red-500/20 text-red-400" :
                      "text-muted-foreground"
                    }`}>
                      {opt}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <p className="mt-3 text-xs text-muted-foreground italic ml-6">{q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="bg-card border border-border rounded-xl px-5 py-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{questions.length} questions</span>
        <span className="text-sm font-semibold text-foreground">{Object.keys(answers).length}/{questions.length} answered</span>
      </div>
      {questions.map((q, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl p-5">
          <p className="text-foreground font-semibold text-sm mb-4">
            <span className="text-orange mr-2">Q{i + 1}.</span>{q.question}
          </p>
          <div className="space-y-2">
            {q.options?.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => handleAnswer(i, oi)}
                className={`w-full text-left text-sm px-4 py-3 rounded-xl border transition-all ${
                  answers[i] === oi
                    ? "border-orange bg-orange/10 text-foreground font-medium"
                    : "border-border hover:border-orange/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="font-mono text-xs text-muted-foreground mr-2">{String.fromCharCode(65 + oi)}.</span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={handleSubmit}
        disabled={Object.keys(answers).length < questions.length}
        className="w-full bg-orange hover:bg-orange-light disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all"
      >
        Submit Quiz
      </button>
    </div>
  );
}
