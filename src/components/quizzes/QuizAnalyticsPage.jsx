import { useState } from "react";
import { Loader2, Brain, Sparkles, Users, BarChart3, Trophy } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";
import SearchableSelect from "../ui/SearchableSelect";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";

export default function QuizAnalyticsPage() {
  const [courseId, setCourseId] = useState("");
  const { data: coursesData } = useGetQuery({ path: "/course/courses", params: { per_page: 200 } });
  const params = courseId ? { course_id: courseId } : {};
  const { data, isLoading, refetch } = useGetQuery({ path: "/student/quiz/analytics", params }, { refetchOnMountOrArgChange: true });
  const [generate, { isLoading: generating }] = usePostMutation();
  const [replace, setReplace] = useState(false);

  const courses = (coursesData?.data || []).map((c) => ({ value: String(c.id), label: c.name }));
  const a = data?.data || {};
  const overall = a.overall || {};
  const byStudent = a.by_student || [];
  const recent = a.recent || [];

  const doGenerate = async () => {
    if (!courseId) { showToast("Pick a course to generate questions for.", "error"); return; }
    try {
      const res = await generate({ path: "student/quiz/generate", body: { course_id: Number(courseId), replace } }).unwrap();
      showToast(res?.data?.message || res?.message || "Generation done.", "success");
      refetch();
    } catch (e) {
      showToast(e?.data?.message || "Could not generate questions.", "error");
    }
  };

  const Card = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-xl p-4 flex items-center gap-3" style={{ border: `1px solid ${BORDER}` }}>
      <span className="grid place-items-center rounded-lg" style={{ width: 38, height: 38, background: "#FEF2F2", color: color || BRAND }}><Icon size={18} /></span>
      <div>
        <div className="text-[18px] font-bold" style={{ color: "#0F172A" }}>{value ?? "—"}</div>
        <div className="text-[11px]" style={{ color: "#94A3B8" }}>{label}</div>
      </div>
    </div>
  );

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2" style={{ color: "#0F172A" }}><BarChart3 size={20} /> Quiz Performance</h1>
          <p className="text-[12px] text-[#94A3B8] mt-0.5">How students are doing on auto-generated quizzes and the daily IQ test.</p>
        </div>
        <div className="flex items-center gap-2" style={{ minWidth: 280 }}>
          <div style={{ width: 200 }}><SearchableSelect options={courses} value={courseId} onChange={setCourseId} placeholder="All courses" /></div>
          <button onClick={doGenerate} disabled={generating} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-white whitespace-nowrap" style={{ background: BRAND, opacity: generating ? 0.6 : 1 }}>
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Generate questions
          </button>
          <label className="flex items-center gap-1.5 text-[11px] whitespace-nowrap" style={{ color: "#475569" }}>
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} /> Replace existing
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <Card icon={Brain} label="Total attempts" value={overall.attempts} />
            <Card icon={Users} label="Students participated" value={overall.students} color="#1D4ED8" />
            <Card icon={Trophy} label="Average score" value={overall.avg_score != null ? `${overall.avg_score}%` : "—"} color="#15803D" />
          </div>

          <div className="bg-white rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${BORDER}` }}>
            <div className="px-4 py-2.5 text-[12px] font-bold" style={{ color: "#0F172A", borderBottom: `1px solid ${BORDER}` }}>Leaderboard</div>
            {byStudent.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px]" style={{ color: "#94A3B8" }}>No attempts yet.</div>
            ) : (
              <table className="w-full text-[12.5px]">
                <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}>{["Student", "Attempts", "Avg", "Best", "Last"].map((h, i) => <th key={i} className="px-4 py-2 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
                <tbody>
                  {byStudent.map((s, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td className="px-4 py-2 font-semibold" style={{ color: "#0F172A" }}>{s.student || "—"}</td>
                      <td className="px-4 py-2" style={{ color: "#475569" }}>{s.attempts}</td>
                      <td className="px-4 py-2 font-bold" style={{ color: s.avg_score >= 70 ? "#15803D" : s.avg_score >= 40 ? "#B45309" : BRAND }}>{s.avg_score}%</td>
                      <td className="px-4 py-2" style={{ color: "#475569" }}>{s.best_score}%</td>
                      <td className="px-4 py-2" style={{ color: "#94A3B8" }}>{String(s.last_attempt || "").slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <div className="px-4 py-2.5 text-[12px] font-bold" style={{ color: "#0F172A", borderBottom: `1px solid ${BORDER}` }}>Recent attempts</div>
            {recent.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px]" style={{ color: "#94A3B8" }}>No attempts yet.</div>
            ) : (
              <table className="w-full text-[12.5px]">
                <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}>{["Student", "Type", "Score", "When"].map((h, i) => <th key={i} className="px-4 py-2 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
                <tbody>
                  {recent.map((r, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td className="px-4 py-2 font-semibold" style={{ color: "#0F172A" }}>{r.student || "—"}</td>
                      <td className="px-4 py-2" style={{ color: "#475569" }}>{r.mode === "daily" ? "Daily IQ" : "Quiz"}</td>
                      <td className="px-4 py-2 font-bold" style={{ color: r.score >= 70 ? "#15803D" : r.score >= 40 ? "#B45309" : BRAND }}>{r.score}% ({r.correct_count}/{r.total_questions})</td>
                      <td className="px-4 py-2" style={{ color: "#94A3B8" }}>{String(r.created_at || "").slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
