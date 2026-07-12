import { useState, useEffect } from "react";
import {
  PieChart,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Check,
} from "lucide-react";
import {
  getPoultryBatches,
  getPoultryProfit,
  distributePoultryProfit,
} from "../../services/api";
import { useToast } from "../../components/ToastProvider";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PoultryProfit() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");

  const currentPeriod = new Date().toISOString().substring(0, 7);
  const [period, setPeriod] = useState(currentPeriod);

  const [profitData, setProfitData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getPoultryBatches("active")
      .then((res) => {
        setBatches(res);
        if (res.length > 0) {
          setSelectedBatchId(res[0].id);
        } else {
          setIsLoading(false);
        }
      })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (selectedBatchId && period) {
      getPoultryProfit(selectedBatchId, period)
        .then(setProfitData)
        .catch(() => setProfitData(null))
        .finally(() => setIsLoading(false));
    }
  }, [selectedBatchId, period]);

  const handleFinalize = async () => {
    if (!profitData || !profitData.investorShares) return;
    if (!window.confirm(`Finalize profit distribution for ${period}?`)) return;

    setIsFinalizing(true);
    try {
      const payload = {
        batchId: parseInt(selectedBatchId),
        period: period,
        distributions: profitData.investorShares.map((inv) => ({
          investorId: inv.investorId,
          shareAmount: inv.shareAmount,
        })),
      };

      await distributePoultryProfit(payload);
      toast.success("Profit distribution successfully finalized!");
    } catch {
      toast.error("Failed to finalize distribution.");
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Nunito']">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-green-600/20">
            <PieChart size={20} className="text-white" />
          </div>
          Profit Distribution
        </h1>
      </div>

      {batches.length === 0 && !isLoading ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-sm text-gray-500">Create a bird batch first.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Batch:
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => {
                  if (selectedBatchId !== e.target.value) {
                    setIsLoading(true);
                    setSelectedBatchId(e.target.value);
                  }
                }}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm font-bold rounded-lg px-3 py-2 outline-none cursor-pointer focus:border-green-500"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    Batch {b.notes || `#${b.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Period:
              </label>
              <input
                type="month"
                value={period}
                onChange={(e) => {
                  if (period !== e.target.value) {
                    setIsLoading(true);
                    setPeriod(e.target.value);
                  }
                }}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm font-bold rounded-lg px-3 py-2 outline-none focus:border-green-500"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <Loader2
                className="animate-spin mx-auto text-green-600 mb-4"
                size={32}
              />
            </div>
          ) : profitData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Total Income
                  </p>
                  <h3 className="text-2xl font-black text-gray-900">
                    Rs. {fmt(profitData.totalIncome)}
                  </h3>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Total Expenses
                  </p>
                  <h3 className="text-2xl font-black text-red-600">
                    Rs. {fmt(profitData.totalExpenses)}
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Batch: {fmt(profitData.batchCost)} | Feed:{" "}
                    {fmt(profitData.totalFeedCost)}
                  </p>
                </div>
                <div
                  className={`border rounded-xl p-5 shadow-sm ${profitData.netProfit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p
                        className={`text-xs font-bold uppercase tracking-wider mb-1 ${profitData.netProfit >= 0 ? "text-green-700" : "text-red-700"}`}
                      >
                        Net {profitData.netProfit >= 0 ? "Profit" : "Loss"}
                      </p>
                      <h3
                        className={`text-2xl font-black ${profitData.netProfit >= 0 ? "text-green-800" : "text-red-800"}`}
                      >
                        {profitData.netProfit < 0 ? "-" : ""}Rs.{" "}
                        {fmt(Math.abs(profitData.netProfit))}
                      </h3>
                    </div>
                    {profitData.netProfit >= 0 ? (
                      <TrendingUp size={24} className="text-green-600" />
                    ) : (
                      <TrendingDown size={24} className="text-red-600" />
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                  <Wallet size={16} className="text-blue-600" />
                  <h2 className="font-bold text-gray-800">
                    Investor Share Distribution
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4 text-left">Investor Name</th>
                        <th className="p-4 text-center">Stake</th>
                        <th className="p-4 text-right">Calculated Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profitData.investorShares?.map((inv) => {
                        const isLoss = inv.shareAmount < 0;
                        return (
                          <tr
                            key={inv.investorId}
                            className="border-t border-gray-50 hover:bg-gray-50/50"
                          >
                            <td className="p-4 font-bold text-gray-900">
                              {inv.name}
                            </td>
                            <td className="p-4 text-center font-bold text-blue-600 bg-blue-50/30">
                              {inv.ownershipPercent}%
                            </td>
                            <td
                              className={`p-4 text-right font-black ${isLoss ? "text-red-600" : "text-green-700"}`}
                            >
                              {isLoss ? "-" : "+"} Rs.{" "}
                              {fmt(Math.abs(inv.shareAmount))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={handleFinalize}
                    disabled={
                      isFinalizing || profitData.investorShares?.length === 0
                    }
                    className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:-translate-y-0.5 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
                  >
                    {isFinalizing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Finalize {period} Distribution
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-gray-500 font-bold">
              No profit data available for this period.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
