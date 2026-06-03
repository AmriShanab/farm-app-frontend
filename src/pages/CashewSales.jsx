import { useState, useEffect } from 'react';
import {
  Plus, Search, Download,
  ChevronLeft, ChevronRight, SlidersHorizontal,
  TrendingUp, Nut, ArrowUpRight, Check, X, Scale,
  Loader2, AlertCircle, Trash2, Edit2, Save
} from 'lucide-react';

import { getCashewSales, createCashewSale, updateCashewSale, deleteCashewSale } from '../services/api';
import { useToast } from '../components/ToastProvider';
import { downloadCsv } from '../utils/csv';

const fmt = (n) => Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CashewSales() {
  const [yearFilter, setYearFilter] = useState('2026');
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  // API States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Panel States ---
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newRow, setNewRow] = useState({
    date: new Date().toISOString().split('T')[0],
    kg: '', rate: '', laborCost: ''
  });

  const [editSale, setEditSale] = useState(null);
  const [editRow, setEditRow] = useState({
    date: new Date().toISOString().split('T')[0],
    kg: '', rate: '', laborCost: ''
  });
  const toast = useToast();

  // --- FIXED CALCULATION ---
  // Gross Revenue (Kg * Rate) minus Labor Cost
  const calcNet = (row) => {
    const kg = parseFloat(row.kg) || 0;
    const rate = parseFloat(row.rate) || 0;
    const labor = parseFloat(row.laborCost ?? row.labor_cost) || 0;

    return Math.max(0, (kg * rate) - labor);
  };

  // --- Fetch Data ---
  useEffect(() => {
    let isActive = true;

    const loadSales = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getCashewSales(yearFilter);
        if (!isActive) return;
        setSales(Array.isArray(data) ? data : (data?.data || []));
      } catch {
        if (isActive) setError("Failed to load cashew sales data. Please check your connection.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadSales();
    return () => { isActive = false; };
  }, [yearFilter]);

  const filtered = sales.filter(s => !search || s.date.includes(search));

  const totalRevenue = filtered.reduce((a, s) => a + (Number(s.total) || calcNet(s)), 0);
  const totalKg = filtered.reduce((a, s) => a + Number(s.kg || 0), 0);
  const avgRate = filtered.length
    ? (filtered.reduce((a, s) => a + Number(s.rate || 0), 0) / filtered.length).toFixed(0)
    : 0;

  const toggleSelect = (id) =>
    setSelected(sel => sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]);
  const toggleAll = () =>
    setSelected(sel => sel.length === filtered.length ? [] : filtered.map(s => s.id));

  const handleRowChange = (e) => setNewRow(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleEditRowChange = (e) => setEditRow(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const openEditSale = (sale) => {
    setEditSale(sale);
    setEditRow({
      date: sale.date || new Date().toISOString().split('T')[0],
      kg: sale.kg ?? '',
      rate: sale.rate ?? '',
      laborCost: sale.laborCost ?? sale.labor_cost ?? '',
    });
  };

  const closeEditSale = () => {
    setEditSale(null);
    setEditRow({ date: new Date().toISOString().split('T')[0], kg: '', rate: '', laborCost: '' });
    setIsSaving(false);
  };

  const handleSaveRow = async () => {
    if (!newRow.kg || !newRow.rate) {
      toast.warn("Please enter both Quantity (Kg) and Rate.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        date: newRow.date,
        kg: parseFloat(newRow.kg) || 0,
        rate: parseFloat(newRow.rate) || 0,
        laborCost: parseFloat(newRow.laborCost) || 0,
      };

      const savedRecord = await createCashewSale(payload);

      const completeRecord = {
        ...savedRecord,
        total: savedRecord.total || calcNet(payload)
      };

      setSales(prev => [completeRecord, ...prev]);
      setIsAdding(false);

      // Auto-update year filter if user added a date from a different year
      const addedYear = newRow.date.split('-')[0];
      if (addedYear !== yearFilter) setYearFilter(addedYear);

      setNewRow({ date: new Date().toISOString().split('T')[0], kg: '', rate: '', laborCost: '' });
      toast.success("Cashew sale recorded.");
    } catch {
      toast.error("Failed to save record to database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSale = async () => {
    if (!editSale?.id) return;
    if (!editRow.kg || !editRow.rate) {
      toast.warn("Please enter both Quantity (Kg) and Rate.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        date: editRow.date,
        kg: parseFloat(editRow.kg) || 0,
        rate: parseFloat(editRow.rate) || 0,
        laborCost: parseFloat(editRow.laborCost) || 0,
      };

      const updatedRecord = await updateCashewSale(editSale.id, payload);
      const completeRecord = {
        ...updatedRecord,
        total: updatedRecord.total || calcNet(payload)
      };

      setSales(prev => prev.map(s => (s.id === editSale.id ? completeRecord : s)));
      closeEditSale();
      toast.success("Record updated successfully.");
    } catch {
      toast.error("Failed to update record.");
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteCashewSale(id);
        setSales(prev => prev.filter(s => s.id !== id));
        toast.success("Record deleted.");
      } catch {
        toast.error("Failed to delete record.");
      }
    }
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewRow({ date: new Date().toISOString().split('T')[0], kg: '', rate: '', laborCost: '' });
  };

  const handleExportCsv = () => {
    downloadCsv(`cashew-sales-${yearFilter}.csv`, [
      { label: 'Date', value: (row) => row.date || '' },
      { label: 'Kg', value: (row) => row.kg ?? 0 },
      { label: 'Rate', value: (row) => row.rate ?? 0 },
      { label: 'Labor Cost', value: (row) => row.laborCost ?? row.labor_cost ?? 0 },
      { label: 'Total', value: (row) => Number(row.total || calcNet(row)).toFixed(2) },
    ], filtered);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Nunito'] pb-10">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c2d12] to-[#9a3412] flex items-center justify-center shadow-lg shadow-orange-900/20">
              <Nut size={20} className="text-orange-300" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Cashew Nuts Ledger
            </h1>
          </div>
          <p className="text-sm font-medium text-gray-500 pl-[52px]">
            Track seasonal cashew yields, labor costs, and pricing
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <button onClick={handleExportCsv} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => setIsAdding(true)}
            disabled={isAdding || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white border-none rounded-xl text-xs font-black shadow-md hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 transition-all"
          >
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      {/* ── ERROR STATE ── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm font-bold animate-in fade-in">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* ── PREMIUM KPI STAT CARDS (CASHEW THEME) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          {
            title: 'Total Revenue (Net)',
            amount: `Rs. ${fmt(totalRevenue)}`,
            badge: `${yearFilter} Harvest`,
            sub: 'Recorded',
            icon: <TrendingUp size={14} />,
            chartColor: '#fdba74',
            path: "M0,40 L0,25 C 20,30 40,10 60,15 C 80,20 90,5 100,5 L100,40 Z"
          },
          {
            title: 'Total Weight Sold',
            amount: `${totalKg.toLocaleString()} Kg`,
            badge: `${filtered.length} Entries`,
            sub: 'Total Volume',
            icon: <Scale size={14} />,
            chartColor: '#fdba74',
            path: "M0,40 L0,20 C 30,35 50,15 70,25 C 85,30 95,10 100,10 L100,40 Z"
          },
          {
            title: 'Avg Rate / Kg',
            amount: `Rs. ${avgRate}`,
            badge: 'Market Avg',
            sub: 'This Period',
            icon: <ArrowUpRight size={14} />,
            chartColor: '#fdba74',
            path: "M0,40 L0,15 C 25,10 45,30 65,20 C 85,10 95,25 100,20 L100,40 Z"
          }
        ].map((card, i) => {
          const gradId = `grad-cashew-${i}`;
          return (
            <div key={i} className="relative overflow-hidden rounded-[1.25rem] p-4 bg-gradient-to-br from-[#9a3412] to-[#7c2d12] text-white shadow-lg shadow-orange-900/20 group border border-orange-800/50 transition-all hover:shadow-orange-900/40 hover:-translate-y-1 h-28">
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
                      <stop offset="0%" stopColor={card.chartColor} stopOpacity="0.4" />
                      <stop offset="100%" stopColor={card.chartColor} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d={card.path} fill={`url(#${gradId})`} stroke={card.chartColor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DEDICATED REGISTRATION PANEL (Upgraded UX) ── */}
      {isAdding && (
        <div className="bg-gradient-to-b from-orange-50 to-white border border-orange-200 rounded-xl p-6 shadow-md mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-5 border-b border-orange-100 pb-3">
            <h3 className="text-lg font-black text-orange-900 flex items-center gap-2">
              <Nut size={18} className="text-orange-600" /> Record Cashew Harvest Yield
            </h3>
            <button onClick={cancelAdd} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm border border-gray-200"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-3">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Date of Sale</label>
              <input type="date" name="date" value={newRow.date} onChange={handleRowChange} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none font-bold focus:border-orange-500 focus:ring-2 focus:ring-orange-100" disabled={isSaving} />
            </div>

            <div className="md:col-span-3">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Quantity (Kg)</label>
              <input type="number" name="kg" placeholder="0.0" value={newRow.kg} onChange={handleRowChange} className="w-full p-2.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 font-bold" disabled={isSaving} />
            </div>

            <div className="md:col-span-3">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Rate / Kg (Rs.)</label>
              <input type="number" name="rate" placeholder="0.00" value={newRow.rate} onChange={handleRowChange} className="w-full p-2.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 font-bold" disabled={isSaving} />
            </div>

            <div className="md:col-span-3">
              <label className="block text-[11px] font-black text-red-600 uppercase tracking-wider mb-1">Labor Cost Deduction</label>
              <input type="number" name="laborCost" placeholder="0.00" value={newRow.laborCost} onChange={handleRowChange} className="w-full p-2.5 text-sm border border-red-200 bg-red-50/50 rounded-lg outline-none focus:border-red-500 font-bold text-red-700" disabled={isSaving} />
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Net Invoice Subtotal</p>
              <p className="text-xl font-black text-orange-700">Rs. {fmt(calcNet(newRow))}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={cancelAdd} disabled={isSaving} className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">Cancel</button>
              <button onClick={handleSaveRow} disabled={isSaving} className="px-6 py-2.5 bg-orange-600 rounded-lg text-white text-sm font-bold shadow-md hover:bg-orange-700 flex items-center gap-2 transition-all disabled:opacity-50">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Record Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN LEDGER CONTAINER ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Table Filters Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
          <div className="flex bg-gray-200/60 p-1 rounded-xl gap-1 overflow-x-auto w-full sm:w-auto">
            {['2026', '2025', '2024', '2023'].map(y => (
              <button key={y} onClick={() => { setYearFilter(y); setIsAdding(false); }}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${yearFilter === y ? 'bg-white text-orange-900 shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}>
                {y} Season
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Search by date..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold outline-none focus:border-orange-500 shadow-sm"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 shadow-sm">
              <SlidersHorizontal size={13} className="text-gray-400" /> Filters
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4 text-left w-12">
                  <input type="checkbox" onChange={toggleAll} checked={selected.length > 0 && selected.length === filtered.length} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 accent-orange-600" />
                </th>
                <th className="p-4 text-left min-w-[120px]">Date</th>
                <th className="p-4 text-left">Quantity (Kg)</th>
                <th className="p-4 text-left">Rate / Kg</th>
                <th className="p-4 text-left">Labor Deduction</th>
                <th className="p-4 text-right">Net Subtotal</th>
                <th className="p-4 text-right w-24"></th>
              </tr>
            </thead>
            <tbody>

              {isLoading && (
                <tr>
                  <td colSpan={7} className="p-20 text-center text-orange-600">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    <span className="text-xs font-bold">Loading {yearFilter} Sales Data...</span>
                  </td>
                </tr>
              )}

              {!isLoading && filtered.map((sale, idx) => {
                const isSel = selected.includes(sale.id);
                return (
                  <tr key={sale.id} className={`border-t border-gray-50 transition-colors ${isSel ? 'bg-orange-50/40' : 'hover:bg-gray-50/40'}`}>
                    <td className="p-4">
                      <input type="checkbox" checked={isSel} onChange={() => toggleSelect(sale.id)} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 accent-orange-600 cursor-pointer" />
                    </td>

                    <td className="p-4 font-bold text-gray-900">
                      {sale.date || '—'}
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-gray-900">{Number(sale.kg || 0).toLocaleString()}</span>
                      <span className="text-xs text-gray-500 ml-1">Kg</span>
                    </td>

                    <td className="p-4 font-medium text-gray-700">
                      Rs. {sale.rate || '—'}
                    </td>

                    <td className="p-4">
                      {Number((sale.laborCost ?? sale.labor_cost) || 0) > 0 ? (
                        <span className="text-red-600 font-bold bg-red-50 border border-red-100 rounded px-2 py-0.5 text-[11px]">
                          −Rs. {sale.laborCost ?? sale.labor_cost}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    <td className="p-4 text-right font-black text-gray-900 text-base">
                      Rs. {fmt(sale.total || calcNet(sale))}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEditSale(sale)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(sale.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="p-12 text-center text-gray-400 font-bold">No cashew sales records found for {yearFilter}.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Custom Scannable Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500">
            Filtered Summary: <span className="text-gray-800">{filtered.length} entries matching</span>
          </span>
          <div className="flex gap-1">
            <button className="p-1.5 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50"><ChevronLeft size={14} /></button>
            <button className="px-3 py-1 text-xs font-black rounded bg-gradient-to-br from-orange-600 to-orange-700 text-white">1</button>
            <button className="p-1.5 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* ── MODAL DIALOG OVERLAY: UPDATE ENTRY ── */}
      {editSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[1.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-700">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Update Cashew Record</h2>
                  <p className="text-xs text-gray-400 font-medium">Modifying entry #{editSale.id}</p>
                </div>
              </div>
              <button onClick={closeEditSale} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Date of Sale</label>
                <input type="date" name="date" value={editRow.date} onChange={handleEditRowChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:border-orange-500 focus:outline-none transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Quantity (Kg)</label>
                  <input type="number" name="kg" value={editRow.kg} onChange={handleEditRowChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:border-orange-500 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Rate / Kg</label>
                  <input type="number" name="rate" value={editRow.rate} onChange={handleEditRowChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:border-orange-500 focus:outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-red-600 uppercase tracking-wider mb-1.5">Labor Cost Deduction (-)</label>
                <input type="number" name="laborCost" value={editRow.laborCost} onChange={handleEditRowChange} className="w-full border border-red-200 bg-red-50 text-red-700 rounded-xl px-4 py-2.5 font-bold focus:border-red-500 focus:outline-none transition-all" />
              </div>
            </div>

            <div className="px-6 py-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Updated Net Total</p>
                <p className="text-xl font-black text-orange-800">Rs. {fmt(calcNet(editRow))}</p>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={closeEditSale} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                <button
                  type="button" onClick={handleUpdateSale} disabled={isSaving}
                  className="bg-orange-600 px-5 py-2 rounded-xl text-white font-bold text-sm shadow-sm hover:bg-orange-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Update Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}