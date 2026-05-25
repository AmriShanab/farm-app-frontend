import { useState, useEffect } from 'react';
import {
  TrendingUp, Wallet, Users, Sprout, ArrowRight, 
  AlertCircle, CheckCircle2, Banknote, Calendar, Loader2, ChevronRight
} from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export default function Dashboard() {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpiData, setKpiData] = useState({
    totalRevenue: 0,
    totalPayroll: 0,
    netProfit: 0,
    activeWorkforce: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  
  const currentMonth = "May 2026"; // In a real app, calculate this dynamically (e.g., dayjs/moment)

  // --- API INTEGRATION ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      // Setup Basic Auth Headers
      const headers = new Headers();
      headers.set('Authorization', 'Basic ' + btoa('admin:admin123'));
      headers.set('Content-Type', 'application/json');

      try {
        // Fetch Summary KPIs and Recent Activity concurrently
        const [summaryRes, recentRes] = await Promise.all([
               fetch(`${apiBaseUrl}/dashboard/summary?month=05&year=2026`, { headers }),
               fetch(`${apiBaseUrl}/dashboard/recent`, { headers })
        ]);

        if (!summaryRes.ok || !recentRes.ok) {
          throw new Error('Failed to fetch dashboard data from server.');
        }

        const summaryData = await summaryRes.json();
        const recentData = await recentRes.json();

        // Update State (Assuming backend returns these keys, adjust mapping as needed based on actual JSON response)
        setKpiData({
          totalRevenue: summaryData.totalRevenue || 0,
          totalPayroll: summaryData.totalPayroll || 0,
          netProfit: summaryData.netProfit || 0,
          activeWorkforce: summaryData.activeWorkforce || 0
        });

        // Ensure recentData is an array before setting
        if (Array.isArray(recentData)) {
          setRecentTransactions(recentData);
        } else if (recentData.data && Array.isArray(recentData.data)) {
          setRecentTransactions(recentData.data);
        }

      } catch (err) {
        console.error("API Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
           <p className="font-bold tracking-wider uppercase text-sm">Loading Live Data...</p>
        </div>
      ) : (
        <>
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
            <div className="relative overflow-hidden rounded-[1.25rem] p-5 bg-gradient-to-br from-[#9f1239] to-[#881337] text-white shadow-lg shadow-rose-900/20 group border border-rose-800/50 hover:-translate-y-1 transition-transform">
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
            <div className="relative overflow-hidden rounded-[1.25rem] p-5 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] text-white shadow-lg shadow-blue-900/20 group border border-blue-800/50 hover:-translate-y-1 transition-transform">
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
            <div className="relative overflow-hidden rounded-[1.25rem] p-5 bg-gradient-to-br from-[#ea580c] to-[#c2410c] text-white shadow-lg shadow-orange-900/20 group border border-orange-800/50 hover:-translate-y-1 transition-transform">
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
            
            {/* ── RECENT TRANSACTIONS ── */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                 <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                    <Banknote size={18} className="text-green-600" /> Recent Ledger Activity
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
                          <td className="p-6 text-center text-gray-400 text-sm font-bold">No recent transactions found.</td>
                        </tr>
                      ) : (
                                    recentTransactions.map((tx, idx) => (
                                       <tr key={`${tx.id ?? 'tx'}-${tx.date ?? 'date'}-${tx.title ?? 'title'}-${idx}`} className="hover:bg-gray-50/80 transition-colors group border-b border-gray-50 last:border-0">
                            <td className="p-3 w-12">
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
                        ))
                      )}
                    </tbody>
                 </table>
              </div>
            </div>

            {/* ── ACTION CENTER / ALERTS ── */}
            <div className="flex flex-col gap-6">
               <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-5 shadow-sm">
                  <h2 className="text-sm font-black text-amber-900 flex items-center gap-2 mb-4">
                     <AlertCircle size={16} className="text-amber-600" /> Pending Actions
                  </h2>
                  <div className="space-y-3">
                     <div className="bg-white p-3 rounded-xl border border-amber-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div>
                           <p className="text-xs font-bold text-gray-900">Mark Today's Attendance</p>
                           <p className="text-[10px] text-gray-500 font-medium">Pending verification</p>
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

               <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex-1">
                  <h2 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-4">
                     <Sprout size={16} className="text-green-600" /> Active Operations
                  </h2>
                  <div className="space-y-4">
                     <div className="pt-2 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                           <CheckCircle2 size={14} className="text-green-500" />
                           API Connection Established
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                           <CheckCircle2 size={14} className="text-green-500" />
                           Data synchronized securely
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}