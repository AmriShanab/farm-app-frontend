import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Bird,
  CalendarDays,
  Download,
  Leaf,
  Loader2,
  RefreshCw,
  Wallet,
  X,
} from "lucide-react";
import { getHeaders } from "../services/api";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);

const money = (value) =>
  Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const number = (value) =>
  Number(value || 0).toLocaleString("en-LK", { maximumFractionDigits: 2 });

const formatDate = (value) => {
  if (!value) return "Present";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const titleCase = (value) =>
  String(value || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());

function SummaryCard({ label, value, tone, icon: Icon, onClick }) {
  const tones = {
    green: "bg-green-50 text-green-800 border-green-100 hover:bg-green-50/80",
    red: "bg-rose-50 text-rose-800 border-rose-100 hover:bg-rose-50/80",
    blue: "bg-sky-50 text-sky-800 border-sky-100 hover:bg-sky-50/80",
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-5 cursor-pointer hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-600/5 transition-all duration-200 ${tones[tone]}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wider opacity-70">
          {label}
        </p>
        <Icon size={19} />
      </div>
      <p className="mt-3 text-2xl font-black">Rs. {money(value)}</p>
    </div>
  );
}

function ProfitCard({ value, onClick }) {
  const positive = Number(value) >= 0;
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-5 cursor-pointer hover:border-emerald-305 hover:shadow-lg hover:shadow-emerald-600/5 transition-all duration-200 ${positive ? "bg-emerald-700 border-emerald-800 hover:bg-emerald-800" : "bg-rose-700 border-rose-800 hover:bg-rose-800"} text-white`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wider text-white/75">
          Net profit / loss
        </p>
        {positive ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
      </div>
      <p className="mt-3 text-2xl font-black">
        {positive ? "" : "-"}Rs. {money(Math.abs(value))}
      </p>
    </div>
  );
}

function AmountRows({ rows, totalLabel = "Total" }) {
  const visibleRows = rows.filter((row) => Number(row.value) !== 0);
  const total = rows.reduce((sum, row) => sum + Number(row.value || 0), 0);

  return (
    <div className="divide-y divide-gray-100">
      {visibleRows.length === 0 && (
        <p className="py-5 text-sm text-gray-400">No records in this cycle.</p>
      )}
      {visibleRows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-4 py-3 text-sm"
        >
          <span className="text-gray-600">{row.label}</span>
          <span className="font-bold text-gray-900">
            Rs. {money(row.value)}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-4 pt-4 text-sm font-black">
        <span>{totalLabel}</span>
        <span>Rs. {money(total)}</span>
      </div>
    </div>
  );
}

function CyclePicker({ items, value, onChange, type }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-gray-500">
        {type === "harvest" ? "Harvest cycle" : "Poultry batch"}
      </span>
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
      >
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {type === "harvest"
              ? `${item.farm} · ${item.startDate ? formatDate(item.startDate) : "Start"} → ${item.endDate ? formatDate(item.endDate) : "Present"}`
              : `Batch #${item.id} · ${formatDate(item.startDate)} · ${titleCase(item.status)}`}
          </option>
        ))}
      </select>
    </label>
  );
}

function HarvestBreakdown({ cycle, onCardClick }) {
  const incomeRows = [
    { label: "Coconut sales", value: cycle.income.coconut },
    { label: "Other income", value: cycle.income.other },
  ];
  const expenseRows = Object.entries(cycle.expenses)
    .filter(([key]) => key !== "total")
    .map(([key, value]) => ({ label: titleCase(key), value }));

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Cycle income"
          value={cycle.income.total}
          tone="green"
          icon={Wallet}
          onClick={() => onCardClick("income")}
        />
        <SummaryCard
          label="Cycle expenses"
          value={cycle.expenses.total}
          tone="red"
          icon={ArrowDownRight}
          onClick={() => onCardClick("expenses")}
        />
        <ProfitCard
          value={cycle.netProfit}
          onClick={() => onCardClick("profit")}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-black text-gray-900">Income</h2>
          <p className="mt-1 text-xs text-gray-500">
            Income recorded during this harvest window.
          </p>
          <AmountRows rows={incomeRows} totalLabel="Total income" />
        </section>
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-black text-gray-900">Expenses</h2>
          <p className="mt-1 text-xs text-gray-500">
            Costs recorded from this harvest up to the next harvest.
          </p>
          <AmountRows rows={expenseRows} totalLabel="Total expenses" />
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-black text-gray-900">Coconut yield</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wider text-gray-400">
                <th className="pb-3">Grade</th>
                <th className="pb-3 text-right">Paid quantity</th>
                <th className="pb-3 text-right">Free quantity</th>
                <th className="pb-3 text-right">Total quantity</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(cycle.volumes).map(([grade, values]) => (
                <tr
                  key={grade}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="py-3 font-bold">{titleCase(grade)}</td>
                  <td className="py-3 text-right">{number(values.paid_qty)}</td>
                  <td className="py-3 text-right">{number(values.free_qty)}</td>
                  <td className="py-3 text-right font-black">
                    {number(values.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function PoultryBreakdown({ batch, onCardClick }) {
  const incomeRows = batch.income.sales.map((sale) => ({
    label: `${titleCase(sale.category)} (${sale.records} records)`,
    value: sale.amount,
  }));
  const expenseRows = [
    { label: "Bird purchase", value: batch.expenses.batchPurchase },
    { label: "Feed (net of returns)", value: batch.expenses.feed },
    { label: "Medicine (net of returns)", value: batch.expenses.medicine || 0 },
    { label: "Other expenses", value: batch.expenses.otherExpenses || 0 },
    { label: "Poultry labour", value: batch.expenses.labour || 0 },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Batch income"
          value={batch.income.total}
          tone="green"
          icon={Wallet}
          onClick={() => onCardClick("income")}
        />
        <SummaryCard
          label="Batch expenses"
          value={batch.expenses.total}
          tone="red"
          icon={ArrowDownRight}
          onClick={() => onCardClick("expenses")}
        />
        <ProfitCard
          value={batch.netProfit}
          onClick={() => onCardClick("profit")}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-black text-gray-900">Sales income</h2>
          <p className="mt-1 text-xs text-gray-500">
            Every sale linked to batch #{batch.id}.
          </p>
          <AmountRows rows={incomeRows} totalLabel="Total sales" />
        </section>
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-black text-gray-900">Batch expenses</h2>
          <p className="mt-1 text-xs text-gray-500">
            Bird purchase, feed, medicine, payroll labour and other linked
            costs.
          </p>
          <AmountRows rows={expenseRows} totalLabel="Total expenses" />
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-black text-gray-900">Batch details</h2>
            <p className="mt-1 text-xs text-gray-500">
              Bird count, pricing and supplier details.
            </p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>
              {number(batch.birds)} birds · Rs. {money(batch.pricePerBird)} each
            </p>
            {batch.supplier && (
              <p className="mt-1">Supplier: {batch.supplier}</p>
            )}
          </div>
        </div>
        {Number(batch.profitDistributed) !== 0 && (
          <div className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
            Profit already distributed:{" "}
            <strong>Rs. {money(batch.profitDistributed)}</strong>
          </div>
        )}
      </section>
    </>
  );
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Plain calendar-month P/L across both coconut farms (no farm selection,
// poultry excluded). Settlement-style Income | Expenses | P&L.
function CalendarBreakdown() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewSection, setPreviewSection] = useState(null); // 'income' | 'expenses' | 'profit' | null
  const [printActiveSection, setPrintActiveSection] = useState(null);

  const triggerSectionPrint = (section) => {
    setPrintActiveSection(section);
    setTimeout(() => {
      window.print();
      setPrintActiveSection(null);
    }, 150);
  };

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => {
      setLoading(true);
      setError("");
    });
    fetch(
      `${API_BASE_URL}/dashboard/calendar-breakdown?month=${month}&year=${year}`,
      {
        headers: getHeaders(),
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok)
          throw new Error(
            payload?.error?.message || "Unable to load calendar breakdown.",
          );
        return payload?.data || payload;
      })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [month, year]);

  const incomeRows = data
    ? [
        { label: "Coconut sales", value: data.income.coconut },
        { label: "Other income", value: data.income.other },
      ]
    : [];
  const expenseRows = data
    ? Object.entries(data.expenses)
        .filter(([key]) => key !== "total")
        .map(([key, value]) => ({ label: titleCase(key), value }))
    : [];

  const years = [];
  for (let y = now.getFullYear() + 1; y >= now.getFullYear() - 4; y -= 1)
    years.push(y);

  return (
    <div className={printActiveSection ? "print-focus-active" : ""}>
      <div className="hide-on-print-focus">
        <div className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-gray-500">
              Month
            </span>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-green-600"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-gray-500">
              Year
            </span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-green-600"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <p className="ml-auto text-xs font-bold text-gray-400">
            Both farms combined · poultry excluded
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center text-green-700">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center font-bold text-rose-800">
            {error}
          </div>
        ) : data ? (
          <div className="mt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <SummaryCard
                label="Total income"
                value={data.income.total}
                tone="green"
                icon={Wallet}
                onClick={() => setPreviewSection("income")}
              />
              <SummaryCard
                label="Total expenses"
                value={data.expenses.total}
                tone="red"
                icon={ArrowDownRight}
                onClick={() => setPreviewSection("expenses")}
              />
              <ProfitCard
                value={data.netProfit}
                onClick={() => setPreviewSection("profit")}
              />
            </div>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="font-black text-gray-900">Income</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {MONTH_NAMES[month - 1]} {year} · MR1 + MR2
                </p>
                <AmountRows rows={incomeRows} totalLabel="Total income" />
              </section>
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="font-black text-gray-900">Expenses</h2>
                <p className="mt-1 text-xs text-gray-500">
                  All costs incl. payroll &amp; fuel
                </p>
                <AmountRows rows={expenseRows} totalLabel="Total expenses" />
              </section>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── PREVIEW MODAL ── */}
      {previewSection && data && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 hide-on-print-focus">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setPreviewSection(null)}
          />
          <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-150 animate-scaleUp">
            {/* Header banner */}
            <div className="bg-gradient-to-br from-green-50 to-green-150/40 p-5 border-b border-green-200 flex justify-between items-center text-gray-800 font-['Nunito']">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Bird size={18} className="text-green-700" />
                  {previewSection === "income" && "Monthly Income Breakdown"}
                  {previewSection === "expenses" &&
                    "Monthly Expenses Breakdown"}
                  {previewSection === "profit" &&
                    "Monthly Profitability Records"}
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                  Estate: Calendar Breakdown ({MONTH_NAMES[month - 1]} {year})
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
            <div className="p-6 overflow-auto flex-1 space-y-6 text-gray-800 font-['Nunito']">
              {previewSection === "income" && (
                <div className="space-y-6">
                  <AmountRows rows={incomeRows} totalLabel="Total income" />
                </div>
              )}
              {previewSection === "expenses" && (
                <div className="space-y-6">
                  <AmountRows rows={expenseRows} totalLabel="Total expenses" />
                </div>
              )}
              {previewSection === "profit" && (
                <div className="space-y-6">
                  <div className="table-container border border-gray-150 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-150 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                        <tr>
                          <th className="p-4 text-left">Summary Title</th>
                          <th className="p-4 text-right">Value Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-bold">
                        <tr>
                          <td className="p-4 text-gray-650">Total Income</td>
                          <td className="p-4 text-right text-green-700">
                            Rs. {money(data.income.total)}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-4 text-gray-650">Total Expenses</td>
                          <td className="p-4 text-right text-red-650 font-bold">
                            Rs. {money(data.expenses.total)}
                          </td>
                        </tr>
                        <tr className="bg-gray-50 font-black">
                          <td className="p-4 text-gray-900 uppercase text-xs">
                            Net profit / loss
                          </td>
                          <td
                            className={`p-4 text-right text-lg ${data.netProfit >= 0 ? "text-green-800" : "text-rose-700"}`}
                          >
                            Rs. {money(data.netProfit)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
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
      {printActiveSection === "income" && data && (
        <div className="hidden print:block font-['Nunito'] space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">
              MONTHLY CALENDAR INCOME BREAKDOWN
            </h2>
            <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
              Calendar month: {MONTH_NAMES[month - 1]} {year}
            </p>
          </div>
          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-[#f3f4f6] text-[#111827] font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="p-4 text-left">Income Category</th>
                <th className="p-4 text-right">Value Amount</th>
              </tr>
            </thead>
            <tbody>
              {incomeRows.map((r, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="p-4 font-bold text-gray-805">{r.label}</td>
                  <td className="p-4 text-right font-black text-green-700">
                    Rs. {money(r.value)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-black border-t-2 border-gray-300">
                <td className="p-4 uppercase tracking-wider text-xs">
                  Total Income
                </td>
                <td className="p-4 text-right text-green-800 text-lg">
                  Rs. {money(data.income.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {printActiveSection === "expenses" && data && (
        <div className="hidden print:block font-['Nunito'] space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">
              MONTHLY CALENDAR EXPENSES BREAKDOWN
            </h2>
            <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
              Calendar month: {MONTH_NAMES[month - 1]} {year}
            </p>
          </div>
          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-[#f3f4f6] text-[#111827] font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="p-4 text-left">Expense Category</th>
                <th className="p-4 text-right">Value Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenseRows.map((r, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="p-4 font-bold text-gray-805">{r.label}</td>
                  <td className="p-4 text-right font-black text-red-650">
                    Rs. {money(r.value)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-black border-t-2 border-gray-350">
                <td className="p-4 uppercase tracking-wider text-xs">
                  Total Expenses
                </td>
                <td className="p-4 text-right text-red-700 text-lg">
                  Rs. {money(data.expenses.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {printActiveSection === "profit" && data && (
        <div className="hidden print:block font-['Nunito'] space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">
              MONTHLY CALENDAR PROFITABILITY REPORT
            </h2>
            <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
              Calendar month: {MONTH_NAMES[month - 1]} {year}
            </p>
          </div>
          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-[#f3f4f6] text-[#111827] font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="p-4 text-left">Summary Title</th>
                <th className="p-4 text-right">Value Amount</th>
              </tr>
            </thead>
            <tbody className="font-bold">
              <tr className="border-b border-gray-200">
                <td className="p-4 text-gray-700">Total Income</td>
                <td className="p-4 text-right text-green-700">
                  Rs. {money(data.income.total)}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-4 text-gray-700">Total Expenses</td>
                <td className="p-4 text-right text-red-650">
                  Rs. {money(data.expenses.total)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-black border-t-2 border-gray-300">
                <td className="p-4 uppercase tracking-wider text-xs">
                  Net profit / loss
                </td>
                <td
                  className={`p-4 text-right text-lg ${data.netProfit >= 0 ? "text-green-800" : "text-rose-700"}`}
                >
                  Rs. {money(data.netProfit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default function MonthlyBreakdown() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("harvest");
  const [farm, setFarm] = useState("all");
  const [selectedHarvestId, setSelectedHarvestId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [previewSection, setPreviewSection] = useState(null); // 'income' | 'expenses' | 'profit' | null
  const [printActiveSection, setPrintActiveSection] = useState(null);

  const triggerSectionPrint = (section) => {
    setPrintActiveSection(section);
    setTimeout(() => {
      window.print();
      setPrintActiveSection(null);
    }, 150);
  };

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_BASE_URL}/dashboard/cycle-breakdown`, {
      headers: getHeaders(),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(
            payload?.error?.message ||
              payload?.message ||
              "Unable to load cycle breakdown.",
          );
        }
        return payload?.data || payload;
      })
      .then(setData)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  const harvests = useMemo(() => {
    const cycles = data?.harvestCycles || [];
    return farm === "all"
      ? cycles
      : cycles.filter((cycle) => cycle.farm === farm);
  }, [data, farm]);

  const selectedHarvest =
    harvests.find((cycle) => cycle.id === selectedHarvestId) ||
    harvests[0] ||
    null;
  const batches = data?.poultryBatches || [];
  const selectedBatch =
    batches.find((batch) => String(batch.id) === String(selectedBatchId)) ||
    batches[0] ||
    null;

  const exportBreakdown = () => {
    const rows = [];
    const selection = tab === "harvest" ? selectedHarvest : selectedBatch;
    if (!selection) return;

    if (tab === "harvest") {
      rows.push(["Harvest Cycle Breakdown"]);
      rows.push(["Farm", selection.farm]);
      rows.push(
        ["Start", selection.startDate],
        ["End", selection.endDate || data.asOfDate],
      );
      rows.push([]);
      rows.push(["Income", "Amount"]);
      Object.entries(selection.income).forEach(([key, value]) =>
        rows.push([titleCase(key), value]),
      );
      rows.push([]);
      rows.push(["Expense", "Amount"]);
      Object.entries(selection.expenses).forEach(([key, value]) =>
        rows.push([titleCase(key), value]),
      );
      rows.push([], ["Net profit / loss", selection.netProfit]);
    } else {
      rows.push(["Poultry Batch Breakdown"], ["Batch", selection.id]);
      rows.push(
        ["Start", selection.startDate],
        ["End", selection.endDate || data.asOfDate],
      );
      rows.push([], ["Income category", "Records", "Amount"]);
      selection.income.sales.forEach((sale) =>
        rows.push([titleCase(sale.category), sale.records, sale.amount]),
      );
      rows.push(["Total income", "", selection.income.total], []);
      rows.push(
        ["Expense", "Amount"],
        ["Bird purchase", selection.expenses.batchPurchase],
        ["Feed (net of returns)", selection.expenses.feed],
        ["Medicine (net of returns)", selection.expenses.medicine || 0],
        ["Other expenses", selection.expenses.otherExpenses || 0],
        ["Poultry labour", selection.expenses.labour || 0],
      );
      rows.push(
        ["Total expenses", selection.expenses.total],
        ["Net profit / loss", selection.netProfit],
      );
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(rows),
      "Cycle Breakdown",
    );
    XLSX.writeFile(workbook, `${tab}-cycle-breakdown.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center text-green-700">
        <Loader2 className="animate-spin" size={30} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center">
        <AlertCircle className="mx-auto text-rose-600" size={30} />
        <p className="mt-3 font-bold text-rose-800">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError("");
            setReloadKey((key) => key + 1);
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white"
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  const selection = tab === "harvest" ? selectedHarvest : selectedBatch;

  return (
    <div
      className={`mx-auto w-full max-w-7xl p-4 md:p-7 ${printActiveSection ? "print-focus-active" : ""}`}
    >
      <div className="hide-on-print-focus">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-green-700">
              Financial performance
            </p>
            <h1 className="mt-1 text-2xl font-black text-gray-900 md:text-3xl">
              Cycle Breakdown
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Review income, expenses, and profit from one harvest to the next
              or for an entire poultry batch.
            </p>
          </div>
          <button
            onClick={exportBreakdown}
            disabled={!selection}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40"
          >
            <Download size={17} /> Export selected cycle
          </button>
        </div>

        <div className="mt-7 inline-flex rounded-2xl bg-gray-100 p-1.5">
          <button
            onClick={() => setTab("harvest")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${tab === "harvest" ? "bg-white text-green-800 shadow-sm" : "text-gray-500"}`}
          >
            <Leaf size={17} /> Harvest breakdown
          </button>
          <button
            onClick={() => setTab("poultry")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${tab === "poultry" ? "bg-white text-green-800 shadow-sm" : "text-gray-500"}`}
          >
            <Bird size={17} /> Batch breakdown
          </button>
          <button
            onClick={() => setTab("calendar")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${tab === "calendar" ? "bg-white text-green-800 shadow-sm" : "text-gray-500"}`}
          >
            <CalendarDays size={17} /> Calendar breakdown
          </button>
        </div>

        {tab === "calendar" && <CalendarBreakdown />}
        {tab !== "calendar" && (
          <>
            <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div
                className={`grid gap-4 ${tab === "harvest" ? "md:grid-cols-[180px_1fr]" : ""}`}
              >
                {tab === "harvest" && (
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-gray-500">
                      Farm
                    </span>
                    <select
                      value={farm}
                      onChange={(event) => setFarm(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-green-600"
                    >
                      <option value="all">All farms</option>
                      <option value="MR1">MR1</option>
                      <option value="MR2">MR2</option>
                    </select>
                  </label>
                )}
                <CyclePicker
                  type={tab}
                  items={tab === "harvest" ? harvests : batches}
                  value={
                    tab === "harvest" ? selectedHarvest?.id : selectedBatch?.id
                  }
                  onChange={
                    tab === "harvest"
                      ? setSelectedHarvestId
                      : setSelectedBatchId
                  }
                />
              </div>
            </div>

            {!selection ? (
              <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center text-gray-400">
                <CalendarDays className="mx-auto mb-3" size={32} />
                <p className="font-bold">
                  No {tab === "harvest" ? "harvest cycles" : "poultry batches"}{" "}
                  found.
                </p>
              </div>
            ) : (
              <div className="mt-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#153f2e] px-5 py-4 text-white">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/60">
                      {tab === "harvest"
                        ? `${selection.farm} harvest cycle`
                        : `Poultry batch #${selection.id}`}
                    </p>
                    <p className="mt-1 font-black">
                      {selection.startDate
                        ? formatDate(selection.startDate)
                        : "Start"}{" "}
                      →{" "}
                      {selection.endDate
                        ? formatDate(selection.endDate)
                        : "Present"}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wider">
                    {titleCase(selection.status)}
                  </span>
                </div>
                {tab === "harvest" ? (
                  <HarvestBreakdown
                    cycle={selection}
                    onCardClick={setPreviewSection}
                  />
                ) : (
                  <PoultryBreakdown
                    batch={selection}
                    onCardClick={setPreviewSection}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── PREVIEW MODAL ── */}
      {previewSection && selection && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 hide-on-print-focus">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setPreviewSection(null)}
          />
          <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-150 animate-scaleUp">
            {/* Header banner */}
            <div className="bg-gradient-to-br from-green-50 to-green-150/40 p-5 border-b border-green-200 flex justify-between items-center text-gray-800 font-['Nunito']">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Bird size={18} className="text-green-700" />
                  {tab === "harvest" ? "Harvest" : "Poultry"} Cycle{" "}
                  {previewSection === "income"
                    ? "Income"
                    : previewSection === "expenses"
                      ? "Expenses"
                      : "Profitability"}{" "}
                  Breakdown
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                  Estate:{" "}
                  {tab === "harvest"
                    ? `${selection.farm} Harvest`
                    : `Poultry Batch #${selection.id}`}{" "}
                  Cycle (
                  {selection.startDate
                    ? formatDate(selection.startDate)
                    : "Start"}{" "}
                  →{" "}
                  {selection.endDate
                    ? formatDate(selection.endDate)
                    : "Present"}
                  )
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
            <div className="p-6 overflow-auto flex-1 space-y-6 text-gray-800 font-['Nunito']">
              {previewSection === "income" && (
                <div className="space-y-6">
                  {tab === "harvest" ? (
                    <AmountRows
                      rows={[
                        {
                          label: "Coconut sales",
                          value: selection.income.coconut,
                        },
                        {
                          label: "Other income",
                          value: selection.income.other,
                        },
                      ]}
                      totalLabel="Total income"
                    />
                  ) : (
                    <AmountRows
                      rows={selection.income.sales.map((sale) => ({
                        label: `${titleCase(sale.category)} (${sale.records} records)`,
                        value: sale.amount,
                      }))}
                      totalLabel="Total sales"
                    />
                  )}
                </div>
              )}
              {previewSection === "expenses" && (
                <div className="space-y-6">
                  {tab === "harvest" ? (
                    <AmountRows
                      rows={Object.entries(selection.expenses)
                        .filter(([key]) => key !== "total")
                        .map(([key, value]) => ({
                          label: titleCase(key),
                          value,
                        }))}
                      totalLabel="Total expenses"
                    />
                  ) : (
                    <AmountRows
                      rows={[
                        {
                          label: "Bird purchase",
                          value: selection.expenses.batchPurchase,
                        },
                        {
                          label: "Feed (net of returns)",
                          value: selection.expenses.feed,
                        },
                        {
                          label: "Medicine (net of returns)",
                          value: selection.expenses.medicine || 0,
                        },
                        {
                          label: "Other expenses",
                          value: selection.expenses.otherExpenses || 0,
                        },
                        {
                          label: "Poultry labour",
                          value: selection.expenses.labour || 0,
                        },
                      ]}
                      totalLabel="Total expenses"
                    />
                  )}
                </div>
              )}
              {previewSection === "profit" && (
                <div className="space-y-6">
                  <div className="table-container border border-gray-150 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-150 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                        <tr>
                          <th className="p-4 text-left">Summary Title</th>
                          <th className="p-4 text-right">Value Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-bold">
                        <tr>
                          <td className="p-4 text-gray-650">Total Income</td>
                          <td className="p-4 text-right text-green-700">
                            Rs. {money(selection.income.total)}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-4 text-gray-650">Total Expenses</td>
                          <td className="p-4 text-right text-red-600">
                            Rs. {money(selection.expenses.total)}
                          </td>
                        </tr>
                        <tr className="bg-gray-50 font-black">
                          <td className="p-4 text-gray-900 uppercase text-xs">
                            Net profit / loss
                          </td>
                          <td
                            className={`p-4 text-right text-lg ${selection.netProfit >= 0 ? "text-green-800" : "text-red-700"}`}
                          >
                            Rs. {money(selection.netProfit)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
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
      {printActiveSection === "income" && selection && (
        <div className="hidden print:block font-['Nunito'] space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">
              {tab === "harvest"
                ? "HARVEST CYCLE INCOME BREAKDOWN"
                : "POULTRY BATCH INCOME BREAKDOWN"}
            </h2>
            <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
              {tab === "harvest"
                ? `${selection.farm} Harvest`
                : `Poultry Batch #${selection.id}`}{" "}
              Cycle (
              {selection.startDate ? formatDate(selection.startDate) : "Start"}{" "}
              → {selection.endDate ? formatDate(selection.endDate) : "Present"})
            </p>
          </div>
          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-[#f3f4f6] text-[#111827] font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="p-4 text-left">Income Category</th>
                <th className="p-4 text-right">Value Amount</th>
              </tr>
            </thead>
            <tbody>
              {tab === "harvest" ? (
                <>
                  <tr className="border-b border-gray-200">
                    <td className="p-4 font-bold text-gray-700">
                      Coconut sales
                    </td>
                    <td className="p-4 text-right text-green-700 font-black">
                      Rs. {money(selection.income.coconut)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-4 font-bold text-gray-700">
                      Other income
                    </td>
                    <td className="p-4 text-right text-green-700 font-black">
                      Rs. {money(selection.income.other)}
                    </td>
                  </tr>
                </>
              ) : (
                selection.income.sales.map((sale, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="p-4 font-bold text-gray-700">
                      {titleCase(sale.category)} ({sale.records} records)
                    </td>
                    <td className="p-4 text-right text-green-700 font-black">
                      Rs. {money(sale.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-black border-t-2 border-gray-300">
                <td className="p-4 uppercase tracking-wider text-xs">
                  Total Income
                </td>
                <td className="p-4 text-right text-green-800 text-lg">
                  Rs. {money(selection.income.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {printActiveSection === "expenses" && selection && (
        <div className="hidden print:block font-['Nunito'] space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">
              {tab === "harvest"
                ? "HARVEST CYCLE EXPENSES BREAKDOWN"
                : "POULTRY BATCH EXPENSES BREAKDOWN"}
            </h2>
            <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
              {tab === "harvest"
                ? `${selection.farm} Harvest`
                : `Poultry Batch #${selection.id}`}{" "}
              Cycle (
              {selection.startDate ? formatDate(selection.startDate) : "Start"}{" "}
              → {selection.endDate ? formatDate(selection.endDate) : "Present"})
            </p>
          </div>
          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-[#f3f4f6] text-[#111827] font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="p-4 text-left">Expense Category</th>
                <th className="p-4 text-right">Value Amount</th>
              </tr>
            </thead>
            <tbody>
              {tab === "harvest" ? (
                Object.entries(selection.expenses)
                  .filter(([key]) => key !== "total")
                  .map(([key, value], i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="p-4 font-bold text-gray-700">
                        {titleCase(key)}
                      </td>
                      <td className="p-4 text-right text-red-650 font-black">
                        Rs. {money(value)}
                      </td>
                    </tr>
                  ))
              ) : (
                <>
                  <tr className="border-b border-gray-200">
                    <td className="p-4 font-bold text-gray-700">
                      Bird purchase
                    </td>
                    <td className="p-4 text-right text-red-650 font-black">
                      Rs. {money(selection.expenses.batchPurchase)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-4 font-bold text-gray-700">
                      Feed (net of returns)
                    </td>
                    <td className="p-4 text-right text-red-650 font-black">
                      Rs. {money(selection.expenses.feed)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-4 font-bold text-gray-700">
                      Medicine (net of returns)
                    </td>
                    <td className="p-4 text-right text-red-650 font-black">
                      Rs. {money(selection.expenses.medicine || 0)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-4 font-bold text-gray-700">
                      Other expenses
                    </td>
                    <td className="p-4 text-right text-red-650 font-black">
                      Rs. {money(selection.expenses.otherExpenses || 0)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-4 font-bold text-gray-700">
                      Poultry labour
                    </td>
                    <td className="p-4 text-right text-red-650 font-black">
                      Rs. {money(selection.expenses.labour || 0)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-black border-t-2 border-gray-350">
                <td className="p-4 uppercase tracking-wider text-xs">
                  Total Expenses
                </td>
                <td className="p-4 text-right text-red-700 text-lg">
                  Rs. {money(selection.expenses.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {printActiveSection === "profit" && selection && (
        <div className="hidden print:block font-['Nunito'] space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">
              {tab === "harvest"
                ? "HARVEST CYCLE PROFITABILITY REPORT"
                : "POULTRY BATCH PROFITABILITY REPORT"}
            </h2>
            <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
              {tab === "harvest"
                ? `${selection.farm} Harvest`
                : `Poultry Batch #${selection.id}`}{" "}
              Cycle (
              {selection.startDate ? formatDate(selection.startDate) : "Start"}{" "}
              → {selection.endDate ? formatDate(selection.endDate) : "Present"})
            </p>
          </div>
          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-[#f3f4f6] text-[#111827] font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="p-4 text-left">Summary Title</th>
                <th className="p-4 text-right">Value Amount</th>
              </tr>
            </thead>
            <tbody className="font-bold">
              <tr className="border-b border-gray-200">
                <td className="p-4 text-gray-700">Total Income</td>
                <td className="p-4 text-right text-green-700">
                  Rs. {money(selection.income.total)}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-4 text-gray-700">Total Expenses</td>
                <td className="p-4 text-right text-red-650 font-semibold">
                  Rs. {money(selection.expenses.total)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-black border-t-2 border-gray-300">
                <td className="p-4 uppercase tracking-wider text-xs">
                  Net profit / loss
                </td>
                <td
                  className={`p-4 text-right text-lg ${selection.netProfit >= 0 ? "text-green-800" : "text-rose-700"}`}
                >
                  Rs. {money(selection.netProfit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
