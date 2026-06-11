import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
   TrendingUp, Wallet, Users, Banknote, Calendar,
   Loader2, AlertCircle, Download,
   Leaf, Zap, Droplets, Settings, Wrench, FlaskConical,
   ArrowUpRight, ArrowDownRight, BarChart3
} from 'lucide-react';
import { getHeaders } from '../services/api';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) =>
   Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtInt = (n) => Number(n || 0).toLocaleString('en-LK');

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

const MONTH_NAMES = [
   'January', 'February', 'March', 'April', 'May', 'June',
   'July', 'August', 'September', 'October', 'November', 'December'
];

const EXPENSE_ICONS = {
   harvest: Leaf,
   maintenance: Wrench,
   ceb: Zap,
   fuel: Droplets,
   machinery: Settings,
   fertilizer: FlaskConical,
   payroll: Users,
   managerSalaries: Users,
   poultryFeed: Leaf,
   ownerFinancials: Banknote,
};

const EXPENSE_COLORS = {
   harvest: '#16a34a',
   maintenance: '#d97706',
   ceb: '#7c3aed',
   fuel: '#0284c7',
   machinery: '#64748b',
   fertilizer: '#15803d',
   payroll: '#ea580c',
   managerSalaries: '#dc2626',
   poultryFeed: '#65a30d',
   ownerFinancials: '#9333ea',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const KpiCard = ({ label, value, badge, icon: Icon, iconColor, positive }) => (
   <div className="relative overflow-hidden rounded-[1.25rem] p-5 bg-gradient-to-br from-[#166534] to-[#14532d] text-white shadow-lg shadow-green-900/20 group border border-green-800/50 hover:-translate-y-1 transition-transform print:shadow-none print:hover:translate-y-0 print:rounded-xl print:p-4">
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[45px] opacity-20 bg-white group-hover:opacity-40 transition-opacity print:hidden" />
      <div className="flex justify-between items-start mb-4 relative z-10">
         <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
            <Icon size={20} className={iconColor} />
         </div>
         <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/20 uppercase tracking-wider backdrop-blur-md">
            {badge}
         </span>
      </div>
      <p className="text-white/80 text-sm font-medium mb-1 relative z-10">{label}</p>
      <h3
         className={`text-2xl font-black relative z-10 ${positive === false ? 'text-rose-300' : positive === true ? 'text-green-300' : ''}`}
      >
         Rs. {fmt(value)}
      </h3>
   </div>
);

const SectionDivider = ({ label }) => (
   <div className="flex items-center gap-3 my-6 print:my-4">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">{label}</span>
      <div className="h-px flex-1 bg-gray-200" />
   </div>
);

const ExpenseBar = ({ label, amount, maxAmount, color }) => {
   const pct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
   return (
      <div className="flex items-center gap-3">
         <span className="w-28 shrink-0 text-[11px] font-bold text-gray-600 capitalize">{label.replace(/([A-Z])/g, ' $1').trim()}</span>
         <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color || '#166534' }} />
         </div>
         <span className="w-28 text-right text-[11px] font-black text-gray-800">Rs. {fmt(amount)}</span>
      </div>
   );
};

const VolumeTable = ({ volumes }) => (
   <table className="w-full text-sm border-collapse">
      <thead>
         <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left p-2 text-[11px] font-black text-gray-500 uppercase tracking-wider">Grade</th>
            <th className="text-right p-2 text-[11px] font-black text-gray-500 uppercase tracking-wider">Paid Qty</th>
            <th className="text-right p-2 text-[11px] font-black text-gray-500 uppercase tracking-wider">Free Qty</th>
            <th className="text-right p-2 text-[11px] font-black text-gray-500 uppercase tracking-wider">Total</th>
         </tr>
      </thead>
      <tbody>
         {Object.entries(volumes).map(([grade, data]) => (
            <tr key={grade} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
               <td className="p-2 font-bold text-gray-800 capitalize">{grade.replace('_', ' ')}</td>
               <td className="p-2 text-right text-gray-600">{fmtInt(data.paid_qty)}</td>
               <td className="p-2 text-right text-gray-500">{fmtInt(data.free_qty)}</td>
               <td className="p-2 text-right font-black text-gray-900">{fmtInt(data.total)}</td>
            </tr>
         ))}
      </tbody>
   </table>
);

const ProfitBadge = ({ value }) => {
   const isPos = value >= 0;
   return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black ${isPos ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
         {isPos ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
         Rs. {fmt(Math.abs(value))}
      </span>
   );
};

// ─── Farm Card ───────────────────────────────────────────────────────────────

const FarmCard = ({ farm }) => {
   const maxExpense = Math.max(...Object.entries(farm.expenses)
      .filter(([k]) => k !== 'total')
      .map(([, v]) => v));

   return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden print:shadow-none print:border print:border-gray-200 print:break-inside-avoid">
         {/* Card header */}
         <div className="p-4 bg-gradient-to-r from-[#166534]/5 to-transparent border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-xl bg-green-700 flex items-center justify-center text-white font-black text-sm">
                  {farm.farmName}
               </div>
               <div>
                  <p className="text-sm font-black text-gray-900">Farm {farm.farmName}</p>
                  <p className="text-[11px] font-medium text-gray-500">Individual breakdown</p>
               </div>
            </div>
            <ProfitBadge value={farm.netProfit} />
         </div>

         <div className="p-5 space-y-5">
            {/* Coconut Volumes */}
            <div>
               <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  Coconut Volumes
               </h4>
               <VolumeTable volumes={farm.volumes} />
            </div>

            {/* Income vs Expenses row */}
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-green-50 rounded-xl border border-green-100 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-green-700 mb-2">Income</p>
                  <div className="space-y-1">
                     <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Coconut</span>
                        <span className="font-bold text-gray-800">Rs. {fmt(farm.income.coconut)}</span>
                     </div>
                     {farm.income.other > 0 && (
                        <div className="flex justify-between text-xs">
                           <span className="text-gray-600">Other</span>
                           <span className="font-bold text-gray-800">Rs. {fmt(farm.income.other)}</span>
                        </div>
                     )}
                     <div className="flex justify-between text-xs pt-1 border-t border-green-200">
                        <span className="font-black text-green-800">Total</span>
                        <span className="font-black text-green-800">Rs. {fmt(farm.income.total)}</span>
                     </div>
                  </div>
               </div>

               <div className="bg-rose-50 rounded-xl border border-rose-100 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700 mb-2">Expenses</p>
                  <div className="space-y-1">
                     {Object.entries(farm.expenses)
                        .filter(([k, v]) => k !== 'total' && v > 0)
                        .slice(0, 4)
                        .map(([k, v]) => (
                           <div key={k} className="flex justify-between text-xs">
                              <span className="text-gray-600 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="font-bold text-gray-800">Rs. {fmt(v)}</span>
                           </div>
                        ))}
                     <div className="flex justify-between text-xs pt-1 border-t border-rose-200">
                        <span className="font-black text-rose-800">Total</span>
                        <span className="font-black text-rose-800">Rs. {fmt(farm.expenses.total)}</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Expense bars */}
            <div>
               <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  Expense Distribution
               </h4>
               <div className="space-y-2.5">
                  {Object.entries(farm.expenses)
                     .filter(([k, v]) => k !== 'total' && v > 0)
                     .sort(([, a], [, b]) => b - a)
                     .map(([k, v]) => (
                        <ExpenseBar
                           key={k}
                           label={k}
                           amount={v}
                           maxAmount={maxExpense}
                           color={EXPENSE_COLORS[k]}
                        />
                     ))}
               </div>
            </div>
         </div>
      </div>
   );
};

// ─── Global Operations Card ───────────────────────────────────────────────────

const GlobalOpsCard = ({ globalOps }) => {
   const maxExpense = Math.max(...Object.entries(globalOps.expenses)
      .filter(([k]) => k !== 'total')
      .map(([, v]) => v));

   return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden print:shadow-none print:border print:border-gray-200 print:break-inside-avoid">
         <div className="p-4 bg-gradient-to-r from-blue-600/5 to-transparent border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center">
                  <BarChart3 size={16} className="text-white" />
               </div>
               <div>
                  <p className="text-sm font-black text-gray-900">Global Operations</p>
                  <p className="text-[11px] font-medium text-gray-500">Cashew · Poultry · Management</p>
               </div>
            </div>
            <ProfitBadge value={globalOps.netProfit} />
         </div>

         <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
               <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Income Sources</h4>
               <div className="space-y-2">
                  {Object.entries(globalOps.income)
                     .filter(([k]) => k !== 'total')
                     .map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between bg-green-50 rounded-xl p-3 border border-green-100">
                           <span className="text-xs font-bold text-gray-700 capitalize">{k}</span>
                           <span className="text-sm font-black text-green-800">Rs. {fmt(v)}</span>
                        </div>
                     ))}
                  <div className="flex items-center justify-between bg-green-700 rounded-xl p-3">
                     <span className="text-xs font-black text-green-100">Total Income</span>
                     <span className="text-sm font-black text-white">Rs. {fmt(globalOps.income.total)}</span>
                  </div>
               </div>
            </div>

            <div>
               <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Expense Breakdown</h4>
               <div className="space-y-2.5">
                  {Object.entries(globalOps.expenses)
                     .filter(([k, v]) => k !== 'total' && v > 0)
                     .sort(([, a], [, b]) => b - a)
                     .map(([k, v]) => (
                        <ExpenseBar
                           key={k}
                           label={k}
                           amount={v}
                           maxAmount={maxExpense}
                           color={EXPENSE_COLORS[k]}
                        />
                     ))}
               </div>
               <div className="mt-3 flex items-center justify-between bg-rose-50 rounded-xl p-3 border border-rose-100">
                  <span className="text-xs font-black text-rose-800">Total Expenses</span>
                  <span className="text-sm font-black text-rose-800">Rs. {fmt(globalOps.expenses.total)}</span>
               </div>
            </div>
         </div>
      </div>
   );
};

// ─── Summary Banner ───────────────────────────────────────────────────────────

const SummaryBanner = ({ summary }) => {
   const profitPct = summary.totalIncome > 0
      ? ((summary.grandNetProfit / summary.totalIncome) * 100).toFixed(1)
      : 0;

   const expenseRatio = ((summary.totalExpenses / summary.totalIncome) * 100).toFixed(1);

   return (
      <div className="bg-gradient-to-br from-[#14532d] via-[#166534] to-[#15803d] rounded-2xl p-6 text-white shadow-xl shadow-green-900/25 print:shadow-none print:rounded-xl">
         <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
               <BarChart3 size={16} />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white/90">Consolidated Summary</h2>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-md border border-white/10">
               <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Total Income</p>
               <p className="text-lg font-black">Rs. {fmt(summary.totalIncome)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-md border border-white/10">
               <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Total Expenses</p>
               <p className="text-lg font-black">Rs. {fmt(summary.totalExpenses)}</p>
            </div>
            <div className={`rounded-xl p-3 backdrop-blur-md border ${summary.grandNetProfit >= 0 ? 'bg-green-400/20 border-green-400/30' : 'bg-rose-400/20 border-rose-400/30'}`}>
               <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Net Profit</p>
               <p className={`text-lg font-black ${summary.grandNetProfit >= 0 ? 'text-green-200' : 'text-rose-200'}`}>
                  Rs. {fmt(summary.grandNetProfit)}
               </p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-md border border-white/10">
               <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Profit Margin</p>
               <p className={`text-lg font-black ${profitPct >= 0 ? 'text-green-200' : 'text-rose-200'}`}>
                  {profitPct}%
               </p>
            </div>
         </div>

         {/* Source breakdown */}
         <div className="grid grid-cols-2 gap-4">
            <div>
               <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-2">Income Sources</p>
               <div className="space-y-2">
                  <div className="flex items-center gap-2">
                     <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-green-300" style={{ width: `${(summary.incomeBreakdown.fromFarms / summary.totalIncome) * 100}%` }} />
                     </div>
                     <span className="text-xs font-bold w-16 text-right">Rs. {fmt(summary.incomeBreakdown.fromFarms)}</span>
                  </div>
                  <p className="text-[10px] text-white/60">From Farms</p>
                  <div className="flex items-center gap-2">
                     <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-300" style={{ width: `${(summary.incomeBreakdown.fromGlobal / summary.totalIncome) * 100}%` }} />
                     </div>
                     <span className="text-xs font-bold w-16 text-right">Rs. {fmt(summary.incomeBreakdown.fromGlobal)}</span>
                  </div>
                  <p className="text-[10px] text-white/60">Global Ops</p>
               </div>
            </div>
            <div>
               <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-2">Expense Sources</p>
               <div className="space-y-2">
                  <div className="flex items-center gap-2">
                     <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-rose-300" style={{ width: `${(summary.expenseBreakdown.fromFarms / summary.totalExpenses) * 100}%` }} />
                     </div>
                     <span className="text-xs font-bold w-16 text-right">Rs. {fmt(summary.expenseBreakdown.fromFarms)}</span>
                  </div>
                  <p className="text-[10px] text-white/60">From Farms</p>
                  <div className="flex items-center gap-2">
                     <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-orange-300" style={{ width: `${(summary.expenseBreakdown.fromGlobal / summary.totalExpenses) * 100}%` }} />
                     </div>
                     <span className="text-xs font-bold w-16 text-right">Rs. {fmt(summary.expenseBreakdown.fromGlobal)}</span>
                  </div>
                  <p className="text-[10px] text-white/60">Global Ops</p>
               </div>
            </div>
         </div>
      </div>
   );
};

// ─── Month Picker ─────────────────────────────────────────────────────────────

const MonthPicker = ({ month, year, onChange }) => {
   const now = new Date();
   return (
      <div className="flex items-center gap-2">
         <select
            value={month}
            onChange={(e) => onChange(Number(e.target.value), year)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
         >
            {MONTH_NAMES.map((m, i) => (
               <option key={m} value={i + 1}>{m}</option>
            ))}
         </select>
         <select
            value={year}
            onChange={(e) => onChange(month, Number(e.target.value))}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
         >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
               <option key={y} value={y}>{y}</option>
            ))}
         </select>
      </div>
   );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MonthBreakdown() {
   const now = new Date();
   const [month, setMonth] = useState(now.getMonth() + 1);
   const [year, setYear] = useState(now.getFullYear());
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [data, setData] = useState(null);
   useEffect(() => {
      const fetchBreakdown = async () => {
         setLoading(true);
         setError(null);
         try {
            const headers = getHeaders();
            const res = await fetch(
               `${apiBaseUrl}/dashboard/month-breakdown?month=${month}&year=${year}`,
               { headers }
            );
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const json = await res.json();
            if (!json.success) throw new Error(json.message || 'API returned failure');
            setData(json.data);
         } catch (err) {
            console.error('MonthBreakdown fetch error:', err);
            setError(err.message);
         } finally {
            setLoading(false);
         }
      };
      fetchBreakdown();
   }, [month, year]);

   const handleExportExcel = () => {
      if (!data) return;
      const wb = XLSX.utils.book_new();
      const period = `${MONTH_NAMES[month - 1]} ${year}`;

      // ── Helper: append rows with a blank spacer
      const addSection = (rows, title, dataRows) => {
         rows.push([title]);
         rows.push(...dataRows);
         rows.push([]);
      };

      // ── Sheet 1: Summary ────────────────────────────────────────
      const summaryRows = [];
      summaryRows.push(['Estate Monthly Breakdown', period]);
      summaryRows.push([]);
      addSection(summaryRows, 'CONSOLIDATED SUMMARY', [
         ['Metric', 'Amount (Rs.)'],
         ['Total Income', Number(data.summary.totalIncome)],
         ['Total Expenses', Number(data.summary.totalExpenses)],
         ['Net Profit', Number(data.summary.grandNetProfit)],
         ['Profit Margin (%)', data.summary.totalIncome > 0
            ? +((data.summary.grandNetProfit / data.summary.totalIncome) * 100).toFixed(2)
            : 0],
         ['Income from Farms', Number(data.summary.incomeBreakdown.fromFarms)],
         ['Income from Global Ops', Number(data.summary.incomeBreakdown.fromGlobal)],
         ['Expenses from Farms', Number(data.summary.expenseBreakdown.fromFarms)],
         ['Expenses from Global Ops', Number(data.summary.expenseBreakdown.fromGlobal)],
      ]);

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // ── Sheet 2: Farm Comparison ─────────────────────────────────
      const farmNames = data.farms.map((f) => `Farm ${f.farmName}`);
      const compRows = [];
      compRows.push(['Estate Monthly Breakdown — Farm Comparison', period]);
      compRows.push([]);
      compRows.push(['Metric', ...farmNames, 'Global Ops']);

      const compMetrics = [
         { label: 'Total Income',   fn: (f) => Number(f.income.total) },
         { label: 'Total Expenses', fn: (f) => Number(f.expenses.total) },
         { label: 'Net Profit',     fn: (f) => Number(f.netProfit) },
         { label: 'Payroll',        fn: (f) => Number(f.expenses.payroll || 0) },
         { label: 'Fuel',           fn: (f) => Number(f.expenses.fuel || 0) },
         { label: 'Harvest',        fn: (f) => Number(f.expenses.harvest || 0) },
         { label: 'Fertilizer',     fn: (f) => Number(f.expenses.fertilizer || 0) },
         { label: 'Maintenance',    fn: (f) => Number(f.expenses.maintenance || 0) },
         { label: 'CEB',            fn: (f) => Number(f.expenses.ceb || 0) },
         { label: 'Machinery',      fn: (f) => Number(f.expenses.machinery || 0) },
      ];

      compMetrics.forEach(({ label, fn }) => {
         compRows.push([label, ...data.farms.map(fn), label === 'Net Profit' ? Number(data.global_operations.netProfit) : '—']);
      });

      const wsComp = XLSX.utils.aoa_to_sheet(compRows);
      wsComp['!cols'] = [{ wch: 22 }, ...farmNames.map(() => ({ wch: 18 })), { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsComp, 'Farm Comparison');

      // ── Sheet per farm ───────────────────────────────────────────
      data.farms.forEach((farm) => {
         const rows = [];
         rows.push([`Farm ${farm.farmName} — ${period}`]);
         rows.push([]);

         addSection(rows, 'COCONUT VOLUMES', [
            ['Grade', 'Paid Qty', 'Free Qty', 'Total'],
            ...Object.entries(farm.volumes).map(([grade, d]) => [
               grade.replace('_', ' '),
               Number(d.paid_qty),
               Number(d.free_qty),
               Number(d.total),
            ]),
         ]);

         addSection(rows, 'INCOME', [
            ['Source', 'Amount (Rs.)'],
            ['Coconut', Number(farm.income.coconut)],
            ...(farm.income.other > 0 ? [['Other', Number(farm.income.other)]] : []),
            ['TOTAL', Number(farm.income.total)],
         ]);

         addSection(rows, 'EXPENSES', [
            ['Category', 'Amount (Rs.)'],
            ...Object.entries(farm.expenses)
               .filter(([k]) => k !== 'total')
               .map(([k, v]) => [k.replace(/([A-Z])/g, ' $1').trim(), Number(v)]),
            ['TOTAL', Number(farm.expenses.total)],
         ]);

         rows.push(['NET PROFIT', Number(farm.netProfit)]);

         const ws = XLSX.utils.aoa_to_sheet(rows);
         ws['!cols'] = [{ wch: 26 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
         XLSX.utils.book_append_sheet(wb, ws, `Farm ${farm.farmName}`);
      });

      // ── Sheet: Global Operations ──────────────────────────────────
      const globalRows = [];
      globalRows.push([`Global Operations — ${period}`]);
      globalRows.push([]);
      addSection(globalRows, 'INCOME', [
         ['Source', 'Amount (Rs.)'],
         ...Object.entries(data.global_operations.income)
            .filter(([k]) => k !== 'total')
            .map(([k, v]) => [k, Number(v)]),
         ['TOTAL', Number(data.global_operations.income.total)],
      ]);
      addSection(globalRows, 'EXPENSES', [
         ['Category', 'Amount (Rs.)'],
         ...Object.entries(data.global_operations.expenses)
            .filter(([k]) => k !== 'total')
            .map(([k, v]) => [k.replace(/([A-Z])/g, ' $1').trim(), Number(v)]),
         ['TOTAL', Number(data.global_operations.expenses.total)],
      ]);
      globalRows.push(['NET PROFIT', Number(data.global_operations.netProfit)]);

      const wsGlobal = XLSX.utils.aoa_to_sheet(globalRows);
      wsGlobal['!cols'] = [{ wch: 26 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsGlobal, 'Global Operations');

      XLSX.writeFile(wb, `Monthly_Breakdown_${MONTH_NAMES[month - 1]}_${year}.xlsx`);
   };

   const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`;

   return (
      <div
         style={{ fontFamily: "'Nunito', sans-serif", maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}
      >
         {/* ── Print-only header ── */}
         <div className="print-header">
            <div>
               <p style={{ fontSize: '18px', fontWeight: 900, color: '#14532d', margin: 0 }}>
                  Estate Monthly Breakdown
               </p>
               <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>{periodLabel} · All Farms</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '10px', color: '#9ca3af' }}>
               <p style={{ margin: 0, fontWeight: 700 }}>Confidential</p>
               <p style={{ margin: 0 }}>Generated {new Date().toLocaleDateString('en-LK')}</p>
            </div>
         </div>

         {/* ── Screen header ── */}
         <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 no-print">
            <div>
               <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Month Breakdown</h1>
               <p className="text-sm font-medium text-gray-500">
                  Full financial breakdown across all farms and operations.
               </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
               <MonthPicker
                  month={month}
                  year={year}
                  onChange={(m, y) => { setMonth(m); setYear(y); }}
               />
               <button
                  onClick={handleExportExcel}
                  disabled={!data || loading}
                  className="flex items-center gap-2 bg-[#166534] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-[#14532d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  <Download size={15} />
                  Export Excel
               </button>
            </div>
         </div>

         {/* ── Period label (screen only) ── */}
         <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm text-sm font-bold text-gray-700 w-fit mb-6 no-print">
            <Calendar size={16} className="text-green-600" />
            {periodLabel}
         </div>

         {/* ── Error ── */}
         {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm font-bold">
               <AlertCircle size={18} />
               {error} — Please ensure the backend server is running.
            </div>
         )}

         {/* ── Loading ── */}
         {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-green-700">
               <Loader2 size={40} className="animate-spin mb-4" />
               <p className="font-bold tracking-wider uppercase text-sm">Loading Breakdown...</p>
            </div>
         ) : data ? (
            <>
               {/* ── Top KPIs ── */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <KpiCard
                     label="Total Income"
                     value={data.summary.totalIncome}
                     badge="Income"
                     icon={TrendingUp}
                     iconColor="text-green-300"
                     positive={true}
                  />
                  <KpiCard
                     label="Total Expenses"
                     value={data.summary.totalExpenses}
                     badge="Expense"
                     icon={Wallet}
                     iconColor="text-rose-300"
                     positive={false}
                  />
                  <KpiCard
                     label="Net Profit"
                     value={data.summary.grandNetProfit}
                     badge="Profit"
                     icon={Banknote}
                     iconColor="text-blue-300"
                     positive={data.summary.grandNetProfit >= 0}
                  />
                  <KpiCard
                     label="Active Farms"
                     value={data.farms.length}
                     badge="Farms"
                     icon={Leaf}
                     iconColor="text-emerald-300"
                  />
               </div>

               {/* ── Consolidated Summary ── */}
               <SummaryBanner summary={data.summary} />

               <SectionDivider label="Farm-Level Breakdown" />

               {/* ── Per-Farm Cards ── */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {data.farms.map((farm) => (
                     <FarmCard key={farm.farmName} farm={farm} />
                  ))}
               </div>

               <SectionDivider label="Global Operations" />

               {/* ── Global Ops ── */}
               <GlobalOpsCard globalOps={data.global_operations} />

               {/* ── Farm comparison table ── */}
               <SectionDivider label="Farm Comparison" />
               <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden print:shadow-none print:border print:border-gray-200 print:break-inside-avoid">
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                     <h2 className="text-sm font-black text-gray-900">Side-by-Side Farm Comparison</h2>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-sm border-collapse">
                        <thead>
                           <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-left p-3 text-[11px] font-black text-gray-500 uppercase tracking-wider">Metric</th>
                              {data.farms.map((f) => (
                                 <th key={f.farmName} className="text-right p-3 text-[11px] font-black text-gray-500 uppercase tracking-wider">
                                    Farm {f.farmName}
                                 </th>
                              ))}
                              <th className="text-right p-3 text-[11px] font-black text-green-700 uppercase tracking-wider bg-green-50/50">
                                 Global Ops
                              </th>
                           </tr>
                        </thead>
                        <tbody>
                           {[
                              { label: 'Total Income', key: 'income', sub: 'total', from: 'income' },
                              { label: 'Total Expenses', key: 'expenses', sub: 'total', from: 'expenses' },
                              { label: 'Net Profit', key: 'netProfit', isRoot: true },
                              { label: '— Payroll', key: 'expenses', sub: 'payroll', from: 'expenses' },
                              { label: '— Fuel', key: 'expenses', sub: 'fuel', from: 'expenses' },
                              { label: '— Harvest', key: 'expenses', sub: 'harvest', from: 'expenses' },
                              { label: '— Fertilizer', key: 'expenses', sub: 'fertilizer', from: 'expenses' },
                           ].map((row) => {
                              const isProfit = row.isRoot;
                              return (
                                 <tr key={row.label} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                                    <td className="p-3 font-bold text-gray-700 text-xs">{row.label}</td>
                                    {data.farms.map((f) => {
                                       let val = isProfit
                                          ? f.netProfit
                                          : (row.from === 'income' ? f.income[row.sub] : f.expenses[row.sub]) ?? 0;
                                       const isNeg = val < 0;
                                       return (
                                          <td key={f.farmName} className={`p-3 text-right font-black text-xs ${isProfit ? (isNeg ? 'text-rose-600' : 'text-green-600') : 'text-gray-800'}`}>
                                             Rs. {fmt(val)}
                                          </td>
                                       );
                                    })}
                                    <td className="p-3 text-right text-xs text-gray-400 bg-green-50/30">—</td>
                                 </tr>
                              );
                           })}
                           {/* Global ops row */}
                           <tr className="bg-blue-50/30 border-t-2 border-blue-100">
                              <td className="p-3 font-black text-blue-800 text-xs">Global Net Profit</td>
                              {data.farms.map((f) => (
                                 <td key={f.farmName} className="p-3 text-right text-xs text-gray-400">—</td>
                              ))}
                              <td className={`p-3 text-right font-black text-xs ${data.global_operations.netProfit >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                                 Rs. {fmt(data.global_operations.netProfit)}
                              </td>
                           </tr>
                        </tbody>
                     </table>
                  </div>
               </div>

               {/* ── Print footer ── */}
               <div className="print-footer">
                  <p>Estate Monthly Report · {periodLabel} · Confidential · Auto-generated</p>
               </div>
            </>
         ) : null}
      </div>
   );
}