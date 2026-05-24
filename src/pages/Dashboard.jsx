import { useState } from 'react';
import {
  TrendingUp, Wallet, Users, Sprout, ArrowRight, 
  AlertCircle, CheckCircle2, Banknote, Calendar, ChevronRight
} from 'lucide-react';

// --- MOCK DATA FOR DASHBOARD ---
const kpiData = {
  totalRevenue: 3489320,
  totalPayroll: 425000,
  netProfit: 3064320,
  activeWorkforce: 24
};

const recentTransactions = [
  { id: 1, type: 'Income', title: 'Coconut Sale - MR1', amount: 840495, date: 'Today', status: 'Completed' },
  { id: 2, type: 'Income', title: 'Cashew Sale (26 Kg)', amount: 14040, date: 'Yesterday', status: 'Completed' },
  { id: 3, type: 'Expense', title: 'Advance - Jarsan', amount: 5000, date: 'May 18, 2026', status: 'Pending' },
  { id: 4, type: 'Expense', title: 'Weekly Payroll', amount: 125000, date: 'May 15, 2026', status: 'Paid' },
  { id: 5, type: 'Income', title: 'Banana Harvest', amount: 45000, date: 'May 14, 2026', status: 'Completed' },
];

const fmt = (n) => n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Dashboard() {
  const currentMonth = "May 2026";

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Estate Overview</h1>
          <p className="text-sm font-medium text-gray-500">
            Welcome back! Here is what's happening on the farm today.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm text-sm font-bold text-gray-700">
          <Calendar size={16} className="text-green-600" />
          {currentMonth}
        </div>
      </div>

      {/* ── MAIN KPI GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Revenue Card */}
        <div className="relative overflow-hidden rounded-[1.25rem] p-5 bg-gradient-to-br from-[#166534] to-[#14532d] text-white shadow-lg shadow-green-900/20 group border border-green-800/50 hover:-translate-y-1 transition-transform">
           <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[45px] opacity-20 bg-white group-hover:opacity-40 transition-opacity"></div>
           <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                 <TrendingUp size={20} className="text-green-300" />
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/20 uppercase tracking-wider backdrop-blur-md">Income</span>
           </div>
           <p className="text-white/80 text-sm font-medium mb-1 relative z-10">Total Revenue</p>
           <h3 className="text-2xl font-black relative z-10">Rs. {fmt(kpiData.totalRevenue)}</h3>
        </div>

      {/* Expenses/Payroll Card */}
      <div className="relative overflow-hidden rounded-[1.25rem] p-5 bg-gradient-to-br from-[#166534] to-[#14532d] text-white shadow-lg shadow-green-900/20 group border border-green-800/50 hover:-translate-y-1 transition-transform">
           <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[45px] opacity-20 bg-white group-hover:opacity-40 transition-opacity"></div>
           <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                 <Wallet size={20} className="text-rose-300" />
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/20 uppercase tracking-wider backdrop-blur-md">Expense</span>
           </div>
           <p className="text-white/80 text-sm font-medium mb-1 relative z-10">Total Payroll & Advances</p>
           <h3 className="text-2xl font-black relative z-10">Rs. {fmt(kpiData.totalPayroll)}</h3>
        </div>

      {/* Net Profit Card */}
      <div className="relative overflow-hidden rounded-[1.25rem] p-5 bg-gradient-to-br from-[#166534] to-[#14532d] text-white shadow-lg shadow-green-900/20 group border border-green-800/50 hover:-translate-y-1 transition-transform">
           <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[45px] opacity-20 bg-white group-hover:opacity-40 transition-opacity"></div>
           <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                 <Banknote size={20} className="text-blue-300" />
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/20 uppercase tracking-wider backdrop-blur-md">Profit</span>
           </div>
           <p className="text-white/80 text-sm font-medium mb-1 relative z-10">Estimated Net Flow</p>
           <h3 className="text-2xl font-black relative z-10">Rs. {fmt(kpiData.netProfit)}</h3>
        </div>

      {/* Workforce Card */}
      <div className="relative overflow-hidden rounded-[1.25rem] p-5 bg-gradient-to-br from-[#166534] to-[#14532d] text-white shadow-lg shadow-green-900/20 group border border-green-800/50 hover:-translate-y-1 transition-transform">
           <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[45px] opacity-20 bg-white group-hover:opacity-40 transition-opacity"></div>
           <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                 <Users size={20} className="text-orange-300" />
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/20 uppercase tracking-wider backdrop-blur-md">Active</span>
           </div>
           <p className="text-white/80 text-sm font-medium mb-1 relative z-10">Total Workforce</p>
           <h3 className="text-2xl font-black relative z-10">{kpiData.activeWorkforce} Staff</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── RECENT TRANSACTIONS (Span 2 cols) ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
             <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Banknote size={18} className="text-green-600" /> Recent Ledger Activity
             </h2>
             <button className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1">
                View Full Ledger <ArrowRight size={14} />
             </button>
          </div>
          <div className="p-2">
             <table className="w-full text-left border-collapse whitespace-nowrap">
                <tbody>
                  {recentTransactions.map((tx, idx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors group border-b border-gray-50 last:border-0">
                      <td className="p-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'Income' ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>
                            {tx.type === 'Income' ? <TrendingUp size={16} /> : <Wallet size={16} />}
                         </div>
                      </td>
                      <td className="p-3">
                         <p className="text-[13px] font-bold text-gray-900">{tx.title}</p>
                         <p className="text-[11px] font-semibold text-gray-500">{tx.date}</p>
                      </td>
                      <td className="p-3 text-right">
                         <p className={`text-[14px] font-black ${tx.type === 'Income' ? 'text-green-700' : 'text-rose-700'}`}>
                            {tx.type === 'Income' ? '+' : '-'} Rs. {fmt(tx.amount)}
                         </p>
                         <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${tx.status === 'Completed' || tx.status === 'Paid' ? 'text-blue-500' : 'text-amber-500'}`}>
                            {tx.status}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>

        {/* ── ACTION CENTER / ALERTS (Span 1 col) ── */}
        <div className="flex flex-col gap-6">
           
           {/* Pending Actions */}
           <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-5 shadow-sm">
              <h2 className="text-sm font-black text-amber-900 flex items-center gap-2 mb-4">
                 <AlertCircle size={16} className="text-amber-600" /> Pending Actions
              </h2>
              <div className="space-y-3">
                 <div className="bg-white p-3 rounded-xl border border-amber-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div>
                       <p className="text-xs font-bold text-gray-900">Mark Today's Attendance</p>
                       <p className="text-[10px] text-gray-500 font-medium">24 employees pending</p>
                    </div>
                    <ChevronRight size={16} className="text-amber-500" />
                 </div>
                 <div className="bg-white p-3 rounded-xl border border-amber-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div>
                       <p className="text-xs font-bold text-gray-900">Run Weekly Payroll</p>
                       <p className="text-[10px] text-gray-500 font-medium">Draft ready for review</p>
                    </div>
                    <ChevronRight size={16} className="text-amber-500" />
                 </div>
              </div>
           </div>

           {/* Quick Yield Summary */}
           <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex-1">
              <h2 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-4">
                 <Sprout size={16} className="text-green-600" /> Yield Summary
              </h2>
              <div className="space-y-4">
                 <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                       <span className="text-gray-700">MR1 Coconut Block</span>
                       <span className="text-green-700">6,400 Nuts</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-green-500 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                       <span className="text-gray-700">MR2 Coconut Block</span>
                       <span className="text-green-700">9,040 Nuts</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-green-600 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                 </div>
                 <div className="pt-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                       <CheckCircle2 size={14} className="text-green-500" />
                       Cashew Harvest Completed (May '24)
                    </div>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}