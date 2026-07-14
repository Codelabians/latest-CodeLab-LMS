import { useEffect, useState } from "react";
import { X, Loader2, Link2, Link2Off, Search, Check } from "lucide-react";
import {
  useLazyGetQuery,
  usePostMutation,
  useDeleteMutation,
} from "../../api/apiSlice";
import { showToast } from "./common/ShowToast";

const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const BRAND_RED = "#C90606";

/**
 * Link a visitor to an EXISTING inquiry (same person filled both forms).
 * Pick the inquiry from a searchable list; the link merges their timelines.
 */
export default function LinkInquiryDialog({ open, visitor, onClose, onChanged }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [trigger, { isFetching }] = useLazyGetQuery();
  const [linkPost, { isLoading: linking }] = usePostMutation();
  const [unlinkDel, { isLoading: unlinking }] = useDeleteMutation();

  const linkedId = visitor?.linked_inquiry_id || null;

  useEffect(() => {
    if (!open) return;
    setQ("");
    setResults([]);
  }, [open, visitor]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      const res = await trigger({ path: `student/leads/inquiries/search`, params: { q } });
      setResults(res?.data?.data || []);
    }, 350);
    return () => clearTimeout(t);
  }, [q, open, trigger]);

  if (!open || !visitor) return null;

  const doLink = async (inquiryId) => {
    const res = await linkPost({
      path: `student/leads/visitor/${visitor.id}/link`,
      body: { inquiry_id: inquiryId },
    });
    if (res?.error) { showToast("Could not link", "error"); return; }
    showToast("Linked to inquiry", "success");
    onChanged?.();
    onClose?.();
  };

  const doUnlink = async () => {
    const res = await unlinkDel({ path: `student/leads/visitor/${visitor.id}/link` });
    if (res?.error) { showToast("Could not unlink", "error"); return; }
    showToast("Unlinked", "success");
    onChanged?.();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(15,23,42,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onClose}>
      <div className="w-full max-w-md p-6 bg-white rounded-2xl max-h-[85vh] overflow-y-auto" style={{ border: `1px solid ${BORDER}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center rounded-lg" style={{ width: 34, height: 34, background: "#EFF6FF", color: "#1D4ED8" }}><Link2 size={16} /></span>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Link to inquiry</h3>
              <p className="text-[12px]" style={{ color: TEXT_MUTED }}>{visitor.name} — same person who filled an inquiry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        {linkedId && (
          <div className="flex items-center justify-between mb-4 px-3 py-2.5 rounded-lg" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
            <span className="text-[12px] font-semibold" style={{ color: "#15803D" }}>Currently linked to inquiry #{linkedId}</span>
            <button type="button" onClick={doUnlink} disabled={unlinking} className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: BRAND_RED }}>
              {unlinking ? <Loader2 size={12} className="animate-spin" /> : <Link2Off size={12} />} Unlink
            </button>
          </div>
        )}

        <div className="relative mb-3">
          <Search size={15} className="absolute -translate-y-1/2 left-3 top-1/2" style={{ color: TEXT_MUTED }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search inquiries by name, phone, email…"
            className="w-full py-2 pl-9 pr-3 text-[13px] rounded-lg outline-none"
            style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
          />
        </div>

        {isFetching ? (
          <div className="py-8 text-center"><Loader2 size={18} className="inline animate-spin" style={{ color: TEXT_MUTED }} /></div>
        ) : results.length === 0 ? (
          <p className="py-6 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No inquiries found.</p>
        ) : (
          <div className="space-y-2">
            {results.map((i) => (
              <button
                key={i.id}
                type="button"
                disabled={linking || i.id === linkedId}
                onClick={() => doLink(i.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition disabled:opacity-60"
                style={{ border: `1px solid ${BORDER}`, background: i.id === linkedId ? "#F0FDF4" : "#F8FAFC" }}
              >
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>{i.name || `Inquiry #${i.id}`}</div>
                  <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{i.phone || i.email || "—"} · {i.status}</div>
                </div>
                {i.id === linkedId ? (
                  <Check size={15} style={{ color: "#15803D" }} />
                ) : (
                  <Link2 size={15} style={{ color: "#1D4ED8" }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
