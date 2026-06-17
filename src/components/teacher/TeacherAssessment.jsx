import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Loader2, Brain, CheckCircle2, XCircle, History, ArrowRight, Trophy, RefreshCw } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const API_URL = import.meta.env?.VITE_API_URL || "https://api.codelab.pk/public/api/";

export default function TeacherAssessment() {
  const token = useSelector((s) => s.auth?.token);
  const { data: fieldsData } = useGetQuery({ path: "/employee/assessment/fields" }, { refetchOnMountOrArgChange: true });
  const { data: histData, refetch: refetchHistory } = useGetQuery({ path: "/employee/assessment/history" }, { refetchOnMountOrArgChange: true });
  const [submit, { isLoading: submitting }] = usePostMutation();

  const [field, setField] = useState("");
  const [language, setLanguage] = useState("");
  const [stage, setStage] = useState("home"); // home | quiz | result
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState("");

  const fields = fieldsData?.data?.fields || [];
  const myField = fieldsData?.data?.my_field || "";
  const history = histData?.data || [];
  const selectedField = fields.find((f) => f.field === field);
  const languages = selectedField?.languages || [];

  // Default to the employee's own designation once fields load.
  useEffect(() => {
    if (!field && myField && fields.some((f) => f.field === myField)) {
      setField(myField);
    }
  }, [myField, fields, field]);

  const start = async () => {
    if (!field) { setNotice("Pick your field first."); return; }
    if (languages.length > 0 && !language) { setNotice("Pick a language."); return; }
    setNotice(""); setResult(null); setAnswers({}); setLoading(true);
    try {
      const qs = `field=${encodeURIComponent(field)}${language ? `&language=${encodeURIComponent(language)}` : ""}`;
      const res = await fetch(`${API_URL}employee/assessment/start?${qs}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const json = await res.json();
      const d = json?.data || json;
      if (!d?.available) { setNotice(d?.message || "No questions available for this field yet."); return; }
      setQuestions(d.questions || []);
      setStage("quiz");
    } catch { setNotice("Could not start the assessment."); }
    finally { setLoading(false); }
  };

  const pick = (qid, idx) => setAnswers((p) => ({ ...p, [qid]: idx }));

  const doSubmit = async () => {
    try {
      const res = await submit({
        path: "employee/assessment/submit",
        body: { field, language: language || null, answers: questions.map((q) => ({ question_id: q.id, selected_index: answers[q.id] ?? null })) },
      }).unwrap();
      setResult(res?.data || res);
      setStage("result");
      refetchHistory();
    } catch (e) { setNotice(e?.data?.message || "Could not submit."); }
  };

  const answered = questions.filter((q) => answers[q.id] != null).length;

  if (stage === "result" && result) {
    const pct = result.score ?? 0;
    const tone = pct >= 70 ? "#15803D" : pct >= 40 ? "#B45309" : BRAND;
    return (
      <div className="space-y-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="bg-white rounded-xl p-6 text-center" style={{ border: `1px solid ${BORDER}` }}>
          <Trophy size={30} className="mx-auto mb-2" style={{ color: tone }} />
          <div className="text-[28px] font-bold" style={{ color: tone }}>{pct}%</div>
          <div className="text-[13px]" style={{ color: "#475569" }}>{result.correct} of {result.total} correct · {field}{language ? ` (${language})` : ""}</div>
        </div>
        <div className="space-y-2">
          {(result.review || []).map((r, i) => (
            <div key={i} className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
              <div className="text-[13px] font-semibold mb-2" style={{ color: "#0F172A" }}>{i + 1}. {r.question}</div>
              {(r.options || []).map((opt, idx) => {
                const isCorrect = idx === r.correct_index;
                const isChosen = idx === r.selected_index;
                return (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12.5px] mb-1" style={{ background: isCorrect ? "#F0FDF4" : isChosen ? "#FEF2F2" : "#fff", color: isCorrect ? "#15803D" : isChosen ? BRAND : "#475569", border: `1px solid ${BORDER}` }}>
                    {isCorrect ? <CheckCircle2 size={14} /> : isChosen ? <XCircle size={14} /> : <span style={{ width: 14 }} />} {opt}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <button onClick={() => setStage("home")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: BRAND }}><RefreshCw size={15} /> Back</button>
      </div>
    );
  }

  if (stage === "quiz") {
    return (
      <div className="space-y-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-center justify-between">
          <div className="text-[14px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><Brain size={17} style={{ color: BRAND }} /> {field}{language ? ` · ${language}` : ""}</div>
          <span className="text-[12px]" style={{ color: "#94A3B8" }}>{answered}/{questions.length} answered</span>
        </div>
        {questions.map((q, i) => (
          <div key={q.id} className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
            <div className="text-[13px] font-semibold mb-2.5" style={{ color: "#0F172A" }}>{i + 1}. {q.question}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(q.options || []).map((opt, idx) => {
                const on = answers[q.id] === idx;
                return (
                  <button key={idx} onClick={() => pick(q.id, idx)} className="text-left px-3 py-2 rounded-lg text-[12.5px] font-medium" style={on ? { background: BRAND, color: "#fff" } : { background: "#F8FAFC", color: "#475569", border: `1px solid ${BORDER}` }}>{opt}</button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex justify-end gap-2">
          <button onClick={() => setStage("home")} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Cancel</button>
          <button onClick={doSubmit} disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: BRAND, opacity: submitting ? 0.6 : 1 }}>{submitting && <Loader2 size={15} className="animate-spin" />} Submit</button>
        </div>
      </div>
    );
  }

  const cell = { background: "#F8FAFC", border: `1px solid ${BORDER}`, color: "#0F172A" };
  return (
    <div className="space-y-4 max-w-2xl" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className="bg-white rounded-xl p-5" style={{ border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 mb-1"><Brain size={20} style={{ color: BRAND }} /><span className="text-[15px] font-bold" style={{ color: "#0F172A" }}>Skills Assessment</span></div>
        <p className="text-[12.5px] mb-4" style={{ color: "#94A3B8" }}>Take a field-relevant test to check you&apos;re up to the mark. Pick your field below.</p>
        {notice && <div className="mb-3 text-[12px] px-3 py-2 rounded-lg" style={{ background: "#FEF2F2", color: BRAND }}>{notice}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Field</label>
            <select value={field} onChange={(e) => { setField(e.target.value); setLanguage(""); }} className="w-full px-3 py-2 rounded-lg text-[12.5px] outline-none" style={cell}>
              <option value="">Select field…</option>
              {fields.map((f) => <option key={f.field} value={f.field}>{f.field}</option>)}
            </select>
          </div>
          {languages.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12.5px] outline-none" style={cell}>
                <option value="">Select language…</option>
                {languages.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}
        </div>
        <button onClick={start} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: BRAND, opacity: loading ? 0.6 : 1 }}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />} Start assessment
        </button>
      </div>

      <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-1.5 text-[12px] font-bold mb-2.5" style={{ color: "#0F172A" }}><History size={15} /> Your past assessments</div>
        {history.length === 0 ? (
          <div className="text-[12.5px]" style={{ color: "#94A3B8" }}>No attempts yet.</div>
        ) : history.slice(0, 10).map((h) => (
          <div key={h.attempt_uuid} className="flex items-center justify-between text-[12.5px] px-3 py-2 rounded-lg mb-1" style={{ background: "#F8FAFC" }}>
            <span style={{ color: "#475569" }}>{h.field}{h.language ? ` (${h.language})` : ""} · {String(h.created_at || "").slice(0, 10)}</span>
            <span className="font-bold" style={{ color: h.score >= 70 ? "#15803D" : h.score >= 40 ? "#B45309" : BRAND }}>{h.score}% ({h.correct_count}/{h.total_questions})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
