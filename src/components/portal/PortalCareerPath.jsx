import { Loader2, Sparkles, RefreshCw, TrendingUp, Target, CheckCircle2, GraduationCap, ArrowRight, Rocket } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";

export default function PortalCareerPath() {
  const { data, isLoading, refetch } = useGetQuery({ path: "/student-portal/career-path" }, { refetchOnMountOrArgChange: true });
  const [regen, { isLoading: regenerating }] = usePostMutation();

  const res = data?.data;
  const path = res?.path;

  const regenerate = async () => {
    try {
      await regen({ path: "student-portal/career-path/regenerate", body: {} }).unwrap();
      showToast("Your roadmap has been refreshed.", "success");
      refetch();
    } catch (e) {
      showToast(e?.data?.message || "Could not refresh right now.", "error");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>;
  }

  if (!res?.available || !path) {
    return (
      <div className="bg-white rounded-xl py-16 px-6 text-center" style={{ border: `1px solid ${BORDER}` }}>
        <Sparkles size={30} className="mx-auto mb-3" style={{ color: BRAND }} />
        <div className="text-[14px] font-semibold mb-1" style={{ color: "#0F172A" }}>Your career path isn&apos;t ready yet</div>
        <p className="text-[12.5px] mb-4" style={{ color: "#94A3B8" }}>{res?.message || "Once you have some grades, we'll craft a personalised roadmap for you."}</p>
        <button onClick={regenerate} disabled={regenerating} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: BRAND, opacity: regenerating ? 0.6 : 1 }}>
          {regenerating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Generate my roadmap
        </button>
      </div>
    );
  }

  const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl ${className}`} style={{ border: `1px solid ${BORDER}` }}>{children}</div>
  );

  return (
    <div className="space-y-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Hero: current -> next track */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4" style={{ background: "linear-gradient(135deg,#C90606 0%,#A00505 100%)" }}>
          <div className="flex items-center gap-2 text-white/90 text-[11px] font-semibold uppercase tracking-wide mb-2"><Sparkles size={14} /> Your CodeLab Career Path</div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3 py-1.5 rounded-lg bg-white/15 text-white text-[13px] font-semibold">{path.current_track || "Your track"}</span>
            <ArrowRight size={18} className="text-white/80" />
            <span className="px-3 py-1.5 rounded-lg bg-white text-[13px] font-bold" style={{ color: BRAND }}>{path.recommended_next_track}</span>
          </div>
        </div>
        {path.summary && <p className="px-5 py-4 text-[13px] leading-relaxed" style={{ color: "#475569" }}>{path.summary}</p>}
      </Card>

      {/* Strengths + focus areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-[12px] font-bold mb-2.5" style={{ color: "#15803D" }}><TrendingUp size={15} /> Your strengths</div>
          <ul className="space-y-1.5">
            {(path.strengths || []).map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px]" style={{ color: "#475569" }}><CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#15803D" }} /> {s}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-[12px] font-bold mb-2.5" style={{ color: "#B45309" }}><Target size={15} /> Focus areas</div>
          <ul className="space-y-1.5">
            {(path.focus_areas || []).map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px]" style={{ color: "#475569" }}><Target size={13} className="mt-0.5 flex-shrink-0" style={{ color: "#B45309" }} /> {s}</li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Roadmap timeline */}
      <Card className="p-5">
        <div className="flex items-center gap-1.5 text-[13px] font-bold mb-4" style={{ color: "#0F172A" }}><Rocket size={16} style={{ color: BRAND }} /> Your roadmap</div>
        <div className="space-y-0">
          {(path.roadmap || []).map((step, i, arr) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center rounded-full text-white text-[11px] font-bold flex-shrink-0" style={{ width: 26, height: 26, background: BRAND }}>{i + 1}</div>
                {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: "#F1D5D5", minHeight: 18 }} />}
              </div>
              <div className="pb-4">
                {step.stage && <div className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: BRAND }}>{step.stage}</div>}
                <div className="text-[13px] font-semibold" style={{ color: "#0F172A" }}>{step.title}</div>
                {step.detail && <div className="text-[12.5px] leading-relaxed mt-0.5" style={{ color: "#475569" }}>{step.detail}</div>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Benefits */}
      {(path.benefits || []).length > 0 && (
        <Card className="p-4">
          <div className="text-[12px] font-bold mb-2.5" style={{ color: "#0F172A" }}>What you&apos;ll gain</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {path.benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-2 text-[12.5px] px-3 py-2 rounded-lg" style={{ background: "#FEF2F2", color: "#475569" }}><CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: BRAND }} /> {b}</div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommended courses */}
      {(path.recommended_courses || []).length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-[12px] font-bold mb-2.5" style={{ color: "#0F172A" }}><GraduationCap size={15} style={{ color: BRAND }} /> Recommended next at CodeLab</div>
          <div className="flex flex-wrap gap-2">
            {path.recommended_courses.map((c, i) => (
              <span key={i} className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#0F172A", background: "#F8FAFC" }}>{c}</span>
            ))}
          </div>
        </Card>
      )}

      {/* Encouragement + regenerate */}
      {path.encouragement && (
        <div className="rounded-xl px-5 py-4 text-[13px] font-medium" style={{ background: "#0F172A", color: "#fff" }}>
          <Sparkles size={15} className="inline mr-1.5" style={{ color: "#FCA5A5" }} /> {path.encouragement}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px]" style={{ color: "#94A3B8" }}>
          {res.generated_at ? `Generated ${new Date(res.generated_at).toLocaleDateString()}` : ""}{res.stale ? " · showing last saved version" : ""}
        </span>
        <button onClick={regenerate} disabled={regenerating} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569", opacity: regenerating ? 0.6 : 1 }}>
          {regenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
        </button>
      </div>
    </div>
  );
}
