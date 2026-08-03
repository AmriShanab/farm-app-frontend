import { useState, useEffect, useMemo } from "react";
import {
  Bird,
  Loader2,
  CheckCircle2,
  Wallet,
  CalendarRange,
  Play,
  Info,
} from "lucide-react";
import {
  getPoultryBatches,
  getBatchPayrollPreview,
  finalizeBatchPayroll,
} from "../services/api";
import { useToast } from "./ToastProvider";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Pending (emptied, ready to run) first, then active (still running), then
// completed/closed; each group newest-batch first.
const STATUS_ORDER = { pending: 0, active: 1, completed: 2, closed: 3 };
const statusStyle = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  active: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function BatchPayrollPanel() {
  const toast = useToast();
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { row, advance }

  useEffect(() => {
    (async () => {
      try {
        const list = await getPoultryBatches("");
        const sorted = [...list].sort(
          (a, b) =>
            (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
            String(b.date).localeCompare(String(a.date)),
        );
        setBatches(sorted);
        if (sorted.length) setBatchId(String(sorted[0].id));
      } catch {
        toast.error("Failed to load poultry batches.");
      }
    })();
  }, []);

  const loadPreview = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      setPreview(await getBatchPayrollPreview(id));
    } catch {
      toast.error("Failed to load batch payroll.");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreview(batchId);
  }, [batchId]);

  const selectedBatch = useMemo(
    () => batches.find((b) => String(b.id) === String(batchId)),
    [batches, batchId],
  );
  const runnable =
    selectedBatch &&
    (selectedBatch.status === "pending" || selectedBatch.status === "completed");

  const totals = useMemo(() => {
    const rows = preview?.payouts || [];
    return rows.reduce(
      (acc, r) => {
        acc.gross += r.grossPay;
        acc.advance += r.advanceDeducted;
        acc.net += r.netPay;
        return acc;
      },
      { gross: 0, advance: 0, net: 0 },
    );
  }, [preview]);

  const openConfirm = (row) => {
    const advance = Math.min(row.advanceOutstanding, row.grossPay);
    setConfirm({ row, advance: Number(advance.toFixed(2)) });
  };

  const doFinalize = async () => {
    if (!confirm) return;
    const { row, advance } = confirm;
    setSavingId(row.empId);
    try {
      await finalizeBatchPayroll({
        batchId: Number(batchId),
        empId: Number(row.empId),
        advanceDeducted: Number(advance || 0),
      });
      toast.success(`Batch payroll run for ${row.name}.`);
      setConfirm(null);
      await loadPreview(batchId);
    } catch (e) {
      toast.error(e.message || "Failed to run batch payroll.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
          <Bird size={15} className="text-green-700" />
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="text-sm font-bold text-gray-700 bg-transparent outline-none cursor-pointer max-w-[280px]"
          >
            {batches.length === 0 && <option value="">No batches</option>}
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                Batch #{b.id} · started {b.date} · {b.quantity} birds ·{" "}
                {b.status}
              </option>
            ))}
          </select>
        </div>

        {selectedBatch && (
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wide border ${
              statusStyle[selectedBatch.status] || statusStyle.closed
            }`}
          >
            {selectedBatch.status}
          </span>
        )}

        {preview && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-bold">
            <CalendarRange size={13} />
            {preview.startDate} → {preview.endDate} · {preview.days} days
          </div>
        )}
      </div>

      {/* Ready-to-run hint */}
      {selectedBatch && !runnable && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-semibold text-amber-800">
          <Info size={16} className="mt-0.5 shrink-0" />
          This batch is still <b>active</b> — its payroll can be run once all
          chicks are sold (the batch moves to <b>pending</b>) or the batch is
          completed. The figures below are a live preview to date.
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Total Gross", value: totals.gross, icon: <Wallet size={14} /> },
          { label: "Advances Deducted", value: totals.advance, icon: <Wallet size={14} /> },
          { label: "Net Payout", value: totals.net, icon: <CheckCircle2 size={14} /> },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl p-4 bg-gradient-to-br from-[#166534] to-[#14532d] text-white shadow-lg shadow-green-900/20 border border-green-800/50"
          >
            <div className="text-xs font-medium text-white/80 mb-1">
              {c.label}
            </div>
            <div className="text-xl font-bold tracking-tight">
              Rs. {fmt(c.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e8ede8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7faf7] text-gray-500 text-[11px] font-black uppercase tracking-wider">
                <th className="text-left px-4 py-3">Employee</th>
                <th className="text-right px-4 py-3">Monthly Salary</th>
                <th className="text-right px-4 py-3">Batch Days</th>
                <th className="text-right px-4 py-3">Gross Pay</th>
                <th className="text-right px-4 py-3">Advance</th>
                <th className="text-right px-4 py-3">Net Pay</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    <Loader2 className="animate-spin inline mr-2" size={16} />
                    Loading…
                  </td>
                </tr>
              )}
              {!loading &&
                (preview?.payouts?.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400 font-semibold">
                      No poultry workers found for this batch.
                    </td>
                  </tr>
                )}
              {!loading &&
                preview?.payouts?.map((row) => (
                  <tr key={row.empId} className="border-t border-[#f0f4f0]">
                    <td className="px-4 py-3 font-bold text-gray-800">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      Rs. {fmt(row.monthlySalary)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {row.days}{" "}
                      <span className="text-gray-400 text-xs">
                        (÷30 × {fmt(row.wagePerDay)})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      Rs. {fmt(row.grossPay)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {row.advanceOutstanding > 0
                        ? `Rs. ${fmt(row.advanceOutstanding)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-green-700">
                      Rs. {fmt(row.alreadyPaid ? row.paidNet : row.netPay)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.alreadyPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle2 size={13} /> Paid
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!runnable || savingId === row.empId}
                          onClick={() => openConfirm(row)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${
                            runnable
                              ? "bg-green-700 text-white hover:bg-green-800"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {savingId === row.empId ? (
                            <Loader2 className="animate-spin" size={13} />
                          ) : (
                            <Play size={13} />
                          )}
                          Run Payroll
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
          onClick={() => !savingId && setConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-gray-900 mb-1">
              Run Batch Payroll — {confirm.row.name}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Batch #{batchId} · {preview?.days} days · {preview?.startDate} →{" "}
              {preview?.endDate}
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">
                  Gross ({fmt(confirm.row.monthlySalary)} × {preview?.days} ÷ 30)
                </span>
                <span className="font-bold text-gray-900">
                  Rs. {fmt(confirm.row.grossPay)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-semibold">
                  Advance deducted
                  {confirm.row.advanceOutstanding > 0 && (
                    <span className="text-gray-400">
                      {" "}
                      (of Rs. {fmt(confirm.row.advanceOutstanding)} owed)
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-xs">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    max={Math.min(
                      confirm.row.advanceOutstanding,
                      confirm.row.grossPay,
                    )}
                    value={confirm.advance}
                    onChange={(e) =>
                      setConfirm((c) => ({
                        ...c,
                        advance: Math.max(
                          0,
                          Math.min(
                            Number(e.target.value) || 0,
                            Math.min(c.row.advanceOutstanding, c.row.grossPay),
                          ),
                        ),
                      }))
                    }
                    className="w-28 text-right border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold outline-none focus:border-green-400"
                  />
                </div>
              </div>

              <div className="flex justify-between border-t border-gray-100 pt-2 mt-1">
                <span className="text-gray-700 font-black">Net pay</span>
                <span className="font-black text-green-700 text-base">
                  Rs. {fmt(Math.max(0, confirm.row.grossPay - confirm.advance))}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={!!savingId}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={doFinalize}
                disabled={!!savingId}
                className="flex-1 px-4 py-2.5 rounded-xl bg-green-700 text-white font-black hover:bg-green-800 inline-flex items-center justify-center gap-2"
              >
                {savingId ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Confirm &amp; Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
