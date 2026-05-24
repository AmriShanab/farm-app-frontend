import { useState } from 'react';
import {
  Calculator, Download, Search, SlidersHorizontal,
  Wallet, Banknote, FileCheck, CheckCircle2, ChevronLeft, ChevronRight
} from 'lucide-react';

// --- MOCK DATA (Simulating the Database Join) ---
// In a real app, your backend does this math: 
// (Base Wage * Days Worked) - Pending Advances = Net Pay
const initialPayrollData = [
  { id: '2', name: 'Jabir', role: 'Laborer', type: 'Daily', wage: 1800, daysWorked: 5.5, gross: 9900, advanceDeduction: 2000, status: 'Draft' },
  { id: '3', name: 'Ajmeer', role: 'Laborer', type: 'Daily', wage: 2000, daysWorked: 6, gross: 12000, advanceDeduction: 0, status: 'Draft' },
  { id: '4', name: 'Jarsan', role: 'Tractor Driver', type: 'Daily', wage: 2500, daysWorked: 6, gross: 15000, advanceDeduction: 5000, status: 'Draft' },
  { id: '5', name: 'Rifaideen', role: 'Laborer', type: 'Daily', wage: 2000, daysWorked: 5.5, gross: 11000, advanceDeduction: 3000, status: 'Draft' },
  { id: '6', name: 'Askan', role: 'Laborer', type: 'Daily', wage: 1800, daysWorked: 7, gross: 12600, advanceDeduction: 0, status: 'Draft' },
  // Manager is fixed monthly, usually processed separately at month-end, but included here for completeness
  { id: '1', name: 'Faizaar', role: 'Manager', type: 'Monthly', wage: 155000, daysWorked: 'N/A', gross: 155000, advanceDeduction: 10000, status: 'Draft' },
];

const fmt = (n) => n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function RunPayroll() {
  const [payrollData, setPayrollData] = useState(initialPayrollData);
  const [search, setSearch] = useState('');
  const [isFinalized, setIsFinalized] = useState(false);

  const filtered = payrollData.filter(emp =>
    !search || emp.name.toLowerCase().includes(search.toLowerCase()) || emp.role.toLowerCase().includes(search.toLowerCase())
  );

  // --- KPI Math ---
  // Net Pay = Gross - Advances
  const totalGross = payrollData.reduce((sum, emp) => sum + emp.gross, 0);
  const totalDeductions = payrollData.reduce((sum, emp) => sum + emp.advanceDeduction, 0);
  const totalNetPayout = totalGross - totalDeductions;

  // --- Action Handler ---
  const handleFinalizePayroll = () => {
    if (confirm("Are you sure you want to finalize this payroll? This will permanently deduct the advances and mark the payroll as Paid.")) {
      const finalizedData = payrollData.map(emp => ({ ...emp, status: 'Paid' }));
      setPayrollData(finalizedData);
      setIsFinalized(true);
      alert("Payroll Finalized! Advances have been marked as Deducted in the database.");
    }
  };

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-green-800 to-green-900 rounded-lg flex items-center justify-center shadow-sm">
              <Calculator size={16} color="#86efac" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Run Payroll</h1>
          </div>
          <p className="text-xs font-medium text-gray-500 pl-11">
            Review calculated wages, verify deductions, and finalize payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 shadow-sm hover:text-green-700 transition-colors">
            <Download size={14} /> Export Payslips
          </button>
          {!isFinalized && (
            <button 
              onClick={handleFinalizePayroll}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <FileCheck size={16} /> Finalize & Pay
            </button>
          )}
        </div>
      </div>

      {/* ── PREMIUM KPI STAT CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          {
            title: 'Total Gross Wages',
            amount: `Rs. ${fmt(totalGross)}`,
            badge: 'Before Deductions',
            sub: 'Base calculation',
            icon: <Wallet size={14} />,
            path: "M0,40 L0,25 C 20,30 40,10 60,15 C 80,20 90,5 100,5 L100,40 Z"
          },
          {
            title: 'Advances Deducted',
            amount: `Rs. ${fmt(totalDeductions)}`,
            badge: 'Recovered',
            sub: 'From pending cash advances',
            icon: <Banknote size={14} />,
            path: "M0,40 L0,20 C 30,35 50,15 70,25 C 85,30 95,10 100,10 L100,40 Z"
          },
          {
            title: 'Net Cash Required',
            amount: `Rs. ${fmt(totalNetPayout)}`,
            badge: 'Final Payout',
            sub: 'Actual cash to distribute',
            icon: <CheckCircle2 size={14} />,
            path: "M0,40 L0,15 C 25,10 45,30 65,20 C 85,10 95,25 100,20 L100,40 Z"
          }
        ].map((card, i) => {
          const gradId = `grad-pay-${i}`;
          const chartColor = "#A5D6A7"; 

          return (
            <div key={i} className="relative overflow-hidden rounded-[1.25rem] p-4 bg-gradient-to-br from-[#166534] to-[#14532d] text-white shadow-lg shadow-green-900/20 group border border-green-800/50 transition-all hover:shadow-green-900/40 hover:-translate-y-1">
              <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[45px] opacity-20 bg-white transition-opacity duration-500 group-hover:opacity-40"></div>
              <div className="flex justify-between items-center relative z-10 mb-1">
                 <span className="text-sm font-medium text-white/80">{card.title}</span>
              </div>
              <h3 className="text-2xl font-bold font-heading relative z-10 mb-3 tracking-tight truncate">
                {card.amount}
              </h3>
              <div className="flex items-center gap-2 relative z-10">
                 <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/20 text-white backdrop-blur-md">
                    {card.icon}
                    <span>{card.badge}</span>
                 </div>
                 <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 truncate">
                    {card.sub}
                 </span>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-[45%] opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                     <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor={chartColor} stopOpacity="0.4" />
                           <stop offset="100%" stopColor={chartColor} stopOpacity="0.0" />
                        </linearGradient>
                     </defs>
                     <path d={card.path} fill={`url(#${gradId})`} stroke={chartColor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                  </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── PAYROLL TABLE ── */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1.5px solid #e8ede8', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '14px 18px', borderBottom: '1.5px solid #f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          
          <div className="flex items-center gap-3">
             <div className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-bold shadow-sm">
                Period: May 18 - May 24, 2026
             </div>
             {isFinalized && (
                <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-bold flex items-center gap-1">
                   <CheckCircle2 size={14} /> Payroll Finalized
                </div>
             )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search staff..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  paddingLeft: '32px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px',
                  border: '1.5px solid #e5e7eb', borderRadius: '9px',
                  fontSize: '12px', color: '#374151', outline: 'none',
                  fontFamily: "'Nunito', sans-serif", width: '200px',
                  background: '#fafafa',
                }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '7px 13px', border: '1.5px solid #e5e7eb',
              borderRadius: '9px', fontSize: '12px', fontWeight: 600, color: '#374151',
              background: '#fff', cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
            }}>
              <SlidersHorizontal size={13} color="#9ca3af" /> Options
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1.5px solid #f0f4f0' }}>
                {['Employee', 'Base Rate', 'Days Worked', 'Gross Earnings', 'Advances Deducted', 'Net Payable', 'Status'].map((h, i) => (
                  <th key={h} style={thStyle(i >= 3 && i <= 5 ? 'right' : 'left')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, idx) => {
                const netPay = emp.gross - emp.advanceDeduction;
                
                return (
                  <tr key={emp.id} style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: idx % 2 === 0 ? '#fff' : '#fafafa',
                    transition: 'background 0.15s',
                  }}
                    onMouseOver={e => { e.currentTarget.style.background = '#f8fff8'; }}
                    onMouseOut={e => { e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafafa'; }}
                  >
                    {/* Employee Identity */}
                    <td style={tdStyle()}>
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs border border-green-200">
                            {emp.name.substring(0, 2).toUpperCase()}
                         </div>
                         <div className="flex flex-col">
                            <span style={{ fontWeight: 800, color: '#0d1f0d', fontSize: '13px' }}>{emp.name}</span>
                            <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600 }}>{emp.role}</span>
                         </div>
                      </div>
                    </td>

                    {/* Base Rate */}
                    <td style={tdStyle()}>
                      <span style={{ color: '#475569', fontWeight: 600 }}>Rs. {fmt(emp.wage)}</span>
                      <span className="text-[10px] text-gray-400 ml-1">/{emp.type === 'Daily' ? 'Day' : 'Mo'}</span>
                    </td>

                    {/* Days Worked */}
                    <td style={tdStyle()}>
                      <span className={`inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-md text-xs font-bold ${emp.daysWorked === 'N/A' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                         {emp.daysWorked}
                      </span>
                    </td>

                    {/* Gross Earnings */}
                    <td style={{ ...tdStyle(), textAlign: 'right' }}>
                       <span style={{ color: '#1f2937', fontWeight: 700 }}>Rs. {fmt(emp.gross)}</span>
                    </td>

                    {/* Advance Deductions */}
                    <td style={{ ...tdStyle(), textAlign: 'right' }}>
                      {emp.advanceDeduction > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-600 font-bold text-xs border border-red-100">
                           - Rs. {fmt(emp.advanceDeduction)}
                        </span>
                      ) : (
                        <span className="text-gray-300 font-medium text-xs">Rs. 0.00</span>
                      )}
                    </td>

                    {/* Net Payable */}
                    <td style={{ ...tdStyle(), textAlign: 'right' }}>
                       <span style={{ color: '#0d3320', fontWeight: 900, fontSize: '14px' }}>Rs. {fmt(netPay)}</span>
                    </td>

                    {/* Status */}
                    <td style={tdStyle()}>
                      {emp.status === 'Draft' ? (
                         <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">Review</span>
                      ) : (
                         <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">Paid</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1.5px solid #f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
          <span style={{ fontSize: '12px', color: '#6b7a6b', fontWeight: 600 }}>
            Showing <strong style={{ color: '#0d1f0d' }}>{filtered.length}</strong> employees processed
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button style={pageBtn(false)}><ChevronLeft size={13} /></button>
            <button style={pageBtn(true)}>1</button>
            <button style={pageBtn(false)}><ChevronRight size={13} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared Inline Styles ──

const thStyle = (align = 'left', width) => ({
  padding: '10px 18px',
  fontSize: '10.5px', fontWeight: 800,
  color: '#6b7a6b', textTransform: 'uppercase', letterSpacing: '0.7px',
  textAlign: align,
  ...(width ? { width } : {}),
});

const tdStyle = (width) => ({
  padding: '14px 18px',
  verticalAlign: 'middle',
  ...(width ? { width } : {}),
});

const pageBtn = (active) => ({
  width: '28px', height: '28px', borderRadius: '7px',
  border: active ? 'none' : '1.5px solid #e5e7eb',
  background: active ? 'linear-gradient(135deg, #16a34a, #15803d)' : '#fff',
  color: active ? '#fff' : '#6b7280',
  fontSize: '12px', fontWeight: 800, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'Nunito', sans-serif",
  boxShadow: active ? '0 2px 8px rgba(22,163,74,0.3)' : 'none',
});