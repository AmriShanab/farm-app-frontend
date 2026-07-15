import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Download,
  ChevronLeft, ChevronRight, SlidersHorizontal,
  Wallet, Banknote, AlertCircle, Check, X,
  User, CheckCircle2, Edit2, Loader2, Save
} from 'lucide-react';

import { useToast } from '../components/ToastProvider';
import { getAdvances, createAdvance, getEmployees, updateAdvance } from '../services/api';
import { downloadCsv } from '../utils/csv';

const fmt = (n) => Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CashAdvances() {
  const [advances, setAdvances] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Unpaid');
  const [selected, setSelected] = useState([]);

  // API & Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const toast = useToast();

  // --- Registration Panel & Modal States (UPDATED WITH CHEQUE DETAILS) ---
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newRow, setNewRow] = useState({
    date: new Date().toISOString().split('T')[0],
    empId: '', amount: '', notes: '', chequeNo: '', chequeDate: ''
  });
  
  const [editAdvance, setEditAdvance] = useState(null);
  const [editRow, setEditRow] = useState({ date: '', amount: '', status: 'Unpaid', notes: '', chequeNo: '', chequeDate: '' });

  // --- Fetch Data ---
  useEffect(() => {
    let active = true;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const params = {};
        if (statusFilter && statusFilter !== 'All') params.status = statusFilter.toLowerCase();
        
        const response = await getAdvances(params);
        const rawData = Array.isArray(response) ? response : (response?.data || []);
        
        const normalizedData = rawData.map(adv => ({
          id: adv.id || adv.advance_id,
          date: adv.date,
          empId: String(adv.employee_id ?? adv.empId ?? ''),
          name: adv.employee_name ?? adv.name ?? '',
          amount: adv.amount,
          repaidAmount: Number(adv.repaid_amount ?? adv.repaidAmount ?? 0),
          status: (adv.status || 'unpaid').charAt(0).toUpperCase() + (adv.status || 'unpaid').slice(1),
          notes: adv.notes || '',
          chequeNo: adv.cheque_no || adv.chequeNo || '',
          chequeDate: adv.cheque_date || adv.chequeDate || ''
        }));

        if (active) setAdvances(normalizedData);
      } catch {
        if (active) toast.error('Failed to load advances.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    const loadEmployees = async () => {
      try {
        const emps = await getEmployees('All');
        if (active && Array.isArray(emps) && emps.length) {
          setEmployees(emps.map(e => ({ 
            id: String(e.id ?? e.employeeId ?? e.empId ?? ''), 
            name: e.name ?? e.employee_name ?? e.employeeName ?? '', 
            role: e.role ?? '' 
          })));
        }
      } catch {
        // Keep empty array on error
      }
    };

    loadData();
    loadEmployees();
    return () => { active = false; };
  }, [statusFilter]);

  const filtered = advances.filter(adv =>
    (statusFilter === 'All' || adv.status === statusFilter) &&
    (!search || adv.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const groupedAdvances = useMemo(() => {
    const map = new Map();
    filtered.forEach(adv => {
      const key = adv.empId || adv.name;
      if (!map.has(key)) map.set(key, { empId: adv.empId, name: adv.name, rows: [], total: 0 });
      const g = map.get(key);
      g.rows.push(adv);
      g.total += Number(adv.amount) || 0;
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered]);

  // KPIs
  // Outstanding = issued minus whatever payroll has already recovered
  const totalUnpaid = advances.filter(a => a.status === 'Unpaid').reduce((sum, a) => sum + Math.max(0, (Number(a.amount)||0) - (Number(a.repaidAmount)||0)), 0);
  const unpaidCount = advances.filter(a => a.status === 'Unpaid').length;
  const totalGivenAllTime = advances.reduce((sum, a) => sum + (Number(a.amount)||0), 0);

  const toggleSelect = (id) => setSelected(sel => sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]);
  const toggleAll = () => setSelected(sel => sel.length === filtered.length ? [] : filtered.map(s => s.id));

  const handleRowChange = (e) => setNewRow(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  // --- SAVE OPERATION MAPPED TO NEW BACKEND SCHEMA ---
  const handleSaveRow = async () => {
    if (!newRow.empId || !newRow.amount) {
      toast.warn("Please select an employee and enter an amount.");
      return;
    }

    setIsSaving(true);
    const payload = {
      date: newRow.date,
      empId: parseInt(newRow.empId, 10),
      amount: parseFloat(newRow.amount) || 0,
      notes: newRow.notes || '',
      chequeNo: newRow.chequeNo || null,
      chequeDate: newRow.chequeNo ? (newRow.chequeDate || newRow.date) : null
    };

    try {
      const saved = await createAdvance(payload);
      const emp = employees.find(e => String(e.id) === String(payload.empId));
      
      const record = {
        id: saved.id || saved.advance_id || String(Date.now()),
        date: saved.date || payload.date,
        empId: String(saved.empId ?? saved.employeeId ?? payload.empId),
        name: saved.name || (emp && emp.name) || '',
        amount: saved.amount ?? payload.amount,
        status: (saved.status || 'unpaid').charAt(0).toUpperCase() + (saved.status || 'unpaid').slice(1),
        notes: saved.notes || '',
        chequeNo: saved.cheque_no || saved.chequeNo || payload.chequeNo || '',
        chequeDate: saved.cheque_date || saved.chequeDate || payload.chequeDate || ''
      };
      
      setAdvances(prev => [record, ...prev]);
      setIsAdding(false);
      if (statusFilter === 'Deducted') setStatusFilter('Unpaid');
      setNewRow({ date: new Date().toISOString().split('T')[0], empId: '', amount: '', notes: '', chequeNo: '', chequeDate: '' });
      toast.success('Advance issued successfully');
    } catch {
      toast.error('Failed to issue advance.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkDeducted = async (adv) => {
    try {
      const payload = {
        date: adv.date,
        amount: parseFloat(adv.amount) || 0,
        status: 'deducted',
        notes: adv.notes || '',
        chequeNo: adv.chequeNo || null,
        chequeDate: adv.chequeDate || null
      };
      
      await updateAdvance(adv.id, payload);
      setAdvances(prev => prev.map(a => a.id === adv.id ? ({ ...a, status: 'Deducted' }) : a));
      toast.success('Advance marked as Deducted');
    } catch {
      toast.error('Failed to update advance status');
    }
  };

  // --- UPDATE OPERATION MAPPED TO NEW BACKEND SCHEMA ---
  const handleUpdateAdvance = async () => {
    if (!editRow.amount || !editRow.date) {
      toast.warn("Date and Amount are required.");
      return;
    }
    
    setIsSaving(true);
    try {
      const payload = { 
        date: editRow.date, 
        amount: parseFloat(editRow.amount) || 0, 
        status: editRow.status.toLowerCase(), 
        notes: editRow.notes,
        chequeNo: editRow.chequeNo || null,
        chequeDate: editRow.chequeNo ? (editRow.chequeDate || editRow.date) : null
      };
      
      await updateAdvance(editAdvance.id, payload);
      setAdvances(prev => prev.map(a => a.id === editAdvance.id ? ({ 
        ...a, date: payload.date, amount: payload.amount, 
        status: payload.status === 'deducted' ? 'Deducted' : 'Unpaid', 
        notes: payload.notes,
        chequeNo: payload.chequeNo || '',
        chequeDate: payload.chequeDate || ''
      }) : a));
      
      toast.success('Advance updated successfully');
      setEditAdvance(null);
    } catch {
      toast.error('Failed to update advance');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewRow({ date: new Date().toISOString().split('T')[0], empId: '', amount: '', notes: '', chequeNo: '', chequeDate: '' });
  };

  const handleExportCsv = () => {
    downloadCsv('cash-advances.csv', [
      { label: 'Date', value: (row) => row.date || '' },
      { label: 'Employee', value: (row) => row.name || '' },
      { label: 'Status', value: (row) => row.status || '' },
      { label: 'Amount', value: (row) => Number(row.amount || 0).toFixed(2) },
      { label: 'Cheque No', value: (row) => row.chequeNo || 'Cash' },
      { label: 'Notes', value: (row) => row.notes || '' },
    ], filtered);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Nunito'] pb-10">
      
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center shadow-lg shadow-green-900/20">
              <Banknote size={20} className="text-green-300" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Cash Advances
            </h1>
          </div>
          <p className="text-sm font-medium text-gray-500 pl-[52px]">
            Record employee advances to be deducted natively during payroll computations
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <button onClick={handleExportCsv} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
            <Download size={14} /> Export List
          </button>
          <button
            onClick={() => setIsAdding(true)}
            disabled={isAdding || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white border-none rounded-xl text-xs font-black shadow-md hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all"
          >
            <Plus size={16} /> Issue Advance
          </button>
        </div>
      </div>

      {/* ── KPI STAT CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          {
            title: 'Outstanding Advances',
            amount: `Rs. ${fmt(totalUnpaid)}`,
            badge: `${unpaidCount} Pending`,
            sub: 'To Deduct Next Payroll',
            icon: <AlertCircle size={14} />,
            chartColor: '#A5D6A7',
            path: "M0,40 L0,25 C 20,30 40,10 60,15 C 80,20 90,5 100,5 L100,40 Z"
          },
          {
            title: 'Total Given (All Time)',
            amount: `Rs. ${fmt(totalGivenAllTime)}`,
            badge: 'Cash Flow',
            sub: 'Historical Total',
            icon: <Wallet size={14} />,
            chartColor: '#A5D6A7',
            path: "M0,40 L0,20 C 30,35 50,15 70,25 C 85,30 95,10 100,10 L100,40 Z"
          },
          {
            title: 'Highest Unpaid',
            amount: unpaidCount > 0 ? `Rs. ${fmt(Math.max(...advances.filter(a => a.status === 'Unpaid').map(a => Number(a.amount))))}` : 'Rs. 0.00',
            badge: 'Max Exposure',
            sub: 'Single Employee',
            icon: <User size={14} />,
            chartColor: '#A5D6A7',
            path: "M0,40 L0,15 C 25,10 45,30 65,20 C 85,10 95,25 100,20 L100,40 Z"
          }
        ].map((card, i) => {
          const gradId = `grad-adv-${i}`;
          return (
            <div key={i} className="relative overflow-hidden rounded-[1.25rem] p-4 bg-gradient-to-br from-[#166534] to-[#14532d] text-white shadow-lg shadow-green-900/20 group border border-green-800/50 transition-all hover:-translate-y-1 h-28">
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

      {/* ── DEDICATED REGISTRATION PANEL (UPGRADED WITH NEW METADATA FIELDS) ── */}
      {isAdding && (
        <div className="bg-gradient-to-b from-green-50 to-white border border-green-200 rounded-xl p-6 shadow-md mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-5 border-b border-green-100 pb-3">
            <h3 className="text-lg font-black text-green-900 flex items-center gap-2">
              <Banknote size={18} className="text-green-600"/> Issue New Advance
            </h3>
            <button onClick={cancelAdd} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm border border-gray-200"><X size={18} /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-3">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Issue Date</label>
              <input type="date" name="date" value={newRow.date} onChange={handleRowChange} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none font-bold focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" disabled={isSaving} />
            </div>

            <div className="md:col-span-4">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Employee</label>
              <select name="empId" value={newRow.empId} onChange={handleRowChange} className="w-full p-2.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 font-bold" disabled={isSaving}>
                 <option value="" disabled>Select Employee...</option>
                 {employees.map(emp => (
                   <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                 ))}
              </select>
            </div>
            
            <div className="md:col-span-3">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Amount (Rs.)</label>
              <input type="number" name="amount" placeholder="0.00" value={newRow.amount} onChange={handleRowChange} className="w-full p-2.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 font-bold" disabled={isSaving} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Status</label>
              <div className="w-full p-2.5 text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-not-allowed">
                <AlertCircle size={14}/> Unpaid
              </div>
            </div>

            {/* NEW FIELD: CHEQUE NUMBER */}
            <div className="md:col-span-4">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Cheque Number <span className="text-gray-400 font-normal">(Leave blank if cash)</span></label>
              <input type="text" name="chequeNo" placeholder="E.g. CHQ102934" value={newRow.chequeNo} onChange={handleRowChange} className="w-full p-2.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 font-bold" disabled={isSaving} />
            </div>

            {/* NEW FIELD: CHEQUE DATE */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Cheque Maturity Date</label>
              <input type="date" name="chequeDate" value={newRow.chequeDate || newRow.date} onChange={handleRowChange} className="w-full p-2.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 font-bold" disabled={!newRow.chequeNo || isSaving} />
            </div>

            {/* NEW FIELD: NOTES */}
            <div className="md:col-span-5">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Reason / Notes</label>
              <input type="text" name="notes" placeholder="E.g. Festival advance, Medical emergency..." value={newRow.notes} onChange={handleRowChange} className="w-full p-2.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 font-bold" disabled={isSaving} />
            </div>
          </div>

          <div className="flex justify-end items-center mt-6 pt-4 border-t border-gray-100 gap-3">
            <button onClick={cancelAdd} disabled={isSaving} className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">Cancel</button>
            <button onClick={handleSaveRow} disabled={isSaving} className="px-6 py-2.5 bg-green-600 rounded-lg text-white text-sm font-bold shadow-md hover:bg-green-700 flex items-center gap-2 transition-all disabled:opacity-50">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Advance
            </button>
          </div>
        </div>
      )}

      {/* ── ADVANCES TABLE ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
          <div className="flex bg-gray-200/60 p-1 rounded-xl gap-1 overflow-x-auto w-full sm:w-auto">
            {['Unpaid', 'Deducted', 'All'].map(f => (
              <button key={f} onClick={() => { setStatusFilter(f); setIsAdding(false); }} 
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${statusFilter === f ? 'bg-white text-green-900 shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}>
                {f} Advances
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold outline-none focus:border-green-500 shadow-sm"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 shadow-sm">
              <SlidersHorizontal size={13} className="text-gray-400" /> Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4 text-left w-12">
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded border-gray-300 text-green-600 focus:ring-green-500 accent-green-600 cursor-pointer" />
                </th>
                <th className="p-4 text-left">Issue Date</th>
                <th className="p-4 text-left">Employee Name</th>
                <th className="p-4 text-left">Funding Type / Notes</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-right">Advance Amount</th>
                <th className="p-4 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody>

              {isLoading && (
                 <tr>
                    <td colSpan={7} className="p-20 text-center text-green-600">
                       <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                       <span className="text-xs font-bold">Loading Advances...</span>
                    </td>
                 </tr>
              )}

              {!isLoading && groupedAdvances.map(group => (
                group.rows.map((adv, rowIdx) => {
                  const isSel = selected.includes(adv.id);
                  const isFirst = rowIdx === 0;
                  return [
                    isFirst && (
                      <tr key={`grp-${group.empId}`} className="border-t-2 border-gray-200 bg-gray-50/70">
                        <td className="pl-4 py-2.5">
                          <input
                            type="checkbox"
                            checked={group.rows.every(r => selected.includes(r.id))}
                            onChange={() => {
                              const allIds = group.rows.map(r => r.id);
                              const allSelected = allIds.every(id => selected.includes(id));
                              setSelected(prev =>
                                allSelected
                                  ? prev.filter(id => !allIds.includes(id))
                                  : [...new Set([...prev, ...allIds])]
                              );
                            }}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500 accent-green-600 cursor-pointer"
                          />
                        </td>
                        <td colSpan={5} className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center text-white font-black text-[11px] flex-shrink-0">
                              {(group.name || 'U').substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-black text-gray-900 text-sm">{group.name}</span>
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold">
                              {group.rows.length} advance{group.rows.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 text-right">
                          <span className="font-black text-green-800 text-sm">Rs. {fmt(group.total)}</span>
                        </td>
                      </tr>
                    ),
                    <tr key={adv.id} className={`border-t border-gray-50 transition-colors ${isSel ? 'bg-green-50/40' : 'hover:bg-gray-50/40'}`}>
                      <td className="p-4">
                        <input type="checkbox" checked={isSel} onChange={() => toggleSelect(adv.id)} className="rounded border-gray-300 text-green-600 focus:ring-green-500 accent-green-600 cursor-pointer" />
                      </td>

                      <td className="p-4 font-bold text-gray-900 pl-8">
                        {adv.date || '—'}
                      </td>

                      <td className="p-4 text-gray-400 text-xs font-medium pl-2">
                        <span className="text-gray-300 mr-1">└</span>{adv.name}
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col max-w-[240px] truncate">
                          {adv.chequeNo ? (
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 inline-block w-max mb-0.5">
                              Chq: {adv.chequeNo} ({adv.chequeDate})
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wide mb-0.5">Liquid Cash Transfer</span>
                          )}
                          <span className="text-xs text-gray-500 italic font-medium truncate" title={adv.notes}>
                            {adv.notes || 'No notes provided'}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        {adv.status === 'Unpaid' ? (
                          adv.repaidAmount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                              <AlertCircle size={10} /> Partial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertCircle size={10} /> Pending
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-700 border border-green-200">
                            <CheckCircle2 size={10} /> Deducted
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <span className="font-black text-gray-900 text-[13px]">Rs. {fmt(parseFloat(adv.amount))}</span>
                        {adv.status === 'Unpaid' && adv.repaidAmount > 0 && (
                          <span className="block text-[10px] font-bold text-blue-600 mt-0.5">
                            Repaid Rs. {fmt(adv.repaidAmount)} · Due Rs. {fmt(Math.max(0, adv.amount - adv.repaidAmount))}
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          {adv.status === 'Unpaid' && (
                            <button
                              onClick={() => handleMarkDeducted(adv)}
                              title="Mark as Deducted"
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}
                          <button
                            title="Edit Record"
                            onClick={() => {
                              setEditAdvance(adv);
                              setEditRow({
                                date: adv.date || '',
                                amount: String(adv.amount || ''),
                                status: adv.status || 'Unpaid',
                                notes: adv.notes || '',
                                chequeNo: adv.chequeNo || '',
                                chequeDate: adv.chequeDate || ''
                              });
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ];
                })
              ))}

              {!isLoading && groupedAdvances.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400 font-bold">
                    No advances found matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
            {!isLoading && filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                  <td className="p-4"></td>
                  <td className="p-4 font-black text-gray-700 text-xs uppercase tracking-wider" colSpan={4}>
                    Totals ({filtered.length} advances across {groupedAdvances.length} employee{groupedAdvances.length !== 1 ? 's' : ''})
                  </td>
                  <td className="p-4 text-right font-black text-gray-900 text-[13px]">
                    Rs. {fmt(filtered.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0))}
                  </td>
                  <td className="p-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500">
            Showing <strong className="text-gray-900">{filtered.length}</strong> records across <strong className="text-gray-900">{groupedAdvances.length}</strong> employee{groupedAdvances.length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-1">
            <button className="p-1.5 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50"><ChevronLeft size={14} /></button>
            <button className="px-3 py-1 text-xs font-black rounded bg-gradient-to-br from-green-600 to-green-700 text-white">1</button>
            <button className="p-1.5 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
      
      {/* ── MODAL DIALOG OVERLAY: UPDATE ADVANCE (UPGRADED WITH ALL NEW SCHEMAS) ── */}
      {editAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[1.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">Edit Advance Record</h2>
                  <p className="text-xs text-gray-400 font-medium">Modifying payload for {editAdvance.name} (ID #{editAdvance.id})</p>
                </div>
              </div>
              <button onClick={() => setEditAdvance(null)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Date Issued</label>
                    <input type="date" value={editRow.date} onChange={e => setEditRow(prev => ({ ...prev, date: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Amount (Rs.)</label>
                    <input type="number" value={editRow.amount} onChange={e => setEditRow(prev => ({ ...prev, amount: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Cheque No <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input type="text" value={editRow.chequeNo} onChange={e => setEditRow(prev => ({ ...prev, chequeNo: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Cheque Maturity Date</label>
                    <input type="date" value={editRow.chequeDate || editRow.date} onChange={e => setEditRow(prev => ({ ...prev, chequeDate: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all" disabled={!editRow.chequeNo} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Deduction Status</label>
                    <select value={editRow.status} onChange={e => setEditRow(prev => ({ ...prev, status: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all">
                      <option value="Unpaid">Unpaid (Pending Deduction)</option>
                      <option value="Deducted">Deducted (Settled / Locked)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Reason / Notes</label>
                    <input type="text" value={editRow.notes} onChange={e => setEditRow(prev => ({ ...prev, notes: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all" />
                  </div>
                </div>
            </div>

            <div className="px-6 py-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setEditAdvance(null)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleUpdateAdvance} disabled={isSaving} className="bg-blue-600 px-6 py-2.5 text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 rounded-xl text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}