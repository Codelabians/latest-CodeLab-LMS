import { useState } from "react";
import { X, Sparkles, Send, Loader2 } from "lucide-react";
import { usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";
import RichTextEditor from "../hr/common/RichTextEditor";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const T1 = "#0F172A";
const T2 = "#475569";
const TM = "#94A3B8";
const SURFACE = "#F8FAFC";

/**
 * Compose a newsletter to all subscribers: write it manually in the shared
 * rich-text editor, or draft it with AI and edit; add inline images; then
 * send. {name} is replaced with each subscriber's first name at send time.
 */
export default function NewsletterComposer({ open, onClose, total = 0 }) {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("friendly and professional");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [htmlMode, setHtmlMode] = useState(false); // raw HTML paste mode
  const [confirming, setConfirming] = useState(false);

  const [post, { isLoading: posting }] = usePostMutation();
  const [generating, setGenerating] = useState(false);

  if (!open) return null;

  const generate = async () => {
    if (!prompt.trim()) { showToast("Tell the AI what the newsletter is about.", "error"); return; }
    setGenerating(true);
    try {
      const res = await post({ path: "newsletter/generate", body: { prompt: prompt.trim(), tone } }).unwrap();
      setSubject(res?.data?.subject || subject);
      setBody(res?.data?.body_html || "");
      showToast("Draft generated — edit as you like.", "success");
    } catch (e) {
      showToast(e?.data?.message || "AI generation failed.", "error");
    } finally {
      setGenerating(false);
    }
  };

  // Uploads an image and returns its URL; the editor inserts it at the cursor.
  const uploadImage = async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await post({ path: "newsletter/upload-image", body: fd }).unwrap();
      return res?.data?.url || null;
    } catch (err) {
      showToast(err?.data?.message || "Image upload failed.", "error");
      return null;
    }
  };

  const send = async () => {
    if (!subject.trim() || !body.trim()) { showToast("Add a subject and body first.", "error"); return; }
    try {
      const res = await post({ path: "newsletter/send", body: { subject: subject.trim(), body_html: body } }).unwrap();
      showToast(`Newsletter sent to ${res?.data?.sent ?? 0} subscriber(s).`, "success");
      setConfirming(false);
      onClose?.();
    } catch (e) {
      showToast(e?.data?.message || "Send failed.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(15,23,42,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onClose}>
      <div className="w-full max-w-3xl bg-white rounded-2xl max-h-[92vh] overflow-y-auto" style={{ border: `1px solid ${BORDER}` }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 bg-white z-10" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <span className="grid place-items-center rounded-lg" style={{ width: 34, height: 34, background: "#FEF2F2", color: BRAND }}><Send size={16} /></span>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: T1 }}>Compose newsletter</h3>
              <p className="text-[12px]" style={{ color: TM }}>Goes to all {total || ""} active subscribers</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: TM }}><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* AI draft */}
          <div className="rounded-xl p-4" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-1.5 mb-2 text-[13px] font-bold" style={{ color: T1 }}><Sparkles size={15} style={{ color: BRAND }} /> Draft with AI</div>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2}
              placeholder="What's this newsletter about? e.g. 'Announce our new AI Automation evening batch starting July, early-bird 20% off, limited seats.'"
              className="w-full px-3 py-2 text-[13px] rounded-lg outline-none resize-y" style={{ border: `1px solid ${BORDER}`, color: T1 }} />
            <div className="flex items-center gap-2 mt-2">
              <select value={tone} onChange={(e) => setTone(e.target.value)} className="px-2.5 py-2 text-[12px] rounded-lg outline-none" style={{ border: `1px solid ${BORDER}`, color: T2 }}>
                <option value="friendly and professional">Friendly &amp; professional</option>
                <option value="excited and promotional">Excited &amp; promotional</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
              </select>
              <button type="button" onClick={generate} disabled={generating}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold text-white disabled:opacity-50" style={{ background: BRAND }}>
                {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Generate
              </button>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: T2 }}>Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Newsletter subject line"
              className="w-full px-3 py-2 text-[13px] rounded-lg outline-none" style={{ border: `1px solid ${BORDER}`, color: T1 }} />
          </div>

          {/* Body — shared rich-text editor with an HTML source toggle so
              ready-made HTML emails can be pasted directly. */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[12px] font-semibold" style={{ color: T2 }}>Body</label>
              <button type="button" onClick={() => setHtmlMode(!htmlMode)}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-md"
                style={htmlMode ? { background: "#0F172A", color: "#fff" } : { border: `1px solid ${BORDER}`, color: T2 }}>
                {"</>"} {htmlMode ? "Back to editor" : "Edit HTML"}
              </button>
            </div>
            {htmlMode ? (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={16}
                spellCheck={false}
                placeholder="Paste your newsletter HTML here…"
                className="w-full px-3 py-2 rounded-lg text-[12px] outline-none font-mono"
                style={{ border: `1px solid ${BORDER}`, color: T1, background: "#F8FAFC", minHeight: 300 }}
              />
            ) : (
              <RichTextEditor
                value={body}
                onChange={setBody}
                onImageUpload={uploadImage}
                minHeight={300}
                placeholder="Write your newsletter… use the toolbar to format, add links and images."
              />
            )}
            <p className="text-[11px] mt-1" style={{ color: TM }}>Tip: type <code>{"{name}"}</code> to insert the subscriber's first name. Use {"</>"} Edit HTML to paste a ready-made HTML email.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-6 py-3 sticky bottom-0 bg-white z-10" style={{ borderTop: `1px solid ${BORDER}` }}>
          {confirming ? (
            <>
              <span className="text-[12px] font-semibold" style={{ color: BRAND }}>Send to all {total || ""} subscribers?</span>
              <div className="flex gap-2">
                <button onClick={() => setConfirming(false)} className="px-3 py-2 rounded-lg text-[12px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: T2 }}>Cancel</button>
                <button onClick={send} disabled={posting} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white disabled:opacity-50" style={{ background: BRAND }}>
                  {posting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Yes, send
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-[11px]" style={{ color: TM }}>Review your email before sending.</span>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2 rounded-lg text-[12px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: T2 }}>Close</button>
                <button onClick={() => { if (!subject.trim() || !body.trim()) { showToast("Add a subject and body first.", "error"); return; } setConfirming(true); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: BRAND }}>
                  <Send size={13} /> Send to all
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
