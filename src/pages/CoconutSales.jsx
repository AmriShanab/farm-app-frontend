import { useState } from 'react';
import {
  Plus, Search, Download, MoreHorizontal,
  ChevronLeft, ChevronRight, SlidersHorizontal,
  TrendingUp, Sprout, Leaf, ArrowUpRight,
  Check, X
} from 'lucide-react';
import { thStyle, tdStyle, inputStyle, pageBtn } from '../assets/CoconutSales.styles';

const mockCoconutSales = [
  { id: '1', date: '2026-05-05', farm: 'MR2', qty1: 9040, rate1: 160, disc1: 176, qty2: 226, rate2: 150, disc2: 0, total: 1452140 },
  { id: '2', date: '2026-04-08', farm: 'MR1', qty1: 6400, rate1: 137, disc1: 265, qty2: 0, rate2: 0, disc2: 0, total: 840495 },
  { id: '3', date: '2026-02-18', farm: 'MR1', qty1: 5900, rate1: 200, disc1: 0, qty2: 118, rate2: 150, disc2: 0, total: 1197700 },
  { id: '4', date: '2026-02-05', farm: 'MR2', qty1: 6640, rate1: 192, disc1: 0, qty2: 130, rate2: 150, disc2: 0, total: 1294380 },
  { id: '5', date: '2026-01-23', farm: 'MR1', qty1: 10600, rate1: 71, disc1: 315, qty2: 880, rate2: 30, disc2: 0, total: 756635 },
];

const fmt = (n) => n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CoconutSales() {
  const [farmFilter, setFarmFilter] = useState('MR1');
  const [sales, setSales] = useState(mockCoconutSales);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  // --- Inline Row State ---
  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState({
    date: new Date().toISOString().split('T')[0],
    qty1: '', rate1: '', disc1: '',
    qty2: '', rate2: '', disc2: ''
  });

  const filtered = sales.filter(s =>
    s.farm === farmFilter &&
    (!search || s.date.includes(search))
  );

  const totalRevenue = filtered.reduce((a, s) => a + s.total, 0);
  const totalNuts = filtered.reduce((a, s) => a + s.qty1 + (s.qty2 || 0), 0);
  const avgRate = filtered.length
    ? (filtered.reduce((a, s) => a + s.rate1, 0) / filtered.length).toFixed(0)
    : 0;

  const toggleSelect = (id) =>
    setSelected(sel => sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]);
  const toggleAll = () =>
    setSelected(sel => sel.length === filtered.length ? [] : filtered.map(s => s.id));

  // Handle input changes for the new row
  const handleRowChange = (e) => {
    setNewRow(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Live calculation for the inline row
  const calcNewRowNet = () => {
    const q1 = parseFloat(newRow.qty1) || 0;
    const r1 = parseFloat(newRow.rate1) || 0;
    const d1 = parseFloat(newRow.disc1) || 0;
    const q2 = parseFloat(newRow.qty2) || 0;
    const r2 = parseFloat(newRow.rate2) || 0;
    // Assuming disc2 logic isn't heavily used based on previous iterations, but keeping it safe
    const d2 = parseFloat(newRow.disc2) || 0;

    const sub1 = Math.max(0, (q1 - d1)) * r1;
    const sub2 = Math.max(0, (q2 - d2)) * r2;
    return sub1 + sub2;
  };

  const handleSaveRow = () => {
    if (!newRow.qty1 || !newRow.rate1) {
      alert("Please enter at least 1st Quality Quantity and Rate.");
      return;
    }

    const newSale = {
      id: String(Date.now()),
      farm: farmFilter, // Automatically assigns to the active tab
      date: newRow.date,
      qty1: parseFloat(newRow.qty1) || 0,
      rate1: parseFloat(newRow.rate1) || 0,
      disc1: parseFloat(newRow.disc1) || 0,
      qty2: parseFloat(newRow.qty2) || 0,
      rate2: parseFloat(newRow.rate2) || 0,
      disc2: parseFloat(newRow.disc2) || 0,
      total: calcNewRowNet(),
    };

    setSales(prev => [newSale, ...prev]);
    setIsAdding(false);
    // Reset form
    setNewRow({
      date: new Date().toISOString().split('T')[0],
      qty1: '', rate1: '', disc1: '',
      qty2: '', rate2: '', disc2: ''
    });
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewRow({
      date: new Date().toISOString().split('T')[0],
      qty1: '', rate1: '', disc1: '',
      qty2: '', rate2: '', disc2: ''
    });
  };

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #0d3320, #1a5c35)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sprout size={16} color="#86efac" />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#0d1f0d', margin: 0, letterSpacing: '-0.4px' }}>
              Coconut Sales Ledger
            </h1>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7a6b', margin: 0, paddingLeft: '42px' }}>
            Manage estate yields and calculate net revenue
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
              background: isAdding ? '#9ca3af' : 'linear-gradient(135deg, #1a5c35 0%, #0d3320 100%)',
              border: 'none', borderRadius: '10px',
              fontSize: '12px', fontWeight: 800, color: '#fff',
              cursor: isAdding ? 'not-allowed' : 'pointer', fontFamily: "'Nunito', sans-serif",
              boxShadow: isAdding ? 'none' : '0 4px 14px rgba(13,51,32,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { if (!isAdding) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(13,51,32,0.45)'; } }}
            onMouseOut={e => { if (!isAdding) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(13,51,32,0.35)'; } }}
          >
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      {/* ── KPI STAT CARDS ── */}

      {/* ── PREMIUM KPI STAT CARDS (COCONUT SALES - REDUCED HEIGHT) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          {
            title: 'Total Revenue',
            amount: `Rs. ${fmt(totalRevenue)}`,
            badge: `${filtered.length} Trans.`,
            sub: 'Recorded',
            isUp: true,
            icon: <TrendingUp size={14} />,
            path: "M0,40 L0,25 C 20,30 40,10 60,15 C 80,20 90,5 100,5 L100,40 Z"
          },
          {
            title: 'Total Nuts Sold',
            amount: totalNuts.toLocaleString(),
            badge: `${farmFilter}`,
            sub: 'Estate Block',
            isUp: true,
            icon: <Leaf size={14} />,
            path: "M0,40 L0,20 C 30,35 50,15 70,25 C 85,30 95,10 100,10 L100,40 Z"
          },
          {
            title: 'Avg Rate / Nut',
            amount: `Rs. ${avgRate}`,
            badge: 'Market Avg',
            sub: 'This Period',
            isUp: true,
            icon: <ArrowUpRight size={14} />,
            path: "M0,40 L0,15 C 25,10 45,30 65,20 C 85,10 95,25 100,20 L100,40 Z"
          }
        ].map((card, i) => {
          const gradId = `grad-coconut-${i}`;
          const chartColor = "#A5D6A7"; // Light green

          return (
            <div key={i} className="relative overflow-hidden rounded-[1.25rem] p-4 bg-gradient-to-br from-[#166534] to-[#14532d] text-white shadow-lg shadow-green-900/20 group border border-green-800/50 transition-all hover:shadow-green-900/40 hover:-translate-y-1">

              <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[45px] opacity-20 bg-white transition-opacity duration-500 group-hover:opacity-40"></div>

              <div className="flex justify-between items-center relative z-10 mb-1">
                <span className="text-sm font-medium text-white/80">{card.title}</span>
                <button className="text-white/70 hover:text-white transition-colors bg-black/10 p-1.5 rounded-lg backdrop-blur-sm">
                  <MoreHorizontal size={18} />
                </button>
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

      {/* ── MAIN TABLE CARD ── */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1.5px solid #e8ede8', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '14px 18px', borderBottom: '1.5px solid #f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>

          {/* Farm toggle */}
          <div style={{ display: 'flex', background: '#f3f4f6', padding: '3px', borderRadius: '10px', gap: '2px' }}>
            {['MR1', 'MR2'].map(f => (
              <button key={f} onClick={() => { setFarmFilter(f); setIsAdding(false); }} style={{
                padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 800,
                border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                background: farmFilter === f ? '#fff' : 'transparent',
                color: farmFilter === f ? '#0d3320' : '#9ca3af',
                boxShadow: farmFilter === f ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}>{f} Sales</button>
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
                onFocus={e => e.target.style.borderColor = '#1a5c35'}
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
                    style={{ accentColor: '#1a5c35', cursor: 'pointer' }}
                  />
                </th>
                {['Date', '1st Qty (Nuts)', '1st Rate', 'Discount', '2nd Qty', '2nd Rate', 'Invoice Total'].map((h, i) => (
                  <th key={h} style={thStyle(i === 6 ? 'right' : 'left')}>{h}</th>
                ))}
                <th style={thStyle('right', '80px')} />
              </tr>
            </thead>
            <tbody>

              {/* ── INLINE ADD ROW ── */}
              {isAdding && (
                <tr style={{ background: '#f8fff8', borderBottom: '1.5px solid #bbf7d0', boxShadow: 'inset 0 2px 4px rgba(22,163,74,0.05)' }}>
                  <td style={tdStyle('52px')}>
                    {/* Empty checkbox space */}
                  </td>
                  <td style={tdStyle()}>
                    <input type="date" name="date" value={newRow.date} onChange={handleRowChange} style={inputStyle} />
                  </td>
                  <td style={tdStyle()}>
                    <input type="number" name="qty1" placeholder="Qty" value={newRow.qty1} onChange={handleRowChange} style={{ ...inputStyle, width: '70px' }} />
                  </td>
                  <td style={tdStyle()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Rs.</span>
                      <input type="number" name="rate1" placeholder="Rate" value={newRow.rate1} onChange={handleRowChange} style={{ ...inputStyle, width: '60px' }} />
                    </div>
                  </td>
                  <td style={tdStyle()}>
                    <input type="number" name="disc1" placeholder="Disc" value={newRow.disc1} onChange={handleRowChange} style={{ ...inputStyle, width: '60px', borderColor: '#fecaca', background: '#fef2f2', color: '#dc2626' }} />
                  </td>
                  <td style={tdStyle()}>
                    <input type="number" name="qty2" placeholder="Opt Qty" value={newRow.qty2} onChange={handleRowChange} style={{ ...inputStyle, width: '70px' }} />
                  </td>
                  <td style={tdStyle()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Rs.</span>
                      <input type="number" name="rate2" placeholder="Opt Rate" value={newRow.rate2} onChange={handleRowChange} style={{ ...inputStyle, width: '60px' }} />
                    </div>
                  </td>
                  <td style={{ ...tdStyle(), textAlign: 'right', paddingRight: '20px' }}>
                    <span style={{ fontWeight: 900, color: '#16a34a', fontSize: '13px' }}>
                      Rs. {fmt(calcNewRowNet())}
                    </span>
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

              {filtered.map((sale, idx) => {
                const isSel = selected.includes(sale.id);
                return (
                  <tr key={sale.id} style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: isSel ? '#f0fdf4' : idx % 2 === 0 ? '#fff' : '#fafafa',
                    transition: 'background 0.15s',
                  }}
                    onMouseOver={e => { if (!isSel) e.currentTarget.style.background = '#f8fff8'; }}
                    onMouseOut={e => { if (!isSel) e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafafa'; }}
                  >
                    <td style={tdStyle('52px')}>
                      <input type="checkbox" checked={isSel} onChange={() => toggleSelect(sale.id)}
                        style={{ accentColor: '#1a5c35', cursor: 'pointer' }} />
                    </td>

                    {/* Date */}
                    <td style={tdStyle()}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 800, color: '#0d1f0d', fontSize: '12.5px' }}>{sale.date}</span>
                        <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600 }}>{sale.farm} Block</span>
                      </div>
                    </td>

                    {/* 1st Qty */}
                    <td style={tdStyle()}>
                      <span style={{ fontWeight: 700, color: '#111827' }}>{sale.qty1.toLocaleString()}</span>
                    </td>

                    {/* 1st Rate */}
                    <td style={tdStyle()}>
                      <span style={{ color: '#374151' }}>Rs. {sale.rate1}</span>
                    </td>

                    {/* Discount */}
                    <td style={tdStyle()}>
                      {sale.disc1 > 0
                        ? <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>−{sale.disc1}</span>
                        : <span style={{ color: '#d1d5db', fontSize: '12px' }}>—</span>
                      }
                    </td>

                    {/* 2nd Qty */}
                    <td style={tdStyle()}>
                      {sale.qty2 > 0
                        ? <span style={{ color: '#374151', fontWeight: 600 }}>{sale.qty2.toLocaleString()}</span>
                        : <span style={{ color: '#d1d5db' }}>—</span>
                      }
                    </td>

                    {/* 2nd Rate */}
                    <td style={tdStyle()}>
                      {sale.rate2 > 0
                        ? <span style={{ color: '#374151' }}>Rs. {sale.rate2}</span>
                        : <span style={{ color: '#d1d5db' }}>—</span>
                      }
                    </td>

                    {/* Total */}
                    <td style={{ ...tdStyle(), textAlign: 'right', paddingRight: '20px' }}>
                      <span style={{ fontWeight: 900, color: '#0d3320', fontSize: '13px' }}>
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
                        onMouseOver={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#1a5c35'; }}
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
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                    No sales records found for {farmFilter}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div style={{ padding: '12px 18px', borderTop: '1.5px solid #f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
          <span style={{ fontSize: '12px', color: '#6b7a6b', fontWeight: 600 }}>
            Showing <strong style={{ color: '#0d1f0d' }}>{filtered.length}</strong> results for {farmFilter}
            {selected.length > 0 && <span style={{ marginLeft: '10px', color: '#1a5c35', fontWeight: 700 }}>· {selected.length} selected</span>}
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