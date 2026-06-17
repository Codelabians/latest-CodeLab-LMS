import { useState } from "react";
import { useSelector } from "react-redux";
import { Loader2, Brain, Sparkles, CheckCircle2, XCircle, History, ArrowRight, Trophy, RefreshCw } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const API_URL = import.meta.env?.VITE_API_URL || "https://api.codelab.pk/public/api/";

export default function PortalQuiz() {
  const token = useSelector((s) => s.auth?.token);
  const { data: histData, refetch: refetchHistory } = useGetQuery({ path: "/student-portal/quiz/history" }, { refetchOnMountOrArgChange: true });
  const [submit, { isLoading: submitting }] = usePostMutation();

  const [stage, setStage] = useState("home"); // home | quiz | result
  const [mode, setMode] = useState("quiz");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // questionId -> selectedIndex
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState("");

  const history = histData?.data || [];

  const start = async (m) => {
    setNotice(""); setResult(null); setAnswers({});
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}student-portal/quiz/start?mode=${m}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const json = await res.json();
      const d = json?.data || json;
      if (!d?.available) {
        setNotice(d?.message || "No quiz available right now.");
        return;
      }
      setMode(m);
      setQuestions(d.questions || []);
      setStage("quiz");
    } catch {
      setNotice("Could not start the quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pick = (qid, idx) => setAnswers((p) => ({ ...p, [qid]: idx }));

  const doSubmit = async () => {
    const payload = {
      mode,
      answers: questions.map((q) => ({ question_id: q.id, selected_index: answers[q.id] ?? null })),
    };
    try {
      const res = await submit({ path: "student-portal/quiz/submit", body: payload }).unwrap();
      setResult(res?.data || res);
      setStage("result");
      refetchHistory();
    } catch (e) {
      setNotice(e?.data?.message || "Could not submit. Please try again.");
    }
  };

  const answeredCount = questions.filter((q) => answers[q.id] != null).length;

  // ---- Result view ----
  if (stage === "result" && result) {
    const pct = result.score ?? 0;
    const tone = pct >= 70 ? "#15803D" : pct >= 40 ? "#B45309" : BRAND;
    return (
      <div className="space-y-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="bg-white rounded-xl p-6 text-center" style={{ border: `1px solid ${BORDER}` }}>
          <Trophy size={30} className="mx-auto mb-2" style={{ color: tone }} />
          <div className="text-[28px] font-bold" style={{ color: tone }}>{pct}%</div>
          <div className="text-[13px]" style={{ color: "#475569" }}>{result.correct} of {result.total} correct</div>
        </div>
        <div className="space-y-2">
          {(result.review || []).map((r, i) => (
            <div key={i} className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
              <div className="text-[13px] font-semibold mb-2" style={{ color: "#0F172A" }}>{i + 1}. {r.question}</div>
              <div className="space-y-1">
                {(r.options || []).map((opt, idx) => {
                  const isCorrect = idx === r.correct_index;
                  const isChosen = idx === r.selected_index;
                  const bg = isCorrect ? "#F0FDF4" : isChosen ? "#FEF2F2" : "#fff";
                  const fg = isCorrect ? "#15803D" : isChosen ? BRAND : "#475569";
                  return (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12.5px]" style={{ background: bg, color: fg, border: `1px solid ${BORDER}` }}>
                      {isCorrect ? <CheckCircle2 size={14} /> : isChosen ? <XCircle size={14} /> : <span style={{ width: 14 }} />}
                      {opt}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setStage("home")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: BRAND }}>
          <RefreshCw size={15} /> Back to quizzes
        </button>
      </div>
    );
  }

  // ---- Active quiz ----
  if (stage === "quiz") {
    return (
      <div className="space-y-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-center justify-between">
          <div className="text-[14px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}>
            {mode === "daily" ? <><Brain size={17} style={{ color: BRAND }} /> Daily IQ Test</> : <><Sparkles size={17} style={{ color: BRAND }} /> Practice Quiz</>}
          </div>
          <span className="text-[12px]" style={{ color: "#94A3B8" }}>{answeredCount}/{questions.length} answered</span>
        </div>
        {questions.map((q, i) => (
          <div key={q.id} className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
            <div className="text-[13px] font-semibold mb-2.5" style={{ color: "#0F172A" }}>{i + 1}. {q.question}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(q.options || []).map((opt, idx) => {
                const on = answers[q.id] === idx;
                return (
                  <button key={idx} onClick={() => pick(q.id, idx)} className="text-left px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors"
                    style={on ? { background: BRAND, color: "#fff" } : { background: "#F8FAFC", color: "#475569", border: `1px solid ${BORDER}` }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex justify-end gap-2">
          <button onClick={() => setStage("home")} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Cancel</button>
          <button onClick={doSubmit} disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: BRAND, opacity: submitting ? 0.6 : 1 }}>
            {submitting && <Loader2 size={15} className="animate-spin" />} Submit
          </button>
        </div>
      </div>
    );
  }

  // ---- Home ----
  return (
    <div className="space-y-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {notice && <div className="bg-white rounded-xl px-4 py-3 text-[12.5px]" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>{notice}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onClick={() => start("daily")} disabled={loading} className="text-left bg-white rounded-xl p-5" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-center rounded-lg mb-3" style={{ width: 40, height: 40, background: "#FEF2F2", color: BRAND }}><Brain size={20} /></div>
          <div className="text-[14px] font-bold mb-0.5" style={{ color: "#0F172A" }}>Daily IQ Test</div>
          <div className="text-[12px] mb-2" style={{ color: "#94A3B8" }}>A quick 5-question test on topics you&apos;ve covered. Once a day — keep your streak sharp!</div>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: BRAND }}>Start <ArrowRight size={13} /></span>
        </button>
        <button onClick={() => start("quiz")} disabled={loading} className="text-left bg-white rounded-xl p-5" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-center rounded-lg mb-3" style={{ width: 40, height: 40, background: "#FEF2F2", color: BRAND }}><Sparkles size={20} /></div>
          <div className="text-[14px] font-bold mb-0.5" style={{ color: "#0F172A" }}>Practice Quiz</div>
          <div className="text-[12px] mb-2" style={{ color: "#94A3B8" }}>10 random questions from your course to test yourself anytime.</div>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: BRAND }}>Start <ArrowRight size={13} /></span>
        </button>
      </div>

      {loading && <div className="flex justify-center py-6"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>}

      <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-1.5 text-[12px] font-bold mb-2.5" style={{ color: "#0F172A" }}><History size={15} /> Your recent results</div>
        {history.length === 0 ? (
          <div className="text-[12.5px]" style={{ color: "#94A3B8" }}>No attempts yet — take your first quiz above.</div>
        ) : (
          <div className="space-y-1.5">
            {history.slice(0, 10).map((h) => (
              <div key={h.attempt_uuid} className="flex items-center justify-between text-[12.5px] px-3 py-2 rounded-lg" style={{ background: "#F8FAFC" }}>
                <span style={{ color: "#475569" }}>{h.mode === "daily" ? "Daily IQ Test" : "Practice Quiz"} · {String(h.created_at || "").slice(0, 10)}</span>
                <span className="font-bold" style={{ color: h.score >= 70 ? "#15803D" : h.score >= 40 ? "#B45309" : BRAND }}>{h.score}% ({h.correct_count}/{h.total_questions})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
