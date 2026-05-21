import { 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Sprout, 
  Bird, 
  Tractor,
  CalendarDays,
  ArrowUpRight,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';

// Mock Data for the Dashboard
const recentTransactions = [
  { id: 1, title: 'MR1 Coconut Sales', type: 'income', amount: '+ Rs. 425,000', date: 'Today, 10:30 AM', category: 'Estate' },
  { id: 2, title: 'Poultry Feed (Owner)', type: 'expense', amount: '- Rs. 85,000', date: 'Yesterday', category: 'Poultry' },
  { id: 3, title: 'Hilux Service & Oil', type: 'expense', amount: '- Rs. 45,000', date: 'May 18, 2026', category: 'Operations' },
  { id: 4, title: 'Egg Batch Sale', type: 'income', amount: '+ Rs. 112,000', date: 'May 17, 2026', category: 'Poultry' },
];

const alerts = [
  { id: 1, title: 'MR1 Fertilizer Due', urgency: 'critical', desc: '100-day cycle complete for MR1 blocks A & B.', icon: Sprout },
  { id: 2, title: 'Tafe Warranty Expiring', urgency: 'warning', desc: 'Rotary parts warranty expires in 12 days.', icon: Tractor },
];

// Unified Green Fill Metric Card
const MetricCard = ({ title, amount, percentage, isUp }) => {
  const gradId = `grad-${title.replace(/\s+/g, '')}`;
  // Using a very light green/white for the chart to pop against the dark green background
  const chartColor = "#A5D6A7"; 

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] p-6 bg-gradient-to-br from-primary to-[#205c24] text-white shadow-lg shadow-primary/20 group border border-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-1">
       {/* Glowing Radial Blur for depth */}
       <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[45px] opacity-20 bg-white transition-opacity duration-500 group-hover:opacity-40"></div>

       {/* Header */}
       <div className="flex justify-between items-center relative z-10 mb-2">
          <span className="text-sm font-medium text-white/80">{title}</span>
          <button className="text-white/70 hover:text-white transition-colors bg-black/10 p-1.5 rounded-lg backdrop-blur-sm">
             <MoreHorizontal size={18} />
          </button>
       </div>

       {/* Amount */}
       <h3 className="text-3xl font-bold font-heading relative z-10 mb-6 tracking-tight">
         {amount}
       </h3>

       {/* Profit/Loss Badge */}
       <div className="flex items-center gap-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/20 text-white backdrop-blur-md">
             {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
             <span>{percentage}</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
             {isUp ? 'Profit' : 'Expense'}
          </span>
       </div>

       {/* SVG Wave Chart Background */}
       <div className="absolute bottom-0 left-0 w-full h-[45%] opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
           <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                 <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={chartColor} stopOpacity="0.0" />
                 </linearGradient>
              </defs>
              {isUp ? (
                 <path d="M0,40 L0,25 C 20,30 40,10 60,15 C 80,20 90,5 100,5 L100,40 Z" fill={`url(#${gradId})`} stroke={chartColor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              ) : (
                 <path d="M0,40 L0,10 C 20,5 40,20 60,15 C 80,10 90,30 100,30 L100,40 Z" fill={`url(#${gradId})`} stroke={chartColor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              )}
           </svg>
       </div>
    </div>
  );
};

export default function Dashboard() {
  return (
    // Added a forced white background wrapper for the dashboard content
    <div className="bg-white min-h-full rounded-3xl p-2 sm:p-6 space-y-6 max-w-[1600px] mx-auto pb-8">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div>
          <h1 className="text-2xl font-bold text-text font-heading">Estate Overview</h1>
          <p className="text-sm text-earth">Your financial and operational summary for May 2026</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-text hover:text-primary transition-colors shadow-sm">
            Download Report
          </button>
          <button className="btn-primary rounded-xl flex items-center gap-2">
            <span>+ New Entry</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (All Solid Green) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard 
           title="Total Cash Balance" 
           amount="Rs. 2,171,500" 
           percentage="+12.5%" 
           isUp={true} 
         />
         <MetricCard 
           title="Estate Income (MTD)" 
           amount="Rs. 844,780" 
           percentage="+5.2%" 
           isUp={true} 
         />
         <MetricCard 
           title="Poultry Income (MTD)" 
           amount="Rs. 312,400" 
           percentage="+2.1%" 
           isUp={true} 
         />
         <MetricCard 
           title="Total Expenses (MTD)" 
           amount="Rs. 420,610" 
           percentage="-1.4%" 
           isUp={false} 
         />
      </div>

      {/* 3. Middle Section: Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
        
        {/* Left: Custom CSS Bar Chart */}
        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 z-10 relative">
          <div className="flex justify-between items-center mb-8">
            <div>
               <h3 className="text-lg font-bold text-text font-heading">Financial Overview</h3>
               <p className="text-sm text-earth">Income vs Expenses (Last 6 Months)</p>
            </div>
            <select className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-1.5 text-text focus:outline-none focus:ring-2 focus:ring-primary/20">
               <option>MR1 & MR2</option>
               <option>Poultry Only</option>
            </select>
          </div>
          
          {/* Mock Chart Area */}
          <div className="h-64 flex items-end justify-between gap-2 px-2">
            {[40, 70, 45, 90, 65, 85].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end gap-1 group relative">
                 <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-text text-white text-xs py-1 px-2 rounded pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-md">
                    Est: Rs. {(height * 12000).toLocaleString()}
                 </div>
                 {/* Expense Bar */}
                 <div style={{ height: `${height * 0.6}%` }} className="w-full max-w-[40px] mx-auto bg-gray-200 rounded-t-sm hover:bg-gray-300 transition-colors cursor-pointer"></div>
                 {/* Income Bar (Primary Green) */}
                 <div style={{ height: `${height}%` }} className="w-full max-w-[40px] mx-auto bg-primary-light/70 rounded-t-md hover:bg-primary transition-colors cursor-pointer relative overflow-hidden">
                    <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-primary to-transparent opacity-50"></div>
                 </div>
                 <span className="text-center text-xs text-earth mt-2 font-medium">
                   {['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'][i]}
                 </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Transactions Feed */}
        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-text font-heading">Recent Activity</h3>
            <button className="text-sm text-primary font-medium hover:underline">View All</button>
          </div>
          
          <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-2">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-primary/10 text-primary' : 'bg-red-50 text-red-500'}`}>
                    {tx.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text group-hover:text-primary transition-colors">{tx.title}</p>
                    <p className="text-xs text-earth flex items-center gap-1">
                      {tx.date} • <span className="uppercase text-[10px] tracking-wider font-bold">{tx.category}</span>
                    </p>
                  </div>
                </div>
                <div className={`text-sm font-bold ${tx.type === 'income' ? 'text-primary' : 'text-text'}`}>
                  {tx.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Alerts & Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Actionable Alerts */}
         <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-text font-heading mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-500" />
              Action Items
            </h3>
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all cursor-pointer">
                  <div className={`p-2 rounded-lg ${alert.urgency === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                     <alert.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-text flex items-center gap-2">
                      {alert.title}
                      <span className={alert.urgency === 'critical' ? 'bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold' : 'bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold'}>
                        {alert.urgency === 'critical' ? 'Action Required' : 'Upcoming'}
                      </span>
                    </h4>
                    <p className="text-xs text-earth mt-1">{alert.desc}</p>
                  </div>
                  <button className="text-gray-400 hover:text-primary">
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              ))}
            </div>
         </div>

         {/* Quick Operational Stats */}
         <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 flex flex-col justify-center">
            <h3 className="text-lg font-bold text-text font-heading mb-6">Operations Snapshot</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <p className="text-xs text-earth font-medium mb-1 flex items-center gap-1"><CalendarDays size={14}/> Next Harvest</p>
                  <p className="text-lg font-bold text-text">MR1: In 14 Days</p>
               </div>
               <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <p className="text-xs text-earth font-medium mb-1">Active Laborers</p>
                  <p className="text-lg font-bold text-text">12 Working Today</p>
               </div>
               <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <p className="text-xs text-earth font-medium mb-1">Tafe Fuel Level</p>
                  <p className="text-lg font-bold text-text">Sufficient</p>
               </div>
               <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <p className="text-xs text-earth font-medium mb-1">Poultry Batch 4</p>
                  <p className="text-lg font-bold text-text">Week 6</p>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}