import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Plus, X, Loader2, ShieldCheck, KeyRound, Search, Crown, Copy, Check, Send } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";

const BRAND = "#C90606";
const BRAND_DARK = "#A00505";
const BRAND_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE = "#F8FAFC";

const inputStyle = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13, outline: "none" };
const LEADERSHIP = ["admin", "super_admin", "ceo", "coo"];
const prettyRole = (n) => (n || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/* ── create user modal ── */
function CreateUserModal({ open, roles, onCancel, onSubmit, isLoading }) {
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", contact: "", password: "", role_id: "" });
  const [err, setErr] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  useEffect(() => { if (open) { setF({ firstName: "", lastName: "", email: "", contact: "", password: "", role_id: "" }); setErr(""); setRoleSearch(""); } }, [open]);
  const filteredRoles = roles.filter((r) => prettyRole(r.name).toLowerCase().includes(roleSearch.trim().toLowerCase()));
  const selectedRole = roles.find((r) => String(r.id) === String(f.role_id));
  if (!open) return null;
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const save = async () => {
    if (!f.firstName.trim() || !f.lastName.trim() || !f.email.trim() || !f.contact.trim() || !f.role_id) { setErr("Name, email, phone and role are required."); return; }
    const res = await onSubmit({
      firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim(),
      contact: f.contact.trim(), password: f.password || undefined, role_id: Number(f.role_id),
    });
    if (res?.error) setErr(res.error);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onCancel}>
      <div className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>New admin / leadership user</h3>
          <button type="button" onClick={onCancel} style={{ color: TEXT_MUTED }}><X size={16} /></button>
        </div>
        <div className="px-5 py-5">
          {err && <div className="p-2.5 mb-4 text-[12px] rounded-lg" style={{ background: BRAND_TINT, color: BRAND, border: "1px solid #FECACA" }}>{err}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>First name *</label><input value={f.firstName} onChange={(e) => set("firstName", e.target.value)} style={inputStyle} /></div>
            <div><label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Last name *</label><input value={f.lastName} onChange={(e) => set("lastName", e.target.value)} style={inputStyle} /></div>
            <div className="col-span-2"><label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Email *</label><input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} style={inputStyle} /></div>
            <div><label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Phone *</label><input value={f.contact} onChange={(e) => set("contact", e.target.value)} style={inputStyle} /></div>
            <div><label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Password</label><input type="text" value={f.password} onChange={(e) => set("password", e.target.value)} placeholder="auto if blank" style={inputStyle} /></div>
            <div className="col-span-2">
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Primary role *</label>
              <div className="relative">
                <Search size={13} className="absolute -translate-y-1/2 left-2.5 top-1/2" style={{ color: TEXT_MUTED }} />
                <input value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} placeholder={selectedRole ? prettyRole(selectedRole.name) : "Search role…"} style={{ ...inputStyle, paddingLeft: 30 }} />
              </div>
              <div className="mt-1.5 max-h-40 overflow-y-auto rounded-lg" style={{ border: `1px solid ${BORDER}` }}>
                {filteredRoles.length === 0 && <div className="px-3 py-2 text-[12px]" style={{ color: TEXT_MUTED }}>No roles match.</div>}
                {filteredRoles.map((r) => {
                  const on = String(r.id) === String(f.role_id);
                  return (
                    <button key={r.id} type="button" onClick={() => set("role_id", String(r.id))} className="flex items-center justify-between w-full px-3 py-2 text-left text-[13px]" style={{ background: on ? "#F0FDF4" : "#fff", color: TEXT_PRIMARY, borderBottom: `1px solid ${BORDER}` }}>
                      <span>{prettyRole(r.name)}{LEADERSHIP.includes(r.name) ? <span style={{ color: BRAND, fontSize: 10 }}> · full control</span> : null}</span>
                      {on && <Check size={14} style={{ color: "#15803D" }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFBFC" }}>
          <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}>Cancel</button>
          <button type="button" onClick={save} disabled={isLoading} className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)` }}>{isLoading ? <Loader2 size={14} className="animate-spin" /> : "Create user"}</button>
        </div>
      </div>
    </div>
  );
}

/* ── manage roles modal (multi-role) ── */
function RolesModal({ user, roles, onCancel, onSave, isLoading }) {
  const [selected, setSelected] = useState([]);
  const [primary, setPrimary] = useState(null);
  const [roleSearch, setRoleSearch] = useState("");
  useEffect(() => {
    if (!user) return;
    const ids = (user.roles || []).map((r) => r.id);
    setSelected(ids);
    setPrimary((user.roles || []).find((r) => r.is_primary)?.id ?? ids[0] ?? null);
    setRoleSearch("");
  }, [user]);
  if (!user) return null;
  const filteredRoles = roles.filter((r) => prettyRole(r.name).toLowerCase().includes(roleSearch.trim().toLowerCase()));
  const toggle = (id) => setSelected((s) => {
    const next = s.includes(id) ? s.filter((x) => x !== id) : [...s, id];
    if (!next.includes(primary)) setPrimary(next[0] ?? null);
    return next;
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onCancel}>
      <div className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div>
            <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Roles for {user.name}</h3>
            <p className="text-[11px]" style={{ color: TEXT_MUTED }}>Assign multiple roles. The primary one is the user's main role.</p>
          </div>
          <button type="button" onClick={onCancel} style={{ color: TEXT_MUTED }}><X size={16} /></button>
        </div>
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          <div className="relative mb-3">
            <Search size={14} className="absolute -translate-y-1/2 left-3 top-1/2" style={{ color: TEXT_MUTED }} />
            <input value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} placeholder="Search roles…" className="w-full py-2 pl-9 pr-3 text-sm rounded-lg outline-none" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {filteredRoles.length === 0 && <div className="px-3 py-2 text-[12px]" style={{ color: TEXT_MUTED }}>No roles match.</div>}
            {filteredRoles.map((r) => {
              const on = selected.includes(r.id);
              return (
                <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ border: `1px solid ${on ? "#BBF7D0" : BORDER}`, background: on ? "#F0FDF4" : SURFACE }}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={on} onChange={() => toggle(r.id)} style={{ accentColor: "#15803D" }} />
                    <span className="text-[13px]" style={{ color: TEXT_PRIMARY }}>{prettyRole(r.name)}{LEADERSHIP.includes(r.name) ? " · full control" : ""}</span>
                  </label>
                  {on && (
                    <label className="flex items-center gap-1 cursor-pointer text-[11px]" style={{ color: primary === r.id ? BRAND : TEXT_MUTED }}>
                      <input type="radio" name="primary" checked={primary === r.id} onChange={() => setPrimary(r.id)} style={{ accentColor: BRAND }} /> Primary
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFBFC" }}>
          <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}>Cancel</button>
          <button type="button" disabled={isLoading || selected.length === 0} onClick={() => onSave(selected.map((id) => ({ id, is_primary: id === primary })))} className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)` }}>{isLoading ? <Loader2 size={14} className="animate-spin" /> : "Save roles"}</button>
        </div>
      </div>
    </div>
  );
}

/* ── reset password (with reveal) modal ── */
function ResetPwdModal({ user, onCancel, onSubmit, isLoading, revealed, onDone }) {
  const [pwd, setPwd] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (user) { setPwd(""); setCopied(false); } }, [user]);
  if (!user) return null;
  const copy = () => { try { navigator.clipboard.writeText(revealed.password); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (e) {} };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={revealed ? onDone : onCancel}>
      <div className="w-full max-w-sm overflow-hidden bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Reset password</h3>
          <button type="button" onClick={revealed ? onDone : onCancel} style={{ color: TEXT_MUTED }}><X size={16} /></button>
        </div>
        <div className="px-5 py-5">
          {revealed ? (
            <>
              <p className="text-[12px] mb-2" style={{ color: TEXT_MUTED }}>New password for <b style={{ color: TEXT_PRIMARY }}>{revealed.name}</b>. Copy it now — it won't be shown again.</p>
              <div className="flex items-center justify-between px-3 py-3 rounded-lg" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <code className="text-[16px] font-bold tracking-wide" style={{ color: "#15803D" }}>{revealed.password}</code>
                <button type="button" onClick={copy} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-md text-white" style={{ background: "#15803D" }}>{copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[12px] mb-3" style={{ color: TEXT_MUTED }}>Set a new password for <b style={{ color: TEXT_PRIMARY }}>{user.name}</b>, or leave blank to auto-generate one. The new password is shown so you can hand it over.</p>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>New password (optional)</label>
              <input value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Leave blank to auto-generate" style={inputStyle} />
            </>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFBFC" }}>
          {revealed ? (
            <button type="button" onClick={onDone} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)` }}>Done</button>
          ) : (
            <>
              <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}>Cancel</button>
              <button type="button" onClick={() => onSubmit(pwd.trim() || undefined)} disabled={isLoading} className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)` }}>{isLoading ? <Loader2 size={14} className="animate-spin" /> : "Set & reveal"}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminsAccess() {
  const user = useSelector(selectCurrentUser);
  const canManage = user?.role === "admin" || (user?.permissions || []).includes("create users");

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [rolesUser, setRolesUser] = useState(null);
  const [pwdUser, setPwdUser] = useState(null);
  const [revealed, setRevealed] = useState(null);

  useEffect(() => { const t = setTimeout(() => setDebounced(search.trim()), 300); return () => clearTimeout(t); }, [search]);

  const { data, isLoading, error, refetch } = useGetQuery({ path: "user/staff", params: debounced ? { q: debounced } : {} }, { refetchOnMountOrArgChange: true });
  const rows = useMemo(() => { const r = data?.data ?? []; return Array.isArray(r) ? r : r?.data ?? []; }, [data]);

  const { data: rolesResp } = useGetQuery({ path: "/core/roles" });
  const roles = useMemo(() => { const r = rolesResp?.data ?? []; return Array.isArray(r) ? r : r?.data ?? []; }, [rolesResp]);

  const [createU, { isLoading: creating }] = usePostMutation();
  const [syncRoles, { isLoading: syncing }] = usePostMutation();
  const [resetPwd, { isLoading: resetting }] = usePostMutation();
  const [resend] = usePostMutation();
  const [resendingUuid, setResendingUuid] = useState(null);

  const doResetPwd = async (password) => {
    try {
      const res = await resetPwd({ path: `user/${pwdUser.uuid}/reset-password-reveal`, body: password ? { password } : {} }).unwrap();
      setRevealed(res?.data || res);
    } catch (e) { showToast(e?.data?.message || "Could not reset password.", "error"); }
  };

  const doResendCredentials = async (u) => {
    if (!window.confirm(`Email fresh login details to ${u.email || u.name}? Their current password will be reset.`)) return;
    setResendingUuid(u.uuid);
    try {
      const res = await resend({ path: `user/${u.uuid}/resend-credentials`, body: {} }).unwrap();
      showToast(res?.message || res?.data || "Login details sent.", "success");
    } catch (e) { showToast(e?.data?.message || "Could not send login details.", "error"); }
    finally { setResendingUuid(null); }
  };

  const doCreate = async (body) => {
    try { await createU({ path: "user/create-with-role", body }).unwrap(); showToast("User created", "success"); setCreateOpen(false); refetch(); return { error: null }; }
    catch (e) { const errs = e?.data?.errors || {}; return { error: Object.values(errs)[0]?.[0] || e?.data?.message || "Could not create user." }; }
  };
  const doSaveRoles = async (rolePayload) => {
    try { await syncRoles({ path: `employee/users/${rolesUser.uuid}/roles/sync`, body: { roles: rolePayload } }).unwrap(); showToast("Roles updated", "success"); setRolesUser(null); refetch(); }
    catch (e) { showToast(e?.data?.message || "Could not update roles.", "error"); }
  };

  return (
    <div className="w-full px-6 py-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: BRAND_TINT, color: BRAND }}><Crown size={18} /></div>
          <div>
            <h2 className="text-[16px] font-bold" style={{ color: TEXT_PRIMARY }}>Admins &amp; Access</h2>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Admin, Super Admin, CEO &amp; COO accounts. Assign multiple roles; leadership roles get full control.</p>
          </div>
        </div>
        {canManage && (
          <button type="button" onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)` }}>
            <Plus size={15} /> New user
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 px-4 py-3 mb-3 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute -translate-y-1/2 left-3 top-1/2" style={{ color: TEXT_MUTED }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" className="w-full py-2 pl-9 pr-3 text-sm rounded-lg outline-none" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
        </div>
        <div className="ml-auto text-[12px]" style={{ color: TEXT_MUTED }}>{rows.length} users</div>
      </div>

      <div className="overflow-hidden bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <table className="w-full">
          <thead style={{ background: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
              <th className="px-5 py-3">User</th><th className="px-5 py-3">Roles</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-5 py-10 text-center text-[13px]" style={{ color: TEXT_MUTED }}><Loader2 size={16} className="inline animate-spin" /> Loading…</td></tr>}
            {!isLoading && error && <tr><td colSpan={4} className="px-5 py-10 text-center text-[13px]" style={{ color: BRAND }}>Couldn't load users.</td></tr>}
            {!isLoading && !error && rows.length === 0 && <tr><td colSpan={4} className="px-5 py-12 text-center text-[13px]" style={{ color: TEXT_MUTED }}>No admin / leadership users yet.</td></tr>}
            {!isLoading && !error && rows.map((u) => (
              <tr key={u.uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td className="px-5 py-3">
                  <div className="text-sm font-bold" style={{ color: TEXT_PRIMARY }}>{u.name}</div>
                  <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{u.email}</div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1" style={{ maxWidth: 360 }}>
                    {(u.roles || []).map((r) => (
                      <span key={r.id} className="inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full" style={{ background: r.is_primary ? BRAND_TINT : SURFACE, color: r.is_primary ? BRAND : TEXT_SECONDARY, border: `1px solid ${r.is_primary ? "#FECACA" : BORDER}` }}>
                        {r.is_primary && <Crown size={9} />}{prettyRole(r.name)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 text-[11.5px] font-semibold rounded-full" style={{ color: u.active_status ? "#15803D" : TEXT_SECONDARY, background: u.active_status ? "#F0FDF4" : "#F1F5F9" }}>{u.active_status ? "Active" : "Inactive"}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  {canManage && (
                    <button type="button" onClick={() => { setRevealed(null); setPwdUser(u); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 mr-1 text-[12px] font-semibold rounded-md" style={{ border: `1px solid ${BORDER}`, color: "#B45309" }}>
                      <KeyRound size={13} /> Reset password
                    </button>
                  )}
                  {canManage && (
                    <button type="button" onClick={() => doResendCredentials(u)} disabled={resendingUuid === u.uuid} title="Reset password and email the login details to the user" className="inline-flex items-center gap-1.5 px-3 py-1.5 mr-1 text-[12px] font-semibold rounded-md" style={{ border: `1px solid ${BORDER}`, color: "#1D4ED8", opacity: resendingUuid === u.uuid ? 0.5 : 1 }}>
                      {resendingUuid === u.uuid ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Send login details
                    </button>
                  )}
                  {canManage && (
                    <button type="button" onClick={() => setRolesUser(u)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-md" style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>
                      <ShieldCheck size={13} /> Manage roles
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateUserModal open={createOpen} roles={roles} onCancel={() => setCreateOpen(false)} onSubmit={doCreate} isLoading={creating} />
      <RolesModal user={rolesUser} roles={roles} onCancel={() => setRolesUser(null)} onSave={doSaveRoles} isLoading={syncing} />
      <ResetPwdModal user={pwdUser} onCancel={() => setPwdUser(null)} onSubmit={doResetPwd} isLoading={resetting} revealed={revealed} onDone={() => { setPwdUser(null); setRevealed(null); }} />
    </div>
  );
}
