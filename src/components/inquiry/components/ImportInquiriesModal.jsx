import { useState } from "react";
import { X, Loader2, UploadCloud, FileSpreadsheet, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { usePostMutation } from "../../../api/apiSlice";
import { showToast } from "../../ui/common/ShowToast";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";

// Must match InquiryImportService::templateHeaders() on the backend.
const TEMPLATE_HEADERS = [
  "First Name", "Last Name", "Course", "joining date", "enrollement fee",
  "monthtly fee", "Email", "CNIC", "Phone Number", "Qualification",
  "Father/Guardian Name", "Father/Guardian Number", "Address", "City",
  "Date of Birth", "Hostelize", "Image",
];

export default function ImportInquiriesModal({ open, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState(""); // "preview" | "import"
  const [post, { isLoading }] = usePostMutation();

  if (!open) return null;

  const downloadTemplate = () => {
    const csv = TEMPLATE_HEADERS.map((h) => `"${h}"`).join(",") + "\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url; a.download = "codelab_student_registrations_template.csv";
    a.click(); URL.revokeObjectURL(url);
  };

  const run = async (dryRun) => {
    if (!file) return showToast("Choose an Excel file first", "error");
    setMode(dryRun ? "preview" : "import");
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("dry_run", dryRun ? 1 : 0);
    try {
      const res = await post({ path: "/student/inquiry/import-registrations", body: fd }).unwrap();
      const data = res?.data || res;
      setResult(data);
      if (!dryRun) {
        showToast(`Imported ${data.imported} · skipped ${data.skipped}`, "success");
        onImported?.();
      }
    } catch (err) {
      showToast(err?.data?.message || "Import failed. Use the template format.", "error");
      setMode("");
    }
  };

  const inputStyle = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(15,23,42,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onClose}>
      <div className="w-full max-w-lg p-6 bg-white shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center rounded-lg" style={{ width: 34, height: 34, background: "#FEF2F2", color: BRAND }}><FileSpreadsheet size={17} /></span>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Import students from Excel</h3>
              <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Each row becomes a pending inquiry — promote later to set batch + fee.</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        <button type="button" onClick={downloadTemplate} className="inline-flex items-center gap-1.5 text-[12px] font-semibold mb-3" style={{ color: BRAND }}>
          <Download size={13} /> Download the template (exact column format)
        </button>

        <label className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl cursor-pointer" style={{ border: `1.5px dashed ${BORDER}`, background: SURFACE }}>
          <UploadCloud size={22} style={{ color: BRAND }} />
          <span className="text-sm" style={{ color: TEXT_SECONDARY }}>{file ? file.name : "Choose an .xlsx / .csv file"}</span>
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); }} />
        </label>

        <div className="flex gap-2 mt-4">
          <button type="button" onClick={() => run(true)} disabled={isLoading || !file}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-lg disabled:opacity-50"
            style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
            {isLoading && mode === "preview" ? <Loader2 size={14} className="animate-spin" /> : null} Preview
          </button>
          <button type="button" onClick={() => run(false)} disabled={isLoading || !file}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
            style={{ background: BRAND }}>
            {isLoading && mode === "import" ? <Loader2 size={14} className="animate-spin" /> : null} Import
          </button>
        </div>

        {result && (
          <div className="mt-4 p-3 rounded-lg" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
              <span className="inline-flex items-center gap-1" style={{ color: "#15803D" }}><CheckCircle2 size={15} /> {result.imported} {mode === "preview" ? "to import" : "imported"}</span>
              <span style={{ color: TEXT_MUTED }}>· {result.skipped} skipped</span>
            </div>
            {result.unmatched_courses?.length > 0 && (
              <p className="mt-2 text-[12px] inline-flex items-start gap-1" style={{ color: "#B45309" }}>
                <AlertTriangle size={13} className="mt-0.5" /> Courses matched by best-guess (verify at promote): {result.unmatched_courses.join(", ")}
              </p>
            )}
            {result.details?.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto text-[11.5px] leading-relaxed" style={{ color: TEXT_SECONDARY }}>
                {result.details.slice(0, 100).map((d, i) => <div key={i}>{d}</div>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
