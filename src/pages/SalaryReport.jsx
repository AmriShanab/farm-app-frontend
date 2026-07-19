import { useEffect, useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Loader2,
  Settings2,
  X,
  Save,
  History,
} from "lucide-react";
import {
  getSalaryReport,
  getBasicRate,
  createBasicRate,
} from "../services/api";
import { useToast } from "../components/ToastProvider";
import { downloadCsv } from "../utils/csv";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const monthLabel = (m) =>
  new Date(2000, m - 1, 1).toLocaleString("en-US", { month: "long" });

const today = new Date();

export default function SalaryReport() {
  const toast = useToast();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [farm, setFarm] = useState("");

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Basic rate control
  const [rateInfo, setRateInfo] = useState({ current: 1200, history: [] });
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [newRate, setNewRate] = useState("");
  const [newEffectiveFrom, setNewEffectiveFrom] = useState(
    today.toISOString().split("T")[0],
  );
  const [isSavingRate, setIsSavingRate] = useState(false);

  const loadReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSalaryReport({ month, year, farm: farm || undefined });
      setReport(data);
    } catch {
      setError("Failed to load salary report.");
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRate = async () => {
    try {
      const r = await getBasicRate();
      setRateInfo(r);
    } catch {
      /* keep default */
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, farm]);

  useEffect(() => {
    loadRate();
  }, []);

  const handleSaveRate = async () => {
    const rate = parseFloat(newRate);
    if (!rate || rate <= 0) {
      toast.warn("Enter a valid basic rate greater than 0.");
      return;
    }
    setIsSavingRate(true);
    try {
      await createBasicRate({ basicPerDay: rate, effectiveFrom: newEffectiveFrom });
      toast.success("Basic rate updated. Past payslips stay unchanged.");
      setIsRateModalOpen(false);
      setNewRate("");
      await loadRate();
      await loadReport();
    } catch (err) {
      toast.error(err?.message || "Failed to update basic rate.");
    } finally {
      setIsSavingRate(false);
    }
  };

  const handleExport = () => {
    if (!report?.rows?.length) return;
    downloadCsv(
      `salary-epf-${year}-${String(month).padStart(2, "0")}${farm ? `-${farm}` : ""}.csv`,
      [
        { label: "Employee", value: (r) => r.name },
        { label: "Role", value: (r) => r.role || "" },
        { label: "Farm", value: (r) => r.farm || "" },
        { label: "Basic", value: (r) => r.basicPay.toFixed(2) },
        { label: "Allowance", value: (r) => r.allowancePay.toFixed(2) },
        { label: "Gross", value: (r) => r.grossPay.toFixed(2) },
        { label: "Net Paid", value: (r) => r.netPay.toFixed(2) },
      ],
      report.rows,
    );
  };

  const totals = report?.totals || { gross: 0, basic: 0, allowance: 0, net: 0 };

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Nunito'] pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center shadow-lg shadow-green-900/20">
              <FileSpreadsheet size={20} className="text-green-300" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Salary / EPF Report
            </h1>
          </div>
          <p className="text-sm font-medium text-gray-500 pl-[52px]">
            Basic vs allowance breakdown from finalized payroll, for EPF/ETF filing
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setIsRateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Settings2 size={14} /> Basic Rate: Rs. {fmt(rateInfo.current)}
          </button>
          <button
            onClick={handleExport}
            disabled={!report?.rows?.length}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Month
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="text-sm font-bold text-gray-700 bg-transparent outline-none cursor-pointer"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Year
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-20 text-sm font-bold text-gray-700 bg-transparent outline-none"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Farm
          </label>
          <select
            value={farm}
            onChange={(e) => setFarm(e.target.value)}
            className="text-sm font-bold text-gray-700 bg-transparent outline-none cursor-pointer"
          >
            <option value="">All</option>
            <option value="MR1">MR1</option>
            <option value="MR2">MR2</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Basic", value: totals.basic, color: "text-gray-900" },
          { label: "Total Allowance", value: totals.allowance, color: "text-blue-700" },
          { label: "Total Gross", value: totals.gross, color: "text-green-700" },
          { label: "Total Net Paid", value: totals.net, color: "text-green-800" },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
          >
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
              {c.label}
            </p>
            <p className={`text-lg font-black ${c.color}`}>Rs. {fmt(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4 text-left">Employee</th>
                <th className="p-4 text-left">Role</th>
                <th className="p-4 text-left">Farm</th>
                <th className="p-4 text-right">Basic</th>
                <th className="p-4 text-right">Allowance</th>
                <th className="p-4 text-right">Gross</th>
                <th className="p-4 text-right">Net Paid</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-green-600">
                    <Loader2 size={22} className="animate-spin mx-auto mb-2" />
                    <span className="text-xs font-bold">Loading report...</span>
                  </td>
                </tr>
              ) : !report?.rows?.length ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400 font-bold">
                    No finalized payroll for {monthLabel(month)} {year}.
                  </td>
                </tr>
              ) : (
                report.rows.map((r) => (
                  <tr key={r.empId} className="border-t border-gray-50 hover:bg-gray-50/40">
                    <td className="p-4 font-bold text-gray-900">{r.name}</td>
                    <td className="p-4 text-gray-600">{r.role || "—"}</td>
                    <td className="p-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                        {r.farm}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-gray-900">
                      Rs. {fmt(r.basicPay)}
                    </td>
                    <td className="p-4 text-right font-bold text-blue-700">
                      Rs. {fmt(r.allowancePay)}
                    </td>
                    <td className="p-4 text-right font-bold text-gray-700">
                      Rs. {fmt(r.grossPay)}
                    </td>
                    <td className="p-4 text-right font-black text-green-700">
                      Rs. {fmt(r.netPay)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {report?.rows?.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                  <td className="p-4 font-black text-gray-700 text-xs uppercase tracking-wider" colSpan={3}>
                    Totals
                  </td>
                  <td className="p-4 text-right font-black text-gray-900">Rs. {fmt(totals.basic)}</td>
                  <td className="p-4 text-right font-black text-blue-700">Rs. {fmt(totals.allowance)}</td>
                  <td className="p-4 text-right font-black text-gray-900">Rs. {fmt(totals.gross)}</td>
                  <td className="p-4 text-right font-black text-green-700">Rs. {fmt(totals.net)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Basic rate modal */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsRateModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-gray-900">Basic Salary Rate</h3>
                <p className="text-xs text-gray-500">
                  Current: Rs. {fmt(rateInfo.current)} / day. A new rate applies going
                  forward — past payslips stay frozen.
                </p>
              </div>
              <button
                onClick={() => setIsRateModalOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  New Basic / Day (Rs.)
                  <input
                    type="number"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:border-green-500"
                  />
                </label>
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Effective From
                  <input
                    type="date"
                    value={newEffectiveFrom}
                    min={today.toISOString().split("T")[0]}
                    onChange={(e) => setNewEffectiveFrom(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:border-green-500"
                  />
                </label>
              </div>

              {rateInfo.history?.length > 0 && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                  <div className="px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100">
                    <History size={12} /> Rate History
                  </div>
                  <ul className="divide-y divide-gray-100 max-h-40 overflow-y-auto">
                    {rateInfo.history.map((h) => (
                      <li key={h.id} className="px-4 py-2 flex justify-between text-xs">
                        <span className="font-bold text-gray-700">
                          Rs. {fmt(h.basicPerDay)} / day
                        </span>
                        <span className="text-gray-400 font-semibold">
                          from {h.effectiveFrom}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/60">
              <button
                onClick={() => setIsRateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRate}
                disabled={isSavingRate}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-black shadow-md disabled:opacity-60 flex items-center gap-2"
              >
                {isSavingRate ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Save Rate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
