import { useState, useEffect, useMemo } from "react";
import {
  Bird,
  Loader2,
  CheckCircle2,
  Wallet,
  CalendarRange,
  Play,
  Info,
  FileCheck,
  X,
  Download,
} from "lucide-react";
import {
  getPoultryBatches,
  getBatchPayrollPreview,
  finalizeBatchPayroll,
  savePayslipSignature,
} from "../services/api";
import { useToast } from "./ToastProvider";
import SignaturePad from "./SignaturePad";

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
  const [slip, setSlip] = useState(null); // paid row shown as a slip
  const [sigSaving, setSigSaving] = useState(false);

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
  // Pay is attendance-based and incremental, so payroll can be run at any point
  // in the batch (a month now, the remainder at batch end) — except once it's
  // closed. The per-row button is enabled only when there's something new to pay.
  const runnable = selectedBatch && selectedBatch.status !== "closed";

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

  const handleSaveSignature = async (dataUrl) => {
    if (!slip?.itemId) return;
    setSigSaving(true);
    try {
      await savePayslipSignature(slip.itemId, dataUrl);
      setSlip((prev) => ({ ...prev, signature: dataUrl }));
      toast.success("Signature saved.");
      await loadPreview(batchId);
    } catch (e) {
      toast.error(e.message || "Failed to save signature.");
    } finally {
      setSigSaving(false);
    }
  };

  // Render the batch payslip into a print window so the user can "Save as PDF".
  const exportSlipPdf = (row) => {
    if (!row) return;
    const money = (n) => "Rs. " + fmt(n);
    const period = `${preview?.startDate || ""} to ${preview?.endDate || ""}`;
    const win = window.open("", "_blank", "width=720,height=920");
    if (!win) {
      toast.error("Allow pop-ups to export the payslip PDF.");
      return;
    }
    win.document.write(`<!doctype html><html><head><meta charset="utf-8" />
      <title>Payslip - ${row.name}</title>
      <style>
        *{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}
        body{margin:0;padding:30px;color:#111827}
        .head{border-bottom:2px solid #166534;padding-bottom:12px;margin-bottom:18px}
        .head h1{margin:0 0 4px;font-size:20px}
        .muted{color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.04em;font-weight:bold;margin-top:2px}
        table{width:100%;border-collapse:collapse;margin-top:6px}
        td{padding:9px 4px;border-bottom:1px solid #eef2f0;font-size:14px}
        td.r{text-align:right;font-weight:bold}
        tr.net td{border-bottom:none;padding-top:14px}
        .net-v{font-size:18px;font-weight:900;color:#166534}
        .sig{margin-top:40px}
        .sig img{max-height:96px;display:block}
        .sig .line{border-bottom:1px solid #9ca3af;width:240px;height:1px;margin-top:4px}
        .sig .lbl{margin-top:6px;font-size:12px;color:#6b7280;font-weight:bold;text-transform:uppercase;letter-spacing:.04em}
        @media print{body{padding:14px}}
      </style></head><body>
      <div class="head">
        <h1>Payslip — ${row.name}</h1>
        <div class="muted">Poultry · Batch #${batchId}</div>
        <div class="muted">Pay period: ${period} · ${row.days} days worked</div>
      </div>
      <table>
        <tr><td>Basic Salary</td><td class="r">${money(row.paidBasic)}</td></tr>
        <tr><td>Allowance</td><td class="r">${money(row.paidAllowance)}</td></tr>
        <tr><td>Gross Pay</td><td class="r">${money(row.paidGross)}</td></tr>
        <tr><td>Advances Deducted</td><td class="r" style="color:#b91c1c">− ${money(row.paidAdvance)}</td></tr>
        <tr class="net"><td><b>Net Cash Paid</b></td><td class="r net-v">${money(row.paidNet)}</td></tr>
      </table>
      <div class="sig">
        ${row.signature ? `<img src="${row.signature}" alt="signature" />` : ""}
        <div class="line"></div>
        <div class="lbl">Employee Signature</div>
      </div>
      <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
      </body></html>`);
    win.document.close();
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

      {/* Info hint */}
      {selectedBatch && runnable && selectedBatch.status === "active" && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm font-semibold text-blue-800">
          <Info size={16} className="mt-0.5 shrink-0" />
          Pay is based on attendance and paid in installments — you can run a
          month now and the remaining days at batch end. Each run pays only the
          days worked since the last one.
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
                <th className="text-right px-4 py-3">Days Worked</th>
                <th className="text-right px-4 py-3">Paid So Far</th>
                <th className="text-right px-4 py-3">To Pay</th>
                <th className="text-right px-4 py-3">Advance</th>
                <th className="text-right px-4 py-3">Net Pay</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                    <Loader2 className="animate-spin inline mr-2" size={16} />
                    Loading…
                  </td>
                </tr>
              )}
              {!loading &&
                (preview?.payouts?.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-400 font-semibold">
                      No poultry workers found for this batch.
                    </td>
                  </tr>
                )}
              {!loading &&
                preview?.payouts?.map((row) => {
                  const toPay = row.grossPay || 0;
                  const fullyPaid = toPay <= 0.009 && (row.paidGross || 0) > 0;
                  return (
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
                        (× {fmt(row.wagePerDay)}/day)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {(row.paidGross || 0) > 0 ? `Rs. ${fmt(row.paidGross)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      Rs. {fmt(toPay)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {row.advanceOutstanding > 0
                        ? `Rs. ${fmt(row.advanceOutstanding)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-green-700">
                      Rs. {fmt(row.netPay)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        {fullyPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                            <CheckCircle2 size={13} /> Paid
                          </span>
                        ) : toPay <= 0.009 ? (
                          <span className="text-xs font-bold text-gray-400">—</span>
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
                        {(row.paidGross || 0) > 0 && row.itemId && (
                          <button
                            type="button"
                            onClick={() => setSlip(row)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                          >
                            <FileCheck size={13} /> Slip
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
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
              Batch #{batchId} · {preview?.startDate} → {preview?.endDate}
              {(confirm.row.paidGross || 0) > 0 && (
                <> · already paid Rs. {fmt(confirm.row.paidGross)}</>
              )}
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">
                  To pay ({confirm.row.days} days worked × {fmt(confirm.row.wagePerDay)}/day)
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

      {/* Slip modal */}
      {slip && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
          onClick={() => !sigSaving && setSlip(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-5 border-b border-green-200 flex justify-between items-start shrink-0">
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-0.5">{slip.name}</h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Poultry &middot; Batch #{batchId}
                </p>
                <p className="text-xs font-bold text-green-700 mt-1">
                  {preview?.startDate} &rarr; {preview?.endDate}
                </p>
              </div>
              <button
                onClick={() => setSlip(null)}
                className="p-1.5 rounded-full text-gray-400 hover:bg-white hover:text-gray-700 shadow-sm"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Days Worked</span>
                  <span className="font-bold text-gray-800">{slip.days}</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Monthly Salary</span>
                  <span className="font-bold text-gray-800">Rs. {fmt(slip.monthlySalary)}</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-black text-gray-600 uppercase tracking-wider">
                  Salary Composition (EPF)
                </div>
                <div className="p-4 grid grid-cols-2 divide-x divide-gray-100 text-center">
                  <div>
                    <span className="block text-lg font-black text-gray-900">Rs. {fmt(slip.paidBasic)}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Basic</span>
                  </div>
                  <div>
                    <span className="block text-lg font-black text-blue-700">Rs. {fmt(slip.paidAllowance)}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Allowance</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 space-y-2 shadow-sm">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">Gross (paid)</span>
                  <span className="font-bold text-gray-900">Rs. {fmt(slip.paidGross)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">Advances Deducted</span>
                  <span className="font-bold text-red-600">− Rs. {fmt(slip.paidAdvance)}</span>
                </div>
                <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between items-center">
                  <span className="text-xs font-black text-green-900 uppercase tracking-wider">Net Cash Paid</span>
                  <span className="text-2xl font-black text-green-700">Rs. {fmt(slip.paidNet)}</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-black text-gray-600 uppercase tracking-wider">
                  Employee Signature
                </div>
                <div className="p-4">
                  <SignaturePad
                    value={slip.signature}
                    onSave={handleSaveSignature}
                    saving={sigSaving}
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-gray-50/60 flex justify-end">
              <button
                type="button"
                onClick={() => exportSlipPdf(slip)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-700 text-white text-sm font-black hover:bg-green-800 shadow-sm"
              >
                <Download size={15} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
