import React, { useMemo, useState } from "react";
import {
  Wallet, TrendingUp, AlertTriangle, Award, Coins, Users, Home, Laptop,
  BarChart3, TrendingDown,
} from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";
import FinanceLedger from "./FinanceLedger";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar, ComposedChart, Line,
} from "recharts";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";
const PIE = ["#C90606", "#1D4ED8", "#15803D", "#C2410C", "#7C3AED", "#0891B2"];

const fmtMoney = (n) => "Rs " + Number(n || 0).toLocaleString();
const fmtDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function FinanceStats() {
  const [tab, setTab] = useState("collections"); // "overview" | "collections" | "expenses"
  const [expensesView, setExpensesView] = useState("analytics"); // "analytics" | "manage"
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [from, to]);

  const { data, isLoading, isFetching } = useGetQuery({ path: `finance/techschool-stats${qs}` });
  const d = data?.data || {};
  const counts = d.counts || {};
  const methodLabels = { cash: "Cash", jazzcash: "JazzCash", easypaisa: "Easypaisa", bank_transfer: "Bank", cheque: "Cheque", other: "Other" };
  const byMethod = (d.by_method || []).map((m) => ({ name: methodLabels[m.method] || m.method, value: m.total }));
  const byFeeType = (d.by_fee_type || []).map((f) => ({ name: f.fee_type === "ENROLLMENT" ? "Enrollment" : f.fee_type === "MONTHLY" ? "Monthly" : f.fee_type, value: f.total }));
  const trend = (d.trend || []).map((t) => ({ month: t.month, total: t.total }));
  const byCourse = (d.by_course || []).map((r) => ({ name: r.label, value: r.total }));
  const byInstructor = (d.by_instructor || []).map((r) => ({ name: r.label, value: r.total }));
  const byReferral = d.by_referral || [];

  // P&L / Overview — manual income vs expense ledger (finance/get/summary).
  const { data: pnlData, isFetching: pnlFetching } = useGetQuery({ path: `finance/get/summary${qs}` }, { skip: tab !== "overview" && tab !== "expenses" });
  const pnl = pnlData?.data || {};
  const pnlMonthly = (pnl?.monthly_chart?.table || []).map((m) => ({ month: m.month, income: Number(m.income || 0), expense: Number(m.expense || 0), profit: Number(m.profit || 0) }));
  const incomeByCat = (pnl?.income_by_category || []).map((r) => ({ name: r.category_name || r.name, value: Number(r.total || 0) })).filter((r) => r.value > 0);
  const expenseByCat = (pnl?.expense_by_category || []).map((r) => ({ name: r.category_name || r.name, value: Number(r.total || 0) })).filter((r) => r.value > 0);
  const methodLabel = { cash: "Cash", jazzcash: "JazzCash", easypaisa: "Easypaisa", bank_transfer: "Bank", bank: "Bank", cheque: "Cheque", nayapay: "NayaPay", split: "Split", other: "Other", unspecified: "Unspecified" };
  const mapByMethod = (arr) => (arr || []).map((r) => ({ name: methodLabel[r.method] || r.method, value: Number(r.total || 0) })).filter((r) => r.value > 0);
  const incomeByMethod = mapByMethod(pnl?.income_by_method);
  const expenseByMethod = mapByMethod(pnl?.expense_by_method);
  const [courseFilter, setCourseFilter] = useState("");
  const studentsPerCourse = (d.students_per_course || []).filter((r) => !courseFilter || (r.label || "").toLowerCase().includes(courseFilter.toLowerCase()));
  const leads = d.leads_health || {};

  const preset = (kind) => {
    const n = new Date();
    const f = (x) => fmtDate(x);
    if (kind === "today") { setFrom(f(n)); setTo(f(n)); }
    else if (kind === "week") { const w = new Date(n); w.setDate(w.getDate() - 6); setFrom(f(w)); setTo(f(n)); }
    else if (kind === "month") { setFrom(f(new Date(n.getFullYear(), n.getMonth(), 1))); setTo(f(n)); }
    else if (kind === "year") { setFrom(f(new Date(n.getFullYear(), 0, 1))); setTo(f(n)); }
    else { setFrom(""); setTo(""); }
  };

  const inp = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };
  const Card = ({ icon: Icon, label, value, color, sub }) => (
    <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-2.5">
        <span className="grid rounded-lg place-items-center" style={{ width: 36, height: 36, background: `${color}14`, color }}><Icon size={17} /></span>
        <div>
          <div className="text-[17px] font-bold" style={{ color: TEXT_PRIMARY }}>{value}</div>
          <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{label}</div>
        </div>
      </div>
      {sub != null && <div className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>{sub}</div>}
    </div>
  );

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND }}><Wallet size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Finance Stats</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Fee collections, outstanding, certificate & referral money {isFetching ? "· refreshing…" : ""}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Collections / Expenses toggle */}
          <div className="inline-flex overflow-hidden rounded-lg" style={{ border: `1px solid ${BORDER}` }}>
            {[{ k: "overview", l: "Overview", Icon: TrendingUp }, { k: "collections", l: "Collections", Icon: BarChart3 }, { k: "expenses", l: "Expenses", Icon: TrendingDown }].map((t) => {
              const active = tab === t.k;
              return (
                <button key={t.k} onClick={() => setTab(t.k)} className="px-3 py-1.5 text-[12px] font-semibold inline-flex items-center gap-1.5" style={{ background: active ? BRAND : "#fff", color: active ? "#fff" : TEXT_MUTED }}>
                  <t.Icon size={13} /> {t.l}
                </button>
              );
            })}
          </div>
          {!(tab === "expenses" && expensesView === "manage") && (
            <div className="flex items-center gap-1.5">
              <span className="text-[12px]" style={{ color: TEXT_MUTED }}>From</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="py-1.5 px-2 text-sm rounded-lg outline-none" style={inp} />
              <span className="text-[12px]" style={{ color: TEXT_MUTED }}>To</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="py-1.5 px-2 text-sm rounded-lg outline-none" style={inp} />
              {[{k:"today",l:"Today"},{k:"week",l:"This week"},{k:"month",l:"This month"},{k:"year",l:"This year"}].map((p) => (
                <button key={p.k} onClick={() => preset(p.k)} className="px-2.5 py-1.5 text-xs font-semibold rounded-lg" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>{p.l}</button>
              ))}
              {(from || to) && <button onClick={() => preset("all")} className="px-2.5 py-1.5 text-xs font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: BRAND }}>All time</button>}
            </div>
          )}
        </div>
      </div>

      {tab === "expenses" ? (
        <>
          {/* Analytics / Manage sub-toggle */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="inline-flex overflow-hidden rounded-lg" style={{ border: `1px solid ${BORDER}` }}>
              {[{ k: "analytics", l: "Analytics", Icon: BarChart3 }, { k: "manage", l: "Manage & record", Icon: Wallet }].map((v) => {
                const active = expensesView === v.k;
                return (
                  <button key={v.k} onClick={() => setExpensesView(v.k)} className="px-3 py-1.5 text-[12px] font-semibold inline-flex items-center gap-1.5" style={{ background: active ? BRAND : "#fff", color: active ? "#fff" : TEXT_MUTED }}>
                    <v.Icon size={13} /> {v.l}
                  </button>
                );
              })}
            </div>
            {expensesView === "analytics" && <span className="text-[12px]" style={{ color: TEXT_MUTED }}>{pnlFetching ? "refreshing…" : ""}</span>}
          </div>

          {expensesView === "manage" ? (
            <FinanceLedger type="expense" embedded />
          ) : (
            <>
              <div className="grid gap-3 mb-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card icon={TrendingDown} label={from || to ? "Spent (range)" : "Total spent"} value={fmtMoney(pnl.total_expense)} color="#C2410C" />
                <Card icon={Wallet} label="Refunds" value={fmtMoney(pnl.total_refund)} color={BRAND} />
                <Card icon={BarChart3} label="Spend categories" value={expenseByCat.length} color="#7C3AED" />
                <Card icon={TrendingDown} label="Top category" value={expenseByCat[0]?.name || "—"} color="#1D4ED8" sub={expenseByCat[0] ? fmtMoney(expenseByCat[0].value) : null} />
              </div>

              <div className="bg-white rounded-xl p-4 mb-4" style={{ border: `1px solid ${BORDER}` }}>
                <h3 className="text-[13px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Spending over time</h3>
                {pnlMonthly.length === 0 ? (
                  <div className="py-10 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No expenses in this range.</div>
                ) : (
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <AreaChart data={pnlMonthly} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                        <defs><linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C2410C" stopOpacity={0.35} /><stop offset="100%" stopColor="#C2410C" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: TEXT_MUTED }} />
                        <YAxis tick={{ fontSize: 10, fill: TEXT_MUTED }} />
                        <Tooltip formatter={(v) => fmtMoney(v)} />
                        <Area type="monotone" dataKey="expense" name="Spent" stroke="#C2410C" fill="url(#gExp)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
                  <h3 className="text-[13px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Spend share by category</h3>
                  {expenseByCat.length === 0 ? <div className="py-10 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No expenses recorded.</div> : (
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={expenseByCat} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                            {expenseByCat.map((e, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => fmtMoney(v)} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
                  <h3 className="text-[13px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Spend amount by category</h3>
                  {expenseByCat.length === 0 ? <div className="py-10 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No expenses recorded.</div> : (
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer>
                        <BarChart data={expenseByCat} layout="vertical" margin={{ top: 4, right: 12, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: TEXT_MUTED }} />
                          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10, fill: TEXT_MUTED }} />
                          <Tooltip formatter={(v) => fmtMoney(v)} />
                          <Bar dataKey="value" name="Spent" fill="#C2410C" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 mt-4" style={{ border: `1px solid ${BORDER}` }}>
                <h3 className="text-[13px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Spend by payment method</h3>
                {expenseByMethod.length === 0 ? <div className="py-6 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No method-tagged expenses yet.</div> : (
                  <div className="grid gap-4 lg:grid-cols-2 items-center">
                    <div style={{ width: "100%", height: 220 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={expenseByMethod} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                            {expenseByMethod.map((e, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => fmtMoney(v)} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5">
                      {expenseByMethod.map((r, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: SURFACE }}>
                          <span className="text-[13px]" style={{ color: TEXT_PRIMARY }}>{r.name}</span>
                          <span className="text-[13px] font-bold" style={{ color: "#C2410C" }}>{fmtMoney(r.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : tab === "overview" ? (
        <>
          <div className="grid gap-3 mb-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card icon={TrendingUp} label="Total income" value={fmtMoney(pnl.total_income)} color="#15803D" sub={pnlFetching ? "refreshing…" : null} />
            <Card icon={TrendingDown} label="Total expense" value={fmtMoney(pnl.total_expense)} color="#C2410C" />
            <Card icon={Wallet} label="Refunds" value={fmtMoney(pnl.total_refund)} color={BRAND} />
            <Card icon={Coins} label="Net profit" value={fmtMoney(pnl.net_profit)} color={Number(pnl.net_profit) >= 0 ? "#15803D" : BRAND} sub={Number(pnl.net_profit) >= 0 ? "Income − Expense" : "Loss"} />
          </div>

          <div className="bg-white rounded-xl p-4 mb-4" style={{ border: `1px solid ${BORDER}` }}>
            <h3 className="text-[13px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Income vs Expense (monthly)</h3>
            {pnlMonthly.length === 0 ? (
              <div className="py-10 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No ledger entries in this range.</div>
            ) : (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <ComposedChart data={pnlMonthly} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: TEXT_MUTED }} />
                    <YAxis tick={{ fontSize: 10, fill: TEXT_MUTED }} />
                    <Tooltip formatter={(v) => fmtMoney(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="income" name="Income" fill="#15803D" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#C2410C" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="profit" name="Net profit" stroke="#1D4ED8" strokeWidth={2} dot={{ r: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
              <h3 className="text-[13px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Income by category</h3>
              {incomeByCat.length === 0 ? <div className="py-6 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No income recorded.</div> : (
                <div className="space-y-1.5">
                  {incomeByCat.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: SURFACE }}>
                      <span className="text-[13px]" style={{ color: TEXT_PRIMARY }}>{r.name}</span>
                      <span className="text-[13px] font-bold" style={{ color: "#15803D" }}>{fmtMoney(r.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
              <h3 className="text-[13px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Expense by category</h3>
              {expenseByCat.length === 0 ? <div className="py-6 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No expenses recorded.</div> : (
                <div className="space-y-1.5">
                  {expenseByCat.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: SURFACE }}>
                      <span className="text-[13px]" style={{ color: TEXT_PRIMARY }}>{r.name}</span>
                      <span className="text-[13px] font-bold" style={{ color: "#C2410C" }}>{fmtMoney(r.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 mt-4 lg:grid-cols-2">
            <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
              <h3 className="text-[13px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Income by payment method</h3>
              {incomeByMethod.length === 0 ? <div className="py-6 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No method-tagged income yet.</div> : (
                <div className="space-y-1.5">
                  {incomeByMethod.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: SURFACE }}>
                      <span className="text-[13px]" style={{ color: TEXT_PRIMARY }}>{r.name}</span>
                      <span className="text-[13px] font-bold" style={{ color: "#15803D" }}>{fmtMoney(r.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
              <h3 className="text-[13px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Expense by payment method</h3>
              {expenseByMethod.length === 0 ? <div className="py-6 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No method-tagged expenses yet.</div> : (
                <div className="space-y-1.5">
                  {expenseByMethod.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: SURFACE }}>
                      <span className="text-[13px]" style={{ color: TEXT_PRIMARY }}>{r.name}</span>
                      <span className="text-[13px] font-bold" style={{ color: "#C2410C" }}>{fmtMoney(r.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : isLoading ? (
        <div className="py-20 text-center" style={{ color: TEXT_MUTED }}>Loading…</div>
      ) : (
        <>
          <div className="grid gap-3 mb-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card icon={Wallet} label={from || to ? "Collected (range)" : "Collected (all time)"} value={fmtMoney(from || to ? d.collected : d.collected_all_time)} color="#15803D" sub={from || to ? `All-time: ${fmtMoney(d.collected_all_time)}` : null} />
            <Card icon={AlertTriangle} label="Outstanding" value={fmtMoney(d.outstanding)} color="#C2410C" sub={`Overdue: ${fmtMoney(d.overdue)}`} />
            <Card icon={Award} label="Certificate fees" value={fmtMoney(d.certificate_fees)} color="#1D4ED8" />
            <Card icon={Coins} label="Referral rewards" value={fmtMoney(d.referral_rewards)} color={BRAND} />
            <Card icon={Users} label="Enrolled students" value={counts.enrolled_students ?? 0} color="#7C3AED" />
            <Card icon={Home} label="Hostelites" value={counts.hostelites ?? 0} color="#0891B2" />
            <Card icon={Laptop} label="Laptops assigned" value={counts.laptops_assigned ?? 0} color="#B45309" />
            <Card icon={TrendingUp} label="Billed (all time)" value={fmtMoney(d.billed_all_time)} color="#334155" />
          </div>

          <div className="grid gap-4 mb-4 lg:grid-cols-3">
            <div className="bg-white rounded-xl p-4 lg:col-span-2" style={{ border: `1px solid ${BORDER}` }}>
              <h3 className="text-[13px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Collections over time</h3>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <AreaChart data={trend} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                    <defs><linearGradient id="gMoney" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#15803D" stopOpacity={0.35} /><stop offset="100%" stopColor="#15803D" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: TEXT_MUTED }} />
                    <YAxis tick={{ fontSize: 10, fill: TEXT_MUTED }} />
                    <Tooltip formatter={(v) => fmtMoney(v)} />
                    <Area type="monotone" dataKey="total" name="Collected" stroke="#15803D" fill="url(#gMoney)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
              <h3 className="text-[13px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>By payment method</h3>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={byMethod} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                      {byMethod.map((e, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtMoney(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
            <h3 className="text-[13px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Collected by fee type</h3>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={byFeeType} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: TEXT_MUTED }} />
                  <YAxis tick={{ fontSize: 10, fill: TEXT_MUTED }} />
                  <Tooltip formatter={(v) => fmtMoney(v)} />
                  <Bar dataKey="value" name="Collected" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-4 mt-4 lg:grid-cols-2">
            <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
              <h3 className="text-[13px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Collected by course</h3>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={byCourse} layout="vertical" margin={{ top: 4, right: 12, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: TEXT_MUTED }} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10, fill: TEXT_MUTED }} />
                    <Tooltip formatter={(v) => fmtMoney(v)} />
                    <Bar dataKey="value" name="Collected" fill="#15803D" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
              <h3 className="text-[13px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Collected by instructor</h3>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={byInstructor} layout="vertical" margin={{ top: 4, right: 12, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: TEXT_MUTED }} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10, fill: TEXT_MUTED }} />
                    <Tooltip formatter={(v) => fmtMoney(v)} />
                    <Bar dataKey="value" name="Collected" fill="#1D4ED8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid gap-4 mt-4 lg:grid-cols-2">
            <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>Students per course</h3>
                <input value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} placeholder="Filter course" className="px-2.5 py-1 text-xs rounded-lg outline-none" style={inp} />
              </div>
              <div className="space-y-1.5" style={{ maxHeight: 240, overflowY: "auto" }}>
                {studentsPerCourse.length === 0 && <div className="text-[12px]" style={{ color: TEXT_MUTED }}>No data.</div>}
                {studentsPerCourse.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: SURFACE }}>
                    <span className="text-[13px]" style={{ color: TEXT_PRIMARY }}>{r.label}</span>
                    <span className="text-[13px] font-bold" style={{ color: "#7C3AED" }}>{r.students}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
              <h3 className="text-[13px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Leads health</h3>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="px-3 py-3 rounded-lg text-center" style={{ background: "#FFF7ED" }}>
                  <div className="text-[18px] font-bold" style={{ color: "#C2410C" }}>{leads.cold ?? 0}</div>
                  <div className="text-[11px]" style={{ color: TEXT_MUTED }}>Cold inquiries</div>
                </div>
                <div className="px-3 py-3 rounded-lg text-center" style={{ background: "#FEF2F2" }}>
                  <div className="text-[18px] font-bold" style={{ color: BRAND }}>{leads.overdue_followups ?? 0}</div>
                  <div className="text-[11px]" style={{ color: TEXT_MUTED }}>Overdue follow-ups</div>
                </div>
                <div className="px-3 py-3 rounded-lg text-center" style={{ background: "#F1F5F9" }}>
                  <div className="text-[18px] font-bold" style={{ color: "#334155" }}>{leads.dropouts ?? 0}</div>
                  <div className="text-[11px]" style={{ color: TEXT_MUTED }}>Dropouts</div>
                </div>
              </div>
              <div className="text-[12px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Why leads go cold</div>
              <div className="space-y-1" style={{ maxHeight: 130, overflowY: "auto" }}>
                {(leads.cold_reasons || []).length === 0 && <div className="text-[12px]" style={{ color: TEXT_MUTED }}>No cold reasons recorded.</div>}
                {(leads.cold_reasons || []).map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px]"><span style={{ color: TEXT_PRIMARY }}>{r.label}</span><span style={{ color: TEXT_MUTED }}>{r.count}</span></div>
                ))}
              </div>
            </div>
          </div>

          {byReferral.length > 0 && (
            <div className="bg-white rounded-xl p-4 mt-4" style={{ border: `1px solid ${BORDER}` }}>
              <h3 className="text-[13px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Referral earnings by ambassador</h3>
              <div className="space-y-1.5">
                {byReferral.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: SURFACE }}>
                    <span className="text-[13px]" style={{ color: TEXT_PRIMARY }}>{r.label}</span>
                    <span className="text-[12px]" style={{ color: TEXT_MUTED }}>{r.conversions} paid · <b style={{ color: BRAND }}>{fmtMoney(r.total)}</b></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
