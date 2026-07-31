import { useState, useEffect } from "react";
import { Receipt, Loader2, TrendingUp, TrendingDown, Wheat, Pill, FileText, Egg, ShoppingBag, CheckCircle2, X } from "lucide-react";
import { getPoultryBatches, getPoultrySettlement, completePoultryBatch } from "../../services/api";
import { useToast } from "../../components/ToastProvider";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const catLabel = (c) => ({ chicks: "Chicks", meat: "Meat", eggs: "Eggs", manure: "Manure" }[c] || c);

const STATUS = {
  active: { label: "Active", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  completed: { label: "Completed", cls: "bg-green-50 text-green-700 border-green-200" },
  closed: { label: "Closed", cls: "bg-gray-100 text-gray-600 border-gray-200" },
};

export default function PoultrySettlement() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [settlement, setSettlement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const toast = useToast();

  const reloadBatches = () => getPoultryBatches("").then((res) => { setBatches(res); return res; });

  useEffect(() => {
    reloadBatches()
      .then((res) => {
        if (res.length > 0) setSelectedBatchId(res[0].id);
        else setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await completePoultryBatch(selectedBatchId);
      const [s] = await Promise.all([getPoultrySettlement(selectedBatchId), reloadBatches()]);
      setSettlement(s);
      setConfirmComplete(false);
      toast.success("Batch completed.");
    } catch (e) {
      toast.error(e?.message || "Failed to complete batch.");
    } finally {
      setCompleting(false);
    }
  };

  useEffect(() => {
    if (selectedBatchId) {
      setIsLoading(true);
      getPoultrySettlement(selectedBatchId)
        .then(setSettlement)
        .catch(() => setSettlement(null))
        .finally(() => setIsLoading(false));
    }
  }, [selectedBatchId]);

  const net = settlement?.netReceived ?? 0;
  const totalCosts = settlement?.totalCosts ?? ((settlement?.feed?.totalCost || 0) + (settlement?.medicine?.totalCost || 0) + (settlement?.expenses?.totalCost || 0) + (settlement?.batchCost || 0));
  const totalIncome = settlement?.totalSales ?? 0;
  const profit = settlement?.profit ?? (totalIncome - totalCosts);
  const isProfit = profit >= 0;

  // Expense lines for the ledger (right side). Additional expenses only shown if any.
  const expenseLines = settlement
    ? [
        { key: "batch", label: "Batch Purchase", amount: settlement.batchCost || 0, Icon: Egg, color: "text-blue-600" },
        { key: "feed", label: "Feed", amount: settlement.feed?.totalCost || 0, Icon: Wheat, color: "text-amber-600" },
        { key: "medicine", label: "Medicine", amount: settlement.medicine?.totalCost || 0, Icon: Pill, color: "text-purple-600" },
        ...((settlement.expenses?.totalCost || 0) > 0
          ? [{ key: "other", label: "Additional Expenses", amount: settlement.expenses.totalCost, Icon: FileText, color: "text-orange-600" }]
          : []),
      ]
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Nunito']">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-green-600/20">
            <Receipt size={20} className="text-white" />
          </div>
          Batch Settlement
        </h1>
        <p className="text-sm font-medium text-gray-500 pl-[52px]">
          Full batch overview — income, supplier account & costs.
        </p>
      </div>

      {batches.length === 0 && !isLoading ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-sm text-gray-500">No batches found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center gap-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Batch:</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm font-bold rounded-lg px-3 py-2 outline-none cursor-pointer focus:border-green-500"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.notes || `Batch #${b.id}`} — {(STATUS[b.status] || STATUS.active).label}
                </option>
              ))}
            </select>
            {settlement && (
              <>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${(STATUS[settlement.status] || STATUS.active).cls}`}>
                  {(STATUS[settlement.status] || STATUS.active).label}
                </span>
                <div className="ml-auto">
                  {settlement.status === "completed" ? (
                    <span className="text-sm font-black text-green-700 flex items-center gap-1.5">
                      <CheckCircle2 size={16} /> Final received: Rs. {fmt(settlement.finalReceived)}
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmComplete(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-black shadow-sm hover:bg-green-700 flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={15} /> Complete Batch
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <Loader2 className="animate-spin mx-auto text-green-600 mb-4" size={32} />
            </div>
          ) : settlement ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Sales Revenue</p>
                  <h3 className="text-2xl font-black text-gray-900">Rs. {fmt(settlement.totalSales)}</h3>
                  {settlement.totalChicksSold > 0 && (
                    <p className="text-[10px] text-gray-400 mt-1">{settlement.totalChicksSold} chicks sold</p>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Batch Costs</p>
                  <h3 className="text-2xl font-black text-gray-900">Rs. {fmt(totalCosts)}</h3>
                  <p className="text-[10px] text-gray-400 mt-1">Purchase + Feed + Medicine + Other</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Supplier Payable</p>
                  <h3 className="text-2xl font-black text-red-600">Rs. {fmt(settlement.totalPayables)}</h3>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Batch: {fmt(settlement.batchPayable)} | Feed: {fmt(settlement.feed?.totalPayable)} | Med: {fmt(settlement.medicine?.totalPayable)}
                  </p>
                </div>

                <div className={`border rounded-xl p-5 shadow-sm ${isProfit ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isProfit ? "text-green-700" : "text-red-700"}`}>
                        {isProfit ? "Net Profit" : "Net Loss"}
                      </p>
                      <h3 className={`text-2xl font-black ${isProfit ? "text-green-800" : "text-red-800"}`}>
                        {!isProfit ? "-" : ""}Rs. {fmt(Math.abs(profit))}
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-1">Income − all costs</p>
                    </div>
                    {isProfit ? <TrendingUp size={24} className="text-green-600" /> : <TrendingDown size={24} className="text-red-600" />}
                  </div>
                </div>
              </div>

              {/* ── LEDGER: Income (left) vs Expenses (right) ── */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <FileText size={16} className="text-gray-600" />
                  <h2 className="font-bold text-gray-800">Batch Ledger</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-gray-100">
                  {/* INCOME side */}
                  <div className="flex flex-col">
                    <div className="px-4 py-2.5 bg-green-50/60 border-b border-gray-100 flex items-center gap-2">
                      <ShoppingBag size={14} className="text-green-600" />
                      <h3 className="font-black text-green-800 text-xs uppercase tracking-wider">Income</h3>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                      <table className="w-full text-sm">
                        <tbody>
                          {(!settlement.salesRows || settlement.salesRows.length === 0) ? (
                            <tr><td className="p-6 text-center text-gray-400 font-bold">No sales recorded.</td></tr>
                          ) : settlement.salesRows.map((s) => (
                            <tr key={s.id} className="border-b border-gray-50">
                              <td className="py-2.5 px-4">
                                <div className="font-bold text-gray-800">{catLabel(s.category)}</div>
                                <div className="text-[11px] text-gray-400">
                                  {s.date}{s.buyer_name ? ` · ${s.buyer_name}` : ''}
                                  {s.category === 'chicks' && parseInt(s.chicks_sold || 0, 10) > 0 ? ` · ${parseInt(s.chicks_sold, 10).toLocaleString()} birds` : ''}
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-right font-black text-green-700 whitespace-nowrap">Rs. {fmt(s.total_price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-auto px-4 py-3 bg-green-50/40 border-t-2 border-green-100 flex justify-between items-center">
                      <span className="font-black text-green-800 text-xs uppercase tracking-wider">Total Income</span>
                      <span className="font-black text-green-700 text-lg whitespace-nowrap">Rs. {fmt(totalIncome)}</span>
                    </div>
                  </div>

                  {/* EXPENSES side */}
                  <div className="flex flex-col border-t lg:border-t-0 border-gray-100">
                    <div className="px-4 py-2.5 bg-red-50/50 border-b border-gray-100 flex items-center gap-2">
                      <FileText size={14} className="text-red-500" />
                      <h3 className="font-black text-red-700 text-xs uppercase tracking-wider">Expenses</h3>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                      <table className="w-full text-sm">
                        <tbody>
                          {expenseLines.map(({ key, label, amount, Icon, color }) => (
                            <tr key={key} className="border-b border-gray-50">
                              <td className="py-2.5 px-4">
                                <div className="font-bold text-gray-800 flex items-center gap-2">
                                  <Icon size={14} className={color} /> {label}
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-right font-black text-gray-900 whitespace-nowrap">Rs. {fmt(amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-auto px-4 py-3 bg-red-50/30 border-t-2 border-red-100 flex justify-between items-center">
                      <span className="font-black text-red-700 text-xs uppercase tracking-wider">Total Expenses</span>
                      <span className="font-black text-gray-900 text-lg whitespace-nowrap">Rs. {fmt(totalCosts)}</span>
                    </div>
                  </div>
                </div>

                {/* Profit / Loss bar spanning both sides */}
                <div className={`px-5 py-4 flex justify-between items-center ${isProfit ? 'bg-green-600' : 'bg-red-600'}`}>
                  <span className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    {isProfit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    {isProfit ? 'Profit' : 'Loss'}
                  </span>
                  <span className="font-black text-white text-2xl whitespace-nowrap">{!isProfit ? '- ' : ''}Rs. {fmt(Math.abs(profit))}</span>
                </div>
              </div>

              {/* ── COSTS: Full Breakdown ── */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <FileText size={16} className="text-gray-600" />
                  <h2 className="font-bold text-gray-800">Supplier Account</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4 text-left">Category</th>
                        <th className="p-4 text-right">Total Cost</th>
                        <th className="p-4 text-right">Paid</th>
                        <th className="p-4 text-right">Payable (Supplier)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-gray-50 hover:bg-gray-50/50">
                        <td className="p-4 font-bold text-gray-900 flex items-center gap-2">
                          <Egg size={14} className="text-blue-600" /> Batch Purchase
                        </td>
                        <td className="p-4 text-right font-bold">Rs. {fmt(settlement.batchCost)}</td>
                        <td className="p-4 text-right font-bold text-green-700">Rs. {fmt(settlement.batchPaid)}</td>
                        <td className="p-4 text-right font-black text-red-600">Rs. {fmt(settlement.batchPayable)}</td>
                      </tr>
                      <tr className="border-t border-gray-50 hover:bg-gray-50/50">
                        <td className="p-4 font-bold text-gray-900 flex items-center gap-2">
                          <Wheat size={14} className="text-amber-600" /> Feed
                        </td>
                        <td className="p-4 text-right font-bold">Rs. {fmt(settlement.feed?.totalCost)}</td>
                        <td className="p-4 text-right font-bold text-green-700">Rs. {fmt(settlement.feed?.totalPaid)}</td>
                        <td className="p-4 text-right font-black text-red-600">Rs. {fmt(settlement.feed?.totalPayable)}</td>
                      </tr>
                      <tr className="border-t border-gray-50 hover:bg-gray-50/50">
                        <td className="p-4 font-bold text-gray-900 flex items-center gap-2">
                          <Pill size={14} className="text-purple-600" /> Medicine
                        </td>
                        <td className="p-4 text-right font-bold">Rs. {fmt(settlement.medicine?.totalCost)}</td>
                        <td className="p-4 text-right font-bold text-green-700">Rs. {fmt(settlement.medicine?.totalPaid)}</td>
                        <td className="p-4 text-right font-black text-red-600">Rs. {fmt(settlement.medicine?.totalPayable)}</td>
                      </tr>
                      {(settlement.expenses?.totalCost || 0) > 0 && (
                        <tr className="border-t border-gray-50 hover:bg-gray-50/50">
                          <td className="p-4 font-bold text-gray-900 flex items-center gap-2">
                            <FileText size={14} className="text-orange-600" /> Additional Expenses
                          </td>
                          <td className="p-4 text-right font-bold">Rs. {fmt(settlement.expenses?.totalCost)}</td>
                          <td className="p-4 text-right font-bold text-gray-400">—</td>
                          <td className="p-4 text-right font-bold text-gray-400">—</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                        <td className="p-4 font-black text-gray-700 text-xs uppercase tracking-wider">Total Costs</td>
                        <td className="p-4 text-right font-black text-gray-900">Rs. {fmt(totalCosts)}</td>
                        <td className="p-4 text-right font-black text-green-700">
                          Rs. {fmt((settlement.batchPaid || 0) + (settlement.feed?.totalPaid || 0) + (settlement.medicine?.totalPaid || 0))}
                        </td>
                        <td className="p-4 text-right font-black text-red-600">Rs. {fmt(settlement.totalPayables)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* ── Additional Expense Details ── */}
              {settlement.expenses?.rows?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-orange-50/50 flex items-center gap-2">
                    <FileText size={16} className="text-orange-600" />
                    <h2 className="font-bold text-gray-800">Additional Expense Details</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm whitespace-nowrap">
                      <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-4 text-left">Date</th>
                          <th className="p-4 text-left">Description</th>
                          <th className="p-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {settlement.expenses.rows.map((e) => (
                          <tr key={e.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                            <td className="p-4 font-bold text-gray-900">{e.date}</td>
                            <td className="p-4 font-bold text-gray-700">{e.description}</td>
                            <td className="p-4 text-right font-black text-gray-900">Rs. {fmt(e.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                          <td colSpan={2} className="p-4 font-black text-gray-700 text-xs uppercase tracking-wider">Total</td>
                          <td className="p-4 text-right font-black text-gray-900">Rs. {fmt(settlement.expenses?.totalCost)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Batch Info ── */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-bold text-gray-800 text-sm mb-3">Batch Info</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Start Date</p>
                    <p className="font-bold">{settlement.batch?.date}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Initial Birds</p>
                    <p className="font-bold">{settlement.batch?.quantity?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Live Birds</p>
                    <p className="font-bold">{parseInt(settlement.batch?.live_birds || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Deaths</p>
                    <p className="font-bold text-red-600">{parseInt(settlement.batch?.total_deaths || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Supplier</p>
                    <p className="font-bold">{settlement.batch?.supplier || '—'}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-gray-500 font-bold">No settlement data.</div>
          )}
        </div>
      )}

      {confirmComplete && settlement && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !completing && setConfirmComplete(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-5 border-b border-green-200 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-gray-900">Complete Batch</h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Final settle-up</p>
              </div>
              <button onClick={() => !completing && setConfirmComplete(false)} className="p-1.5 rounded-full text-gray-400 hover:bg-white transition-all shadow-sm">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm font-bold text-gray-700">Are the feed &amp; medicine payables paid?</p>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">Total sales</span>
                  <span className="font-bold text-gray-800">Rs. {fmt(settlement.totalSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">Total payables (batch + feed + medicine)</span>
                  <span className="font-bold text-red-600">− Rs. {fmt(settlement.totalPayables)}</span>
                </div>
                <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between items-center">
                  <span className="text-xs font-black text-green-900 uppercase tracking-wider">Final amount received</span>
                  <span className="text-xl font-black text-green-700">Rs. {fmt(settlement.netReceived)}</span>
                </div>
              </div>
              <p className="text-[11px] font-semibold text-gray-400">Confirming locks the batch as completed and records the final amount received.</p>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/60">
              <button onClick={() => setConfirmComplete(false)} disabled={completing} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                Cancel
              </button>
              <button onClick={handleComplete} disabled={completing} className="px-5 py-2 rounded-xl bg-green-600 text-white text-sm font-black shadow-md hover:bg-green-700 disabled:opacity-60 flex items-center gap-2">
                {completing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Yes, complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
