import { useState, useEffect } from 'react';
import {
  Plus, Search, Download, MoreHorizontal,
  ChevronLeft, ChevronRight, SlidersHorizontal,
  TrendingUp, Wallet, Coins, Check, X, Award,
  Loader2, AlertCircle, Trash2, Pencil
} from 'lucide-react';

import { getOtherIncomes, createOtherIncome, updateOtherIncome, deleteOtherIncome } from '../services/api';
import { useToast } from '../components/ToastProvider';
import { downloadCsv } from '../utils/csv';

const fmt = (n) => Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function OtherIncomes() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  // API States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Inline Row State ---
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newRow, setNewRow] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: ''
  });

  // --- Inline Edit State ---
  const [editingId, setEditingId] = useState(null);
  const [editRow, setEditRow] = useState({ date: '', description: '', amount: '' });
  const toast = useToast();

  // --- Fetch Data ---
  useEffect(() => {
    fetchIncomeData();
  }, []);

  const fetchIncomeData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getOtherIncomes(); // Fetching all by default
      setSales(data);
    } catch (err) {
      setError("Failed to load income data. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter based only on search text (Description or Date)
  const filtered = sales.filter(s =>
    !search ||
    (s.date && s.date.includes(search)) ||
    (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  const totalRevenue = filtered.reduce((a, s) => a + (parseFloat(s.amount) || 0), 0);

  // Find the highest value entry for the KPI card
  const topEntry = filtered.reduce((max, sale) => {
    const amt = parseFloat(sale.amount) || 0;
    return amt > max.amount ? { amount: amt, description: sale.description } : max;
  }, { amount: 0, description: 'N/A' });

  const toggleSelect = (id) =>
    setSelected(sel => sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]);
  const toggleAll = () =>
    setSelected(sel => sel.length === filtered.length ? [] : filtered.map(s => s.id));

  const handleRowChange = (e) => {
    setNewRow(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveRow = async () => {
    if (!newRow.description || !newRow.amount) {
      toast.warn("Please enter a description and an amount.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        date: newRow.date,
        farm: "MR1",          // Defaulted to satisfy backend
        category: "Misc",     // Defaulted to keep UI clean as requested
        description: newRow.description,
        amount: parseFloat(newRow.amount) || 0,
      };

      const savedRecord = await createOtherIncome(payload);
      
      setSales(prev => [savedRecord, ...prev]);
      setIsAdding(false);
      setNewRow({ date: new Date().toISOString().split('T')[0], description: '', amount: '' });
    } catch (err) {
      toast.error("Failed to save record to database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteOtherIncome(id);
        setSales(prev => prev.filter(s => s.id !== id));
      } catch (err) {
        toast.error("Failed to delete record.");
      }
    }
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewRow({ date: new Date().toISOString().split('T')[0], description: '', amount: '' });
  };

  const startEdit = (sale) => {
    setIsAdding(false);
    setEditingId(sale.id);
    setEditRow({
      date: sale.date || new Date().toISOString().split('T')[0],
      description: sale.description || '',
      amount: sale.amount ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRow({ date: '', description: '', amount: '' });
  };

  const handleEditChange = (e) => {
    setEditRow(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdateRow = async (sale) => {
    if (!editRow.description || editRow.amount === '') {
      toast.warn("Please enter a description and an amount.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        date: editRow.date,
        farm: sale.farm || "MR1",
        category: sale.category || "Misc",
        description: editRow.description,
        amount: parseFloat(editRow.amount) || 0,
      };
      const updated = await updateOtherIncome(sale.id, payload);
      setSales(prev => prev.map(s => s.id === sale.id ? { ...s, ...updated, ...payload, id: sale.id } : s));
      cancelEdit();
      toast.success("Record updated.");
    } catch (err) {
      toast.error("Failed to update record.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCsv = () => {
    downloadCsv('other-incomes.csv', [
      { label: 'Date', value: (row) => row.date || '' },
      { label: 'Description', value: (row) => row.description || '' },
      { label: 'Amount', value: (row) => Number(row.amount || 0).toFixed(2) },
    ], filtered);
  };

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #14532d, #166534)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={16} color="#86efac" />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#0d1f0d', margin: 0, letterSpacing: '-0.4px' }}>
              Other Incomes Ledger
            </h1>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7a6b', margin: 0, paddingLeft: '42px' }}>
            Track miscellaneous revenue, intercrops, and asset sales
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={handleExportCsv} style={{
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
              background: isAdding || isLoading ? '#9ca3af' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              border: 'none', borderRadius: '10px',
              fontSize: '12px', fontWeight: 800, color: '#fff',
              cursor: isAdding || isLoading ? 'not-allowed' : 'pointer', fontFamily: "'Nunito', sans-serif",
              boxShadow: isAdding ? 'none' : '0 4px 14px rgba(22,163,74,0.35)',
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

      {/* ── PREMIUM KPI STAT CARDS (OTHER INCOMES - REDUCED HEIGHT) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          {
            title: 'Total Misc Revenue',
            amount: `Rs. ${fmt(totalRevenue)}`,
            badge: `${filtered.length} Trans.`,
            sub: 'Recorded',
            icon: <TrendingUp size={14} />,
            path: "M0,40 L0,25 C 20,30 40,10 60,15 C 80,20 90,5 100,5 L100,40 Z"
          },
          {
            title: 'Largest Single Income',
            amount: `Rs. ${fmt(topEntry.amount)}`,
            badge: 'Top Entry',
            sub: topEntry.description,
            icon: <Award size={14} />,
            path: "M0,40 L0,20 C 30,35 50,15 70,25 C 85,30 95,10 100,10 L100,40 Z"
          },
          {
            title: 'Total Entries',
            amount: filtered.length.toString(),
            badge: 'Records',
            sub: 'Matching Search',
            icon: <Coins size={14} />,
            path: "M0,40 L0,15 C 25,10 45,30 65,20 C 85,10 95,25 100,20 L100,40 Z"
          }
        ].map((card, i) => {
          const gradId = `grad-other-${i}`;
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 truncate max-w-[100px] sm:max-w-[140px]">
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

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', maxWidth: '400px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search descriptions or dates..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '32px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px',
                  border: '1.5px solid #e5e7eb', borderRadius: '9px',
                  fontSize: '12px', color: '#374151', outline: 'none',
                  fontFamily: "'Nunito', sans-serif",
                  background: '#fafafa',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
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
                    style={{ accentColor: '#16a34a', cursor: 'pointer' }}
                  />
                </th>
                {['Date', 'Income Description', 'Amount Received'].map((h, i) => (
                  <th key={h} style={thStyle(i === 2 ? 'right' : 'left', i === 1 ? '50%' : undefined)}>{h}</th>
                ))}
                <th style={thStyle('right', '80px')} />
              </tr>
            </thead>
            <tbody>

              {/* ── INLINE ADD ROW ── */}
              {isAdding && (
                <tr style={{ background: '#f0fdf4', borderBottom: '1.5px solid #bbf7d0', boxShadow: 'inset 0 2px 4px rgba(22,163,74,0.05)' }}>
                  <td style={tdStyle('52px')}></td>
                  <td style={tdStyle('150px')}>
                    <input type="date" name="date" value={newRow.date} onChange={handleRowChange} style={inputStyle} disabled={isSaving} />
                  </td>
                  <td style={tdStyle()}>
                    <input type="text" name="description" placeholder="Enter income details (e.g., Banana Harvest sales)" value={newRow.description} onChange={handleRowChange} style={{ ...inputStyle, width: '100%' }} disabled={isSaving} />
                  </td>
                  <td style={{ ...tdStyle('200px'), textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Rs.</span>
                      <input type="number" name="amount" placeholder="0.00" value={newRow.amount} onChange={handleRowChange} style={{ ...inputStyle, width: '120px', textAlign: 'right' }} disabled={isSaving} />
                    </div>
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
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#16a34a' }}>
                       <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                       <span className="text-xs font-bold">Loading Ledger...</span>
                    </td>
                 </tr>
              )}

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
                      <input type="checkbox" checked={isSel} onChange={() => toggleSelect(sale.id)}
                        style={{ accentColor: '#16a34a', cursor: 'pointer' }} />
                    </td>

                    {editingId === sale.id ? (
                      <>
                        {/* Date (edit) */}
                        <td style={tdStyle()}>
                          <input type="date" name="date" value={editRow.date} onChange={handleEditChange} style={inputStyle} disabled={isSaving} />
                        </td>
                        {/* Description (edit) */}
                        <td style={tdStyle()}>
                          <input type="text" name="description" value={editRow.description} onChange={handleEditChange} style={{ ...inputStyle, width: '100%' }} disabled={isSaving} />
                        </td>
                        {/* Amount (edit) */}
                        <td style={{ ...tdStyle(), textAlign: 'right', paddingRight: '20px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Rs.</span>
                            <input type="number" name="amount" value={editRow.amount} onChange={handleEditChange} style={{ ...inputStyle, width: '120px', textAlign: 'right' }} disabled={isSaving} />
                          </div>
                        </td>
                        {/* Actions (edit) */}
                        <td style={{ ...tdStyle('80px'), textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={cancelEdit} disabled={isSaving} style={{ background: '#f3f4f6', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#6b7280' }}>
                              <X size={14} strokeWidth={3} />
                            </button>
                            <button onClick={() => handleUpdateRow(sale)} disabled={isSaving} style={{ background: '#16a34a', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#fff', boxShadow: '0 2px 4px rgba(22,163,74,0.2)' }}>
                              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Date */}
                        <td style={tdStyle()}>
                          <span style={{ fontWeight: 800, color: '#0d1f0d', fontSize: '12.5px' }}>{sale.date}</span>
                        </td>

                        {/* Description */}
                        <td style={tdStyle()}>
                          <span style={{ color: '#1f2937', fontWeight: 600 }}>{sale.description}</span>
                        </td>

                        {/* Total */}
                        <td style={{ ...tdStyle(), textAlign: 'right', paddingRight: '20px' }}>
                          <span style={{ fontWeight: 900, color: '#14532d', fontSize: '13px' }}>
                            Rs. {fmt(parseFloat(sale.amount))}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ ...tdStyle('80px'), textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                            <button onClick={() => startEdit(sale)} style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: '6px', borderRadius: '6px', color: '#9ca3af',
                              transition: 'all 0.15s',
                            }}
                              onMouseOver={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; }}
                              onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af'; }}
                            >
                              <Pencil size={14} />
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
                      </>
                    )}
                  </tr>
                );
              })}

              {!isLoading && filtered.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                    No records found for your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div style={{ padding: '12px 18px', borderTop: '1.5px solid #f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
          <span style={{ fontSize: '12px', color: '#6b7a6b', fontWeight: 600 }}>
            Showing <strong style={{ color: '#0d1f0d' }}>{filtered.length}</strong> results
            {selected.length > 0 && <span style={{ marginLeft: '10px', color: '#16a34a', fontWeight: 700 }}>· {selected.length} selected</span>}
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