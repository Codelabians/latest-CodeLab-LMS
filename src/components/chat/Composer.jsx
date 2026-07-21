import { useEffect, useRef, useState } from "react";
import {
  FileText, Image as ImageIcon, Loader2, Mic, Paperclip, Send, Square, Trash2, X,
} from "lucide-react";
import { usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";
import {
  BRAND, BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SURFACE, fmtDuration,
} from "./chatTheme";

const MB = 1024 * 1024;
const LIMITS = { image: 8 * MB, voice: 10 * MB, file: 16 * MB };

/*
 * Message composer: text (Enter sends, Shift+Enter newline), image/file
 * attachments with a preview chip, and browser voice notes via MediaRecorder.
 */
export default function Composer({ groupUuid, onSent }) {
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState(null); // {file, kind:'image'|'file', previewUrl}
  const [attachOpen, setAttachOpen] = useState(false);

  // Voice-note state
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [voiceNote, setVoiceNote] = useState(null); // {blob, url, duration}
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);

  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [post, { isLoading: sending }] = usePostMutation();

  // Clean up any live recorder / object URLs on unmount or group switch.
  useEffect(() => {
    return () => {
      stopTimer();
      try { recorderRef.current?.stream?.getTracks().forEach((t) => t.stop()); } catch { /* noop */ }
      recorderRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupUuid]);

  useEffect(() => {
    // Reset drafts when moving between groups.
    setDraft("");
    discardAttachment();
    discardVoice();
    setRecording(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupUuid]);

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  /* ---------- attachments ---------- */
  const pickAttachment = (kind, file) => {
    if (!file) return;
    const limit = LIMITS[kind];
    if (file.size > limit) {
      showToast(`${kind === "image" ? "Image" : "File"} is too large (max ${limit / MB} MB).`, "error");
      return;
    }
    discardVoice();
    setAttachment({
      file,
      kind,
      previewUrl: kind === "image" ? URL.createObjectURL(file) : null,
    });
  };

  const discardAttachment = () => {
    setAttachment((a) => {
      if (a?.previewUrl) URL.revokeObjectURL(a.previewUrl);
      return null;
    });
  };

  /* ---------- voice recording ---------- */
  const startRecording = async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferred = "audio/webm;codecs=opus";
      const mimeType =
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(preferred)
          ? preferred
          : undefined; // fall back to the browser default
      const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        const duration = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        if (blob.size > LIMITS.voice) {
          showToast("Voice note is too large (max 10 MB).", "error");
          return;
        }
        discardAttachment();
        setVoiceNote({ blob, url: URL.createObjectURL(blob), duration });
      };
      recorderRef.current = rec;
      startedAtRef.current = Date.now();
      rec.start();
      setRecSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(
        () => setRecSeconds(Math.round((Date.now() - startedAtRef.current) / 1000)),
        500,
      );
    } catch (e) {
      showToast(
        e?.name === "NotAllowedError"
          ? "Microphone access was denied. Allow it in your browser settings to record voice notes."
          : "Could not access the microphone.",
        "error",
      );
    }
  };

  const stopRecording = () => {
    stopTimer();
    setRecording(false);
    try { recorderRef.current?.stop(); } catch { /* noop */ }
  };

  const discardVoice = () => {
    setVoiceNote((v) => {
      if (v?.url) URL.revokeObjectURL(v.url);
      return null;
    });
  };

  /* ---------- send ---------- */
  const send = async () => {
    if (sending) return;
    const text = draft.trim();
    try {
      if (voiceNote) {
        const fd = new FormData();
        fd.append("type", "voice");
        fd.append(
          "attachment",
          new File([voiceNote.blob], "voice-note.webm", { type: voiceNote.blob.type || "audio/webm" }),
        );
        fd.append("duration_seconds", String(voiceNote.duration));
        await post({ path: `communication/chat/groups/${groupUuid}/messages`, body: fd }).unwrap();
        discardVoice();
      } else if (attachment) {
        const fd = new FormData();
        fd.append("type", attachment.kind);
        fd.append("attachment", attachment.file);
        if (text) fd.append("body", text);
        await post({ path: `communication/chat/groups/${groupUuid}/messages`, body: fd }).unwrap();
        discardAttachment();
        setDraft("");
      } else {
        if (!text) return;
        await post({
          path: `communication/chat/groups/${groupUuid}/messages`,
          body: { type: "text", body: text },
        }).unwrap();
        setDraft("");
      }
      onSent?.();
    } catch (e) {
      const errors = e?.data?.errors;
      const first = errors && Object.values(errors)[0];
      showToast(
        (Array.isArray(first) ? first[0] : first) || e?.data?.message || "Message could not be sent.",
        "error",
      );
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const canSend = !sending && (voiceNote || attachment || draft.trim());

  return (
    <div className="bg-white" style={{ borderTop: `1px solid ${BORDER}` }}>
      {/* Pending attachment chip */}
      {attachment && (
        <div className="flex items-center gap-2 px-3 pt-2">
          <div
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            {attachment.kind === "image" && attachment.previewUrl ? (
              <img src={attachment.previewUrl} alt="preview" className="object-cover rounded" style={{ width: 34, height: 34 }} />
            ) : (
              <FileText size={16} style={{ color: TEXT_SECONDARY }} />
            )}
            <span className="text-[12px] font-medium truncate max-w-[220px]" style={{ color: TEXT_PRIMARY }}>
              {attachment.file.name}
            </span>
            <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
              {(attachment.file.size / MB).toFixed(1)} MB
            </span>
            <button onClick={discardAttachment} className="p-0.5 rounded" style={{ color: TEXT_MUTED }} title="Remove attachment">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Voice-note preview (recorded, not yet sent) */}
      {voiceNote && (
        <div className="flex items-center gap-2 px-3 pt-2">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <audio controls src={voiceNote.url} style={{ height: 32, maxWidth: 220 }} />
            <span className="text-[11px] font-semibold" style={{ color: TEXT_SECONDARY }}>{fmtDuration(voiceNote.duration)}</span>
            <button onClick={discardVoice} className="p-1 rounded" style={{ color: BRAND }} title="Discard voice note">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="relative flex items-end gap-2 px-3 py-3">
        {/* Hidden pickers */}
        <input
          ref={imageInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { pickAttachment("image", e.target.files?.[0]); e.target.value = ""; }}
        />
        <input
          ref={fileInputRef} type="file" className="hidden"
          onChange={(e) => { pickAttachment("file", e.target.files?.[0]); e.target.value = ""; }}
        />

        {/* Attach menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setAttachOpen((o) => !o)}
            disabled={recording}
            title="Attach"
            className="grid rounded-lg place-items-center"
            style={{ width: 40, height: 40, background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY, opacity: recording ? 0.5 : 1 }}
          >
            <Paperclip size={16} />
          </button>
          {attachOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setAttachOpen(false)} />
              <div
                className="absolute z-20 py-1 bg-white rounded-xl bottom-12"
                style={{ border: `1px solid ${BORDER}`, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", minWidth: 140 }}
              >
                <button
                  onClick={() => { setAttachOpen(false); imageInputRef.current?.click(); }}
                  className="flex items-center w-full gap-2 px-3 py-2 text-[12.5px] font-medium hover:bg-[#F8FAFC]"
                  style={{ color: TEXT_PRIMARY }}
                >
                  <ImageIcon size={15} style={{ color: TEXT_SECONDARY }} /> Image
                </button>
                <button
                  onClick={() => { setAttachOpen(false); fileInputRef.current?.click(); }}
                  className="flex items-center w-full gap-2 px-3 py-2 text-[12.5px] font-medium hover:bg-[#F8FAFC]"
                  style={{ color: TEXT_PRIMARY }}
                >
                  <FileText size={15} style={{ color: TEXT_SECONDARY }} /> File
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mic / stop */}
        <button
          onClick={recording ? stopRecording : startRecording}
          title={recording ? "Stop recording" : "Record a voice note"}
          className="relative grid rounded-lg place-items-center flex-shrink-0"
          style={{
            width: 40, height: 40,
            background: recording ? BRAND : SURFACE,
            border: `1px solid ${recording ? BRAND : BORDER}`,
            color: recording ? "#fff" : TEXT_SECONDARY,
          }}
        >
          {recording ? <Square size={15} /> : <Mic size={16} />}
          {recording && (
            <span className="absolute inline-flex w-full h-full rounded-lg opacity-40 animate-ping" style={{ background: BRAND }} />
          )}
        </button>

        {recording ? (
          <div
            className="flex items-center flex-1 gap-2 px-3 text-sm rounded-lg"
            style={{ height: 40, background: "#FEF2F2", border: `1px solid ${BORDER}`, color: BRAND }}
          >
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: BRAND }} />
            <span className="font-semibold">Recording… {fmtDuration(recSeconds)}</span>
            <span className="ml-auto text-[11px]" style={{ color: TEXT_MUTED }}>Click ■ to stop</span>
          </div>
        ) : (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={
              voiceNote
                ? "Voice note ready — press send"
                : attachment
                  ? "Add a caption (optional)…"
                  : "Type a message…  (Enter to send, Shift+Enter for new line)"
            }
            disabled={!!voiceNote}
            className="flex-1 px-3 py-2 text-sm rounded-lg outline-none resize-none"
            style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, maxHeight: 120, opacity: voiceNote ? 0.6 : 1 }}
          />
        )}

        <button
          onClick={send}
          disabled={!canSend || recording}
          title="Send"
          className="grid text-white rounded-lg place-items-center flex-shrink-0"
          style={{ width: 40, height: 40, background: BRAND, opacity: !canSend || recording ? 0.5 : 1 }}
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
