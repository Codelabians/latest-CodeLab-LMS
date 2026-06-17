import React, { useMemo, useState } from "react";
import { Mail, Search, Loader2, CheckCircle2, XCircle, Download } from "lucide-react";
import { useGetQuery, useLazyGetQuery } from "../../api/apiSlice";
import SimplePagination from "../ui/SimplePagination";
import ReportModal from "../ui/ReportModal";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE_HOVER = "#F8FAFC";

export default function NewsletterSubscribers() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [reportOpen, setReportOpen] = useState(false);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("per_page", String(perPage));
    if (search) p.set("q", search);
    if (status) p.set("status", status);
    return p.toString();
  }, [page, perPage, search, status]);

  const { data, isLoading, isFetching } = useGetQuery({ path: `newsletter/subscribers?${query}` });
  const rows = data?.data || [];
  const pg = data?.meta || data?.pagination || {};

  const submitSearch = (e) => { e.preventDefault(); setPage(1); setSearch(q.trim()); };

  const inputStyle = { background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND }}><Mail size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Newsletter Subscribers</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Auto-emailed when a new batch is created · {pg.total || rows.length} total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setReportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg text-white" style={{ background: "#0F172A" }} title="Download report">
            <Download size={14} /> Report
          </button>
          <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}
            className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Unsubscribed</option>
          </select>
          <form onSubmit={submitSearch} className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={inputStyle}>
            <Search size={15} style={{ color: TEXT_MUTED }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email or name"
              className="text-sm bg-transparent outline-none" style={{ color: TEXT_PRIMARY, width: 180 }} />
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: SURFACE_HOVER, color: TEXT_SECONDARY }}>
              <th className="px-4 py-3 text-left font-semibold text-[12px]">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-[12px]">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-[12px]">Source</th>
              <th className="px-4 py-3 text-left font-semibold text-[12px]">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-[12px]">Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {(isLoading || isFetching) && (
              <tr><td colSpan={5} className="px-4 py-10 text-center" style={{ color: TEXT_MUTED }}><Loader2 className="inline animate-spin" size={18} /> Loading…</td></tr>
            )}
            {!isLoading && !isFetching && rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center" style={{ color: TEXT_MUTED }}>No subscribers yet.</td></tr>
            )}
            {!isLoading && !isFetching && rows.map((r) => (
              <tr key={r.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td className="px-4 py-3" style={{ color: TEXT_PRIMARY }}>{r.email}</td>
                <td className="px-4 py-3" style={{ color: r.name ? TEXT_PRIMARY : TEXT_MUTED }}>{r.name || "—"}</td>
                <td className="px-4 py-3 capitalize" style={{ color: TEXT_SECONDARY }}>{r.source || "website"}</td>
                <td className="px-4 py-3">
                  {r.is_active
                    ? <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: "#15803D" }}><CheckCircle2 size={14} /> Active</span>
                    : <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: TEXT_MUTED }}><XCircle size={14} /> Unsubscribed</span>}
                </td>
                <td className="px-4 py-3 text-[12px]" style={{ color: TEXT_MUTED }}>{(r.subscribed_at || r.created_at || "").slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
          <SimplePagination page={page} total={pg.total || 0} perPage={perPage}
            onPageChange={setPage} onPerPageChange={(n) => { setPerPage(n); setPage(1); }} alwaysShow />
        </div>
      </div>
      <ReportModal
        open={reportOpen} onClose={() => setReportOpen(false)}
        title="Download Subscribers Report" path="newsletter/subscribers" filenameBase="subscribers"
        initialValues={{ status, q: search }}
        fields={[
          { type: "select", key: "status", label: "Status", options: [{ value: "", label: "All" }, { value: "active", label: "Active" }, { value: "inactive", label: "Unsubscribed" }] },
          { type: "text", key: "q", label: "Search (email or name)", full: true },
        ]}
        buildParams={(v) => ({ status: v.status || undefined, q: v.q || undefined })}
        columns={[
          { label: "Email", key: "email" },
          { label: "Name", key: "name" },
          { label: "Source", key: "source" },
          { label: "Status", map: (r) => (r.is_active ? "Active" : "Unsubscribed") },
          { label: "Subscribed", map: (r) => (r.subscribed_at || r.created_at || "").slice(0, 10) },
        ]}
      />
    </div>
  );
}
