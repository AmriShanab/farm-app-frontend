import { useState, useEffect } from 'react';
import {
  Plus, Search, Download,
  ChevronLeft, ChevronRight, SlidersHorizontal,
  TrendingUp, Sprout, Leaf, ArrowUpRight,
  Check, X, Loader2, AlertCircle, Trash2, Edit2
} from 'lucide-react';

// Import our new API service
import { getCoconutSales, createCoconutSale, updateCoconutSale, deleteCoconutSale } from '../services/api';
import { useToast } from '../components/ToastProvider';

const fmt = (n) => Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const normalizeSaleRecord = (record, fallback = {}) => {
  const source = record && typeof record === 'object' && 'data' in record && record.data && typeof record.data === 'object'
    ? record.data
    : record;

  return {
    ...fallback,
    ...(source || {}),
  };
};

const emptySaleForm = () => ({
  date: new Date().toISOString().split('T')[0],
  farm: 'MR1',
  qty1: '',
  rate1: '',
  disc1: '',
  qty2: '',
  rate2: '',
  disc2: '',
});

const saleToForm = (sale) => ({
  date: sale?.date || new Date().toISOString().split('T')[0],
  farm: sale?.farm || 'MR1',
  qty1: sale?.qty1 ?? '',
  rate1: sale?.rate1 ?? '',
  disc1: sale?.disc1 ?? '',
  qty2: sale?.qty2 ?? '',
  rate2: sale?.rate2 ?? '',
  disc2: sale?.disc2 ?? '',
});

export default function CoconutSales() {
  const [farmFilter, setFarmFilter] = useState('MR1');
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  
  // API States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Inline Row State ---
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newRow, setNewRow] = useState(emptySaleForm());
  const [editSale, setEditSale] = useState(null);
  const [editRow, setEditRow] = useState(emptySaleForm());
  const toast = useToast();

  // Helper to calculate total
  const calcNet = (row) => {
    const q1 = parseFloat(row.qty1) || 0;
    const r1 = parseFloat(row.rate1) || 0;
    const d1 = parseFloat(row.disc1) || 0;
    const q2 = parseFloat(row.qty2) || 0;
    const r2 = parseFloat(row.rate2) || 0;
    const d2 = parseFloat(row.disc2) || 0; 
    
    const sub1 = Math.max(0, (q1 - d1)) * r1;
    const sub2 = Math.max(0, (q2 - d2)) * r2;
    return sub1 + sub2;
  };

  // --- Fetch Data on Mount & Tab Change ---
  useEffect(() => {
    let isActive = true;

    const loadSales = async () => {
      try {
        const data = await getCoconutSales(farmFilter);
        if (!isActive) {
          return;
        }

        const rows = Array.isArray(data) ? data : (data?.data || []);
        setSales(rows.map((row) => normalizeSaleRecord(row)));
      } catch {
        if (isActive) {
          setError("Failed to load sales data. Please check your connection.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadSales();

    return () => {
      isActive = false;
    };
  }, [farmFilter]); // Re-run when farmFilter changes (MR1 <-> MR2)

  const filtered = sales.filter(s =>
    !search || s.date.includes(search)
  );

  // Calculate KPIs locally based on fetched data
  const totalRevenue = filtered.reduce((a, s) => a + (Number(s.total) || calcNet(s)), 0);
  const totalNuts = filtered.reduce((a, s) => a + Number(s.qty1 || 0) + Number(s.qty2 || 0), 0);
  const avgRate = filtered.length
    ? (filtered.reduce((a, s) => a + Number(s.rate1 || 0), 0) / filtered.length).toFixed(0)
    : 0;

  const toggleSelect = (id) =>
    setSelected(sel => sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]);
  const toggleAll = () =>
    setSelected(sel => sel.length === filtered.length ? [] : filtered.map(s => s.id));

  const handleRowChange = (e) => {
    setNewRow(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditRowChange = (e) => {
    setEditRow(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openEditSale = (sale) => {
    setEditSale(normalizeSaleRecord(sale));
    setEditRow(saleToForm(sale));
  };

  const closeEditSale = () => {
    setEditSale(null);
    setEditRow(emptySaleForm());
    setIsSaving(false);
  };

  // --- Handle API POST ---
  const handleSaveRow = async () => {
    if (!newRow.qty1 || !newRow.rate1) {
      toast.warn("Please enter at least 1st Quality Quantity and Rate.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        date: newRow.date,
        farm: farmFilter,
        qty1: parseFloat(newRow.qty1) || 0,
        rate1: parseFloat(newRow.rate1) || 0,
        disc1: parseFloat(newRow.disc1) || 0,
        qty2: parseFloat(newRow.qty2) || 0,
        rate2: parseFloat(newRow.rate2) || 0,
        disc2: parseFloat(newRow.disc2) || 0,
      };

      const savedRecord = await createCoconutSale(payload);
      
      // Ensure local state calculates total if backend doesn't return it
      const completeRecord = normalizeSaleRecord(savedRecord, payload);
      completeRecord.total = completeRecord.total || calcNet(payload);

      setSales(prev => [completeRecord, ...prev]);
      setIsAdding(false);
      setNewRow({
        date: new Date().toISOString().split('T')[0],
        qty1: '', rate1: '', disc1: '',
        qty2: '', rate2: '', disc2: ''
      });
    } catch {
      toast.error("Failed to save record to database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSale = async () => {
    if (!editSale?.id) {
      return;
    }

    if (!editRow.qty1 || !editRow.rate1) {
      toast.warn("Please enter at least 1st Quality Quantity and Rate.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        date: editRow.date,
        farm: editRow.farm,
        qty1: parseFloat(editRow.qty1) || 0,
        rate1: parseFloat(editRow.rate1) || 0,
        disc1: parseFloat(editRow.disc1) || 0,
        qty2: parseFloat(editRow.qty2) || 0,
        rate2: parseFloat(editRow.rate2) || 0,
        disc2: parseFloat(editRow.disc2) || 0,
      };

      const updatedRecord = normalizeSaleRecord(await updateCoconutSale(editSale.id, payload), {
        ...editSale,
        ...payload,
      });
      updatedRecord.total = updatedRecord.total || calcNet(payload);

      setSales((prev) => prev.map((sale) => (sale.id === editSale.id ? updatedRecord : sale)));
      closeEditSale();
    } catch {
      toast.error("Failed to update record.");
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteCoconutSale(id);
        setSales(prev => prev.filter(s => s.id !== id));
      } catch {
        const toast = useToast();
        toast.error("Failed to delete record.");
      }
    }
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
            disabled={isAdding || isLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 18px',
              background: isAdding || isLoading ? '#9ca3af' : 'linear-gradient(135deg, #1a5c35 0%, #0d3320 100%)',
              border: 'none', borderRadius: '10px',
              fontSize: '12px', fontWeight: 800, color: '#fff',
              cursor: isAdding || isLoading ? 'not-allowed' : 'pointer', fontFamily: "'Nunito', sans-serif",
              boxShadow: isAdding ? 'none' : '0 4px 14px rgba(13,51,32,0.35)',
              transition: 'all 0.2s',
            }}
          >
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      {/* ── API ERROR STATE ── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm font-bold">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* ── PREMIUM KPI STAT CARDS (REDUCED HEIGHT) ── */}
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

      {/* ── MAIN TABLE CARD ── */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1.5px solid #e8ede8', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '14px 18px', borderBottom: '1.5px solid #f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>

          <div style={{ display: 'flex', background: '#f3f4f6', padding: '3px', borderRadius: '10px', gap: '2px' }}>
            {['MR1', 'MR2'].map(f => (
              <button key={f} onClick={() => { setIsLoading(true); setError(null); setFarmFilter(f); setIsAdding(false); }} style={{
                padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 800,
                border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                background: farmFilter === f ? '#fff' : 'transparent',
                color: farmFilter === f ? '#0d3320' : '#9ca3af',
                boxShadow: farmFilter === f ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}>{f} Sales</button>
            ))}
          </div>

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
                  <input type="checkbox" onChange={toggleAll} checked={selected.length > 0 && selected.length === filtered.length} style={{ accentColor: '#1a5c35' }} />
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
                  <td style={tdStyle('52px')}></td>
                  <td style={tdStyle()}>
                    <input type="date" name="date" value={newRow.date} onChange={handleRowChange} style={inputStyle} />
                  </td>
                  <td style={tdStyle()}>
                    <input type="number" name="qty1" placeholder="Qty" value={newRow.qty1} onChange={handleRowChange} style={{...inputStyle, width: '70px'}} disabled={isSaving} />
                  </td>
                  <td style={tdStyle()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Rs.</span>
                      <input type="number" name="rate1" placeholder="Rate" value={newRow.rate1} onChange={handleRowChange} style={{...inputStyle, width: '60px'}} disabled={isSaving} />
                    </div>
                  </td>
                  <td style={tdStyle()}>
                    <input type="number" name="disc1" placeholder="Disc" value={newRow.disc1} onChange={handleRowChange} style={{...inputStyle, width: '60px', borderColor: '#fecaca', background: '#fef2f2', color: '#dc2626'}} disabled={isSaving} />
                  </td>
                  <td style={tdStyle()}>
                    <input type="number" name="qty2" placeholder="Opt Qty" value={newRow.qty2} onChange={handleRowChange} style={{...inputStyle, width: '70px'}} disabled={isSaving} />
                  </td>
                  <td style={tdStyle()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Rs.</span>
                      <input type="number" name="rate2" placeholder="Opt Rate" value={newRow.rate2} onChange={handleRowChange} style={{...inputStyle, width: '60px'}} disabled={isSaving} />
                    </div>
                  </td>
                  <td style={{ ...tdStyle(), textAlign: 'right', paddingRight: '20px' }}>
                     <span style={{ fontWeight: 900, color: '#16a34a', fontSize: '13px' }}>
                        Rs. {fmt(calcNet(newRow))}
                     </span>
                  </td>
                  <td style={{ ...tdStyle('80px'), textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={cancelAdd} disabled={isSaving} style={{ background: '#f3f4f6', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#6b7280' }}>
                        <X size={14} strokeWidth={3} />
                      </button>
                      <button onClick={handleSaveRow} disabled={isSaving} style={{ background: '#16a34a', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#fff', boxShadow: '0 2px 4px rgba(22,163,74,0.2)' }}>
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* ── LOADING SPINNER IN TABLE ── */}
              {isLoading && !isAdding && (
                 <tr>
                    <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#16a34a' }}>
                       <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                       <span className="text-xs font-bold">Loading {farmFilter} Sales...</span>
                    </td>
                 </tr>
              )}

              {/* ── ACTUAL DATA ROWS ── */}
              {!isLoading && filtered.map((sale, idx) => {
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
                      <input type="checkbox" checked={isSel} onChange={() => toggleSelect(sale.id)} style={{ accentColor: '#1a5c35', cursor: 'pointer' }} />
                    </td>

                    <td style={tdStyle()}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 800, color: '#0d1f0d', fontSize: '12.5px' }}>{sale.date || '—'}</span>
                        <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600 }}>{sale.farm ? `${sale.farm} Block` : '—'}</span>
                      </div>
                    </td>

                    <td style={tdStyle()}><span style={{ fontWeight: 700, color: '#111827' }}>{Number(sale.qty1 || 0).toLocaleString()}</span></td>
                    <td style={tdStyle()}><span style={{ color: '#374151' }}>Rs. {sale.rate1 || '—'}</span></td>
                    
                    <td style={tdStyle()}>
                      {Number(sale.disc1 || 0) > 0 ? <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>−{sale.disc1}</span> : <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>

                    <td style={tdStyle()}>{Number(sale.qty2 || 0) > 0 ? <span style={{ color: '#374151', fontWeight: 600 }}>{Number(sale.qty2).toLocaleString()}</span> : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                    <td style={tdStyle()}>{Number(sale.rate2 || 0) > 0 ? <span style={{ color: '#374151' }}>Rs. {sale.rate2}</span> : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                    
                    <td style={{ ...tdStyle(), textAlign: 'right', paddingRight: '20px' }}>
                      <span style={{ fontWeight: 900, color: '#0d3320', fontSize: '13px' }}>
                        Rs. {fmt(sale.total || calcNet(sale))}
                      </span>
                    </td>

                    <td style={{ ...tdStyle('80px'), textAlign: 'right' }}>
                       <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                         <button
                           onClick={() => openEditSale(sale)}
                           style={{
                             background: 'none', border: 'none', cursor: 'pointer',
                             padding: '6px', borderRadius: '6px', color: '#9ca3af',
                             transition: 'all 0.15s',
                           }}
                           onMouseOver={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; }}
                           onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af'; }}
                         >
                           <Edit2 size={14} />
                         </button>
                         <button onClick={() => handleDelete(sale.id)} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '6px', borderRadius: '6px', color: '#9ca3af',
                            transition: 'all 0.15s',
                          }}
                            onMouseOver={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af'; }}
                          >
                            <Trash2 size={14} />
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}

              {!isLoading && filtered.length === 0 && !isAdding && (
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
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button style={pageBtn(false)}><ChevronLeft size={13} /></button>
            <button style={pageBtn(true)}>1</button>
            <button style={pageBtn(false)}><ChevronRight size={13} /></button>
          </div>
        </div>
      </div>

      {editSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[1.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text font-heading">Update Coconut Sale</h2>
                  <p className="text-xs text-earth">Edit sale #{editSale.id}</p>
                </div>
              </div>
              <button onClick={closeEditSale} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-text mb-1.5">Date of Sale</label>
                    <input
                      type="date"
                      name="date"
                      value={editRow.date}
                      onChange={handleEditRowChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-text focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text mb-1.5">Estate Farm</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditRow((prev) => ({ ...prev, farm: 'MR1' }))}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${editRow.farm === 'MR1' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-200 text-earth hover:bg-gray-50'}`}>
                        MR1 Block
                      </button>
                      <button type="button" onClick={() => setEditRow((prev) => ({ ...prev, farm: 'MR2' }))}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${editRow.farm === 'MR2' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-200 text-earth hover:bg-gray-50'}`}>
                        MR2 Block
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/40 space-y-4">
                  <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2">1st Quality Yield</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-earth mb-1">Quantity (Nuts)</label>
                      <input type="number" name="qty1" value={editRow.qty1} onChange={handleEditRowChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-earth mb-1">Rate (Rs.)</label>
                      <input type="number" name="rate1" value={editRow.rate1} onChange={handleEditRowChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-amber-600 mb-1">Discount Qty (-)</label>
                      <input type="number" name="disc1" value={editRow.disc1} onChange={handleEditRowChange} className="w-full border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none" />
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4">
                  <h3 className="text-sm font-bold text-text">2nd Quality Yield</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-earth mb-1">Quantity (Nuts)</label>
                      <input type="number" name="qty2" value={editRow.qty2} onChange={handleEditRowChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-earth mb-1">Rate (Rs.)</label>
                      <input type="number" name="rate2" value={editRow.rate2} onChange={handleEditRowChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-amber-600 mb-1">Discount Qty</label>
                    <input type="number" name="disc2" value={editRow.disc2} onChange={handleEditRowChange} className="w-full border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm text-blue-600">
                  <ArrowUpRight size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-earth uppercase tracking-wider mb-0.5">Updated Net Total</p>
                  <p className="text-2xl font-bold text-text font-heading">Rs. {fmt(calcNet(editRow))}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={closeEditSale} className="px-5 py-2.5 text-sm font-bold text-earth hover:text-text transition-colors">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateSale}
                  disabled={isSaving}
                  className="bg-blue-600 px-6 py-2.5 text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 rounded-xl text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Update Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = (align = 'left', width) => ({
  padding: '10px 14px', fontSize: '10.5px', fontWeight: 800, color: '#6b7a6b', textTransform: 'uppercase', letterSpacing: '0.7px', textAlign: align, ...(width ? { width } : {}),
});
const tdStyle = (width) => ({
  padding: '12px 14px', verticalAlign: 'middle', ...(width ? { width } : {}),
});
const inputStyle = {
  padding: '6px 8px', borderRadius: '6px', border: '1.5px solid #d1d5db', fontSize: '12px', fontWeight: 600, fontFamily: "'Nunito', sans-serif", color: '#111827', outline: 'none', transition: 'border-color 0.2s',
};
const pageBtn = (active) => ({
  width: '28px', height: '28px', borderRadius: '7px', border: active ? 'none' : '1.5px solid #e5e7eb', background: active ? 'linear-gradient(135deg, #1a5c35, #0d3320)' : '#fff', color: active ? '#fff' : '#6b7280', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito', sans-serif", boxShadow: active ? '0 2px 8px rgba(13,51,32,0.3)' : 'none',
});