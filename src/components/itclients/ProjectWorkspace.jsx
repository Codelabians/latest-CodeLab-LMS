import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, X, Pencil, Trash2, Loader2, Building2, Users, FolderKanban,
  CalendarClock, Link2, ExternalLink, Flag, GripVertical,
} from "lucide-react";
import {
  useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation,
} from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";

/* ---- tokens ---- */
const BRAND = "#C90606";
const BLUE = "#1D4ED8";
const GREEN = "#15803D";
const AMBER = "#B45309";
const PURPLE = "#7C3AED";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";
const field = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };

const COLUMNS = [
  { key: "todo", label: "To do", color: TEXT_MUTED },
  { key: "in_progress", label: "In progress", color: BLUE },
  { key: "in_review", label: "In review", color: PURPLE },
  { key: "done", label: "Done", color: GREEN },
  { key: "blocked", label: "Blocked", color: BRAND },
];
const PRIORITIES = [
  { value: "low", label: "Low", color: TEXT_MUTED },
  { value: "medium", label: "Medium", color: AMBER },
  { value: "high", label: "High", color: BRAND },
];
const prMeta = (p) => PRIORITIES.find((x) => x.value === p) || PRIORITIES[1];
const initials = (name) => (name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
const todayStr = new Date().toISOString().slice(0, 10);

/* ============================ Task modal ============================ */
function TaskModal({ isOpen, onClose, onSubmit, task, employeeOptions, saving, error, onAddDoc, onRemoveDoc }) {
  const isEdit = !!task;
  const [form, setForm] = useState({});
  const [docUrl, setDocUrl] = useState("");
  const [docLabel, setDocLabel] = useState("");

  useMemo(() => {
    if (isOpen) {
      setForm({
        title: task?.title || "",
        description: task?.description || "",
        assignee_user_id: task?.assignee_user_id ? String(task.assignee_user_id) : "",
        status: task?.status || "todo",
        priority: task?.priority || "medium",
        deadline: task?.deadline || "",
      });
      setDocUrl(""); setDocLabel("");
    }
  }, [isOpen, task]);

  if (!isOpen) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const docs = task?.docs || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-lg p-6 bg-white rounded-2xl max-h-[92vh] overflow-y-auto" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{isEdit ? "Edit task" : "New task"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Title</label>
            <input value={form.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Design home screen" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Assignee</label>
            <SearchableSelect options={employeeOptions} value={form.assignee_user_id || ""} onChange={(v) => set("assignee_user_id", v || "")} placeholder="Unassigned" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full px-2 py-2 text-sm rounded-lg outline-none" style={field}>
                {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Priority</label>
              <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className="w-full px-2 py-2 text-sm rounded-lg outline-none" style={field}>
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Deadline</label>
              <input type="date" value={form.deadline || ""} onChange={(e) => set("deadline", e.target.value)} className="w-full px-2 py-2 text-sm rounded-lg outline-none" style={field} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Description</label>
            <textarea rows={2} value={form.description || ""} onChange={(e) => set("description", e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none" style={field} />
          </div>

          {/* Doc links — only for existing tasks */}
          {isEdit && (
            <div>
              <label className="block text-[11px] font-semibold mb-1 inline-flex items-center gap-1" style={{ color: TEXT_SECONDARY }}><Link2 size={12} /> Document links</label>
              <div className="space-y-1.5">
                {docs.length === 0 && <div className="text-[11.5px]" style={{ color: TEXT_MUTED }}>No links yet.</div>}
                {docs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ background: SURFACE }}>
                    <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-semibold truncate" style={{ color: BLUE }}>
                      <ExternalLink size={12} /> {d.label || d.url}
                    </a>
                    <button onClick={() => onRemoveDoc(task, d.id)} style={{ color: BRAND }}><X size={14} /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 mt-2">
                <input value={docLabel} onChange={(e) => setDocLabel(e.target.value)} placeholder="Label" className="px-2 py-1.5 text-[12px] rounded-lg outline-none" style={{ ...field, width: 110 }} />
                <input value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://…" className="flex-1 px-2 py-1.5 text-[12px] rounded-lg outline-none" style={field} />
                <button onClick={() => { if (docUrl.trim()) { onAddDoc(task, { url: docUrl.trim(), label: docLabel.trim() || null }); setDocUrl(""); setDocLabel(""); } }}
                  className="px-2.5 py-1.5 text-[12px] font-semibold text-white rounded-lg" style={{ background: BLUE }}>Add</button>
              </div>
            </div>
          )}
        </div>

        {error && <div className="mt-4 px-3 py-2 text-[12px] font-semibold rounded-lg" style={{ background: "#FEF2F2", color: BRAND, border: `1px solid ${BORDER}` }}>{error}</div>}

        <div className="flex gap-2 pt-5">
          <button onClick={onClose} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Close</button>
          <button
            onClick={() => onSubmit({
              title: (form.title || "").trim(),
              description: (form.description || "").trim() || null,
              assignee_user_id: form.assignee_user_id ? Number(form.assignee_user_id) : null,
              status: form.status, priority: form.priority,
              deadline: form.deadline || null,
            })}
            disabled={!form.title?.trim() || saving}
            className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: BRAND }}>
            {saving ? "Saving…" : isEdit ? "Save task" : "Create task"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================ Sprint modal ============================ */
function SprintModal({ isOpen, onClose, onSubmit, sprint, noun, saving }) {
  const isEdit = !!sprint;
  const [form, setForm] = useState({});
  useMemo(() => {
    if (isOpen) setForm({
      name: sprint?.name || "", goal: sprint?.goal || "", status: sprint?.status || "planned",
      start_date: sprint?.start_date || "", end_date: sprint?.end_date || "",
    });
  }, [isOpen, sprint]);
  if (!isOpen) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-md p-6 bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{isEdit ? `Edit ${noun}` : `New ${noun}`}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Name</label>
            <input value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder={noun === "cycle" ? "e.g. April 2026 Content" : "e.g. Sprint 1"} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Start</label>
              <input type="date" value={form.start_date || ""} onChange={(e) => set("start_date", e.target.value)} className="w-full px-2 py-2 text-sm rounded-lg outline-none" style={field} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>End</label>
              <input type="date" value={form.end_date || ""} onChange={(e) => set("end_date", e.target.value)} className="w-full px-2 py-2 text-sm rounded-lg outline-none" style={field} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Goal</label>
            <textarea rows={2} value={form.goal || ""} onChange={(e) => set("goal", e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none" style={field} />
          </div>
        </div>
        <div className="flex gap-2 pt-5">
          <button onClick={onClose} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={() => onSubmit({ name: (form.name || "").trim(), goal: (form.goal || "").trim() || null, status: form.status, start_date: form.start_date || null, end_date: form.end_date || null })}
            disabled={!form.name?.trim() || saving} className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: BRAND }}>
            {saving ? "Saving…" : isEdit ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================ main ============================ */
export default function ProjectWorkspace() {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const { data: projData, isLoading: projLoading } = useGetQuery({ path: `clients/projects/${uuid}` }, { refetchOnMountOrArgChange: true });
  const project = projData?.data;
  // Social media and SEO run as recurring "cycles"; software/other as "sprints".
  const isCycle = project?.type === "social_media" || project?.type === "seo";
  const noun = isCycle ? "cycle" : "sprint";
  const TYPE_LABELS = { software: "Software", social_media: "Social media", seo: "SEO", other: "Other" };
  const TYPE_TINTS = { software: ["#EFF6FF", BLUE], social_media: ["#F5F3FF", PURPLE], seo: ["#F0FDF4", GREEN], other: [SURFACE, TEXT_MUTED] };

  const { data: sprintData, isFetching: sprintsFetching, refetch: refetchSprints } =
    useGetQuery({ path: "clients/sprints", params: project ? { project_id: project.id } : {} }, { skip: !project });
  const sprints = sprintData?.data || [];

  const [activeSprint, setActiveSprint] = useState(null);
  const currentSprint = sprints.find((s) => s.uuid === activeSprint) || sprints[0] || null;

  const { data: empData } = useGetQuery({ path: "employee/teams/employees" });
  const employeeOptions = (empData?.data || []).map((e) => ({ value: String(e.id), label: e.employee_id ? `${e.name} · ${e.employee_id}` : e.name }));

  const { data: taskData, isFetching: tasksFetching, refetch: refetchTasks } =
    useGetQuery({ path: "clients/tasks", params: currentSprint ? { sprint_id: currentSprint.id } : {} }, { skip: !currentSprint });
  const tasks = taskData?.data || [];

  const [createSprint, { isLoading: creatingSprint }] = usePostMutation();
  const [updateSprint, { isLoading: updatingSprint }] = usePatchMutation();
  const [deleteSprint] = useDeleteMutation();
  const [createTask, { isLoading: creatingTask }] = usePostMutation();
  const [updateTask, { isLoading: updatingTask }] = usePatchMutation();
  const [deleteTask] = useDeleteMutation();
  const [postDoc] = usePostMutation();
  const [delDoc] = useDeleteMutation();

  const [sprintModal, setSprintModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [taskModal, setTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskErr, setTaskErr] = useState(null);

  // The task currently open in the modal, re-read from the live list so doc
  // changes reflect immediately.
  const modalTask = editingTask ? (tasks.find((t) => t.uuid === editingTask.uuid) || editingTask) : null;

  const submitSprint = async (body) => {
    try {
      if (editingSprint) await updateSprint({ path: `clients/sprints/${editingSprint.uuid}`, body }).unwrap();
      else await createSprint({ path: "clients/sprints", body: { ...body, project_id: project.id } }).unwrap();
      setSprintModal(false); setEditingSprint(null); refetchSprints();
    } catch (e) { console.error("save sprint failed", e); }
  };
  const removeSprint = async (s) => {
    if (!window.confirm(`Delete ${noun} "${s.name}" and its tasks view?`)) return;
    try { await deleteSprint({ path: `clients/sprints/${s.uuid}`, body: {} }).unwrap(); if (currentSprint?.uuid === s.uuid) setActiveSprint(null); refetchSprints(); }
    catch (e) { console.error("delete sprint failed", e); }
  };

  const submitTask = async (body) => {
    setTaskErr(null);
    try {
      if (editingTask) await updateTask({ path: `clients/tasks/${editingTask.uuid}`, body }).unwrap();
      else await createTask({ path: "clients/tasks", body: { ...body, sprint_id: currentSprint.id } }).unwrap();
      setTaskModal(false); setEditingTask(null); refetchTasks();
    } catch (e) {
      console.error("save task failed", e);
      setTaskErr(e?.data?.message || (e?.status === 404 ? "Endpoint not found — restart backend after migrating." : `Request failed (HTTP ${e?.status ?? "?"}).`));
    }
  };
  const moveTask = async (task, status) => {
    try { await updateTask({ path: `clients/tasks/${task.uuid}`, body: { status } }).unwrap(); refetchTasks(); }
    catch (e) { console.error("move task failed", e); }
  };
  const removeTask = async (task) => {
    if (!window.confirm("Delete this task?")) return;
    try { await deleteTask({ path: `clients/tasks/${task.uuid}`, body: {} }).unwrap(); refetchTasks(); }
    catch (e) { console.error("delete task failed", e); }
  };
  const addDoc = async (task, body) => {
    try { await postDoc({ path: `clients/tasks/${task.uuid}/docs`, body }).unwrap(); refetchTasks(); }
    catch (e) { console.error("add doc failed", e); }
  };
  const removeDoc = async (task, docId) => {
    try { await delDoc({ path: `clients/tasks/${task.uuid}/docs/${docId}`, body: {} }).unwrap(); refetchTasks(); }
    catch (e) { console.error("remove doc failed", e); }
  };

  if (projLoading) return <div className="flex justify-center py-20" style={{ background: "#FAFBFC" }}><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>;
  if (!project) return <div className="py-20 text-center text-[13px]" style={{ color: BRAND, background: "#FAFBFC" }}>Project not found.</div>;

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-2.5">
          <button onClick={() => navigate("/dashboard/it-solutions/clients")} className="grid w-9 h-9 rounded-lg place-items-center" style={{ background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><ArrowLeft size={16} /></button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>{project.name}</h1>
              {(() => { const [tint, color] = TYPE_TINTS[project.type] || TYPE_TINTS.software; return (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: tint, color }}>{TYPE_LABELS[project.type] || "Software"}</span>
              ); })()}
            </div>
            <p className="text-[11.5px] mt-0.5 flex flex-wrap items-center gap-x-3" style={{ color: TEXT_MUTED }}>
              {project.client?.name && <span className="inline-flex items-center gap-1"><Building2 size={11} /> {project.client.name}</span>}
              {project.team?.name && <span className="inline-flex items-center gap-1"><Users size={11} /> {project.team.name}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Sprints / Cycles bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {sprints.map((s) => {
          const active = currentSprint?.uuid === s.uuid;
          return (
            <button key={s.uuid} onClick={() => setActiveSprint(s.uuid)}
              className="group inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] font-semibold"
              style={active ? { background: BRAND, color: "#fff" } : { background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
              {s.name}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: active ? "rgba(255,255,255,0.2)" : SURFACE, color: active ? "#fff" : TEXT_MUTED }}>{s.tasks_count ?? 0}</span>
            </button>
          );
        })}
        <button onClick={() => { setEditingSprint(null); setSprintModal(true); }} className="inline-flex items-center gap-1 px-3 py-2 text-[12.5px] font-semibold rounded-lg" style={{ background: SURFACE, border: `1px dashed ${BORDER}`, color: BRAND }}>
          <Plus size={14} /> New {noun}
        </button>
        {sprintsFetching && <Loader2 size={14} className="animate-spin" style={{ color: BRAND }} />}
      </div>

      {!currentSprint ? (
        <div className="py-16 text-center bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
          <p className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>No {noun}s yet</p>
          <p className="text-[12px] mt-1" style={{ color: TEXT_MUTED }}>Create a {noun} to start adding tasks.</p>
        </div>
      ) : (
        <>
          {/* Sprint sub-header */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="text-[13px]" style={{ color: TEXT_SECONDARY }}>
              <span className="font-bold" style={{ color: TEXT_PRIMARY }}>{currentSprint.name}</span>
              {(currentSprint.start_date || currentSprint.end_date) && <span className="ml-2 inline-flex items-center gap-1 text-[11.5px]" style={{ color: TEXT_MUTED }}><CalendarClock size={12} /> {currentSprint.start_date || "—"} → {currentSprint.end_date || "—"}</span>}
              {tasksFetching && <span className="ml-2 text-[11px]" style={{ color: BRAND }}>· updating…</span>}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => { setEditingSprint(currentSprint); setSprintModal(true); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><Pencil size={13} /> Edit {noun}</button>
              <button onClick={() => removeSprint(currentSprint)} className="grid rounded-lg w-8 h-8 place-items-center" style={{ background: "#FEF2F2", border: `1px solid ${BORDER}`, color: BRAND }}><Trash2 size={13} /></button>
              <button onClick={() => { setEditingTask(null); setTaskErr(null); setTaskModal(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white rounded-lg" style={{ background: BRAND }}><Plus size={14} /> Add task</button>
            </div>
          </div>

          {/* Kanban */}
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
            {COLUMNS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.key);
              return (
                <div key={col.key} className="rounded-xl" style={{ background: "#fff", border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold" style={{ color: TEXT_PRIMARY }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: col.color }} /> {col.label}
                    </span>
                    <span className="text-[11px] font-semibold" style={{ color: TEXT_MUTED }}>{colTasks.length}</span>
                  </div>
                  <div className="p-2 space-y-2 min-h-[80px]">
                    {colTasks.map((t) => {
                      const pm = prMeta(t.priority);
                      const overdue = t.deadline && t.deadline < todayStr && t.status !== "done";
                      return (
                        <div key={t.uuid} className="p-2.5 rounded-lg" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                          <div className="flex items-start gap-1.5">
                            <Flag size={12} style={{ color: pm.color, marginTop: 2 }} />
                            <button onClick={() => { setEditingTask(t); setTaskErr(null); setTaskModal(true); }} className="text-left text-[12.5px] font-semibold flex-1" style={{ color: TEXT_PRIMARY }}>{t.title}</button>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1.5">
                              {t.assignee?.name
                                ? <span className="grid rounded-full place-items-center text-[9px] font-bold" style={{ width: 20, height: 20, background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }} title={t.assignee.name}>{initials(t.assignee.name)}</span>
                                : <span className="text-[10px]" style={{ color: TEXT_MUTED }}>Unassigned</span>}
                              {t.docs?.length > 0 && <span className="inline-flex items-center gap-0.5 text-[10px]" style={{ color: BLUE }}><Link2 size={11} /> {t.docs.length}</span>}
                            </div>
                            {t.deadline && <span className="text-[10px] font-semibold" style={{ color: overdue ? BRAND : TEXT_MUTED }}>{t.deadline}</span>}
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <select value={t.status} onChange={(e) => moveTask(t, e.target.value)} className="flex-1 px-1.5 py-1 text-[10.5px] rounded-md outline-none" style={{ background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
                              {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                            </select>
                            <button onClick={() => removeTask(t)} className="grid rounded-md w-6 h-6 place-items-center" style={{ background: "#FEF2F2", color: BRAND }}><Trash2 size={11} /></button>
                          </div>
                        </div>
                      );
                    })}
                    {colTasks.length === 0 && <div className="py-3 text-center text-[11px]" style={{ color: TEXT_MUTED }}>—</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <SprintModal isOpen={sprintModal} onClose={() => { setSprintModal(false); setEditingSprint(null); }} onSubmit={submitSprint} sprint={editingSprint} noun={noun} saving={creatingSprint || updatingSprint} />
      <TaskModal isOpen={taskModal} onClose={() => { setTaskModal(false); setEditingTask(null); setTaskErr(null); }} onSubmit={submitTask} task={modalTask} employeeOptions={employeeOptions} saving={creatingTask || updatingTask} error={taskErr} onAddDoc={addDoc} onRemoveDoc={removeDoc} />
    </div>
  );
}
