import { useState, useEffect } from "react";
import { Receipt, Loader2, TrendingUp, TrendingDown, Wheat, Pill, FileText, Egg, ShoppingBag } from "lucide-react";
import { getPoultryBatches, getPoultrySettlement } from "../../services/api";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const catLabel = (c) => ({ chicks: "Chicks", meat: "Meat", eggs: "Eggs", manure: "Manure" }[c] || c);

export default function PoultrySettlement() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [settlement, setSettlement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getPoultryBatches()
      .then((res) => {
        setBatches(res);
        if (res.length > 0) setSelectedBatchId(res[0].id);
        else setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

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
  const totalCosts = (settlement?.feed?.totalCost || 0) + (settlement?.medicine?.totalCost || 0) + (settlement?.expenses?.totalCost || 0) + (settlement?.batchCost || 0);

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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Batch:</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm font-bold rounded-lg px-3 py-2 outline-none cursor-pointer focus:border-green-500"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.notes || `Batch #${b.id}`} — {b.status === "active" ? "Active" : "Closed"}
                </option>
              ))}
            </select>
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
                    Feed: {fmt(settlement.feed?.totalPayable)} | Med: {fmt(settlement.medicine?.totalPayable)}
                  </p>
                </div>

                <div className={`border rounded-xl p-5 shadow-sm ${net >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${net >= 0 ? "text-green-700" : "text-red-700"}`}>
                        Supplier Net {net >= 0 ? "Receivable" : "Deficit"}
                      </p>
                      <h3 className={`text-2xl font-black ${net >= 0 ? "text-green-800" : "text-red-800"}`}>
                        {net < 0 ? "-" : ""}Rs. {fmt(Math.abs(net))}
                      </h3>
                    </div>
                    {net >= 0 ? <TrendingUp size={24} className="text-green-600" /> : <TrendingDown size={24} className="text-red-600" />}
                  </div>
                </div>
              </div>

              {/* ── INCOME: Sales Breakdown ── */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-green-50/50 flex items-center gap-2">
                  <ShoppingBag size={16} className="text-green-600" />
                  <h2 className="font-bold text-gray-800">Sales Breakdown</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4 text-left">Date</th>
                        <th className="p-4 text-left">Category</th>
                        <th className="p-4 text-left">Buyer</th>
                        <th className="p-4 text-right">Birds / Qty</th>
                        <th className="p-4 text-right">Weight (kg)</th>
                        <th className="p-4 text-right">Rate</th>
                        <th className="p-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!settlement.salesRows || settlement.salesRows.length === 0) ? (
                        <tr><td colSpan={7} className="p-8 text-center text-gray-400 font-bold">No sales recorded.</td></tr>
                      ) : settlement.salesRows.map((s) => (
                        <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                          <td className="p-4 font-bold text-gray-900">{s.date}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              s.category === 'chicks' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              s.category === 'meat' ? 'bg-red-50 text-red-700 border border-red-200' :
                              s.category === 'eggs' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}>
                              {catLabel(s.category)}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-gray-700">{s.buyer_name || '—'}</td>
                          <td className="p-4 text-right font-bold text-gray-800">
                            {s.category === 'chicks' ? (parseInt(s.chicks_sold || 0).toLocaleString() + ' birds') : (parseFloat(s.quantity || 0).toLocaleString())}
                          </td>
                          <td className="p-4 text-right font-bold text-gray-600">
                            {parseFloat(s.weight_kilos || 0) > 0 ? parseFloat(s.weight_kilos).toLocaleString() : '—'}
                          </td>
                          <td className="p-4 text-right font-bold text-gray-600">
                            {s.category === 'chicks'
                              ? (parseFloat(s.rate || 0) > 0 ? `Rs. ${fmt(s.rate)}/bird` : '—')
                              : (parseFloat(s.price_per_kg || 0) > 0 ? `Rs. ${fmt(s.price_per_kg)}/kg` : '—')}
                          </td>
                          <td className="p-4 text-right font-black text-green-700">Rs. {fmt(s.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                    {settlement.salesRows?.length > 0 && (
                      <tfoot>
                        <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                          <td colSpan={6} className="p-4 font-black text-gray-700 text-xs uppercase tracking-wider">Total Revenue</td>
                          <td className="p-4 text-right font-black text-green-700">Rs. {fmt(settlement.totalSales)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* ── COSTS: Full Breakdown ── */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <FileText size={16} className="text-gray-600" />
                  <h2 className="font-bold text-gray-800">Cost Breakdown</h2>
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
                        <td className="p-4 text-right font-bold text-gray-400">—</td>
                        <td className="p-4 text-right font-bold text-gray-400">—</td>
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
                          Rs. {fmt((settlement.feed?.totalPaid || 0) + (settlement.medicine?.totalPaid || 0))}
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
    </div>
  );
}
