import { useEffect, useRef, useState } from "react";
import { Loader2, X, Eraser, PenLine } from "lucide-react";

import { usePostMutation } from "../../../../api/apiSlice";
import { showToast } from "../../../ui/common/ShowToast";

const BRAND_RED = "#C90606";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_ALT = "#F8FAFC";

const SignatureCanvasModal = ({ open, onClose, contractUuid, onSigned }) => {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const [empty, setEmpty] = useState(true);
  const [signing, setSigning] = useState(false);

  const [signContract] = usePostMutation();

  useEffect(() => {
    if (!open) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0F172A";
    setEmpty(true);
  }, [open]);

  if (!open) return null;

  const getPos = (e) => {
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    const scaleX = c.width / rect.width;
    const scaleY = c.height / rect.height;
    if (e.touches && e.touches[0]) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const onDown = (e) => {
    e.preventDefault();
    drawingRef.current = true;
    lastRef.current = getPos(e);
  };

  const onMove = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastRef.current = pos;
    setEmpty(false);
  };

  const onUp = (e) => {
    if (drawingRef.current) e.preventDefault?.();
    drawingRef.current = false;
  };

  const clear = () => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);
    setEmpty(true);
  };

  const submit = async () => {
    if (empty) return;
    setSigning(true);
    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
      await signContract({
        path: `employee/contracts/${contractUuid}/sign`,
        body: { signature_base64: base64 },
      }).unwrap();
      showToast("Contract signed", "success");
      onSigned?.();
      onClose();
    } catch (err) {
      showToast(err?.data?.message || "Could not sign contract.", "error");
    } finally {
      setSigning(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl p-6 bg-white shadow-2xl rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold" style={{ color: TEXT_PRIMARY }}>
            Sign contract
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>
        <p className="mb-3 text-xs" style={{ color: TEXT_SECONDARY }}>
          Use mouse or touch to draw your signature in the box below.
        </p>
        <div
          className="border rounded-md overflow-hidden"
          style={{ borderColor: BORDER, background: SURFACE_ALT }}
        >
          <canvas
            ref={canvasRef}
            width={500}
            height={200}
            className="w-full bg-white cursor-crosshair touch-none"
            style={{ display: "block" }}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchStart={onDown}
            onTouchMove={onMove}
            onTouchEnd={onUp}
          />
        </div>
        {empty && (
          <p className="mt-2 text-[11px]" style={{ color: TEXT_MUTED }}>
            Sign above to enable the button.
          </p>
        )}
        <div className="flex justify-between gap-2 mt-4">
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border rounded-md"
            style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
          >
            <Eraser size={12} /> Clear
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs border rounded-md"
              style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={empty || signing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-md disabled:opacity-40"
              style={{ background: BRAND_RED }}
            >
              {signing ? <Loader2 size={12} className="animate-spin" /> : <PenLine size={12} />}
              Sign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureCanvasModal;
