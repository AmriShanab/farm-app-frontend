import { useState } from 'react';
import {
  Plus, Search, Download, MoreHorizontal,
  ChevronLeft, ChevronRight, SlidersHorizontal,
  TrendingUp, Nut, ArrowUpRight, Check, X, Scale
} from 'lucide-react';

// Extracted from your Excel/CSV image for 2023/2024
const mockCashewSales = [
  { id: '1', date: '2024-05-10', kg: 26, rate: 540, total: 14040 },
  { id: '2', date: '2024-05-08', kg: 13, rate: 540, total: 7020 },
  { id: '3', date: '2024-05-07', kg: 26, rate: 540, total: 14040 },
  { id: '4', date: '2024-05-04', kg: 18, rate: 540, total: 9720 },
  { id: '5', date: '2024-05-02', kg: 25.5, rate: 600, total: 15300 },
  { id: '6', date: '2023-05-30', kg: 32, rate: 590, total: 18880 },
  { id: '7', date: '2023-05-28', kg: 60, rate: 590, total: 35400 },
  { id: '8', date: '2023-05-25', kg: 49, rate: 590, total: 28910 },
  { id: '9', date: '2023-05-20', kg: 58, rate: 550, total: 31900 },
];

const fmt = (n) => n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CashewSales() {
  // Use Year for filtering since cashews are a seasonal crop
  const [yearFilter, setYearFilter] = useState('2024');
  const [sales, setSales] = useState(mockCashewSales);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  // --- Inline Row State ---
  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState({
    date: new Date().toISOString().split('T')[0],
    kg: '', rate: ''
  });

  const filtered = sales.filter(s =>
    s.date.startsWith(yearFilter) &&
    (!search || s.date.includes(search))
  );

  const totalRevenue = filtered.reduce((a, s) => a + s.total, 0);
  const totalKg = filtered.reduce((a, s) => a + s.kg, 0);
  const avgRate = filtered.length
    ? (filtered.reduce((a, s) => a + s.rate, 0) / filtered.length).toFixed(0)
    : 0;

  const toggleSelect = (id) =>
    setSelected(sel => sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]);
  const toggleAll = () =>
    setSelected(sel => sel.length === filtered.length ? [] : filtered.map(s => s.id));

  const handleRowChange = (e) => {
    setNewRow(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const calcNewRowNet = () => {
    const kg = parseFloat(newRow.kg) || 0;
    const rate = parseFloat(newRow.rate) || 0;
    return kg * rate;
  };

  const handleSaveRow = () => {
    if (!newRow.kg || !newRow.rate) {
      alert("Please enter both Quantity (Kg) and Rate.");
      return;
    }

    const newSale = {
      id: String(Date.now()),
      date: newRow.date,
      kg: parseFloat(newRow.kg) || 0,
      rate: parseFloat(newRow.rate) || 0,
      total: calcNewRowNet(),
    };
    
    setSales(prev => [newSale, ...prev]);
    setIsAdding(false);
    
    // Auto-update year filter if the user adds a date from a different year
    const addedYear = newRow.date.split('-')[0];
    if (addedYear !== yearFilter) setYearFilter(addedYear);

    setNewRow({ date: new Date().toISOString().split('T')[0], kg: '', rate: '' });
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewRow({ date: new Date().toISOString().split('T')[0], kg: '', rate: '' });
  };

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #7c2d12, #9a3412)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Nut size={16} color="#fdba74" />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#0d1f0d', margin: 0, letterSpacing: '-0.4px' }}>
              Cashew Nuts Ledger
            </h1>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7a6b', margin: 0, paddingLeft: '42px' }}>
            Track seasonal cashew yields and pricing
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
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 18px',
              background: isAdding ? '#9ca3af' : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
              border: 'none', borderRadius: '10px',
              fontSize: '12px', fontWeight: 800, color: '#fff',
              cursor: isAdding ? 'not-allowed' : 'pointer', fontFamily: "'Nunito', sans-serif",
              boxShadow: isAdding ? 'none' : '0 4px 14px rgba(234,88,12,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { if(!isAdding) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(234,88,12,0.45)'; } }}
            onMouseOut={e => { if(!isAdding) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(234,88,12,0.35)'; } }}
          >
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      {/* ── KPI STAT CARDS ── */}
     {/* ── PREMIUM KPI STAT CARDS (CASHEW THEME - REDUCED HEIGHT) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          {
            title: 'Total Revenue',
            amount: `Rs. ${fmt(totalRevenue)}`,
            badge: `${yearFilter} Harvest`,
            sub: 'Recorded',
            icon: <TrendingUp size={14} />,
            // Standard upward growth wave
            path: "M0,40 L0,25 C 20,30 40,10 60,15 C 80,20 90,5 100,5 L100,40 Z"
          },
          {
            title: 'Total Weight Sold',
            amount: `${totalKg.toLocaleString()} Kg`,
            badge: `${filtered.length} Entries`,
            sub: 'Total Volume',
            icon: <Scale size={14} />,
            // Slightly varied wave for visual distinction
            path: "M0,40 L0,20 C 30,35 50,15 70,25 C 85,30 95,10 100,10 L100,40 Z"
          },
          {
            title: 'Avg Rate / Kg',
            amount: `Rs. ${avgRate}`,
            badge: 'Market Avg',
            sub: 'This Period',
            icon: <ArrowUpRight size={14} />,
            // A third distinct wave pattern
            path: "M0,40 L0,15 C 25,10 45,30 65,20 C 85,10 95,25 100,20 L100,40 Z"
          }
        ].map((card, i) => {
          const gradId = `grad-cashew-${i}`;
          const chartColor = "#fdba74"; // Light orange/peach for contrast against dark rust background

          return (
            // Adjusted padding from p-6 to p-4 to reduce overall card height
            <div key={i} className="relative overflow-hidden rounded-[1.25rem] p-4 bg-gradient-to-br from-[#9a3412] to-[#7c2d12] text-white shadow-lg shadow-orange-900/20 group border border-orange-800/50 transition-all hover:shadow-orange-900/40 hover:-translate-y-1">
              
              {/* Glowing Radial Blur for depth */}
              <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[45px] opacity-20 bg-white transition-opacity duration-500 group-hover:opacity-40"></div>

              {/* Header */}
              <div className="flex justify-between items-center relative z-10 mb-1">
                 <span className="text-sm font-medium text-white/80">{card.title}</span>
                 <button className="text-white/70 hover:text-white transition-colors bg-black/10 p-1.5 rounded-lg backdrop-blur-sm">
                    <MoreHorizontal size={18} />
                 </button>
              </div>

              {/* Amount - Adjusted margin-bottom from mb-6 to mb-3 */}
              <h3 className="text-2xl font-bold font-heading relative z-10 mb-3 tracking-tight">
                {card.amount}
              </h3>

              {/* Frosted Badge */}
              <div className="flex items-center gap-2 relative z-10">
                 <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/20 text-white backdrop-blur-md">
                    {card.icon}
                    <span>{card.badge}</span>
                 </div>
                 <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                    {card.sub}
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
                     <path d={card.path} fill={`url(#${gradId})`} stroke={chartColor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                  </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MAIN TABLE CARD ── */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1.5px solid #e8ede8', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '14px 18px', borderBottom: '1.5px solid #f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>

          {/* Harvest Year Toggle */}
          <div style={{ display: 'flex', background: '#f3f4f6', padding: '3px', borderRadius: '10px', gap: '2px' }}>
            {['2026', '2025', '2024', '2023'].map(y => (
              <button key={y} onClick={() => { setYearFilter(y); setIsAdding(false); }} style={{
                padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 800,
                border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                background: yearFilter === y ? '#fff' : 'transparent',
                color: yearFilter === y ? '#c2410c' : '#9ca3af',
                boxShadow: yearFilter === y ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}>{y}</button>
            ))}
          </div>

          {/* Search + Filter */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search by date..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  paddingLeft: '32px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px',
                  border: '1.5px solid #e5e7eb', borderRadius: '9px',
                  fontSize: '12px', color: '#374151', outline: 'none',
                  fontFamily: "'Nunito', sans-serif", width: '200px',
                  background: '#fafafa',
                }}
                onFocus={e => e.target.style.borderColor = '#ea580c'}
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
                  <input type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    style={{ accentColor: '#ea580c', cursor: 'pointer' }}
                  />
                </th>
                {['Date', 'Quantity (Kg)', 'Rate / Kg (Rs)', 'Invoice Subtotal'].map((h, i) => (
                  <th key={h} style={thStyle(i === 3 ? 'right' : 'left')}>{h}</th>
                ))}
                <th style={thStyle('right', '80px')} />
              </tr>
            </thead>
            <tbody>
              
              {/* ── INLINE ADD ROW ── */}
              {isAdding && (
                <tr style={{ background: '#fff7ed', borderBottom: '1.5px solid #fed7aa', boxShadow: 'inset 0 2px 4px rgba(234,88,12,0.05)' }}>
                  <td style={tdStyle('52px')}></td>
                  <td style={tdStyle()}>
                    <input type="date" name="date" value={newRow.date} onChange={handleRowChange} style={inputStyle} />
                  </td>
                  <td style={tdStyle()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input type="number" name="kg" placeholder="e.g. 25.5" value={newRow.kg} onChange={handleRowChange} style={{...inputStyle, width: '90px'}} />
                      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Kg</span>
                    </div>
                  </td>
                  <td style={tdStyle()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Rs.</span>
                      <input type="number" name="rate" placeholder="e.g. 600" value={newRow.rate} onChange={handleRowChange} style={{...inputStyle, width: '90px'}} />
                    </div>
                  </td>
                  <td style={{ ...tdStyle(), textAlign: 'right', paddingRight: '20px' }}>
                     <span style={{ fontWeight: 900, color: '#ea580c', fontSize: '14px' }}>
                        Rs. {fmt(calcNewRowNet())}
                     </span>
                  </td>
                  <td style={{ ...tdStyle('80px'), textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={cancelAdd} style={{ background: '#f3f4f6', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#6b7280' }}>
                        <X size={14} strokeWidth={3} />
                      </button>
                      <button onClick={handleSaveRow} style={{ background: '#ea580c', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#fff', boxShadow: '0 2px 4px rgba(234,88,12,0.2)' }}>
                        <Check size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {filtered.map((sale, idx) => {
                const isSel = selected.includes(sale.id);
                return (
                  <tr key={sale.id} style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: isSel ? '#fff7ed' : idx % 2 === 0 ? '#fff' : '#fafafa',
                    transition: 'background 0.15s',
                  }}
                    onMouseOver={e => { if (!isSel) e.currentTarget.style.background = '#fffaf5'; }}
                    onMouseOut={e => { if (!isSel) e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafafa'; }}
                  >
                    <td style={tdStyle('52px')}>
                      <input type="checkbox" checked={isSel} onChange={() => toggleSelect(sale.id)}
                        style={{ accentColor: '#ea580c', cursor: 'pointer' }} />
                    </td>

                    {/* Date */}
                    <td style={tdStyle()}>
                      <span style={{ fontWeight: 800, color: '#0d1f0d', fontSize: '12.5px' }}>{sale.date}</span>
                    </td>

                    {/* Kg */}
                    <td style={tdStyle()}>
                      <span style={{ fontWeight: 700, color: '#111827' }}>{sale.kg}</span> <span style={{ fontSize: '11px', color: '#6b7280' }}>Kg</span>
                    </td>

                    {/* Rate */}
                    <td style={tdStyle()}>
                      <span style={{ color: '#374151', fontWeight: 600 }}>Rs. {sale.rate}</span>
                    </td>

                    {/* Total */}
                    <td style={{ ...tdStyle(), textAlign: 'right', paddingRight: '20px' }}>
                      <span style={{ fontWeight: 900, color: '#431407', fontSize: '13px' }}>
                        Rs. {fmt(sale.total)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ ...tdStyle('80px'), textAlign: 'right' }}>
                      <button style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '4px', borderRadius: '6px', color: '#9ca3af',
                        transition: 'all 0.15s',
                      }}
                        onMouseOver={e => { e.currentTarget.style.background = '#ffedd5'; e.currentTarget.style.color = '#ea580c'; }}
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
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                    No cashew sales records found for {yearFilter}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div style={{ padding: '12px 18px', borderTop: '1.5px solid #f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
          <span style={{ fontSize: '12px', color: '#6b7a6b', fontWeight: 600 }}>
            Showing <strong style={{ color: '#0d1f0d' }}>{filtered.length}</strong> results for {yearFilter}
            {selected.length > 0 && <span style={{ marginLeft: '10px', color: '#ea580c', fontWeight: 700 }}>· {selected.length} selected</span>}
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
  padding: '6px 8px',
  borderRadius: '6px',
  border: '1.5px solid #d1d5db',
  fontSize: '12px',
  fontWeight: 600,
  fontFamily: "'Nunito', sans-serif",
  color: '#111827',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const pageBtn = (active) => ({
  width: '28px', height: '28px', borderRadius: '7px',
  border: active ? 'none' : '1.5px solid #e5e7eb',
  background: active ? 'linear-gradient(135deg, #ea580c, #9a3412)' : '#fff',
  color: active ? '#fff' : '#6b7280',
  fontSize: '12px', fontWeight: 800, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'Nunito', sans-serif",
  boxShadow: active ? '0 2px 8px rgba(234,88,12,0.3)' : 'none',
});