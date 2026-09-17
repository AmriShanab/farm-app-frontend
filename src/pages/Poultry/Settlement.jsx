import { useState, useEffect } from "react";
import {
  Receipt,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wheat,
  Pill,
  FileText,
  Egg,
  ShoppingBag,
  CheckCircle2,
  X,
  Users,
} from "lucide-react";
import {
  getPoultryBatches,
  getPoultrySettlement,
  completePoultryBatch,
} from "../../services/api";
import { useToast } from "../../components/ToastProvider";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const catLabel = (c) =>
  ({ chicks: "Chicks", meat: "Meat", eggs: "Eggs", manure: "Manure" })[c] || c;

const STATUS = {
  active: { label: "Active", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  pending: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  completed: {
    label: "Completed",
    cls: "bg-green-50 text-green-700 border-green-200",
  },
  closed: { label: "Closed", cls: "bg-gray-100 text-gray-600 border-gray-200" },
};

export default function PoultrySettlement() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [settlement, setSettlement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [printActiveSection, setPrintActiveSection] = useState(null);
  const [previewSection, setPreviewSection] = useState(null);
  const toast = useToast();

  const triggerSectionPrint = (section) => {
    setPrintActiveSection(section);
    setTimeout(() => {
      window.print();
      setPrintActiveSection(null);
    }, 150);
  };

  const reloadBatches = () =>
    getPoultryBatches("").then((res) => {
      setBatches(res);
      return res;
    });

  useEffect(() => {
    reloadBatches()
      .then((res) => {
        if (res.length > 0) setSelectedBatchId(res[0].id);
        else setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await completePoultryBatch(selectedBatchId);
      const [s] = await Promise.all([
        getPoultrySettlement(selectedBatchId),
        reloadBatches(),
      ]);
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
      Promise.resolve().then(() => setIsLoading(true));
      getPoultrySettlement(selectedBatchId)
        .then(setSettlement)
        .catch(() => setSettlement(null))
        .finally(() => setIsLoading(false));
    }
  }, [selectedBatchId]);

  const totalCosts =
    settlement?.totalCosts ??
    (settlement?.feed?.totalCost || 0) +
      (settlement?.medicine?.totalCost || 0) +
      (settlement?.expenses?.totalCost || 0) +
      (settlement?.supplierExpenses?.totalCost || 0) +
      (settlement?.batchCost || 0) +
      (settlement?.labour || 0);
  const totalIncome = settlement?.totalSales ?? 0;
  const profit = settlement?.profit ?? totalIncome - totalCosts;
  const isProfit = profit >= 0;

  const finalReceivedVal = settlement
    ? settlement.status === "completed"
      ? (settlement.finalReceived ?? settlement.netReceived)
      : settlement.netReceived
    : 0;
  const isFinalReceivedPositive = finalReceivedVal >= 0;

  // Expense lines for the ledger (right side). Additional expenses & labour only shown if any.
  const expenseLines = settlement
    ? [
        {
          key: "batch",
          label: "Batch Purchase",
          amount: settlement.batchCost || 0,
          Icon: Egg,
          color: "text-blue-600",
        },
        {
          key: "feed",
          label: "Feed",
          amount: settlement.feed?.totalCost || 0,
          Icon: Wheat,
          color: "text-amber-600",
        },
        {
          key: "medicine",
          label: "Medicine",
          amount: settlement.medicine?.totalCost || 0,
          Icon: Pill,
          color: "text-purple-600",
        },
        ...((settlement.expenses?.totalCost || 0) > 0
          ? [
              {
                key: "other",
                label: "Additional Expenses",
                amount: settlement.expenses.totalCost,
                Icon: FileText,
                color: "text-orange-600",
              },
            ]
          : []),
        ...((settlement.supplierExpenses?.totalCost || 0) > 0
          ? [
              {
                key: "supplier_expenses",
                label: "Supplier Paid Expenses",
                amount: settlement.supplierExpenses.totalCost,
                Icon: FileText,
                color: "text-amber-600",
              },
            ]
          : []),
        ...((settlement.labour || 0) > 0
          ? [
              {
                key: "labour",
                label: "Poultry Labour",
                amount: settlement.labour,
                Icon: Users,
                color: "text-teal-600",
              },
            ]
          : []),
      ]
    : [];

  const salesGrouped = settlement?.salesRows
    ? settlement.salesRows.reduce((acc, s) => {
        const cat = s.category;
        if (!acc[cat]) {
          acc[cat] = { category: cat, records: 0, amount: 0, chicks_sold: 0 };
        }
        acc[cat].records += 1;
        acc[cat].amount += Number(s.total_price || 0);
        if (cat === "chicks") {
          acc[cat].chicks_sold += parseInt(s.chicks_sold || 0, 10);
        }
        return acc;
      }, {})
    : {};
  const salesGroupedArray = Object.values(salesGrouped);

  return (
    <div
      className={`p-6 max-w-7xl mx-auto font-['Nunito'] ${printActiveSection ? "print-focus-active" : ""}`}
    >
      <div className="hide-on-print-focus">
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
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Batch:
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm font-bold rounded-lg px-3 py-2 outline-none cursor-pointer focus:border-green-500"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.notes || `Batch #${b.id}`} —{" "}
                    {(STATUS[b.status] || STATUS.active).label}
                  </option>
                ))}
              </select>
              {settlement && (
                <>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${(STATUS[settlement.status] || STATUS.active).cls}`}
                  >
                    {(STATUS[settlement.status] || STATUS.active).label}
                  </span>
                  <div className="ml-auto">
                    {settlement.status === "completed" ? (
                      <span className="text-sm font-black text-green-700 flex items-center gap-1.5">
                        <CheckCircle2 size={16} /> Final received: Rs.{" "}
                        {fmt(settlement.finalReceived)}
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
                <Loader2
                  className="animate-spin mx-auto text-green-600 mb-4"
                  size={32}
                />
              </div>
            ) : settlement ? (
              <>
                {/* Summary cards code */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* ONE SIDE: Batch Profitability (Total Sales + Batch Cost + Net Profit/loss) */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                    <div className="pb-2 border-b border-gray-100 flex justify-between items-center">
                      <div>
                        <h4 className="font-extrabold text-gray-800 text-sm uppercase tracking-wider">
                          Batch Profitability
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          Overall performance (Accrual basis)
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div
                        onClick={() => setPreviewSection("sales")}
                        className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between cursor-pointer hover:border-emerald-300 hover:shadow transition-all duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                              Total Sales
                            </p>
                            <h3 className="text-base font-black text-gray-900 leading-tight">
                              Rs. {fmt(settlement.totalSales)}
                            </h3>
                          </div>
                          <ShoppingBag
                            size={16}
                            className="text-green-500 opacity-80"
                          />
                        </div>
                        {settlement.totalChicksSold > 0 && (
                          <p className="text-[9px] text-gray-500 mt-2 font-medium">
                            {settlement.totalChicksSold} birds sold
                          </p>
                        )}
                      </div>

                      <div
                        onClick={() => setPreviewSection("costs")}
                        className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between cursor-pointer hover:border-emerald-300 hover:shadow transition-all duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                              Batch Costs
                            </p>
                            <h3 className="text-base font-black text-gray-900 leading-tight">
                              Rs. {fmt(totalCosts)}
                            </h3>
                          </div>
                          <Egg
                            size={16}
                            className="text-amber-500 opacity-80"
                          />
                        </div>
                        <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-wide">
                          All costs in
                        </p>
                      </div>

                      <div
                        onClick={() => setPreviewSection("profit")}
                        className={`border rounded-xl p-4 shadow-sm flex flex-col justify-between cursor-pointer hover:border-emerald-300 hover:shadow transition-all duration-200 ${isProfit ? "bg-green-50/50 border-green-200" : "bg-red-50/50 border-red-200"}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p
                              className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isProfit ? "text-green-700" : "text-red-700"}`}
                            >
                              {isProfit ? "Net Profit" : "Net Loss"}
                            </p>
                            <h3
                              className={`text-base font-black leading-tight ${isProfit ? "text-green-800" : "text-red-800"}`}
                            >
                              {!isProfit ? "-" : ""}Rs. {fmt(Math.abs(profit))}
                            </h3>
                          </div>
                          {isProfit ? (
                            <TrendingUp size={16} className="text-green-600" />
                          ) : (
                            <TrendingDown size={16} className="text-red-600" />
                          )}
                        </div>
                        <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-wide">
                          Profit / Loss
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ANOTHER SIDE: Cash Settle-up (Total Sales + Batch Cost + final received value) */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                    <div className="pb-2 border-b border-gray-100 flex justify-between items-center">
                      <div>
                        <h4 className="font-extrabold text-gray-800 text-sm uppercase tracking-wider">
                          Supplier Settlement
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          Cash settlement balance
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div
                        onClick={() => setPreviewSection("sales")}
                        className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between cursor-pointer hover:border-emerald-300 hover:shadow transition-all duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                              Total Sales
                            </p>
                            <h3 className="text-base font-black text-gray-900 leading-tight">
                              Rs. {fmt(settlement.totalSales)}
                            </h3>
                          </div>
                          <ShoppingBag
                            size={16}
                            className="text-green-500 opacity-80"
                          />
                        </div>
                        {settlement.totalChicksSold > 0 && (
                          <p className="text-[9px] text-gray-500 mt-2 font-medium">
                            {settlement.totalChicksSold} birds sold
                          </p>
                        )}
                      </div>

                      <div
                        onClick={() => setPreviewSection("payables")}
                        className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between cursor-pointer hover:border-emerald-300 hover:shadow transition-all duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">
                              Payables
                            </p>
                            <h3 className="text-base font-black text-red-650 leading-tight text-red-600">
                              Rs. {fmt(settlement.totalPayables)}
                            </h3>
                          </div>
                          <Wheat
                            size={16}
                            className="text-red-500 opacity-80"
                          />
                        </div>
                        {(settlement.totalReceivables || 0) > 0 ? (
                          <p className="text-[9px] text-green-600 mt-2 font-bold uppercase">
                            Ref. Rs. {fmt(settlement.totalReceivables)}
                          </p>
                        ) : (
                          <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase">
                            Supplier bills
                          </p>
                        )}
                      </div>

                      <div
                        onClick={() => setPreviewSection("received")}
                        className={`border rounded-xl p-4 shadow-sm flex flex-col justify-between cursor-pointer hover:border-emerald-300 hover:shadow transition-all duration-200 ${isFinalReceivedPositive ? "bg-green-50/50 border-green-200" : "bg-red-50/50 border-red-200"}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p
                              className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isFinalReceivedPositive ? "text-green-700" : "text-red-700"}`}
                            >
                              Final Received
                            </p>
                            <h3
                              className={`text-base font-black leading-tight ${isFinalReceivedPositive ? "text-green-800" : "text-red-800"}`}
                            >
                              {!isFinalReceivedPositive ? "-" : ""}Rs.{" "}
                              {fmt(Math.abs(finalReceivedVal))}
                            </h3>
                          </div>
                          {isFinalReceivedPositive ? (
                            <TrendingUp size={16} className="text-green-600" />
                          ) : (
                            <TrendingDown size={16} className="text-red-600" />
                          )}
                        </div>
                        <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-wide">
                          Cash Settle-up
                        </p>
                      </div>
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
                        <h3 className="font-black text-green-800 text-xs uppercase tracking-wider">
                          Income
                        </h3>
                      </div>
                      <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-sm">
                          <tbody>
                            {salesGroupedArray.length === 0 ? (
                              <tr>
                                <td className="p-6 text-center text-gray-400 font-bold">
                                  No sales recorded.
                                </td>
                              </tr>
                            ) : (
                              salesGroupedArray.map((g) => (
                                <tr
                                  key={g.category}
                                  className="border-b border-gray-50"
                                >
                                  <td className="py-2.5 px-4">
                                    <div className="font-bold text-gray-800">
                                      {catLabel(g.category)}
                                    </div>
                                    <div className="text-[11px] text-gray-400">
                                      {g.records}{" "}
                                      {g.records === 1 ? "sale" : "sales"}
                                      {g.category === "chicks" &&
                                      g.chicks_sold > 0
                                        ? ` · ${g.chicks_sold.toLocaleString()} birds`
                                        : ""}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-black text-green-700 whitespace-nowrap">
                                    Rs. {fmt(g.amount)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-auto px-4 py-3 bg-green-50/40 border-t-2 border-green-100 flex justify-between items-center">
                        <span className="font-black text-green-800 text-xs uppercase tracking-wider">
                          Total Income
                        </span>
                        <span className="font-black text-green-700 text-lg whitespace-nowrap">
                          Rs. {fmt(totalIncome)}
                        </span>
                      </div>
                    </div>

                    {/* EXPENSES side */}
                    <div className="flex flex-col border-t lg:border-t-0 border-gray-100">
                      <div className="px-4 py-2.5 bg-red-50/50 border-b border-gray-100 flex items-center gap-2">
                        <FileText size={14} className="text-red-500" />
                        <h3 className="font-black text-red-700 text-xs uppercase tracking-wider">
                          Expenses
                        </h3>
                      </div>
                      <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-sm">
                          <tbody>
                            {expenseLines.map(
                              ({ key, label, amount, Icon, color }) => (
                                <tr
                                  key={key}
                                  className="border-b border-gray-50"
                                >
                                  <td className="py-2.5 px-4">
                                    <div className="font-bold text-gray-800 flex items-center gap-2">
                                      <Icon size={14} className={color} />{" "}
                                      {label}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-black text-gray-900 whitespace-nowrap">
                                    Rs. {fmt(amount)}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-auto px-4 py-3 bg-red-50/30 border-t-2 border-red-100 flex justify-between items-center">
                        <span className="font-black text-red-700 text-xs uppercase tracking-wider">
                          Total Expenses
                        </span>
                        <span className="font-black text-gray-900 text-lg whitespace-nowrap">
                          Rs. {fmt(totalCosts)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profit / Loss bar spanning both sides */}
                  <div
                    className={`px-5 py-4 flex justify-between items-center ${isProfit ? "bg-green-600" : "bg-red-600"}`}
                  >
                    <span className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
                      {isProfit ? (
                        <TrendingUp size={18} />
                      ) : (
                        <TrendingDown size={18} />
                      )}
                      {isProfit ? "Profit" : "Loss"}
                    </span>
                    <span className="font-black text-white text-2xl whitespace-nowrap">
                      {!isProfit ? "- " : ""}Rs. {fmt(Math.abs(profit))}
                    </span>
                  </div>
                </div>

                {/* ── COSTS: Full Breakdown ── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                    <FileText size={16} className="text-gray-600" />
                    <h2 className="font-bold text-gray-800">
                      Supplier Account
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-4 text-left">Category</th>
                          <th className="p-4 text-right">Total Cost</th>
                          <th className="p-4 text-right">Paid</th>
                          <th className="p-4 text-right">Returned</th>
                          <th className="p-4 text-right">Payable (Supplier)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-gray-50 hover:bg-gray-50/50">
                          <td className="p-4 font-bold text-gray-900 flex items-center gap-2">
                            <Egg size={14} className="text-blue-600" /> Batch
                            Purchase
                          </td>
                          <td className="p-4 text-right font-bold">
                            Rs. {fmt(settlement.batchCost)}
                          </td>
                          <td className="p-4 text-right font-bold text-green-700">
                            Rs. {fmt(settlement.batchPaid)}
                          </td>
                          <td className="p-4 text-right font-bold text-gray-400">
                            —
                          </td>
                          <td className="p-4 text-right font-black text-red-600">
                            Rs. {fmt(settlement.batchPayable)}
                          </td>
                        </tr>
                        <tr className="border-t border-gray-50 hover:bg-gray-50/50">
                          <td className="p-4 font-bold text-gray-900 flex items-center gap-2">
                            <Wheat size={14} className="text-amber-600" /> Feed
                          </td>
                          <td className="p-4 text-right font-bold">
                            Rs. {fmt(settlement.feed?.totalCost)}
                          </td>
                          <td className="p-4 text-right font-bold text-green-700">
                            Rs. {fmt(settlement.feed?.totalPaid)}
                          </td>
                          <td className="p-4 text-right font-bold text-amber-700">
                            {(settlement.feed?.returned || 0) > 0
                              ? `Rs. ${fmt(settlement.feed?.returned)}`
                              : "—"}
                          </td>
                          <td className="p-4 text-right font-black text-red-600">
                            Rs. {fmt(settlement.feed?.totalPayable)}
                          </td>
                        </tr>
                        <tr className="border-t border-gray-50 hover:bg-gray-50/50">
                          <td className="p-4 font-bold text-gray-900 flex items-center gap-2">
                            <Pill size={14} className="text-purple-600" />{" "}
                            Medicine
                          </td>
                          <td className="p-4 text-right font-bold">
                            Rs. {fmt(settlement.medicine?.totalCost)}
                          </td>
                          <td className="p-4 text-right font-bold text-green-700">
                            Rs. {fmt(settlement.medicine?.totalPaid)}
                          </td>
                          <td className="p-4 text-right font-bold text-amber-700">
                            {(settlement.medicine?.returned || 0) > 0
                              ? `Rs. ${fmt(settlement.medicine?.returned)}`
                              : "—"}
                          </td>
                          <td className="p-4 text-right font-black text-red-600">
                            Rs. {fmt(settlement.medicine?.totalPayable)}
                          </td>
                        </tr>
                        {(settlement.supplierExpenses?.totalCost || 0) > 0 && (
                          <tr className="border-t border-gray-50 hover:bg-gray-50/50">
                            <td className="p-4 font-bold text-gray-900 flex items-center gap-2">
                              <FileText size={14} className="text-amber-600" />{" "}
                              Supplier Paid Expenses
                            </td>
                            <td className="p-4 text-right font-bold">
                              Rs. {fmt(settlement.supplierExpenses?.totalCost)}
                            </td>
                            <td className="p-4 text-right font-bold text-green-700">
                              Rs. {fmt(settlement.supplierExpenses?.totalPaid)}
                            </td>
                            <td className="p-4 text-right font-bold text-gray-400">
                              —
                            </td>
                            <td className="p-4 text-right font-black text-red-600">
                              Rs.{" "}
                              {fmt(settlement.supplierExpenses?.totalPayable)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                          <td className="p-4 font-black text-gray-700 text-xs uppercase tracking-wider">
                            Total Costs
                          </td>
                          <td className="p-4 text-right font-black text-gray-900">
                            Rs. {fmt(totalCosts - (settlement.labour || 0))}
                          </td>
                          <td className="p-4 text-right font-black text-green-700">
                            Rs.{" "}
                            {fmt(
                              (settlement.batchPaid || 0) +
                                (settlement.feed?.totalPaid || 0) +
                                (settlement.medicine?.totalPaid || 0) +
                                (settlement.supplierExpenses?.totalPaid || 0),
                            )}
                          </td>
                          <td className="p-4 text-right font-black text-amber-700">
                            Rs.{" "}
                            {fmt(
                              (settlement.feed?.returned || 0) +
                                (settlement.medicine?.returned || 0),
                            )}
                          </td>
                          <td className="p-4 text-right font-black text-red-600">
                            Rs. {fmt(settlement.totalPayables)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>


                {/* ── Batch Info ── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h3 className="font-bold text-gray-800 text-sm mb-3">
                    Batch Info
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        Start Date
                      </p>
                      <p className="font-bold">{settlement.batch?.date}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        Initial Birds
                      </p>
                      <p className="font-bold">
                        {settlement.batch?.quantity?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        Live Birds
                      </p>
                      <p className="font-bold">
                        {parseInt(
                          settlement.batch?.live_birds || 0,
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        Deaths
                      </p>
                      <p className="font-bold text-red-600">
                        {parseInt(
                          settlement.batch?.total_deaths || 0,
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        Birds Sold
                      </p>
                      <p className="font-bold text-blue-600">
                        {parseInt(
                          settlement.totalChicksSold || 0,
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        Supplier
                      </p>
                      <p className="font-bold">
                        {settlement.batch?.supplier || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-gray-500 font-bold">
                No settlement data.
              </div>
            )}
          </div>
        )}

        {confirmComplete && settlement && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !completing && setConfirmComplete(false)}
            />
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-5 border-b border-green-200 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    Complete Batch
                  </h3>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Final settle-up
                  </p>
                </div>
                <button
                  onClick={() => !completing && setConfirmComplete(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:bg-white transition-all shadow-sm"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm font-bold text-gray-700">
                  Are the feed &amp; medicine payables paid?
                </p>
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500">Total sales</span>
                    <span className="font-bold text-gray-800">
                      Rs. {fmt(settlement.totalSales)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500">
                      Total payables (batch + feed + medicine)
                    </span>
                    <span className="font-bold text-red-600">
                      − Rs. {fmt(settlement.totalPayables)}
                    </span>
                  </div>
                  {(settlement.totalReceivables || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-500">
                        Refund due from returns
                      </span>
                      <span className="font-bold text-green-600">
                        + Rs. {fmt(settlement.totalReceivables)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between items-center">
                    <span className="text-xs font-black text-green-900 uppercase tracking-wider">
                      Final amount received
                    </span>
                    <span className="text-xl font-black text-green-700">
                      Rs. {fmt(settlement.netReceived)}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-gray-400">
                  Confirming locks the batch as completed and records the final
                  amount received.
                </p>
              </div>
              <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/60">
                <button
                  onClick={() => setConfirmComplete(false)}
                  disabled={completing}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className="px-5 py-2 rounded-xl bg-green-600 text-white text-sm font-black shadow-md hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {completing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}{" "}
                  Yes, complete
                </button>
              </div>
            </div>
          </div>
        )}

        {previewSection && settlement && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 hide-on-print-focus">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setPreviewSection(null)}
            />
            <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-150 animate-scaleUp">
              {/* Header banner */}
              <div className="bg-gradient-to-br from-green-50 to-green-150/40 p-5 border-b border-green-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <FileText size={18} className="text-green-700" />
                    {previewSection === "sales" && "Detailed Sales Report"}
                    {previewSection === "costs" &&
                      "Detailed Batch Costs Report"}
                    {previewSection === "profit" &&
                      "Detailed Profitability Report"}
                    {previewSection === "payables" &&
                      "Supplier Ledger Account (Payables)"}
                    {previewSection === "received" &&
                      "Final Received Settlement Stats"}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    Batch:{" "}
                    {settlement.batch?.notes || `Batch #${selectedBatchId}`}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => triggerSectionPrint(previewSection)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white rounded-xl text-sm font-black shadow-md hover:shadow-lg transition-all"
                  >
                    Export PDF
                  </button>
                  <button
                    onClick={() => setPreviewSection(null)}
                    className="p-2 rounded-full text-gray-400 hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 bg-white shadow-sm"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Modal Body Preview Content */}
              <div className="p-6 overflow-auto flex-1 space-y-6">
                {/* Sales Preview */}
                {previewSection === "sales" && (
                  <div className="space-y-4">
                    <table className="w-full text-sm border border-gray-200">
                      <thead className="bg-gray-100 text-gray-700 font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="p-3 text-left">Date</th>
                          <th className="p-3 text-left">Category</th>
                          <th className="p-3 text-right">Quantity</th>
                          <th className="p-3 text-right">Price (Rs.)</th>
                          <th className="p-3 text-right">Total Price (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        {settlement.salesRows?.map((s) => (
                          <tr
                            key={s.id}
                            className="hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="p-3 font-semibold text-gray-700">
                              {s.date}
                            </td>
                            <td className="p-3 font-bold text-gray-905">
                              {catLabel(s.category)}
                            </td>
                            <td className="p-3 text-right text-gray-800">
                              {s.category === "chicks"
                                ? `${s.chicks_sold?.toLocaleString() || 0} birds` +
                                  (s.weight_kilos
                                    ? ` / ${s.weight_kilos} kg`
                                    : "")
                                : s.quantity?.toLocaleString()}
                            </td>
                            <td className="p-3 text-right text-gray-800 font-bold">
                              {s.category === "chicks"
                                ? s.price_per_kg
                                  ? `Rs. ${fmt(s.price_per_kg)} / kg`
                                  : "—"
                                : `Rs. ${fmt(s.rate)}`}
                            </td>
                            <td className="p-3 text-right font-black text-green-700">
                              Rs. {fmt(s.total_price || s.total_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 font-black border-t border-gray-205">
                          <td
                            colSpan={2}
                            className="p-3 uppercase tracking-wider text-xs"
                          >
                            Total Sales
                          </td>
                          <td className="p-3 text-right">—</td>
                          <td className="p-3 text-right">—</td>
                          <td className="p-3 text-right text-base text-green-800">
                            Rs. {fmt(settlement.totalSales)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Costs Preview */}
                {previewSection === "costs" && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                        Cost Summaries
                      </h4>
                      <table className="w-full text-sm border border-gray-200">
                        <thead className="bg-gray-100 text-gray-700 font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
                          <tr>
                            <th className="p-3 text-left">Cost Category</th>
                            <th className="p-3 text-right">Total Cost (Rs.)</th>
                            <th className="p-3 text-right">Paid (Rs.)</th>
                            <th className="p-3 text-right">Returned (Rs.)</th>
                            <th className="p-3 text-right">Payable (Rs.)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150">
                          <tr className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-3 font-semibold text-gray-800">
                              Batch Purchase
                            </td>
                            <td className="p-3 text-right text-gray-900">
                              {fmt(settlement.batchCost)}
                            </td>
                            <td className="p-3 text-right text-green-700">
                              {fmt(settlement.batchPaid)}
                            </td>
                            <td className="p-3 text-right text-gray-400">—</td>
                            <td className="p-3 text-right font-black text-red-600">
                              {fmt(settlement.batchPayable)}
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-3 font-semibold text-gray-800">
                              Feed Purchases
                            </td>
                            <td className="p-3 text-right text-gray-900">
                              {fmt(settlement.feed?.totalCost)}
                            </td>
                            <td className="p-3 text-right text-green-700">
                              {fmt(settlement.feed?.totalPaid)}
                            </td>
                            <td className="p-3 text-right text-amber-700">
                              {(settlement.feed?.returned || 0) > 0
                                ? fmt(settlement.feed?.returned)
                                : "—"}
                            </td>
                            <td className="p-3 text-right font-black text-red-600">
                              {fmt(settlement.feed?.totalPayable)}
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-3 font-semibold text-gray-800">
                              Medicine Purchases
                            </td>
                            <td className="p-3 text-right text-gray-900">
                              {fmt(settlement.medicine?.totalCost)}
                            </td>
                            <td className="p-3 text-right text-green-700">
                              {fmt(settlement.medicine?.totalPaid)}
                            </td>
                            <td className="p-3 text-right text-amber-750">
                              {(settlement.medicine?.returned || 0) > 0
                                ? fmt(settlement.medicine?.returned)
                                : "—"}
                            </td>
                            <td className="p-3 text-right font-black text-red-605">
                              {fmt(settlement.medicine?.totalPayable)}
                            </td>
                          </tr>
                          {(settlement.expenses?.totalCost || 0) > 0 && (
                            <tr className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-3 font-semibold text-gray-800">
                                Farm-Paid Expenses
                              </td>
                              <td className="p-3 text-right text-gray-900">
                                {fmt(settlement.expenses.totalCost)}
                              </td>
                              <td className="p-3 text-right text-gray-400">—</td>
                              <td className="p-3 text-right text-gray-400">—</td>
                              <td className="p-3 text-right text-gray-400">—</td>
                            </tr>
                          )}
                          {(settlement.supplierExpenses?.totalCost || 0) > 0 && (
                            <tr className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-3 font-semibold text-gray-800">
                                Supplier-Paid Expenses
                              </td>
                              <td className="p-3 text-right text-gray-900">
                                {fmt(settlement.supplierExpenses.totalCost)}
                              </td>
                              <td className="p-3 text-right text-green-700">
                                {fmt(settlement.supplierExpenses.totalPaid)}
                              </td>
                              <td className="p-3 text-right text-gray-400">—</td>
                              <td className="p-3 text-right font-black text-red-600">
                                {fmt(settlement.supplierExpenses.totalPayable)}
                              </td>
                            </tr>
                          )}
                          {settlement.labour > 0 && (
                            <tr className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-3 font-semibold text-gray-800">
                                Poultry Labour
                              </td>
                              <td className="p-3 text-right text-gray-900">
                                {fmt(settlement.labour)}
                              </td>
                              <td className="p-3 text-right text-green-700">
                                {fmt(settlement.labour)}
                              </td>
                              <td className="p-3 text-right text-gray-400">
                                —
                              </td>
                              <td className="p-3 text-right text-gray-400">
                                —
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 font-black border-t-2 border-gray-300">
                            <td className="p-3 uppercase tracking-wider text-xs">
                              Total Costs Summary
                            </td>
                            <td className="p-3 text-right">
                              {fmt(totalCosts)}
                            </td>
                            <td className="p-3 text-right text-green-800">
                              {fmt(
                                (settlement.batchPaid || 0) +
                                  (settlement.feed?.totalPaid || 0) +
                                  (settlement.medicine?.totalPaid || 0) +
                                  (settlement.supplierExpenses?.totalPaid || 0) +
                                  (settlement.labour || 0),
                              )}
                            </td>
                            <td className="p-3 text-right text-amber-700">
                              {fmt(
                                (settlement.feed?.returned || 0) +
                                  (settlement.medicine?.returned || 0),
                              )}
                            </td>
                            <td className="p-3 text-right text-red-700">
                              {fmt(settlement.totalPayables)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                  </div>
                )}

                {/* Profitability Preview */}
                {previewSection === "profit" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-200 rounded-2xl">
                      <div>
                        <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">
                          Total Income
                        </p>
                        <h3 className="text-xl font-black text-green-750 mt-1">
                          Rs. {fmt(totalIncome)}
                        </h3>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">
                          Total Combined Cost
                        </p>
                        <h3 className="text-xl font-black text-gray-850 mt-1">
                          Rs. {fmt(totalCosts)}
                        </h3>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-gray-100 p-3.5 font-extrabold text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
                        Financial Statement Summary
                      </div>
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-gray-150">
                          <tr className="bg-green-50/10">
                            <td className="p-3.5 font-bold text-gray-750">
                              Accrued Chick &amp; Products Sales
                            </td>
                            <td className="p-3.5 text-right font-black text-green-750">
                              Rs. {fmt(totalIncome)}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3.5 text-gray-600 font-medium">
                              Less: batch purchase costs
                            </td>
                            <td className="p-3.5 text-right font-bold text-gray-900">
                              - Rs. {fmt(settlement.batchCost)}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3.5 text-gray-600 font-medium">
                              Less: feed intake expenses
                            </td>
                            <td className="p-3.5 text-right font-bold text-gray-900">
                              - Rs. {fmt(settlement.feed?.totalCost)}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3.5 text-gray-600 font-medium">
                              Less: medicine &amp; vaccine costs
                            </td>
                            <td className="p-3.5 text-right font-bold text-gray-900">
                              - Rs. {fmt(settlement.medicine?.totalCost)}
                            </td>
                          </tr>
                          {settlement.expenses?.totalCost > 0 && (
                            <tr>
                              <td className="p-3.5 text-gray-600 font-medium">
                                Less: additional farm operations expenses
                              </td>
                              <td className="p-3.5 text-right font-bold text-gray-900">
                                - Rs. {fmt(settlement.expenses.totalCost)}
                              </td>
                            </tr>
                          )}
                          {settlement.supplierExpenses?.totalCost > 0 && (
                            <tr>
                              <td className="p-3.5 text-gray-600 font-medium">
                                Less: additional supplier paid expenses
                              </td>
                              <td className="p-3.5 text-right font-bold text-gray-900">
                                - Rs.{" "}
                                {fmt(settlement.supplierExpenses.totalCost)}
                              </td>
                            </tr>
                          )}
                          {settlement.labour > 0 && (
                            <tr>
                              <td className="p-3.5 text-gray-600 font-medium">
                                Less: poultry workers labor pay
                              </td>
                              <td className="p-3.5 text-right font-bold text-gray-900">
                                - Rs. {fmt(settlement.labour)}
                              </td>
                            </tr>
                          )}
                          <tr
                            className={`font-black text-white text-base ${isProfit ? "bg-green-600" : "bg-red-600"}`}
                          >
                            <td className="p-4 uppercase tracking-wider">
                              {isProfit ? "NET PROFIT" : "NET LOSS"}
                            </td>
                            <td className="p-4 text-right text-lg">
                              {!isProfit ? "-" : ""}Rs. {fmt(Math.abs(profit))}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Payables Preview */}
                {previewSection === "payables" && (
                  <div className="space-y-4">
                    <table className="w-full text-sm border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                      <thead className="bg-gray-100 text-gray-700 font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="p-4 text-left">Category</th>
                          <th className="p-4 text-right">Total Cost</th>
                          <th className="p-4 text-right">Paid</th>
                          <th className="p-4 text-right">Returned</th>
                          <th className="p-4 text-right">
                            Owed (Supplier Payable)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        <tr className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-bold text-gray-800">
                            Batch Purchase
                          </td>
                          <td className="p-4 text-right">
                            {fmt(settlement.batchCost)}
                          </td>
                          <td className="p-4 text-right text-green-700 font-bold">
                            {fmt(settlement.batchPaid)}
                          </td>
                          <td className="p-4 text-right text-gray-400">—</td>
                          <td className="p-4 text-right font-black text-red-650">
                            {fmt(settlement.batchPayable)}
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-bold text-gray-800">Feed</td>
                          <td className="p-4 text-right">
                            {fmt(settlement.feed?.totalCost)}
                          </td>
                          <td className="p-4 text-right text-green-700 font-bold">
                            {fmt(settlement.feed?.totalPaid)}
                          </td>
                          <td className="p-4 text-right text-amber-700">
                            {(settlement.feed?.returned || 0) > 0
                              ? fmt(settlement.feed?.returned)
                              : "—"}
                          </td>
                          <td className="p-4 text-right font-black text-red-650">
                            {fmt(settlement.feed?.totalPayable)}
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-bold text-gray-800">
                            Medicine
                          </td>
                          <td className="p-4 text-right">
                            {fmt(settlement.medicine?.totalCost)}
                          </td>
                          <td className="p-4 text-right text-green-700 font-bold">
                            {fmt(settlement.medicine?.totalPaid)}
                          </td>
                          <td className="p-4 text-right text-amber-700">
                            {(settlement.medicine?.returned || 0) > 0
                              ? fmt(settlement.medicine?.returned)
                              : "—"}
                          </td>
                          <td className="p-4 text-right font-black text-red-650">
                            {fmt(settlement.medicine?.totalPayable)}
                          </td>
                        </tr>
                        {settlement.supplierExpenses?.totalCost > 0 && (
                          <tr className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 font-bold text-gray-800">
                              Supplier Paid Expenses
                            </td>
                            <td className="p-4 text-right">
                              {fmt(settlement.supplierExpenses.totalCost)}
                            </td>
                            <td className="p-4 text-right text-green-700 font-bold">
                              {fmt(settlement.supplierExpenses.totalPaid)}
                            </td>
                            <td className="p-4 text-right text-gray-400">—</td>
                            <td className="p-4 text-right font-black text-red-650">
                              {fmt(settlement.supplierExpenses.totalPayable)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 font-black border-t-2 border-gray-300">
                          <td className="p-4 uppercase tracking-wider text-xs">
                            Total Supplier Account
                          </td>
                          <td className="p-4 text-right text-gray-800">
                            {fmt(
                              totalCosts -
                                (settlement.expenses?.totalCost || 0) -
                                settlement.labour,
                            )}
                          </td>
                          <td className="p-4 text-right text-green-800">
                            {fmt(
                              (settlement.batchPaid || 0) +
                                (settlement.feed?.totalPaid || 0) +
                                (settlement.medicine?.totalPaid || 0) +
                                (settlement.supplierExpenses?.totalPaid || 0),
                            )}
                          </td>
                          <td className="p-4 text-right text-amber-700">
                            {fmt(
                              (settlement.feed?.returned || 0) +
                                (settlement.medicine?.returned || 0),
                            )}
                          </td>
                          <td className="p-4 text-right text-red-700 text-base">
                            {fmt(settlement.totalPayables)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Received stats Preview */}
                {previewSection === "received" && (
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-gray-100 p-3.5 font-extrabold text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
                        Cash Settlement Calculation
                      </div>
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-gray-150">
                          <tr>
                            <td className="p-3.5 text-gray-700 font-bold">
                              Total Accrued Income (A)
                            </td>
                            <td className="p-3.5 text-right font-black text-green-755">
                              Rs. {fmt(totalIncome)}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3.5 text-gray-500 font-medium">
                              Less: Total Supplier Payables (B)
                            </td>
                            <td className="p-3.5 text-right text-red-650 font-black">
                              - Rs. {fmt(settlement.totalPayables)}
                            </td>
                          </tr>
                          {(settlement.totalReceivables || 0) > 0 && (
                            <tr>
                              <td className="p-3.5 text-gray-500 font-medium">
                                Plus: Refund Receivables from stock returns (C)
                              </td>
                              <td className="p-3.5 text-right text-green-600 font-black">
                                + Rs. {fmt(settlement.totalReceivables)}
                              </td>
                            </tr>
                          )}
                          <tr className="bg-gray-50 font-black">
                            <td className="p-4 text-xs uppercase tracking-wider text-gray-750">
                              Net Payable Cash Settle-up{" "}
                              {(settlement.totalReceivables || 0) > 0
                                ? "(A - B + C)"
                                : "(A - B)"}
                            </td>
                            <td className="p-4 text-right text-base text-gray-905">
                              Rs. {fmt(settlement.netReceived)}
                            </td>
                          </tr>
                          {settlement.status === "completed" && (
                            <tr className="bg-green-600 text-white font-black">
                              <td className="p-4 text-xs uppercase tracking-wider">
                                FINAL REGISTERED RECEIVED AMOUNT
                              </td>
                              <td className="p-4 text-right text-base">
                                Rs. {fmt(settlement.finalReceived)}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="px-6 py-4 border-t border-gray-150 bg-gray-50/50 flex justify-end">
                <button
                  onClick={() => setPreviewSection(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all font-heading"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── PRINT ONLY SECTIONS ── */}
      {printActiveSection === "sales" && settlement && (
        <div className="hidden print:block font-['Nunito']">
          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">
              DETAILED SALES REPORT
            </h2>
            <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
              {settlement.batch?.notes || `Batch #${selectedBatchId}`} (
              {settlement.batch?.date})
            </p>
          </div>
          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-gray-100 text-[#111827] font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-right">Quantity</th>
                <th className="p-3 text-right">Price (Rs.)</th>
                <th className="p-3 text-right">Total Price (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {settlement.salesRows?.map((s) => (
                <tr key={s.id} className="border-b border-gray-200">
                  <td className="p-3">{s.date}</td>
                  <td className="p-3 font-semibold">{catLabel(s.category)}</td>
                  <td className="p-3 text-right text-gray-700">
                    {s.category === "chicks"
                      ? `${s.chicks_sold?.toLocaleString() || 0} birds` +
                        (s.weight_kilos ? ` / ${s.weight_kilos} kg` : "")
                      : s.quantity?.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-gray-700 font-bold">
                    {s.category === "chicks"
                      ? s.price_per_kg
                        ? `Rs. ${fmt(s.price_per_kg)} / kg`
                        : "—"
                      : `Rs. ${fmt(s.rate)}`}
                  </td>
                  <td className="p-3 text-right font-black text-green-700">
                    {fmt(s.total_price || s.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-black border-t-2 border-gray-300">
                <td
                  colSpan={2}
                  className="p-3 uppercase tracking-wider text-xs"
                >
                  Total Sales
                </td>
                <td className="p-3 text-right">—</td>
                <td className="p-3 text-right">—</td>
                <td className="p-3 text-right text-lg text-green-800">
                  {fmt(settlement.totalSales)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {printActiveSection === "costs" && settlement && (
        <div className="hidden print:block font-['Nunito'] space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">
              DETAILED BATCH COSTS REPORT
            </h2>
            <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
              {settlement.batch?.notes || `Batch #${selectedBatchId}`} (
              {settlement.batch?.date})
            </p>
          </div>

          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-gray-100 text-[#111827] font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="p-3 text-left">Cost Category</th>
                <th className="p-3 text-right">Total Cost (Rs.)</th>
                <th className="p-3 text-right">Paid (Rs.)</th>
                <th className="p-3 text-right">Returned (Rs.)</th>
                <th className="p-3 text-right">Payable (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-3 font-semibold">Batch Purchase</td>
                <td className="p-3 text-right">{fmt(settlement.batchCost)}</td>
                <td className="p-3 text-right text-green-700">
                  {fmt(settlement.batchPaid)}
                </td>
                <td className="p-3 text-right text-gray-400">—</td>
                <td className="p-3 text-right font-black text-red-600">
                  {fmt(settlement.batchPayable)}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-3 font-semibold">Feed Purchases</td>
                <td className="p-3 text-right">
                  {fmt(settlement.feed?.totalCost)}
                </td>
                <td className="p-3 text-right text-green-700">
                  {fmt(settlement.feed?.totalPaid)}
                </td>
                <td className="p-3 text-right text-amber-705">
                  {(settlement.feed?.returned || 0) > 0
                    ? fmt(settlement.feed?.returned)
                    : "—"}
                </td>
                <td className="p-3 text-right font-black text-red-600">
                  {fmt(settlement.feed?.totalPayable)}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-3 font-semibold">Medicine Purchases</td>
                <td className="p-3 text-right">
                  {fmt(settlement.medicine?.totalCost)}
                </td>
                <td className="p-3 text-right text-green-700">
                  {fmt(settlement.medicine?.totalPaid)}
                </td>
                <td className="p-3 text-right text-amber-705">
                  {(settlement.medicine?.returned || 0) > 0
                    ? fmt(settlement.medicine?.returned)
                    : "—"}
                </td>
                <td className="p-3 text-right font-black text-red-600">
                  {fmt(settlement.medicine?.totalPayable)}
                </td>
              </tr>
              {(settlement.expenses?.totalCost || 0) > 0 && (
                <tr className="border-b border-gray-200">
                  <td className="p-3 font-semibold">Farm-Paid Expenses</td>
                  <td className="p-3 text-right">
                    {fmt(settlement.expenses.totalCost)}
                  </td>
                  <td className="p-3 text-right text-gray-400">—</td>
                  <td className="p-3 text-right text-gray-400">—</td>
                  <td className="p-3 text-right text-gray-400">—</td>
                </tr>
              )}
              {(settlement.supplierExpenses?.totalCost || 0) > 0 && (
                <tr className="border-b border-gray-200">
                  <td className="p-3 font-semibold">Supplier-Paid Expenses</td>
                  <td className="p-3 text-right">
                    {fmt(settlement.supplierExpenses.totalCost)}
                  </td>
                  <td className="p-3 text-right text-green-700">
                    {fmt(settlement.supplierExpenses.totalPaid)}
                  </td>
                  <td className="p-3 text-right text-gray-400">—</td>
                  <td className="p-3 text-right font-black text-red-600">
                    {fmt(settlement.supplierExpenses.totalPayable)}
                  </td>
                </tr>
              )}
              {settlement.labour > 0 && (
                <tr className="border-b border-gray-200">
                  <td className="p-3 font-semibold">Poultry Labour</td>
                  <td className="p-3 text-right">{fmt(settlement.labour)}</td>
                  <td className="p-3 text-right text-green-700">
                    {fmt(settlement.labour)}
                  </td>
                  <td className="p-3 text-right text-gray-400">—</td>
                  <td className="p-3 text-right text-gray-400">—</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-black border-t-2 border-gray-300">
                <td className="p-3 uppercase tracking-wider text-xs">
                  Total Costs Summary
                </td>
                <td className="p-3 text-right">{fmt(totalCosts)}</td>
                <td className="p-3 text-right text-green-800">
                  {fmt(
                    (settlement.batchPaid || 0) +
                      (settlement.feed?.totalPaid || 0) +
                      (settlement.medicine?.totalPaid || 0) +
                      (settlement.supplierExpenses?.totalPaid || 0) +
                      (settlement.labour || 0),
                  )}
                </td>
                <td className="p-3 text-right text-amber-700">
                  {fmt(
                    (settlement.feed?.returned || 0) +
                      (settlement.medicine?.returned || 0),
                  )}
                </td>
                <td className="p-3 text-right text-red-700">
                  {fmt(settlement.totalPayables)}
                </td>
              </tr>
            </tfoot>
          </table>

        </div>
      )}

      {printActiveSection === "profit" && settlement && (
        <div className="hidden print:block font-['Nunito'] space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">
              BATCH PROFITABILITY REPORT
            </h2>
            <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
              {settlement.batch?.notes || `Batch #${selectedBatchId}`} (
              {settlement.batch?.date})
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-250 rounded-xl">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">
                Total Income
              </p>
              <h3 className="text-lg font-black text-green-700">
                Rs. {fmt(totalIncome)}
              </h3>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">
                Total Cost
              </p>
              <h3 className="text-lg font-black text-gray-800">
                Rs. {fmt(totalCosts)}
              </h3>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-100 p-3 font-extrabold text-[#111827] text-xs uppercase tracking-wider border-b border-gray-200">
              FINANCIAL STATEMENT SUMMARY
            </div>
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr className="border-b border-gray-200 bg-green-50/20">
                  <td className="p-3 font-bold text-gray-700">
                    Accrued Chick & Products Sales
                  </td>
                  <td className="p-3 text-right font-black text-green-700">
                    Rs. {fmt(totalIncome)}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-3 text-gray-655">
                    Less: batch purchase costs
                  </td>
                  <td className="p-3 text-right font-bold">
                    - Rs. {fmt(settlement.batchCost)}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-3 text-gray-655">
                    Less: feed intake expenses
                  </td>
                  <td className="p-3 text-right font-bold">
                    - Rs. {fmt(settlement.feed?.totalCost)}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-3 text-gray-655">
                    Less: medicine & vaccine costs
                  </td>
                  <td className="p-3 text-right font-bold">
                    - Rs. {fmt(settlement.medicine?.totalCost)}
                  </td>
                </tr>
                {settlement.expenses?.totalCost > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="p-3 text-gray-655">
                      Less: additional farm operations expenses
                    </td>
                    <td className="p-3 text-right font-bold">
                      - Rs. {fmt(settlement.expenses?.totalCost)}
                    </td>
                  </tr>
                )}
                {settlement.supplierExpenses?.totalCost > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="p-3 text-gray-655">
                      Less: additional supplier paid expenses
                    </td>
                    <td className="p-3 text-right font-bold">
                      - Rs. {fmt(settlement.supplierExpenses?.totalCost)}
                    </td>
                  </tr>
                )}
                {settlement.labour > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="p-3 text-gray-655">
                      Less: poultry workers labor pay
                    </td>
                    <td className="p-3 text-right font-bold">
                      - Rs. {fmt(settlement.labour)}
                    </td>
                  </tr>
                )}
                <tr
                  className={`font-black text-white ${isProfit ? "bg-green-600" : "bg-red-600"}`}
                >
                  <td className="p-4 uppercase tracking-wider">
                    {isProfit ? "NET PROFIT" : "NET LOSS"}
                  </td>
                  <td className="p-4 text-right text-lg">
                    {!isProfit ? "-" : ""}Rs. {fmt(Math.abs(profit))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {printActiveSection === "payables" && settlement && (
        <div className="hidden print:block font-['Nunito'] space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">
              SUPPLIER LEDGER ACCOUNT (PAYABLES)
            </h2>
            <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
              {settlement.batch?.notes || `Batch #${selectedBatchId}`} (
              {settlement.batch?.date})
            </p>
          </div>

          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-gray-100 text-[#111827] font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-right">Total Cost</th>
                <th className="p-4 text-right">Paid</th>
                <th className="p-4 text-right">Returned</th>
                <th className="p-4 text-right">Owed (Supplier Payable)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-4 font-bold text-gray-700">Batch Purchase</td>
                <td className="p-4 text-right">{fmt(settlement.batchCost)}</td>
                <td className="p-4 text-right text-green-700">
                  {fmt(settlement.batchPaid)}
                </td>
                <td className="p-4 text-right text-gray-400">—</td>
                <td className="p-4 text-right font-black text-red-600">
                  {fmt(settlement.batchPayable)}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-4 font-bold text-gray-700">Feed</td>
                <td className="p-4 text-right">
                  {fmt(settlement.feed?.totalCost)}
                </td>
                <td className="p-4 text-right text-green-700">
                  {fmt(settlement.feed?.totalPaid)}
                </td>
                <td className="p-4 text-right text-amber-705">
                  {(settlement.feed?.returned || 0) > 0
                    ? fmt(settlement.feed?.returned)
                    : "—"}
                </td>
                <td className="p-4 text-right font-black text-red-600">
                  {fmt(settlement.feed?.totalPayable)}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-4 font-bold text-gray-700">Medicine</td>
                <td className="p-4 text-right">
                  {fmt(settlement.medicine?.totalCost)}
                </td>
                <td className="p-4 text-right text-green-700">
                  {fmt(settlement.medicine?.totalPaid)}
                </td>
                <td className="p-4 text-right text-amber-705">
                  {(settlement.medicine?.returned || 0) > 0
                    ? fmt(settlement.medicine?.returned)
                    : "—"}
                </td>
                <td className="p-4 text-right font-black text-red-600">
                  {fmt(settlement.medicine?.totalPayable)}
                </td>
              </tr>
              {settlement.supplierExpenses?.totalCost > 0 && (
                <tr className="border-b border-gray-200">
                  <td className="p-4 font-bold text-gray-700">
                    Supplier Paid Expenses
                  </td>
                  <td className="p-4 text-right">
                    {fmt(settlement.supplierExpenses?.totalCost)}
                  </td>
                  <td className="p-4 text-right text-green-700">
                    {fmt(settlement.supplierExpenses?.totalPaid)}
                  </td>
                  <td className="p-4 text-right text-gray-400">—</td>
                  <td className="p-4 text-right font-black text-red-600">
                    {fmt(settlement.supplierExpenses?.totalPayable)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-black border-t-2 border-gray-300">
                <td className="p-4 uppercase tracking-wider text-xs">
                  Total Supplier Account
                </td>
                <td className="p-4 text-right text-gray-800">
                  {fmt(
                    totalCosts -
                      (settlement.expenses?.totalCost || 0) -
                      settlement.labour,
                  )}
                </td>
                <td className="p-4 text-right text-green-800">
                  {fmt(
                    (settlement.batchPaid || 0) +
                      (settlement.feed?.totalPaid || 0) +
                      (settlement.medicine?.totalPaid || 0) +
                      (settlement.supplierExpenses?.totalPaid || 0),
                  )}
                </td>
                <td className="p-4 text-right text-amber-700">
                  {fmt(
                    (settlement.feed?.returned || 0) +
                      (settlement.medicine?.returned || 0),
                  )}
                </td>
                <td className="p-4 text-right text-red-700 text-lg">
                  {fmt(settlement.totalPayables)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {printActiveSection === "received" && settlement && (
        <div className="hidden print:block font-['Nunito'] space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">
              FINAL RECEIVED SETTLEMENT STATS
            </h2>
            <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
              {settlement.batch?.notes || `Batch #${selectedBatchId}`} (
              {settlement.batch?.date})
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-100 p-3 font-extrabold text-[#111827] text-xs uppercase tracking-wider border-b border-gray-200">
              CASH SETTLEMENT CALCULATION
            </div>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="p-3 text-gray-700 font-bold">
                    Total Accrued Income (A)
                  </td>
                  <td className="p-3 text-right font-bold text-green-700">
                    Rs. {fmt(totalIncome)}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-3 text-gray-500">
                    Less: Total Supplier Payables (B)
                  </td>
                  <td className="p-3 text-right text-red-650 font-semibold">
                    - Rs. {fmt(settlement.totalPayables)}
                  </td>
                </tr>
                {(settlement.totalReceivables || 0) > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="p-3 text-gray-500">
                      Plus: Refund Receivables from stock returns (C)
                    </td>
                    <td className="p-3 text-right text-green-600 font-semibold">
                      + Rs. {fmt(settlement.totalReceivables)}
                    </td>
                  </tr>
                )}
                <tr className="border-t border-gray-200 bg-gray-50/50 font-black">
                  <td className="p-4 text-xs uppercase tracking-wider">
                    Net Payable Cash Settle-up{" "}
                    {(settlement.totalReceivables || 0) > 0
                      ? "(A - B + C)"
                      : "(A - B)"}
                  </td>
                  <td className="p-4 text-right text-lg text-gray-900">
                    Rs. {fmt(settlement.netReceived)}
                  </td>
                </tr>
                {settlement.status === "completed" && (
                  <tr className="bg-green-600 text-white font-black">
                    <td className="p-4 text-xs uppercase tracking-wider">
                      FINAL REGISTERED RECEIVED AMOUNT
                    </td>
                    <td className="p-4 text-right text-xl">
                      Rs. {fmt(settlement.finalReceived)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
