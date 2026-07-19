import { useState, useEffect } from 'react';
import {
  Search, Download,
  ChevronLeft, ChevronRight, SlidersHorizontal,
  Users, UserPlus, MapPin, Briefcase, Check, X, Edit2, ArrowUpRight,
  Loader2, AlertCircle, Trash2, Save, CalendarClock, Pause, Play
} from 'lucide-react';

import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getBasicRate } from '../services/api';
import { useToast } from '../components/ToastProvider';
import { downloadCsv } from '../utils/csv';

const fmt = (n) => Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Split an entered salary into Basic (capped at the basic rate) + Allowance.
// Daily: basic = rate/day. Monthly (fixed): basic = rate × 30 /month.
const splitSalary = (wage, type, basicRate) => {
  const total = parseFloat(wage) || 0;
  const basicCap = type === 'fixed' ? basicRate * 30 : basicRate;
  const basic = Math.min(total, basicCap);
  return { basic, allowance: Math.max(0, total - basic), unit: type === 'fixed' ? 'mo' : 'day' };
};

export default function EmployeeProfiles() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [farmFilter, setFarmFilter] = useState('All');
  const [selected, setSelected] = useState([]);

  // API States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [basicRate, setBasicRate] = useState(1200);

  // --- UI States (UPDATED FOR NEW SCHEMA) ---
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newRow, setNewRow] = useState({
    name: '', role: '', farm: 'MR1', type: 'daily', payFrequency: 'weekly', wage: ''
  });

  const [editEmployee, setEditEmployee] = useState(null);
  const [editRow, setEditRow] = useState({ 
    name: '', role: '', farm: 'MR1', type: 'daily', payFrequency: 'weekly', wage: '' 
  });
  const toast = useToast();

  // --- Fetch Data ---
  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const all = await getEmployees(farmFilter === 'All' ? null : farmFilter, null);
        const data = all.filter(e => e.status !== 'inactive');
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

  // Current Basic rate — drives the Basic/Allowance split preview.
  useEffect(() => {
    let isActive = true;
    getBasicRate()
      .then((r) => { if (isActive && r?.current) setBasicRate(r.current); })
      .catch(() => {});
    return () => { isActive = false; };
  }, []);

  const filtered = employees.filter(emp =>
    (!search || emp.name.toLowerCase().includes(search.toLowerCase()) || emp.role.toLowerCase().includes(search.toLowerCase()))
  );

  // KPIs
  const totalHeadcount = employees.length;
  const mr1Count = employees.filter(e => e.farm === 'MR1').length;
  const poultryCount = employees.filter(e => e.farm === 'Poultry').length;

  const toggleSelect = (id) => setSelected(sel => sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]);
  const toggleAll = () => setSelected(sel => sel.length === filtered.length ? [] : filtered.map(s => s.id));

  // Smart Row Handlers for Role Selection
  const handleRowChange = (e) => {
    const { name, value } = e.target;
    setNewRow(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'role' && value.toLowerCase().includes('manager')) {
        updated.type = 'fixed';
        updated.payFrequency = 'monthly'; // Managers are usually monthly
      }
      return updated;
    });
  };

  const handleEditRowChange = (e) => {
    const { name, value } = e.target;
    setEditRow(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'role' && value.toLowerCase().includes('manager')) {
        updated.type = 'fixed';
        updated.payFrequency = 'monthly';
      }
      return updated;
    });
  };

  const openEditEmployee = (emp) => {
    setEditEmployee(emp);
    setEditRow({
      name: emp.name || '',
      role: emp.role || '',
      farm: emp.farm || 'MR1', 
      type: emp.type || 'daily',
      payFrequency: emp.pay_frequency || emp.payFrequency || 'weekly', // Map new DB field
      wage: emp.wage_per_day || emp.wagePerDay || ''
    });
  };

  const closeEditEmployee = () => {
    setEditEmployee(null);
    setEditRow({ name: '', role: '', farm: 'MR1', type: 'daily', payFrequency: 'weekly', wage: '' });
    setIsSaving(false);
  };

  // (UPDATED FOR NEW SCHEMA)
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
        payFrequency: editRow.payFrequency, 
        wagePerDay: parseFloat(editRow.wage) || 0,
        status: editEmployee.status || 'active'
      };

      const updated = await updateEmployee(editEmployee.id, payload);
      const record = { ...(updated || {}), ...payload };
      setEmployees(prev => prev.map(e => (e.id === editEmployee.id ? record : e)));
      closeEditEmployee();
      toast.success('Employee profile updated.');
    } catch (err) {
      toast.error(err?.message || 'Failed to update employee.');
      setIsSaving(false);
    }
  };

  // (UPDATED FOR NEW SCHEMA)
  const handleSaveRow = async () => {
    if (!newRow.name || !newRow.role || !newRow.wage) {
      toast.warn("Please fill out Name, Role, and Base Wage.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: newRow.name,
        role: newRow.role,
        farm: newRow.farm,
        type: newRow.type,
        payFrequency: newRow.payFrequency,
        wagePerDay: parseFloat(newRow.wage) || 0,
        status: 'active'
      };

      const savedRecord = await createEmployee(payload);

      setEmployees(prev => [savedRecord, ...prev]);
      setIsAdding(false);
      setNewRow({ name: '', role: '', farm: 'MR1', type: 'daily', payFrequency: 'weekly', wage: '' });
      toast.success('Employee added to directory.');
    } catch (err) {
      toast.error(err?.message || "Failed to save employee to database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePause = async (emp) => {
    const newStatus = emp.status === 'paused' ? 'active' : 'paused';
    const label = newStatus === 'paused' ? 'pause' : 'resume';
    try {
      const payload = {
        name: emp.name,
        role: emp.role,
        farm: emp.farm,
        type: emp.type,
        payFrequency: emp.pay_frequency || emp.payFrequency || 'weekly',
        wagePerDay: emp.wage_per_day || emp.wagePerDay || 0,
        status: newStatus,
      };
      await updateEmployee(emp.id, payload);
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, status: newStatus } : e));
      toast.success(`Employee ${label}d.`);
    } catch {
      toast.error(`Failed to ${label} employee.`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to deactivate/delete this employee?")) {
      try {
        await deleteEmployee(id);
        setEmployees(prev => prev.filter(e => e.id !== id));
        toast.success("Employee removed.");
      } catch {
        toast.error("Failed to delete employee.");
      }
    }
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewRow({ name: '', role: '', farm: 'MR1', type: 'daily', payFrequency: 'weekly', wage: '' });
  };

  const handleExportCsv = () => {
    downloadCsv('employee-profiles.csv', [
      { label: 'Name', value: (row) => row.name || '' },
      { label: 'Role', value: (row) => row.role || '' },
      { label: 'Farm Base', value: (row) => row.farm || '' },
      { label: 'Wage Type', value: (row) => row.type || '' },
      { label: 'Pay Frequency', value: (row) => row.pay_frequency || row.payFrequency || 'weekly' },
      { label: 'Base Rate', value: (row) => Number(row.wage_per_day || row.wagePerDay || row.wage || 0).toFixed(2) },
      { label: 'Basic', value: (row) => splitSalary(row.wage_per_day || row.wagePerDay || 0, row.type, basicRate).basic.toFixed(2) },
      { label: 'Allowance', value: (row) => splitSalary(row.wage_per_day || row.wagePerDay || 0, row.type, basicRate).allowance.toFixed(2) },
    ], filtered);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Nunito'] pb-10">
      
      {/* ── DATALIST FOR SMART ROLES ── */}
      <datalist id="roleOptions">
        <option value="Manager">Estate Manager</option>
        <option value="Supervisor">Field Supervisor</option>
        <option value="Laborer">General Laborer</option>
        <option value="Tractor Driver">Tractor Driver</option>
        <option value="Security">Security Guard</option>
        <option value="Poultry Worker">Poultry Worker</option>
      </datalist>

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center shadow-lg shadow-green-900/20">
              <Users size={20} className="text-green-300" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Employee Profiles
            </h1>
          </div>
          <p className="text-sm font-medium text-gray-500 pl-[52px]">
            Maintain estate workforce details, base locations, and salary structures
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
            <UserPlus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* ── API ERROR STATE ── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm font-bold animate-in fade-in">
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
            chartColor: '#A5D6A7',
            path: "M0,40 L0,25 C 20,30 40,10 60,15 C 80,20 90,5 100,5 L100,40 Z"
          },
          {
            title: 'MR1 Base Workforce',
            amount: mr1Count.toString(),
            badge: 'Assigned',
            sub: 'Including Managers',
            icon: <MapPin size={14} />,
            chartColor: '#A5D6A7',
            path: "M0,40 L0,20 C 30,35 50,15 70,25 C 85,30 95,10 100,10 L100,40 Z"
          },
          {
            title: 'Poultry Workforce',
            amount: poultryCount.toString(),
            badge: 'Assigned',
            sub: 'Specialized Staff',
            icon: <MapPin size={14} />,
            chartColor: '#A5D6A7',
            path: "M0,40 L0,15 C 25,10 45,30 65,20 C 85,10 95,25 100,20 L100,40 Z"
          }
        ].map((card, i) => {
          const gradId = `grad-emp-${i}`;
          return (
            <div key={i} className="relative overflow-hidden rounded-[1.25rem] p-4 bg-gradient-to-br from-[#166534] to-[#14532d] text-white shadow-lg shadow-green-900/20 group border border-green-800/50 transition-all hover:shadow-green-900/40 hover:-translate-y-1 h-28">
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
        <div className="bg-gradient-to-b from-green-50 to-white border border-green-200 rounded-xl p-6 shadow-md mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-5 border-b border-green-100 pb-3">
            <h3 className="text-lg font-black text-green-900 flex items-center gap-2">
              <UserPlus size={18} className="text-green-600" /> Onboard New Employee
            </h3>
            <button onClick={cancelAdd} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm border border-gray-200"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-4">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
              <input type="text" name="name" placeholder="E.g. Nimal Perera" value={newRow.name} onChange={handleRowChange} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none font-bold focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" disabled={isSaving} />
            </div>

            <div className="md:col-span-4">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Job Role</label>
              <input type="text" list="roleOptions" name="role" placeholder="Select or type..." value={newRow.role} onChange={handleRowChange} className="w-full p-2.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 font-bold" disabled={isSaving} />
            </div>

            {/* EXPANDED FARM LOCATIONS */}
            <div className="md:col-span-4">
              <div className="flex justify-between items-center mb-1">
                 <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider">Primary Base Location</label>
                 <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">Required</span>
              </div>
              <select name="farm" value={newRow.farm} onChange={handleRowChange} className="w-full p-2.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 font-bold" disabled={isSaving}>
                <option value="MR1">MR1 Block</option>
                <option value="MR2">MR2 Block</option>
                <option value="Poultry">Poultry Farm</option>
                <option value="Floating">Floating (No Fixed Base)</option>
              </select>
            </div>

            <div className="md:col-span-4">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Wage Type</label>
              <select name="type" value={newRow.type} onChange={handleRowChange} className="w-full p-2.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 font-bold" disabled={isSaving}>
                <option value="daily">Daily Wage (Standard)</option>
                <option value="fixed">Monthly Fixed Salary</option>
              </select>
            </div>

            {/* NEW PAY FREQUENCY DROPDOWN */}
            <div className="md:col-span-4">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Pay Frequency</label>
              <select name="payFrequency" value={newRow.payFrequency} onChange={handleRowChange} className="w-full p-2.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 font-bold" disabled={isSaving}>
                <option value="weekly">Weekly (Thursdays)</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="md:col-span-4">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Base Wage / Salary (Rs.)</label>
              <input type="number" name="wage" placeholder="0.00" value={newRow.wage} onChange={handleRowChange} className="w-full p-2.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 font-bold" disabled={isSaving} />
              {parseFloat(newRow.wage) > 0 && (() => {
                const s = splitSalary(newRow.wage, newRow.type, basicRate);
                return (
                  <p className="mt-1.5 text-[11px] font-bold text-gray-500">
                    Basic <span className="text-gray-800">Rs. {fmt(s.basic)}</span>
                    {" · "}Allowance <span className="text-blue-700">Rs. {fmt(s.allowance)}</span>
                    <span className="text-gray-400"> / {s.unit}</span>
                  </p>
                );
              })()}
            </div>
          </div>

          <div className="flex justify-end items-center mt-6 pt-4 border-t border-gray-100 gap-3">
            <button onClick={cancelAdd} disabled={isSaving} className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">Cancel</button>
            <button onClick={handleSaveRow} disabled={isSaving} className="px-6 py-2.5 bg-green-600 rounded-lg text-white text-sm font-bold shadow-md hover:bg-green-700 flex items-center gap-2 transition-all disabled:opacity-50">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Employee
            </button>
          </div>
        </div>
      )}

      {/* ── EMPLOYEE DIRECTORY TABLE ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
          <div className="flex bg-gray-200/60 p-1 rounded-xl gap-1 overflow-x-auto w-full sm:w-auto">
            {/* UPDATED FILTERS */}
            {['All', 'MR1', 'MR2', 'Poultry', 'Floating'].map(f => (
              <button key={f} onClick={() => { setFarmFilter(f); setIsAdding(false); }}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${farmFilter === f ? 'bg-white text-green-900 shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}>
                {f === 'All' ? 'All Staff' : `${f} Staff`}
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Search by name or role..." value={search} onChange={e => setSearch(e.target.value)}
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
                <th className="p-4 text-left">Employee Name</th>
                <th className="p-4 text-left">Job Role</th>
                <th className="p-4 text-left">Primary Base Farm</th>
                <th className="p-4 text-left">Wage / Frequency</th>
                <th className="p-4 text-right">Base Salary Default</th>
                <th className="p-4 text-right w-24"></th>
              </tr>
            </thead>
            <tbody>

              {isLoading && (
                <tr>
                  <td colSpan={7} className="p-20 text-center text-green-600">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    <span className="text-xs font-bold">Loading Employees...</span>
                  </td>
                </tr>
              )}

              {!isLoading && filtered.map((emp, idx) => {
                const isSel = selected.includes(emp.id);
                const wageTypeLabel = emp.type === 'fixed' ? 'Fixed' : 'Daily';
                // Pull payFrequency safely handling both camelCase and snake_case backend returns
                const payFreqLabel = (emp.pay_frequency || emp.payFrequency) === 'monthly' ? 'Monthly' : 'Weekly';
                const wageValue = emp.wage_per_day || emp.wagePerDay || 0;

                return (
                  <tr key={emp.id} className={`border-t border-gray-50 transition-colors ${isSel ? 'bg-green-50/40' : 'hover:bg-gray-50/40'}`}>
                    <td className="p-4">
                      <input type="checkbox" checked={isSel} onChange={() => toggleSelect(emp.id)} className="rounded border-gray-300 text-green-600 focus:ring-green-500 accent-green-600 cursor-pointer" />
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${emp.status === 'paused' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                          {emp.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-[13px] ${emp.status === 'paused' ? 'text-gray-400' : 'text-gray-900'}`}>{emp.name}</span>
                          {emp.status === 'paused' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">Paused</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-bold text-gray-600">
                      {emp.role}
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${emp.farm === 'Poultry' ? 'bg-amber-50 text-amber-700 border border-amber-200' : emp.farm === 'Floating' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        <MapPin size={10} /> {emp.farm}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex gap-1.5">
                         <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                           <Briefcase size={10} /> {wageTypeLabel}
                         </span>
                         <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${payFreqLabel === 'Monthly' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                           <CalendarClock size={10} /> {payFreqLabel} Pay
                         </span>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      {(() => {
                        const s = splitSalary(wageValue, emp.type, basicRate);
                        return (
                          <div className="flex flex-col items-end">
                            <span className="text-gray-900 font-black text-[13px]">Rs. {fmt(parseFloat(wageValue))}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">/ {wageTypeLabel === 'Daily' ? 'Day' : 'Month'}</span>
                            {parseFloat(wageValue) > 0 && (
                              <span className="text-[10px] font-bold text-gray-400 mt-0.5">
                                B: {fmt(s.basic)} · A: {fmt(s.allowance)}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleTogglePause(emp)}
                          title={emp.status === 'paused' ? 'Resume' : 'Pause'}
                          className={`p-2 rounded-full transition-colors ${emp.status === 'paused' ? 'text-green-500 hover:text-green-700 hover:bg-green-50' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'}`}
                        >
                          {emp.status === 'paused' ? <Play size={13} /> : <Pause size={13} />}
                        </button>
                        <button onClick={() => openEditEmployee(emp)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(emp.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400 font-bold">
                    No employees found for your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500">
            Showing <strong className="text-gray-900">{filtered.length}</strong> profiles
          </span>
          <div className="flex gap-1">
            <button className="p-1.5 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50"><ChevronLeft size={14} /></button>
            <button className="px-3 py-1 text-xs font-black rounded bg-gradient-to-br from-green-600 to-green-700 text-white">1</button>
            <button className="p-1.5 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* ── MODAL DIALOG OVERLAY: UPDATE EMPLOYEE ── */}
      {editEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[1.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">Update Employee</h2>
                  <p className="text-xs text-gray-400 font-medium">Modifying profile #{editEmployee.id}</p>
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
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input type="text" name="name" value={editRow.name} onChange={handleEditRowChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Job Role</label>
                    <input type="text" list="roleOptions" name="role" value={editRow.role} onChange={handleEditRowChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                       <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">Primary Base Farm</label>
                       <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">Required</span>
                    </div>
                    {/* EXPANDED FARM TOGGLE BUTTONS */}
                    <div className="flex flex-wrap gap-2">
                      {['MR1', 'MR2', 'Poultry', 'Floating'].map(f => (
                        <button key={f} type="button" onClick={() => setEditRow((prev) => ({ ...prev, farm: f }))}
                          className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-sm font-bold border transition-all ${editRow.farm === f ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Wage Type</label>
                    <select name="type" value={editRow.type} onChange={handleEditRowChange} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all">
                      <option value="daily">Daily Wage</option>
                      <option value="fixed">Monthly Fixed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Pay Frequency</label>
                    <select name="payFrequency" value={editRow.payFrequency} onChange={handleEditRowChange} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all">
                      <option value="weekly">Weekly (Thursdays)</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Base Rate (Rs.)</label>
                    <div className="flex items-center gap-2">
                      <input type="number" name="wage" value={editRow.wage} onChange={handleEditRowChange} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all" />
                    </div>
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
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Updated Base Wage</p>
                  <p className="text-xl font-black text-gray-900">Rs. {fmt(parseFloat(editRow.wage) || 0)}</p>
                  {parseFloat(editRow.wage) > 0 && (() => {
                    const s = splitSalary(editRow.wage, editRow.type, basicRate);
                    return (
                      <p className="text-[11px] font-bold text-gray-500 mt-0.5">
                        Basic <span className="text-gray-800">Rs. {fmt(s.basic)}</span>
                        {" · "}Allowance <span className="text-blue-700">Rs. {fmt(s.allowance)}</span>
                        <span className="text-gray-400"> / {s.unit}</span>
                      </p>
                    );
                  })()}
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={closeEditEmployee} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleUpdateEmployee} disabled={isSaving} className="bg-blue-600 px-6 py-2.5 text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 rounded-xl text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Update Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}