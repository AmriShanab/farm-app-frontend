import { useState } from 'react';
import {
  Plus, Search, Download, MoreHorizontal,
  ChevronLeft, ChevronRight, SlidersHorizontal,
  Wallet, Banknote, AlertCircle, Check, X,
  User, CheckCircle2
} from 'lucide-react';

// --- MOCK DATA ---
const mockEmployees = [
  { id: '1', name: 'Faizaar', role: 'Manager' },
  { id: '2', name: 'Jabir', role: 'Laborer' },
  { id: '3', name: 'Ajmeer', role: 'Laborer' },
  { id: '4', name: 'Jarsan', role: 'Tractor Driver' },
  { id: '5', name: 'Rifaideen', role: 'Laborer' },
  { id: '6', name: 'Askan', role: 'Laborer' },
];

const mockAdvances = [
  { id: '101', date: '2026-05-20', empId: '4', name: 'Jarsan', role: 'Tractor Driver', amount: 5000, status: 'Unpaid' },
  { id: '102', date: '2026-05-18', empId: '5', name: 'Rifaideen', role: 'Laborer', amount: 3000, status: 'Unpaid' },
  { id: '103', date: '2026-05-15', empId: '2', name: 'Jabir', role: 'Laborer', amount: 2000, status: 'Unpaid' },
  { id: '104', date: '2026-05-10', empId: '1', name: 'Faizaar', role: 'Manager', amount: 10000, status: 'Unpaid' },
  { id: '105', date: '2026-05-05', empId: '6', name: 'Askan', role: 'Laborer', amount: 1500, status: 'Deducted' }, // Example of a past cleared advance
];

const fmt = (n) => n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CashAdvances() {
  const [advances, setAdvances] = useState(mockAdvances);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Unpaid');
  const [selected, setSelected] = useState([]);

  // --- Inline Row State ---
  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState({
    date: new Date().toISOString().split('T')[0],
    empId: '',
    amount: ''
  });

  const filtered = advances.filter(adv =>
    (statusFilter === 'All' || adv.status === statusFilter) &&
    (!search || adv.name.toLowerCase().includes(search.toLowerCase()) || adv.role.toLowerCase().includes(search.toLowerCase()))
  );

  // KPIs
  const totalUnpaid = advances.filter(a => a.status === 'Unpaid').reduce((sum, a) => sum + a.amount, 0);
  const unpaidCount = advances.filter(a => a.status === 'Unpaid').length;
  const totalGivenAllTime = advances.reduce((sum, a) => sum + a.amount, 0);

  const toggleSelect = (id) => setSelected(sel => sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]);
  const toggleAll = () => setSelected(sel => sel.length === filtered.length ? [] : filtered.map(s => s.id));

  const handleRowChange = (e) => {
    setNewRow(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveRow = () => {
    if (!newRow.empId || !newRow.amount) {
      alert("Please select an employee and enter an amount.");
      return;
    }

    const selectedEmp = mockEmployees.find(e => e.id === newRow.empId);

    const newAdvance = {
      id: String(Date.now()),
      date: newRow.date,
      empId: selectedEmp.id,
      name: selectedEmp.name,
      role: selectedEmp.role,
      amount: parseFloat(newRow.amount) || 0,
      status: 'Unpaid', // Defaults to unpaid until payroll clears it
    };
    
    setAdvances(prev => [newAdvance, ...prev]);
    setIsAdding(false);
    
    // Switch filter to 'Unpaid' so the user sees their new entry
    if (statusFilter === 'Deducted') setStatusFilter('Unpaid');

    setNewRow({ date: new Date().toISOString().split('T')[0], empId: '', amount: '' });
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewRow({ date: new Date().toISOString().split('T')[0], empId: '', amount: '' });
  };

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #166534, #14532d)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Banknote size={16} color="#86efac" />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#0d1f0d', margin: 0, letterSpacing: '-0.4px' }}>
              Cash Advances
            </h1>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7a6b', margin: 0, paddingLeft: '42px' }}>
            Record employee advances to be deducted from payroll
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 16px', background: '#fff',
            border: '1.5px solid #e5e7eb', borderRadius: '10px',
            fontSize: '12px', fontWeight: 700, color: '#374151',
            cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <Download size={14} /> Export List
          </button>
          <button
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 18px',
              background: isAdding ? '#9ca3af' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              border: 'none', borderRadius: '10px',
              fontSize: '12px', fontWeight: 800, color: '#fff',
              cursor: isAdding ? 'not-allowed' : 'pointer', fontFamily: "'Nunito', sans-serif",
              boxShadow: isAdding ? 'none' : '0 4px 14px rgba(22,163,74,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { if(!isAdding) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(22,163,74,0.45)'; } }}
            onMouseOut={e => { if(!isAdding) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(22,163,74,0.35)'; } }}
          >
            <Plus size={16} /> Issue Advance
          </button>
        </div>
      </div>

      {/* ── PREMIUM KPI STAT CARDS (REDUCED HEIGHT) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          {
            title: 'Outstanding Advances',
            amount: `Rs. ${fmt(totalUnpaid)}`,
            badge: `${unpaidCount} Pending`,
            sub: 'To Deduct Next Payroll',
            icon: <AlertCircle size={14} />,
            path: "M0,40 L0,25 C 20,30 40,10 60,15 C 80,20 90,5 100,5 L100,40 Z"
          },
          {
            title: 'Total Given (All Time)',
            amount: `Rs. ${fmt(totalGivenAllTime)}`,
            badge: 'Cash Flow',
            sub: 'Historical Total',
            icon: <Wallet size={14} />,
            path: "M0,40 L0,20 C 30,35 50,15 70,25 C 85,30 95,10 100,10 L100,40 Z"
          },
          {
            title: 'Highest Unpaid',
            amount: unpaidCount > 0 ? `Rs. ${fmt(Math.max(...advances.filter(a => a.status === 'Unpaid').map(a => a.amount)))}` : 'Rs. 0.00',
            badge: 'Max Exposure',
            sub: 'Single Employee',
            icon: <User size={14} />,
            path: "M0,40 L0,15 C 25,10 45,30 65,20 C 85,10 95,25 100,20 L100,40 Z"
          }
        ].map((card, i) => {
          const gradId = `grad-adv-${i}`;
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

      {/* ── ADVANCES TABLE ── */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1.5px solid #e8ede8', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '14px 18px', borderBottom: '1.5px solid #f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>

          <div style={{ display: 'flex', background: '#f3f4f6', padding: '3px', borderRadius: '10px', gap: '2px' }}>
            {['Unpaid', 'Deducted', 'All'].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} style={{
                padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 800,
                border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                background: statusFilter === f ? '#fff' : 'transparent',
                color: statusFilter === f ? (f === 'Unpaid' ? '#b45309' : f === 'Deducted' ? '#15803d' : '#374151') : '#9ca3af',
                boxShadow: statusFilter === f ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}>{f}</button>
            ))}
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
              <SlidersHorizontal size={13} color="#9ca3af" /> Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1.5px solid #f0f4f0' }}>
                <th style={thStyle('left', '52px')}>
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} style={{ accentColor: '#16a34a', cursor: 'pointer' }} />
                </th>
                {['Issue Date', 'Employee Name', 'Role', 'Status', 'Advance Amount'].map((h, i) => (
                  <th key={h} style={thStyle(i === 4 ? 'right' : 'left')}>{h}</th>
                ))}
                <th style={thStyle('right', '80px')} />
              </tr>
            </thead>
            <tbody>

              {/* ── INLINE ADD ROW ── */}
              {isAdding && (
                <tr style={{ background: '#f0fdf4', borderBottom: '1.5px solid #bbf7d0', boxShadow: 'inset 0 2px 4px rgba(22,163,74,0.05)' }}>
                  <td style={tdStyle('52px')}></td>
                  <td style={tdStyle()}>
                    <input type="date" name="date" value={newRow.date} onChange={handleRowChange} style={inputStyle} />
                  </td>
                  <td colSpan={2} style={tdStyle()}>
                    <select name="empId" value={newRow.empId} onChange={handleRowChange} style={{...inputStyle, cursor: 'pointer', appearance: 'auto'}}>
                       <option value="" disabled>Select Employee...</option>
                       {mockEmployees.map(emp => (
                         <option key={emp.id} value={emp.id}>{emp.name} - {emp.role}</option>
                       ))}
                    </select>
                  </td>
                  <td style={tdStyle()}>
                     <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertCircle size={10} /> Unpaid
                     </span>
                  </td>
                  <td style={{ ...tdStyle('150px'), textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Rs.</span>
                      <input type="number" name="amount" placeholder="0.00" value={newRow.amount} onChange={handleRowChange} style={{...inputStyle, width: '100px', textAlign: 'right'}} />
                    </div>
                  </td>
                  <td style={{ ...tdStyle('80px'), textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={cancelAdd} style={{ background: '#f3f4f6', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#6b7280' }}>
                        <X size={14} strokeWidth={3} />
                      </button>
                      <button onClick={handleSaveRow} style={{ background: '#16a34a', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#fff', boxShadow: '0 2px 4px rgba(22,163,74,0.2)' }}>
                        <Check size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {filtered.map((adv, idx) => {
                const isSel = selected.includes(adv.id);
                return (
                  <tr key={adv.id} style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: isSel ? '#f0fdf4' : idx % 2 === 0 ? '#fff' : '#fafafa',
                    transition: 'background 0.15s',
                  }}
                    onMouseOver={e => { if (!isSel) e.currentTarget.style.background = '#f8fff8'; }}
                    onMouseOut={e => { if (!isSel) e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafafa'; }}
                  >
                    <td style={tdStyle('52px')}>
                      <input type="checkbox" checked={isSel} onChange={() => toggleSelect(adv.id)} style={{ accentColor: '#16a34a', cursor: 'pointer' }} />
                    </td>

                    {/* Date */}
                    <td style={tdStyle()}>
                      <span style={{ fontWeight: 800, color: '#0d1f0d', fontSize: '12.5px' }}>{adv.date}</span>
                    </td>

                    {/* Employee Identity */}
                    <td style={tdStyle()}>
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs border border-green-200">
                            {adv.name.substring(0, 2).toUpperCase()}
                         </div>
                         <span style={{ fontWeight: 800, color: '#0d1f0d', fontSize: '13px' }}>{adv.name}</span>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={tdStyle()}>
                      <span style={{ color: '#475569', fontWeight: 600 }}>{adv.role}</span>
                    </td>

                    {/* Status Pill */}
                    <td style={tdStyle()}>
                      {adv.status === 'Unpaid' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                           <AlertCircle size={10} /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
                           <CheckCircle2 size={10} /> Deducted
                        </span>
                      )}
                    </td>

                    {/* Advance Amount */}
                    <td style={{ ...tdStyle(), textAlign: 'right', paddingRight: '20px' }}>
                       <span style={{ color: '#0d3320', fontWeight: 900, fontSize: '13px' }}>Rs. {fmt(adv.amount)}</span>
                    </td>

                    {/* Actions */}
                    <td style={{ ...tdStyle('80px'), textAlign: 'right' }}>
                      <button style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '4px', borderRadius: '6px', color: '#9ca3af',
                        transition: 'all 0.15s',
                      }}
                        onMouseOver={e => { e.currentTarget.style.background = '#dcfce7'; e.currentTarget.style.color = '#16a34a'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af'; }}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && !isAdding && (
                 <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-400 text-sm font-semibold">
                      No advances found matching your filters.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1.5px solid #f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
          <span style={{ fontSize: '12px', color: '#6b7a6b', fontWeight: 600 }}>
            Showing <strong style={{ color: '#0d1f0d' }}>{filtered.length}</strong> records
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
  padding: '10px 14px',
  fontSize: '10.5px', fontWeight: 800,
  color: '#6b7a6b', textTransform: 'uppercase', letterSpacing: '0.7px',
  textAlign: align,
  ...(width ? { width } : {}),
});

const tdStyle = (width) => ({
  padding: '12px 14px',
  verticalAlign: 'middle',
  ...(width ? { width } : {}),
});

const inputStyle = {
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1.5px solid #d1d5db',
  fontSize: '12px',
  fontWeight: 600,
  fontFamily: "'Nunito', sans-serif",
  color: '#111827',
  outline: 'none',
  transition: 'border-color 0.2s',
  width: '100%'
};

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