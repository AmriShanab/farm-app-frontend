import { useState, useEffect } from 'react';
import {
  Search, Download,
  ChevronLeft, ChevronRight,
  Users, UserPlus, MapPin, Briefcase, Check, X, Edit2, ArrowUpRight,
  Loader2, AlertCircle, Trash2
} from 'lucide-react';

import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../services/api';
import { useToast } from '../components/ToastProvider';

const fmt = (n) => Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function EmployeeProfiles() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [farmFilter, setFarmFilter] = useState('All');
  const [selected, setSelected] = useState([]);

  // API States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Inline Row State ---
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newRow, setNewRow] = useState({
    name: '', role: '', farm: 'MR1', type: 'daily', wage: ''
  });
  const [editEmployee, setEditEmployee] = useState(null);
  const [editRow, setEditRow] = useState({ name: '', role: '', farm: 'MR1', type: 'daily', wage: '' });
  const toast = useToast();

  // --- Fetch Data ---
  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getEmployees(farmFilter);
        if (!isActive) return;
        setEmployees(data);
      } catch {
        if (isActive) setError("Failed to load employee directory. Please check your connection.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    load();
    return () => { isActive = false; };
  }, [farmFilter]);

  const filtered = employees.filter(emp =>
    (!search || emp.name.toLowerCase().includes(search.toLowerCase()) || emp.role.toLowerCase().includes(search.toLowerCase()))
  );

  // KPIs
  const totalHeadcount = employees.length;
  const mr1Count = employees.filter(e => e.farm === 'MR1').length;
  const mr2Count = employees.filter(e => e.farm === 'MR2').length;

  const toggleSelect = (id) => setSelected(sel => sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]);
  const toggleAll = () => setSelected(sel => sel.length === filtered.length ? [] : filtered.map(s => s.id));

  const handleRowChange = (e) => {
    setNewRow(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditRowChange = (e) => {
    setEditRow(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openEditEmployee = (emp) => {
    setEditEmployee(emp);
    setEditRow({
      name: emp.name || '',
      role: emp.role || '',
      farm: emp.farm || 'MR1',
      type: emp.type || 'daily',
      wage: emp.wage_per_day || emp.wagePerDay || ''
    });
  };

  const closeEditEmployee = () => {
    setEditEmployee(null);
    setEditRow({ name: '', role: '', farm: 'MR1', type: 'daily', wage: '' });
    setIsSaving(false);
  };

  const handleUpdateEmployee = async () => {
    if (!editEmployee?.id) return;
    if (!editRow.name || !editRow.role || !editRow.wage) {
      toast.warn('Please provide Name, Role and Base Wage.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: editRow.name,
        role: editRow.role,
        farm: editRow.farm,
        type: editRow.type,
        wagePerDay: parseFloat(editRow.wage) || 0,
      };

      const updated = await updateEmployee(editEmployee.id, payload);
      const record = { ...(updated || {}), ...payload };
      setEmployees(prev => prev.map(e => (e.id === editEmployee.id ? record : e)));
      closeEditEmployee();
    } catch {
      toast.error('Failed to update employee.');
      setIsSaving(false);
    }
  };

  const handleSaveRow = async () => {
    if (!newRow.name || !newRow.role || !newRow.wage) {
      toast.warn("Please fill out Name, Role, and Base Wage.");
      return;
    }

    setIsSaving(true);
    try {
      // Map frontend state to backend API expectations
      const payload = {
        name: newRow.name,
        role: newRow.role,
        farm: newRow.farm,
        type: newRow.type, // 'daily' or 'fixed'
        wagePerDay: parseFloat(newRow.wage) || 0,
        status: 'active'
      };

      const savedRecord = await createEmployee(payload);
      
      setEmployees(prev => [savedRecord, ...prev]);
      setIsAdding(false);
      setNewRow({ name: '', role: '', farm: 'MR1', type: 'daily', wage: '' });
    } catch {
      toast.error("Failed to save employee to database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to deactivate/delete this employee?")) {
      try {
        await deleteEmployee(id);
        setEmployees(prev => prev.filter(e => e.id !== id));
      } catch {
        toast.error("Failed to delete employee.");
      }
    }
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewRow({ name: '', role: '', farm: 'MR1', type: 'daily', wage: '' });
  };

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #166534, #14532d)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} color="#86efac" />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#0d1f0d', margin: 0, letterSpacing: '-0.4px' }}>
              Employee Profiles
            </h1>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7a6b', margin: 0, paddingLeft: '42px' }}>
            Maintain estate workforce details and salary defaults
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
            <UserPlus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* ── API ERROR STATE ── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm font-bold">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* ── PREMIUM KPI STAT CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          {
            title: 'Total Headcount',
            amount: totalHeadcount.toString(),
            badge: 'Active',
            sub: 'Registered Staff',
            icon: <Users size={14} />,
            path: "M0,40 L0,25 C 20,30 40,10 60,15 C 80,20 90,5 100,5 L100,40 Z"
          },
          {
            title: 'MR1 Workforce',
            amount: mr1Count.toString(),
            badge: 'Assigned',
            sub: 'Including Managers',
            icon: <MapPin size={14} />,
            path: "M0,40 L0,20 C 30,35 50,15 70,25 C 85,30 95,10 100,10 L100,40 Z"
          },
          {
            title: 'MR2 Workforce',
            amount: mr2Count.toString(),
            badge: 'Assigned',
            sub: 'Including Managers',
            icon: <MapPin size={14} />,
            path: "M0,40 L0,15 C 25,10 45,30 65,20 C 85,10 95,25 100,20 L100,40 Z"
          }
        ].map((card, i) => {
          const gradId = `grad-emp-${i}`;
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

      {/* ── EMPLOYEE DIRECTORY TABLE ── */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1.5px solid #e8ede8', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '14px 18px', borderBottom: '1.5px solid #f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>

          <div style={{ display: 'flex', background: '#f3f4f6', padding: '3px', borderRadius: '10px', gap: '2px' }}>
            {['All', 'MR1', 'MR2'].map(f => (
              <button key={f} onClick={() => { setFarmFilter(f); setIsAdding(false); }} style={{
                padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 800,
                border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                background: farmFilter === f ? '#fff' : 'transparent',
                color: farmFilter === f ? '#15803d' : '#9ca3af',
                boxShadow: farmFilter === f ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}>{f === 'All' ? 'All Farms' : `${f} Farm`}</button>
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
                {['Employee Name', 'Job Role', 'Assigned Farm', 'Pay Type', 'Base Salary Default'].map((h, i) => (
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
                    <input type="text" name="name" placeholder="Full Name" value={newRow.name} onChange={handleRowChange} style={inputStyle} disabled={isSaving} />
                  </td>
                  <td style={tdStyle()}>
                    <input type="text" name="role" placeholder="E.g. Laborer" value={newRow.role} onChange={handleRowChange} style={inputStyle} disabled={isSaving} />
                  </td>
                  <td style={tdStyle()}>
                    <select name="farm" value={newRow.farm} onChange={handleRowChange} style={{...inputStyle, cursor: 'pointer', appearance: 'auto'}} disabled={isSaving}>
                       <option value="MR1">MR1</option>
                       <option value="MR2">MR2</option>
                       <option value="All">All Farms</option>
                    </select>
                  </td>
                  <td style={tdStyle()}>
                    <select name="type" value={newRow.type} onChange={handleRowChange} style={{...inputStyle, cursor: 'pointer', appearance: 'auto'}} disabled={isSaving}>
                       <option value="daily">Daily Wage</option>
                       <option value="fixed">Monthly Fixed</option>
                    </select>
                  </td>
                  <td style={{ ...tdStyle('150px'), textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Rs.</span>
                      <input type="number" name="wage" placeholder="0.00" value={newRow.wage} onChange={handleRowChange} style={{...inputStyle, width: '100px', textAlign: 'right'}} disabled={isSaving} />
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
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#16a34a' }}>
                       <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                       <span className="text-xs font-bold">Loading Employees...</span>
                    </td>
                 </tr>
              )}

              {!isLoading && filtered.map((emp, idx) => {
                const isSel = selected.includes(emp.id);
                // Map backend string values to nice UI labels
                const payTypeLabel = emp.type === 'fixed' ? 'Monthly' : 'Daily';
                // Backend sends wage_per_day
                const wageValue = emp.wage_per_day || emp.wagePerDay || 0;

                return (
                  <tr key={emp.id} style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: isSel ? '#f0fdf4' : idx % 2 === 0 ? '#fff' : '#fafafa',
                    transition: 'background 0.15s',
                  }}
                    onMouseOver={e => { if (!isSel) e.currentTarget.style.background = '#f8fff8'; }}
                    onMouseOut={e => { if (!isSel) e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafafa'; }}
                  >
                    <td style={tdStyle('52px')}>
                      <input type="checkbox" checked={isSel} onChange={() => toggleSelect(emp.id)} style={{ accentColor: '#16a34a', cursor: 'pointer' }} />
                    </td>

                    {/* Employee Identity */}
                    <td style={tdStyle()}>
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs border border-green-200">
                            {emp.name.substring(0, 2).toUpperCase()}
                         </div>
                         <span style={{ fontWeight: 800, color: '#0d1f0d', fontSize: '13px' }}>{emp.name}</span>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={tdStyle()}>
                      <span style={{ color: '#475569', fontWeight: 600 }}>{emp.role}</span>
                    </td>

                    {/* Farm Assignment */}
                    <td style={tdStyle()}>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold ${emp.farm === 'All' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-green-50 text-green-700 border-green-200'} border`}>
                         <MapPin size={10} /> {emp.farm}
                      </span>
                    </td>

                    {/* Type */}
                    <td style={tdStyle()}>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold ${payTypeLabel === 'Monthly' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'} border`}>
                         <Briefcase size={10} /> {payTypeLabel}
                      </span>
                    </td>

                    {/* Base Salary */}
                    <td style={{ ...tdStyle(), textAlign: 'right', paddingRight: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ color: '#0d3320', fontWeight: 800, fontSize: '13px' }}>Rs. {fmt(parseFloat(wageValue))}</span>
                        <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>/ {payTypeLabel === 'Daily' ? 'Day' : 'Month'}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ ...tdStyle('80px'), textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button onClick={() => openEditEmployee(emp)} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '6px', borderRadius: '6px', color: '#9ca3af',
                            transition: 'all 0.15s',
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; }}
                          onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af'; }}
                        >
                          <Edit2 size={14} />
                        </button>

                        <button onClick={() => handleDelete(emp.id)} style={{
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
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                    No employees found for your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1.5px solid #f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
          <span style={{ fontSize: '12px', color: '#6b7a6b', fontWeight: 600 }}>
            Showing <strong style={{ color: '#0d1f0d' }}>{filtered.length}</strong> profiles
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button style={pageBtn(false)}><ChevronLeft size={13} /></button>
            <button style={pageBtn(true)}>1</button>
            <button style={pageBtn(false)}><ChevronRight size={13} /></button>
          </div>
        </div>
      </div>
      {editEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[1.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text font-heading">Update Employee</h2>
                  <p className="text-xs text-earth">Edit profile #{editEmployee.id}</p>
                </div>
              </div>
              <button onClick={closeEditEmployee} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-text mb-1.5">Full Name</label>
                    <input type="text" name="name" value={editRow.name} onChange={handleEditRowChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-text focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text mb-1.5">Job Role</label>
                    <input type="text" name="role" value={editRow.role} onChange={handleEditRowChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-text focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-text mb-1.5">Assigned Farm</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditRow((prev) => ({ ...prev, farm: 'MR1' }))}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${editRow.farm === 'MR1' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-200 text-earth hover:bg-gray-50'}`}>
                        MR1
                      </button>
                      <button type="button" onClick={() => setEditRow((prev) => ({ ...prev, farm: 'MR2' }))}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${editRow.farm === 'MR2' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-200 text-earth hover:bg-gray-50'}`}>
                        MR2
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text mb-1.5">Pay Type</label>
                    <select name="type" value={editRow.type} onChange={handleEditRowChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all">
                      <option value="daily">Daily Wage</option>
                      <option value="fixed">Monthly Fixed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-text mb-1.5">Base Wage</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-600">Rs.</span>
                    <input type="number" name="wage" value={editRow.wage} onChange={handleEditRowChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-text focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all" />
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
                  <p className="text-xs font-bold text-earth uppercase tracking-wider mb-0.5">Updated Base Wage</p>
                  <p className="text-2xl font-bold text-text font-heading">Rs. {fmt(parseFloat(editRow.wage) || 0)}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={closeEditEmployee} className="px-5 py-2.5 text-sm font-bold text-earth hover:text-text transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleUpdateEmployee} disabled={isSaving} className="bg-blue-600 px-6 py-2.5 text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 rounded-xl text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed">
                  {isSaving ? 'Saving...' : 'Update Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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