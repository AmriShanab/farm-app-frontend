import { useState, useEffect } from "react";
import {
  TrendingUp,
  Wallet,
  Users,
  Sprout,
  ArrowRight,
  AlertCircle,
  Banknote,
  Calendar,
  Loader2,
  CalendarClock,
  Egg,
  X,
  FileText,
} from "lucide-react";
import { getHeaders } from "../services/api";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);
const asNumber = (value) => Number(value || 0);
const dashboardFarm = "MR1";
const retryableGatewayStatuses = new Set([502, 503, 504]);

const fetchDashboardResource = async (url, options) => {
  let response = await fetch(url, options);

  if (retryableGatewayStatuses.has(response.status)) {
    response = await fetch(url, options);
  }

  return response;
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};

const batchDayNumber = (startDate) => {
  if (!startDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - start) / 86400000);
  return diff < 0 ? null : diff + 1;
};

const incomeTypes = new Set([
  "coconut_sale",
  "cashew_sale",
  "other_income",
  "poultry_sale",
]);

const normalizeRecentTransaction = (record) => {
  const direction = incomeTypes.has(record?.type) ? "Income" : "Expense";

  return {
    ...record,
    title: record?.description || record?.title || "Transaction",
    type: direction,
    status: direction,
  };
};

const normalizeExpenseEntry = (record) => ({
  ...record,
  amount: asNumber(record?.amount),
});

const groupExpensesBySection = (entries = []) => {
  const grouped = entries.reduce((acc, entry) => {
    const section = (entry?.section || entry?.category || "other").toString();
    if (!acc[section]) {
      acc[section] = { section, total: 0, count: 0 };
    }

    acc[section].total += asNumber(entry?.amount);
    acc[section].count += 1;
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => b.total - a.total);
};

export default function Dashboard() {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpiData, setKpiData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    payrollCost: 0,
    netProfit: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [expenseEntries, setExpenseEntries] = useState([]);
  const [profitability, setProfitability] = useState({
    months: [],
    totals: { income: 0, expenses: 0, profit: 0 },
  });
  const [highlights, setHighlights] = useState({
    nextHarvests: [],
    activeBatches: [],
  });
  const [currentMonth, setCurrentMonth] = useState("May 2026");
  const [previewSection, setPreviewSection] = useState(null); // 'income' | 'expenses' | 'profit' | 'payroll' | null
  const [printActiveSection, setPrintActiveSection] = useState(null);

  const triggerSectionPrint = (section) => {
    setPrintActiveSection(section);
    setTimeout(() => {
      window.print();
      setPrintActiveSection(null);
    }, 150);
  };

  // --- API INTEGRATION ---
  useEffect(() => {
    const now = new Date();

    const currentMonthNumber = String(now.getMonth() + 1).padStart(2, "0");
    const currentYearNumber = now.getFullYear();
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      const headers = getHeaders();

      try {
        // Fetch Summary KPIs and Recent Activity concurrently
        const [
          summaryRes,
          recentRes,
          expensesRes,
          profitabilityRes,
          highlightsRes,
        ] = await Promise.all([
          fetchDashboardResource(
            `${apiBaseUrl}/dashboard/summary?month=${currentMonthNumber}&year=${currentYearNumber}`,
            { headers },
          ),
          fetchDashboardResource(`${apiBaseUrl}/dashboard/recent`, { headers }),
          fetchDashboardResource(
            `${apiBaseUrl}/dashboard/expenses?farm=${dashboardFarm}`,
            { headers },
          ),
          fetchDashboardResource(
            `${apiBaseUrl}/dashboard/profitability?year=${now.getFullYear()}`,
            { headers },
          ),
          fetchDashboardResource(`${apiBaseUrl}/dashboard/highlights`, {
            headers,
          }),
        ]);

        if (
          !summaryRes.ok ||
          !recentRes.ok ||
          !expensesRes.ok ||
          !profitabilityRes.ok ||
          !highlightsRes.ok
        ) {
          throw new Error("Failed to fetch dashboard data from server.");
        }

        const summaryData = await summaryRes.json();
        const recentData = await recentRes.json();
        const expensesData = await expensesRes.json();
        const profitabilityData = await profitabilityRes.json();
        const highlightsData = await highlightsRes.json();

        const summaryPayload = summaryData?.data || summaryData;
        const period = summaryPayload?.period || {};
        if (period.month && period.year) {
          setCurrentMonth(
            new Date(period.year, period.month - 1).toLocaleString("en-US", {
              month: "long",
              year: "numeric",
            }),
          );
        }

        setKpiData({
          totalIncome: asNumber(
            summaryPayload?.income?.total ?? summaryPayload?.totalIncome,
          ),
          totalExpenses: asNumber(
            summaryPayload?.expenses?.total ?? summaryPayload?.totalExpenses,
          ),
          payrollCost: asNumber(
            summaryPayload?.expenses?.payroll ??
              summaryPayload?.salaries?.total,
          ),
          netProfit: asNumber(summaryPayload?.netProfit),
        });

        // Ensure recentData is an array before setting
        if (Array.isArray(recentData)) {
          setRecentTransactions(recentData.map(normalizeRecentTransaction));
        } else if (recentData.data && Array.isArray(recentData.data)) {
          setRecentTransactions(
            recentData.data.map(normalizeRecentTransaction),
          );
        }

        const expensePayload = expensesData?.data || expensesData;
        setExpenseEntries(
          Array.isArray(expensePayload)
            ? expensePayload.map(normalizeExpenseEntry)
            : [],
        );

        const profitabilityPayload =
          profitabilityData?.data || profitabilityData;
        setProfitability({
          months: Array.isArray(profitabilityPayload?.months)
            ? profitabilityPayload.months
            : [],
          totals: profitabilityPayload?.totals || {
            income: 0,
            expenses: 0,
            profit: 0,
          },
        });

        const hlPayload = highlightsData?.data || highlightsData;
        setHighlights({
          nextHarvests: Array.isArray(hlPayload?.nextHarvests)
            ? hlPayload.nextHarvests
            : [],
          activeBatches: Array.isArray(hlPayload?.activeBatches)
            ? hlPayload.activeBatches
            : [],
        });
      } catch (err) {
        console.error("API Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const groupedExpenses = groupExpensesBySection(expenseEntries);
  const highestMonthlyValue =
    profitability.months.reduce(
      (max, month) =>
        Math.max(
          max,
          asNumber(month.income),
          asNumber(month.expenses),
          Math.abs(asNumber(month.profit)),
        ),
      0,
    ) || 1;

  return (
    <div
      className={printActiveSection ? "print-focus-active" : ""}
      style={{
        fontFamily: "'Nunito', sans-serif",
        maxWidth: "1400px",
        margin: "0 auto",
        paddingBottom: "40px",
      }}
    >
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
            Estate Overview
          </h1>
          <p className="text-sm font-medium text-gray-500">
            Welcome back! Here is what's happening on the farm today.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm text-sm font-bold text-gray-700">
          <Calendar size={16} className="text-green-600" />
          {currentMonth}
        </div>
      </div>

      {/* ── LOADING / ERROR STATES ── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm font-bold">
          <AlertCircle size={18} />
          {error} - Please ensure the backend server is running.
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-green-700">
          <Loader2 size={40} className="animate-spin mb-4" />
          <p className="font-bold tracking-wider uppercase text-sm">
            Loading Live Data...
          </p>
        </div>
      ) : (
        <>
          <div className="hide-on-print-focus">
            {/* ── MAIN KPI GRID ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Revenue Card */}
              <div
                onClick={() => setPreviewSection("income")}
                className="relative overflow-hidden rounded-[1.25rem] p-5 bg-gradient-to-br from-[#166534] to-[#14532d] text-white shadow-lg shadow-green-900/20 group border border-green-800/50 hover:-translate-y-1 transition-transform cursor-pointer"
              >
                <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[45px] opacity-20 bg-white group-hover:opacity-40 transition-opacity"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                    <TrendingUp size={20} className="text-green-300" />
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/20 uppercase tracking-wider backdrop-blur-md">
                    Income
                  </span>
                </div>
                <p className="text-white/80 text-sm font-medium mb-1 relative z-10">
                  Total Income
                </p>
                <h3 className="text-2xl font-black relative z-10">
                  Rs. {fmt(kpiData.totalIncome)}
                </h3>
              </div>

              {/* Expenses Card */}
              <div
                onClick={() => setPreviewSection("expenses")}
                className="relative overflow-hidden rounded-[1.25rem] p-5 bg-gradient-to-br from-[#166534] to-[#14532d] text-white shadow-lg shadow-green-900/20 group border border-green-800/50 hover:-translate-y-1 transition-transform cursor-pointer"
              >
                <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[45px] opacity-20 bg-white group-hover:opacity-40 transition-opacity"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                    <Wallet size={20} className="text-rose-300" />
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/20 uppercase tracking-wider backdrop-blur-md">
                    Expense
                  </span>
                </div>
                <p className="text-white/80 text-sm font-medium mb-1 relative z-10">
                  Total Expenses
                </p>
                <h3 className="text-2xl font-black relative z-10">
                  Rs. {fmt(kpiData.totalExpenses)}
                </h3>
              </div>

              {/* Net Profit Card */}
              <div
                onClick={() => setPreviewSection("profit")}
                className="relative overflow-hidden rounded-[1.25rem] p-5 bg-gradient-to-br from-[#166534] to-[#14532d] text-white shadow-lg shadow-green-900/20 group border border-green-800/50 hover:-translate-y-1 transition-transform cursor-pointer"
              >
                <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[45px] opacity-20 bg-white group-hover:opacity-40 transition-opacity"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                    <Banknote size={20} className="text-blue-300" />
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/20 uppercase tracking-wider backdrop-blur-md">
                    Profit
                  </span>
                </div>
                <p className="text-white/80 text-sm font-medium mb-1 relative z-10">
                  Net Profit
                </p>
                <h3 className="text-2xl font-black relative z-10">
                  Rs. {fmt(kpiData.netProfit)}
                </h3>
              </div>

              {/* Payroll Card */}
              <div
                onClick={() => setPreviewSection("payroll")}
                className="relative overflow-hidden rounded-[1.25rem] p-5 bg-gradient-to-br from-[#166534] to-[#14532d] text-white shadow-lg shadow-green-900/20 group border border-green-800/50 hover:-translate-y-1 transition-transform cursor-pointer"
              >
                <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[45px] opacity-20 bg-white group-hover:opacity-40 transition-opacity"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                    <Users size={20} className="text-orange-300" />
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/20 uppercase tracking-wider backdrop-blur-md">
                    Payroll
                  </span>
                </div>
                <p className="text-white/80 text-sm font-medium mb-1 relative z-10">
                  Payroll + Manager Salary
                </p>
                <h3 className="text-2xl font-black relative z-10">
                  Rs. {fmt(kpiData.payrollCost)}
                </h3>
              </div>
            </div>

            {/* ── OPERATIONAL HIGHLIGHTS ── */}
            {(highlights.nextHarvests.length > 0 ||
              highlights.activeBatches.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Next Harvest Dates */}
                {highlights.nextHarvests.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-amber-50/50 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Sprout size={16} className="text-amber-700" />
                      </div>
                      <h2 className="text-sm font-black text-gray-900">
                        Next Harvest
                      </h2>
                    </div>
                    <div className="p-4 space-y-3">
                      {highlights.nextHarvests.map((h) => {
                        const days = daysUntil(h.next_harvest_date);
                        // `due` (from the API) means the planned date has passed with no
                        // harvest recorded yet; it clears once a harvest lands on/after.
                        const isDue = Number(h.due) === 1;
                        const isSoon =
                          !isDue && days !== null && days >= 0 && days <= 7;
                        const isDone = !isDue && days !== null && days < 0;
                        const colorClass = isDue
                          ? "bg-red-50 border-red-200 text-red-700"
                          : isSoon
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : isDone
                              ? "bg-gray-50 border-gray-200 text-gray-500"
                              : "bg-green-50 border-green-200 text-green-700";
                        const badgeColor = isDue
                          ? "bg-red-100 text-red-800"
                          : isSoon
                            ? "bg-amber-100 text-amber-800"
                            : isDone
                              ? "bg-gray-100 text-gray-600"
                              : "bg-green-100 text-green-800";
                        return (
                          <div
                            key={h.farm}
                            className={`rounded-xl border p-3 ${colorClass}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-black uppercase tracking-wider opacity-70">
                                  {h.farm}
                                </p>
                                <p className="text-sm font-bold mt-0.5">
                                  {new Date(
                                    h.next_harvest_date + "T00:00:00",
                                  ).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-black ${badgeColor}`}
                              >
                                {isDue
                                  ? `DUE${days < 0 ? ` ${Math.abs(days)}d` : ""}`
                                  : isDone
                                    ? "Harvested"
                                    : days === 0
                                      ? "Today"
                                      : `In ${days}d`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Active Poultry Batches */}
                {highlights.activeBatches.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-emerald-50/50 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Egg size={16} className="text-emerald-700" />
                      </div>
                      <h2 className="text-sm font-black text-gray-900">
                        Active Flocks
                      </h2>
                    </div>
                    <div className="p-4 space-y-3">
                      {highlights.activeBatches.map((b) => {
                        const dayNo = batchDayNumber(b.date);
                        const qty = parseInt(b.quantity || 0, 10);
                        const liveBirds = parseInt(b.live_birds ?? qty, 10);
                        const totalSold = parseInt(b.total_sold || 0, 10);
                        const totalDeaths = parseInt(b.total_deaths || 0, 10);
                        return (
                          <div
                            key={b.id}
                            className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-bold text-gray-900">
                                  {b.notes || `Batch #${b.id}`}
                                </p>
                                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                                  {qty.toLocaleString()} birds ·{" "}
                                  {b.supplier || "No supplier"}
                                </p>
                              </div>
                              {dayNo != null && (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg text-xs font-black">
                                  <CalendarClock size={12} /> Day {dayNo}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                  Live
                                </p>
                                <p className="text-sm font-black text-emerald-800">
                                  {liveBirds.toLocaleString()}
                                </p>
                              </div>
                              <div className="flex-1 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                  Sold
                                </p>
                                <p className="text-sm font-black text-blue-800">
                                  {totalSold.toLocaleString()}
                                </p>
                              </div>
                              <div className="flex-1 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                                  Deaths
                                </p>
                                <p className="text-sm font-black text-red-700">
                                  {totalDeaths.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ── RECENT TRANSACTIONS ── */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                    <Banknote size={18} className="text-green-600" /> Recent
                    Ledger Activity
                  </h2>
                  <button className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1">
                    View Full Ledger <ArrowRight size={14} />
                  </button>
                </div>
                <div className="p-2 overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap min-w-[500px]">
                    <tbody>
                      {recentTransactions.length === 0 ? (
                        <tr>
                          <td className="p-6 text-center text-gray-400 text-sm font-bold">
                            No recent transactions found.
                          </td>
                        </tr>
                      ) : (
                        recentTransactions.map((tx, idx) => (
                          <tr
                            key={`${tx.id ?? "tx"}-${tx.date ?? "date"}-${tx.title ?? "title"}-${idx}`}
                            className="hover:bg-gray-50/80 transition-colors group border-b border-gray-50 last:border-0"
                          >
                            <td className="p-3 w-12">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "Income" ? "bg-green-100 text-green-600" : "bg-rose-100 text-rose-600"}`}
                              >
                                {tx.type === "Income" ? (
                                  <TrendingUp size={16} />
                                ) : (
                                  <Wallet size={16} />
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <p className="text-[13px] font-bold text-gray-900">
                                {tx.title}
                              </p>
                              <p className="text-[11px] font-semibold text-gray-500">
                                {tx.date}
                              </p>
                            </td>
                            <td className="p-3 text-right">
                              <p
                                className={`text-[14px] font-black ${tx.type === "Income" ? "text-green-700" : "text-rose-700"}`}
                              >
                                {tx.type === "Income" ? "+" : "-"} Rs.{" "}
                                {fmt(tx.amount)}
                              </p>
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${tx.status === "Completed" || tx.status === "Paid" ? "text-blue-500" : "text-amber-500"}`}
                              >
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── ACTION CENTER / ALERTS ── */}
              <div className="flex flex-col gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h2 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-4">
                    <Wallet size={16} className="text-green-600" /> Expense
                    Breakdown ({dashboardFarm})
                  </h2>
                  <div className="space-y-3">
                    {groupedExpenses.length === 0 ? (
                      <p className="text-sm text-gray-400 font-medium">
                        No expenses found.
                      </p>
                    ) : (
                      groupedExpenses.slice(0, 5).map((item) => (
                        <div
                          key={item.section}
                          className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between gap-4"
                        >
                          <div>
                            <p className="text-xs font-bold text-gray-900 capitalize">
                              {item.section.replace(/[-_]/g, " ")}
                            </p>
                            <p className="text-[10px] text-gray-500 font-medium">
                              {item.count} entries
                            </p>
                          </div>
                          <p className="text-sm font-black text-gray-900">
                            Rs. {fmt(item.total)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex-1">
                  <h2 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-4">
                    <TrendingUp size={16} className="text-green-600" /> Monthly
                    Profitability
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                      <span>Income</span>
                      <span>Expenses</span>
                      <span>Profit</span>
                    </div>
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {profitability.months.map((month) => {
                        const incomeWidth =
                          (asNumber(month.income) / highestMonthlyValue) * 100;
                        const expenseWidth =
                          (asNumber(month.expenses) / highestMonthlyValue) *
                          100;
                        const profitWidth =
                          (Math.abs(asNumber(month.profit)) /
                            highestMonthlyValue) *
                          100;
                        return (
                          <div
                            key={month.month}
                            className="rounded-xl border border-gray-100 p-3 bg-gray-50/60"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-black text-gray-900">
                                {month.monthName}
                              </p>
                              <p
                                className={`text-[10px] font-bold uppercase tracking-wider ${asNumber(month.profit) >= 0 ? "text-green-600" : "text-rose-600"}`}
                              >
                                {asNumber(month.profit) >= 0 ? "+" : "-"}Rs.{" "}
                                {fmt(Math.abs(month.profit))}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="w-10 text-[10px] font-bold text-gray-500">
                                  Inc
                                </span>
                                <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-green-500"
                                    style={{ width: `${incomeWidth}%` }}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-10 text-[10px] font-bold text-gray-500">
                                  Exp
                                </span>
                                <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-rose-500"
                                    style={{ width: `${expenseWidth}%` }}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-10 text-[10px] font-bold text-gray-500">
                                  Pft
                                </span>
                                <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${asNumber(month.profit) >= 0 ? "bg-blue-500" : "bg-amber-500"}`}
                                    style={{ width: `${profitWidth}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-green-700">
                          Income
                        </p>
                        <p className="text-sm font-black text-green-900">
                          Rs. {fmt(profitability.totals.income)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                          Expenses
                        </p>
                        <p className="text-sm font-black text-rose-900">
                          Rs. {fmt(profitability.totals.expenses)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                          Profit
                        </p>
                        <p className="text-sm font-black text-blue-900">
                          Rs. {fmt(profitability.totals.profit)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* ── PREVIEW MODAL ── */}
          {previewSection && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 hide-on-print-focus">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setPreviewSection(null)}
              />
              <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-150 animate-scaleUp">
                {/* Header banner */}
                <div className="bg-gradient-to-br from-green-50 to-green-150/40 p-5 border-b border-green-200 flex justify-between items-center text-gray-800">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                      <FileText size={18} className="text-green-700" />
                      {previewSection === "income" && "Income Ledger Breakdown"}
                      {previewSection === "expenses" &&
                        "Cost & Expenses Ledger Breakdown"}
                      {previewSection === "profit" &&
                        "Monthly Profitability Records"}
                      {previewSection === "payroll" &&
                        "Staff Wages & Payroll Breakdown"}
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      Estate Report: {dashboardFarm}
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
                <div className="p-6 overflow-auto flex-1 space-y-6 text-gray-800">
                  {/* Income Preview */}
                  {previewSection === "income" && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                          Recent Income Activity
                        </h4>
                        <table className="w-full text-sm border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                          <thead className="bg-gray-100 text-gray-700 font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
                            <tr>
                              <th className="p-3 text-left">Date</th>
                              <th className="p-3 text-left">Description</th>
                              <th className="p-3 text-right">Amount (Rs.)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150">
                            {recentTransactions.filter(
                              (tx) => tx.type === "Income",
                            ).length === 0 ? (
                              <tr>
                                <td
                                  colSpan={3}
                                  className="p-4 text-center text-gray-400 font-bold"
                                >
                                  No income entries found.
                                </td>
                              </tr>
                            ) : (
                              recentTransactions
                                .filter((tx) => tx.type === "Income")
                                .map((tx, idx) => (
                                  <tr
                                    key={idx}
                                    className="hover:bg-gray-50/50 transition-colors"
                                  >
                                    <td className="p-3 font-semibold text-gray-600">
                                      {tx.date}
                                    </td>
                                    <td className="p-3 font-bold text-gray-900">
                                      {tx.title}
                                    </td>
                                    <td className="p-3 text-right font-black text-green-700">
                                      Rs. {fmt(tx.amount)}
                                    </td>
                                  </tr>
                                ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 font-heading">
                          Monthly Accrued Income
                        </h4>
                        <table className="w-full text-sm border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                          <thead className="bg-gray-100 text-gray-700 font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
                            <tr>
                              <th className="p-3 text-left">Month</th>
                              <th className="p-3 text-right">
                                Total Income (Rs.)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150">
                            {profitability.months.map((m, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-gray-50/50 transition-colors"
                              >
                                <td className="p-3 font-bold text-gray-800">
                                  {m.monthName}
                                </td>
                                <td className="p-3 text-right font-black text-green-700">
                                  Rs. {fmt(m.income)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Expenses Preview */}
                  {previewSection === "expenses" && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                          Grouped Category Summary
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {groupedExpenses.map((e, idx) => (
                            <div
                              key={idx}
                              className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col justify-between"
                            >
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                {e.section.replace(/[-_]/g, " ")}
                              </span>
                              <span className="text-base font-black text-gray-900 mt-1">
                                Rs. {fmt(e.total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                          Detailed Expenses Logs
                        </h4>
                        <table className="w-full text-sm border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                          <thead className="bg-gray-100 text-gray-700 font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
                            <tr>
                              <th className="p-3 text-left">Date</th>
                              <th className="p-3 text-left">Section</th>
                              <th className="p-3 text-left">Description</th>
                              <th className="p-3 text-right">Amount (Rs.)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150">
                            {expenseEntries.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="p-4 text-center text-gray-400 font-bold"
                                >
                                  No expense records found.
                                </td>
                              </tr>
                            ) : (
                              expenseEntries.map((e, idx) => (
                                <tr
                                  key={idx}
                                  className="hover:bg-gray-50/50 transition-colors"
                                >
                                  <td className="p-3 text-gray-600 font-medium">
                                    {e.date}
                                  </td>
                                  <td className="p-3 capitalize font-bold text-gray-800">
                                    {e.section?.replace(/[-_]/g, " ") ||
                                      e.category}
                                  </td>
                                  <td className="p-3 font-semibold text-gray-600">
                                    {e.description}
                                  </td>
                                  <td className="p-3 text-right font-black text-rose-700">
                                    Rs. {fmt(e.amount)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Profitability Preview */}
                  {previewSection === "profit" && (
                    <div className="space-y-4">
                      <table className="w-full text-sm border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                        <thead className="bg-gray-100 text-gray-700 font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
                          <tr>
                            <th className="p-4 text-left">Month</th>
                            <th className="p-4 text-right">Accrued Income</th>
                            <th className="p-4 text-right">Accrued Expense</th>
                            <th className="p-4 text-right">
                              Net Margin Profit/Loss
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150">
                          {profitability.months.map((m, idx) => {
                            const netProfit = asNumber(m.profit);
                            return (
                              <tr
                                key={idx}
                                className="hover:bg-gray-50/50 transition-colors"
                              >
                                <td className="p-4 font-bold text-gray-900">
                                  {m.monthName}
                                </td>
                                <td className="p-4 text-right text-green-700 font-bold">
                                  Rs. {fmt(m.income)}
                                </td>
                                <td className="p-4 text-right text-rose-700 font-bold">
                                  Rs. {fmt(m.expenses)}
                                </td>
                                <td
                                  className={`p-4 text-right font-black ${netProfit >= 0 ? "text-blue-700" : "text-amber-800"}`}
                                >
                                  {netProfit >= 0 ? "+" : "-"} Rs.{" "}
                                  {fmt(Math.abs(netProfit))}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 font-black border-t-2 border-gray-300">
                            <td className="p-4 uppercase tracking-wider text-xs">
                              Annual Total
                            </td>
                            <td className="p-4 text-right text-green-800">
                              Rs. {fmt(profitability.totals.income)}
                            </td>
                            <td className="p-4 text-right text-rose-800">
                              Rs. {fmt(profitability.totals.expenses)}
                            </td>
                            <td
                              className={`p-4 text-right text-base ${asNumber(profitability.totals.profit) >= 0 ? "text-blue-800" : "text-amber-800"}`}
                            >
                              {asNumber(profitability.totals.profit) >= 0
                                ? "+"
                                : "-"}{" "}
                              Rs. {fmt(Math.abs(profitability.totals.profit))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* Payroll Preview */}
                  {previewSection === "payroll" && (
                    <div className="space-y-6">
                      <div className="bg-orange-50/55 border border-orange-100 p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                            Total Payroll Cost
                          </span>
                          <h4 className="text-xl font-black text-orange-700 mt-0.5">
                            Rs. {fmt(kpiData.payrollCost)}
                          </h4>
                        </div>
                        <span className="text-xs text-gray-405 font-bold">
                          Includes managers and daily wage staff
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                          Itemized Payroll Expenses
                        </h4>
                        <table className="w-full text-sm border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                          <thead className="bg-gray-100 text-gray-700 font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
                            <tr>
                              <th className="p-3 text-left">Date</th>
                              <th className="p-3 text-left">Category</th>
                              <th className="p-3 text-left">Description</th>
                              <th className="p-3 text-right">Amount (Rs.)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150">
                            {expenseEntries.filter(
                              (e) =>
                                e.section === "payroll" ||
                                e.section === "labor" ||
                                e.category === "payroll" ||
                                e.category === "labor",
                            ).length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="p-4 text-center text-gray-400 font-bold"
                                >
                                  No custom labor wages recorded in expenses.
                                </td>
                              </tr>
                            ) : (
                              expenseEntries
                                .filter(
                                  (e) =>
                                    e.section === "payroll" ||
                                    e.section === "labor" ||
                                    e.category === "payroll" ||
                                    e.category === "labor",
                                )
                                .map((e, idx) => (
                                  <tr
                                    key={idx}
                                    className="hover:bg-gray-50/50 transition-colors"
                                  >
                                    <td className="p-3 text-gray-600 font-medium">
                                      {e.date}
                                    </td>
                                    <td className="p-3 uppercase font-bold text-gray-800">
                                      {e.section || e.category}
                                    </td>
                                    <td className="p-3 font-semibold text-gray-600">
                                      {e.description}
                                    </td>
                                    <td className="p-3 text-right font-black text-rose-700">
                                      Rs. {fmt(e.amount)}
                                    </td>
                                  </tr>
                                ))
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

          {/* ── PRINT-ONLY LAYOUT TEMPLATES ── */}
          {printActiveSection === "income" && (
            <div className="hidden print:block font-['Nunito'] space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">
                  INCOME LEDGER ACCOUNT
                </h2>
                <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
                  Estate: {dashboardFarm} ({currentMonth})
                </p>
              </div>
              <table className="w-full text-sm border border-gray-200">
                <thead className="bg-gray-100 text-[#111827] font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Description</th>
                    <th className="p-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions
                    .filter((t) => t.type === "income")
                    .map((t) => (
                      <tr key={t.id} className="border-b border-gray-200">
                        <td className="p-4 font-semibold text-gray-700">
                          {t.date}
                        </td>
                        <td className="p-4 text-gray-850 font-bold">
                          {t.description}
                        </td>
                        <td className="p-4 text-right font-black text-green-700">
                          Rs. {fmt(t.amount)}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-black border-t-2 border-gray-300">
                    <td
                      colSpan={2}
                      className="p-4 uppercase tracking-wider text-xs"
                    >
                      Total Income
                    </td>
                    <td className="p-4 text-right text-green-800 text-lg">
                      Rs. {fmt(kpiData.totalIncome)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {printActiveSection === "expenses" && (
            <div className="hidden print:block font-['Nunito'] space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">
                  COST & EXPENSES LEDGER ACCOUNT
                </h2>
                <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
                  Estate: {dashboardFarm} ({currentMonth})
                </p>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                  Grouped Category Summary
                </h4>
                <table className="w-full text-sm border border-gray-200 mb-6">
                  <thead className="bg-[#f3f4f6] text-[#111827] font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="p-4 text-left">Category</th>
                      <th className="p-4 text-right">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedExpenses.map((e, idx) => (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="p-4 font-bold text-gray-700 uppercase tracking-wide">
                          {e.section.replace(/[-_]/g, " ")}
                        </td>
                        <td className="p-4 text-right font-black text-gray-900">
                          Rs. {fmt(e.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                  Detailed Expenses Logs
                </h4>
                <table className="w-full text-sm border border-gray-200">
                  <thead className="bg-[#f3f4f6] text-[#111827] font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-205">
                    <tr>
                      <th className="p-4 text-left">Date</th>
                      <th className="p-4 text-left">Category</th>
                      <th className="p-4 text-left">Description</th>
                      <th className="p-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseEntries.map((e) => (
                      <tr key={e.id} className="border-b border-gray-200">
                        <td className="p-4 font-semibold text-gray-700">
                          {e.date}
                        </td>
                        <td className="p-4 font-bold text-gray-905 uppercase tracking-wide">
                          {(e.section || e.category || "other").replace(
                            /[-_]/g,
                            " ",
                          )}
                        </td>
                        <td className="p-4 text-gray-800">{e.description}</td>
                        <td className="p-4 text-right font-black text-red-650">
                          Rs. {fmt(e.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-black border-t-2 border-gray-300">
                      <td
                        colSpan={3}
                        className="p-4 uppercase tracking-wider text-xs"
                      >
                        Total Expenses
                      </td>
                      <td className="p-4 text-right text-red-700 text-lg">
                        Rs. {fmt(kpiData.totalExpenses)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {printActiveSection === "profit" && (
            <div className="hidden print:block font-['Nunito'] space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">
                  MONTHLY PROFITABILITY REPORT
                </h2>
                <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
                  Estate: {dashboardFarm} ({currentMonth})
                </p>
              </div>
              <table className="w-full text-sm border border-gray-200">
                <thead className="bg-[#f3f4f6] text-[#111827] font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-left">Month</th>
                    <th className="p-4 text-right">Income</th>
                    <th className="p-4 text-right">Expenses</th>
                    <th className="p-4 text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {profitability.months.map((m) => (
                    <tr key={m.month} className="border-b border-gray-200">
                      <td className="p-4 font-semibold text-gray-700">
                        {m.month}
                      </td>
                      <td className="p-4 text-right text-green-700">
                        Rs. {fmt(m.income)}
                      </td>
                      <td className="p-4 text-right text-red-650">
                        Rs. {fmt(m.expenses)}
                      </td>
                      <td
                        className={`p-4 text-right font-black ${m.profit >= 0 ? "text-green-800" : "text-rose-700"}`}
                      >
                        Rs. {fmt(m.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-black border-t-2 border-gray-300">
                    <td className="p-4 uppercase tracking-wider text-xs">
                      Total Summary
                    </td>
                    <td className="p-4 text-right text-green-800">
                      Rs. {fmt(profitability.totals.income)}
                    </td>
                    <td className="p-4 text-right text-red-700">
                      - Rs. {fmt(profitability.totals.expenses)}
                    </td>
                    <td
                      className={`p-4 text-right text-lg ${profitability.totals.profit >= 0 ? "text-green-900" : "text-rose-800"}`}
                    >
                      Rs. {fmt(profitability.totals.profit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {printActiveSection === "payroll" && (
            <div className="hidden print:block font-['Nunito'] space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">
                  STAFF WAGES & PAYROLL REPORT
                </h2>
                <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
                  Estate: {dashboardFarm} ({currentMonth})
                </p>
              </div>
              <table className="w-full text-sm border border-gray-200">
                <thead className="bg-[#f3f4f6] text-[#111827] font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-left">Staff Name</th>
                    <th className="p-4 text-left">Role / Designation</th>
                    <th className="p-4 text-right">Payment Method</th>
                    <th className="p-4 text-right">Net Wages</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions
                    .filter((t) => t.type === "payroll")
                    .map((t) => (
                      <tr key={t.id} className="border-b border-gray-200">
                        <td className="p-4 font-semibold text-gray-700">
                          {t.description}
                        </td>
                        <td className="p-4 text-gray-500 uppercase tracking-wider text-xs">
                          Staff Member
                        </td>
                        <td className="p-4 text-right text-gray-600">
                          Bank Transfer / Cash
                        </td>
                        <td className="p-4 text-right font-black text-rose-700">
                          Rs. {fmt(t.amount)}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-black border-t-2 border-gray-300">
                    <td
                      colSpan={3}
                      className="p-4 uppercase tracking-wider text-xs"
                    >
                      Total Payroll Costs
                    </td>
                    <td className="p-4 text-right text-red-700 text-lg">
                      Rs. {fmt(kpiData.payrollCost)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
