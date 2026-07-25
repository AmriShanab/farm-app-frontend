import { useState, useEffect, useCallback } from "react";
import { X, Loader2, CalendarDays, Banknote, CheckCircle2, ClipboardList, Wallet } from "lucide-react";
import { getEmployeeHistory } from "../services/api";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusChip = (s) =>
  s === "full"
    ? "bg-green-50 text-green-700 border-green-200"
    : s === "half"
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-red-50 text-red-700 border-red-200";

export default function EmployeeHistoryModal({ employee, onClose }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!employee?.id) return;
    setLoading(true);
    getEmployeeHistory(employee.id, { from, to })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [employee?.id, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const att = data?.attendance?.summary || {};
  const adv = data?.advances || {};
  const pay = data?.payroll || {};

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-black">
              {(employee?.name || "?").substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">{employee?.name}</h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {employee?.role || "—"} · {employee?.farm || "—"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white border border-gray-200 shadow-sm">
            <X size={18} />
          </button>
        </div>

        {/* Date filter */}
        <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3 bg-white">
          <CalendarDays size={15} className="text-gray-400" />
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-green-500" />
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-green-500" />
          {(from || to) && (
            <button onClick={() => { setFrom(""); setTo(""); }}
              className="text-xs font-bold text-green-700 hover:underline">All time</button>
          )}
        </div>

        {loading ? (
          <div className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-green-600" size={30} /></div>
        ) : !data ? (
          <div className="py-24 text-center text-gray-500 font-bold">Failed to load history.</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/40">
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <SummaryCard icon={<ClipboardList size={14} />} label="Worked Days" value={att.workedDays ?? 0}
                sub={`${att.fullDays || 0} full · ${att.halfDays || 0} half · ${att.absentDays || 0} absent`} />
              <SummaryCard icon={<Banknote size={14} />} label="Advances Taken" value={`Rs. ${fmt(adv.totalTaken)}`}
                sub={`${adv.taken?.length || 0} advance(s)`} tone="amber" />
              <SummaryCard icon={<Wallet size={14} />} label="Advances Repaid" value={`Rs. ${fmt(adv.totalRepaid)}`}
                sub="via payroll" tone="orange" />
              <SummaryCard icon={<CheckCircle2 size={14} />} label="Net Paid" value={`Rs. ${fmt(pay.totalNet)}`}
                sub={`${pay.items?.length || 0} payroll run(s)`} tone="green" />
            </div>

            {/* Payroll */}
            <Section title="Payroll">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 text-left">Period</th><th className="p-3 text-left">Farm</th>
                    <th className="p-3 text-right">Gross</th><th className="p-3 text-right">Basic</th>
                    <th className="p-3 text-right">Allowance</th><th className="p-3 text-right">Advance</th>
                    <th className="p-3 text-right">Net Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {(pay.items || []).length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-gray-400 font-bold">No payroll in this range.</td></tr>
                  ) : pay.items.map((p) => (
                    <tr key={p.id} className="border-t border-gray-50">
                      <td className="p-3 font-bold text-gray-800">{p.start_date} → {p.end_date}</td>
                      <td className="p-3 text-gray-600">{p.farm || "—"}</td>
                      <td className="p-3 text-right font-bold">Rs. {fmt(p.gross_pay)}</td>
                      <td className="p-3 text-right text-gray-600">{p.basic_pay != null ? `Rs. ${fmt(p.basic_pay)}` : "—"}</td>
                      <td className="p-3 text-right text-blue-700">{p.allowance_pay != null ? `Rs. ${fmt(p.allowance_pay)}` : "—"}</td>
                      <td className="p-3 text-right text-orange-700">{Number(p.advance_deducted) > 0 ? `Rs. ${fmt(p.advance_deducted)}` : "—"}</td>
                      <td className="p-3 text-right font-black text-green-700">Rs. {fmt(p.net_pay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            {/* Advances taken */}
            <Section title="Advances Taken">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 text-left">Date</th><th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-right">Repaid</th><th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(adv.taken || []).length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-gray-400 font-bold">No advances in this range.</td></tr>
                  ) : adv.taken.map((a) => (
                    <tr key={a.id} className="border-t border-gray-50">
                      <td className="p-3 font-bold text-gray-800">{a.date}</td>
                      <td className="p-3 text-right font-bold">Rs. {fmt(a.amount)}</td>
                      <td className="p-3 text-right text-gray-600">Rs. {fmt(a.repaid_amount)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${a.status === "deducted" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">{a.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            {/* Advance repayments */}
            <Section title="Advance Repayments (via payroll)">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 text-left">Deducted in run</th><th className="p-3 text-left">Original advance date</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(adv.repaid || []).length === 0 ? (
                    <tr><td colSpan={3} className="p-6 text-center text-gray-400 font-bold">No repayments in this range.</td></tr>
                  ) : adv.repaid.map((r, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="p-3 font-bold text-gray-800">{r.start_date} → {r.end_date}</td>
                      <td className="p-3 text-gray-600">{r.advance_date}</td>
                      <td className="p-3 text-right font-black text-red-600">− Rs. {fmt(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            {/* Attendance */}
            <Section title="Attendance">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 text-left">Date</th><th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Location</th><th className="p-3 text-left">Task</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.attendance?.records || []).length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-gray-400 font-bold">No attendance in this range.</td></tr>
                  ) : data.attendance.records.map((a, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="p-3 font-bold text-gray-800">{a.date}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${statusChip(a.status)}`}>{a.status}</span>
                      </td>
                      <td className="p-3 text-gray-600">{a.location_worked || "—"}</td>
                      <td className="p-3 text-gray-500">{a.task_type || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, tone = "gray" }) {
  const toneMap = {
    gray: "text-gray-900", amber: "text-amber-700", orange: "text-orange-700", green: "text-green-700",
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">{icon} {label}</p>
      <h4 className={`text-xl font-black ${toneMap[tone]}`}>{value}</h4>
      {sub && <p className="text-[10px] text-gray-400 font-bold mt-0.5">{sub}</p>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
