import { useState, useEffect } from 'react';
import {
  CalendarCheck, Calendar, CheckCircle2, AlertCircle,
  Users, Save, Check, X, Search, UserCheck, Minus, SplitSquareHorizontal
} from 'lucide-react';
import { getAttendance, saveAttendanceBulk } from '../services/api';
import { useToast } from '../components/ToastProvider';

const LOCATION_OPTIONS = ['MR1', 'MR2', 'Poultry'];
const TASK_TYPE_OPTIONS = ['MR1 Coconut Harvest', 'MR2 Coconut Harvest', 'Cashew Harvest'];

// --- REUSABLE STAT CARD COMPONENT ---
const StatCard = ({ title, amount, badge, sub, icon, path, index }) => {
  const gradId = `grad-att-${index}`;
  const chartColor = "#A5D6A7";

  return (
    <div className="relative overflow-hidden rounded-[1.25rem] p-4 bg-gradient-to-br from-[#166534] to-[#14532d] text-white shadow-lg shadow-green-900/20 group border border-green-800/50 transition-all hover:shadow-green-900/40 hover:-translate-y-1">
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[45px] opacity-20 bg-white transition-opacity duration-500 group-hover:opacity-40"></div>
      <div className="flex justify-between items-center relative z-10 mb-1">
        <span className="text-sm font-medium text-white/80">{title}</span>
      </div>
      <h3 className="text-2xl font-bold font-heading relative z-10 mb-3 tracking-tight truncate">
        {amount}
      </h3>
      <div className="flex items-center gap-2 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/20 text-white backdrop-blur-md">
          {icon}
          <span>{badge}</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 truncate">
          {sub}
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
          <path d={path} fill={`url(#${gradId})`} stroke={chartColor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </div>
  );
};

// Each employee's day is represented as one "entry":
//   { mode: 'single', status: 'full'|'half'|'absent', locationWorked, taskType }
//   { mode: 'split', splitA: {locationWorked, taskType}, splitB: {locationWorked, taskType} }
// 'split' is always two half-days at two different locations (= one full day total).
const entryToSegments = (entry) => {
  if (!entry) return [];
  if (entry.mode === 'split') {
    return [
      { status: 'half', locationWorked: entry.splitA.locationWorked, taskType: entry.splitA.taskType },
      { status: 'half', locationWorked: entry.splitB.locationWorked, taskType: entry.splitB.taskType },
    ];
  }
  if (entry.status === 'absent') return [{ status: 'absent' }];
  return [{ status: entry.status, locationWorked: entry.locationWorked, taskType: entry.taskType }];
};

const otherLocation = (loc) => LOCATION_OPTIONS.find((l) => l !== loc) || LOCATION_OPTIONS[0];

// --- MAIN PAGE COMPONENT ---
export default function DailyAttendance() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  const [entries, setEntries] = useState({}); // { [employeeId]: entry }

  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();
  const [isLocked, setIsLocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');

  const checkIsPastDate = (date) => {
    const today = new Date().toISOString().split('T')[0];
    return date < today;
  };

  const filteredEmployees = employees.filter(emp =>
    !search || emp.name.toLowerCase().includes(search.toLowerCase()) || (emp.role || '').toLowerCase().includes(search.toLowerCase())
  );

  // Derived KPIs
  const presentCount = Object.values(entries).filter(e => e.mode === 'split' || e.status === 'full' || e.status === 'half').length;
  const absentCount = Object.values(entries).filter(e => e.mode === 'single' && e.status === 'absent').length;
  const unmarkedCount = employees.length - Object.keys(entries).length;

  const setEntry = (id, entry) => setEntries(prev => ({ ...prev, [id]: entry }));

  const handlePinSubmit = () => {
    const CORRECT_PIN = '1234'; // later move to backend

    if (pin === CORRECT_PIN) {
      setIsLocked(false);
      setShowPinModal(false);
      setPin('');
      toast.success('Unlocked successfully');
    } else {
      toast.error('Invalid PIN');
    }
  };

  const handleStatusChange = (id, status) => {
    if (isLocked) {
      setShowPinModal(true);
      return;
    }
    const emp = employees.find(e => String(e.employeeId || e.id) === String(id));
    const prev = entries[id];
    const prevLoc = prev?.mode === 'single' ? prev.locationWorked : null;

    setEntry(id, {
      mode: 'single',
      status,
      locationWorked: status === 'absent' ? null : prevLoc,
      taskType: status === 'absent' ? null : (prev?.mode === 'single' ? prev.taskType : null),
    });
  };

  const handleLocationChange = (id, newLocation) => {
    if (isLocked) {
      setShowPinModal(true);
      return;
    }
    setEntries(prev => {
      const e = prev[id];
      if (!e || e.mode !== 'single' || e.status === 'absent') return prev;
      return { ...prev, [id]: { ...e, locationWorked: newLocation } };
    });
  };

  const handleTaskTypeChange = (id, newTaskType) => {
    setEntries(prev => {
      const e = prev[id];
      if (!e || e.mode !== 'single' || e.status === 'absent') return prev;
      return { ...prev, [id]: { ...e, taskType: newTaskType || null } };
    });
  };

  const handleToggleSplit = (id) => {
    if (isLocked) {
      setShowPinModal(true);
      return;
    }
    const emp = employees.find(e => String(e.employeeId || e.id) === String(id));
    const prev = entries[id];

    if (prev?.mode === 'split') {
      // Collapse back to a single full day at the first split location.
      setEntry(id, {
        mode: 'single',
        status: 'full',
        locationWorked: prev.splitA.locationWorked,
        taskType: null,
      });
      return;
    }

    const locA = (prev?.mode === 'single' && prev.locationWorked) || emp?.farm || 'MR1';
    setEntry(id, {
      mode: 'split',
      splitA: { locationWorked: locA, taskType: null },
      splitB: { locationWorked: otherLocation(locA), taskType: null },
    });
  };

  const handleSplitLocationChange = (id, which, newLocation) => {
    if (isLocked) {
      setShowPinModal(true);
      return;
    }
    setEntries(prev => {
      const e = prev[id];
      if (!e || e.mode !== 'split') return prev;
      const other = which === 'A' ? 'splitB' : 'splitA';
      const updated = { ...e, [which === 'A' ? 'splitA' : 'splitB']: { ...e[which === 'A' ? 'splitA' : 'splitB'], locationWorked: newLocation } };
      // Keep the two locations distinct.
      if (updated[other].locationWorked === newLocation) {
        updated[other] = { ...updated[other], locationWorked: otherLocation(newLocation) };
      }
      return { ...prev, [id]: updated };
    });
  };

  const handleSplitTaskTypeChange = (id, which, newTaskType) => {
    if (isLocked) {
      setShowPinModal(true);
      return;
    }
    setEntries(prev => {
      const e = prev[id];
      if (!e || e.mode !== 'split') return prev;
      const key = which === 'A' ? 'splitA' : 'splitB';
      return { ...prev, [id]: { ...e, [key]: { ...e[key], taskType: newTaskType || null } } };
    });
  };

  const handleMarkAllPresent = () => {
    setEntries(prev => {
      const next = { ...prev };
      filteredEmployees.forEach(emp => {
        const id = String(emp.employeeId || emp.id);
        next[id] = { mode: 'single', status: 'full', locationWorked: null, taskType: null };
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (unmarkedCount > 0) {
      toast.warn(`You still have ${unmarkedCount} unmarked employees! Please mark everyone before saving.`);
      return;
    }

    const records = employees.map(emp => {
      const id = String(emp.employeeId || emp.id);
      return {
        empId: emp.employeeId || parseInt(emp.id, 10),
        segments: entryToSegments(entries[id]),
      };
    });

    try {
      setIsLoading(true);
      await saveAttendanceBulk(selectedDate, records);
      toast.success('Attendance saved successfully!');
    } catch {
      toast.error('Failed to save attendance.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!selectedDate) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await getAttendance(selectedDate);
        if (!active) return;

        const emps = data.map(d => ({
          id: String(d.employeeId),
          employeeId: d.employeeId,
          name: d.name,
          role: d.role || '',
          farm: d.home_farm || d.farm,
          wagePerDay: d.wagePerDay,
        }));

        setEmployees(emps);

        const next = {};

        data.forEach(d => {
          const key = String(d.employeeId);
          const segs = d.segments || [];

          if (segs.length === 0) return;

          if (segs.length === 1) {
            const s = segs[0];
            next[key] = {
              mode: 'single',
              status: s.status,
              locationWorked: s.status === 'absent'
                ? null
                : (s.locationWorked || d.home_farm || d.farm),
              taskType: s.taskType ?? null,
            };
          } else {
            next[key] = {
              mode: 'split',
              splitA: {
                locationWorked: segs[0].locationWorked,
                taskType: segs[0].taskType ?? null,
              },
              splitB: {
                locationWorked: segs[1].locationWorked,
                taskType: segs[1].taskType ?? null,
              },
            };
          }
        });

        setEntries(next);

        // 🔒 NEW: LOCK LOGIC FOR PAST DATES
        const today = new Date().toISOString().split('T')[0];
        const isPastDate = selectedDate < today;

        setIsLocked(isPastDate);

      } catch {
        if (active) setError('Failed to load attendance.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [selectedDate]);

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-green-800 to-green-900 rounded-lg flex items-center justify-center shadow-sm">
              <CalendarCheck size={16} color="#86efac" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Daily Attendance</h1>
          </div>
          <p className="text-xs font-medium text-gray-500 pl-11">
            Grid-style attendance register supporting cross-farm deployment and split days
          </p>
        </div>

        {/* Date Selector + Filter Farm */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm">
            <div className="pl-3 pr-2 text-gray-400">
              <Calendar size={16} />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setEntries({});
              }}

              className="bg-transparent border-none outline-none text-sm font-bold text-gray-800 pr-3 cursor-pointer"
            />
          </div>

        </div>
      </div>

      {/* ── KPI STAT CARDS ── */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold">
          <AlertCircle size={16} /> <span style={{ marginLeft: 8 }}>{error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Present Today" amount={presentCount.toString()} badge="Active" sub="Full & Half Days"
          icon={<UserCheck size={14} />} index={1} path="M0,40 L0,25 C 20,30 40,10 60,15 C 80,20 90,5 100,5 L100,40 Z"
        />
        <StatCard
          title="Absent" amount={absentCount.toString()} badge="Leave" sub="Did not report"
          icon={<AlertCircle size={14} />} index={2} path="M0,40 L0,20 C 30,35 50,15 70,25 C 85,30 95,10 100,10 L100,40 Z"
        />
        <StatCard
          title="Unmarked" amount={unmarkedCount.toString()} badge="Pending" sub="Requires action"
          icon={<Users size={14} />} index={3} path="M0,40 L0,15 C 25,10 45,30 65,20 C 85,10 95,25 100,20 L100,40 Z"
        />
      </div>

      {/* ── GRID ATTENDANCE TABLE ── */}
      <div
className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${isLocked ? 'opacity-70 select-none' : ''}`}
      >

        {/* Toolbar */}
        {isLocked && (
          <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={14} />
            This is a locked historical record. Editing is restricted. Enter PIN to unlock.
          </div>
        )}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 outline-none focus:border-green-600 transition-colors shadow-sm"
            />
          </div>

          <button
            onClick={handleMarkAllPresent}
            disabled={isLoading}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:border-green-500 hover:text-green-600 transition-colors shadow-sm w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Mark All Present
          </button>
        </div>

        {/* List Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[960px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-gray-500 w-[22%]">Employee</th>

                <th className="py-3 px-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 w-[18%] text-center">
                  Location Worked
                </th>

                <th className="py-3 px-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 w-[18%] text-center">
                  Task Type
                </th>

                <th className="py-3 px-2 text-center w-[9%]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-600">Full Day</span>
                </th>
                <th className="py-3 px-2 text-center w-[9%]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Half Day</span>
                </th>
                <th className="py-3 px-2 text-center w-[9%]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Absent</span>
                </th>
                <th className="py-3 px-2 text-center w-[15%]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Split Day</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-gray-400 text-sm font-semibold">
                    No employees found matching your search.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => {
                  const entry = entries[emp.id];
                  const isSplit = entry?.mode === 'split';
                  const isAbsent = entry?.mode === 'single' && entry.status === 'absent';
                  const status = entry?.mode === 'single' ? entry.status : null;

                  return (
                    <tr key={emp.id} className={`hover:bg-gray-50/80 transition-colors group ${isSplit ? 'bg-blue-50/30' : ''}`}>

                      {/* Employee Name & Details */}
                      <td className="py-3 px-5 align-top">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs border border-green-200 shrink-0">
                            {emp.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-[13px]">{emp.name}</span>
                            <div className="flex items-center gap-1.5 text-[10.5px] text-gray-500 font-medium">
                              <span>{emp.role}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              <span className="text-gray-400">Home: <strong className="text-green-700">{emp.farm}</strong></span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {isSplit ? (
                        <>
                          {/* Split: two location dropdowns stacked */}
                          <td className="py-3 px-2 text-center align-middle">
                            <div className="flex flex-col gap-1.5 items-center">
                              <select
                                value={entry.splitA.locationWorked}
                                onChange={(e) => handleSplitLocationChange(emp.id, 'A', e.target.value)}
                                className="w-3/4 max-w-[140px] text-[11px] font-bold border rounded-lg px-2 py-1 outline-none cursor-pointer bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {LOCATION_OPTIONS.map(l => <option key={l} value={l}>{l} — Half</option>)}
                              </select>
                              <select
                                value={entry.splitB.locationWorked}
                                onChange={(e) => handleSplitLocationChange(emp.id, 'B', e.target.value)}
                                className="w-3/4 max-w-[140px] text-[11px] font-bold border rounded-lg px-2 py-1 outline-none cursor-pointer bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {LOCATION_OPTIONS.map(l => <option key={l} value={l}>{l} — Half</option>)}
                              </select>
                            </div>
                          </td>

                          {/* Split: two task-type dropdowns stacked */}
                          <td className="py-3 px-2 text-center align-middle">
                            <div className="flex flex-col gap-1.5 items-center">
                              <select
                                value={entry.splitA.taskType || ''}
                                onChange={(e) => handleSplitTaskTypeChange(emp.id, 'A', e.target.value)}
                                className="w-full max-w-[160px] text-[11px] font-bold border rounded-lg px-2 py-1 outline-none cursor-pointer bg-white text-gray-500 border-gray-300"
                              >
                                <option value="">— None —</option>
                                {TASK_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <select
                                value={entry.splitB.taskType || ''}
                                onChange={(e) => handleSplitTaskTypeChange(emp.id, 'B', e.target.value)}
                                className="w-full max-w-[160px] text-[11px] font-bold border rounded-lg px-2 py-1 outline-none cursor-pointer bg-white text-gray-500 border-gray-300"
                              >
                                <option value="">— None —</option>
                                {TASK_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                          </td>

                          {/* Full/Half/Absent radios disabled while split (status is implicitly half+half) */}
                          <td className="py-3 px-2 text-center align-middle">
                            <div className="flex justify-center p-2">
                              <div className="w-6 h-6 rounded-full border-2 border-gray-100 bg-gray-50 opacity-40" />
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center align-middle">
                            <div className="flex justify-center p-2">
                              <div className="w-6 h-6 rounded-full border-2 border-amber-300 bg-amber-100 flex items-center justify-center">
                                <Minus size={14} className="text-amber-500" strokeWidth={3} />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center align-middle">
                            <div className="flex justify-center p-2">
                              <div className="w-6 h-6 rounded-full border-2 border-gray-100 bg-gray-50 opacity-40" />
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Location Worked Dropdown — optional for fixed-farm employees (defaults to
                              home farm server-side), but REQUIRED for Floating employees who have
                              no valid default location in attendance.location_worked. */}
                          <td className="py-3 px-2 text-center align-middle">
                            {(() => {
                              const isFloating = emp.farm === 'Floating';
                              return (
                                <select
                                  value={entry?.locationWorked || ''}
                                  onChange={(e) => handleLocationChange(emp.id, e.target.value || null)}
                                  disabled={isAbsent}
                                  className={`w-3/4 max-w-[150px] text-[11px] font-bold border rounded-lg px-2 py-1.5 outline-none transition-colors cursor-pointer ${isAbsent
                                    ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed opacity-60'
                                    : entry?.locationWorked && entry.locationWorked !== emp.farm
                                        ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                                        : 'bg-white text-gray-400 border-gray-300 focus:border-green-500'
                                    }`}
                                >
                                  {isFloating
                                    ? <option value="">General (Both Farms)</option>
                                    : <option value="">{`Default (${emp.farm})`}</option>
                                  }
                                  {LOCATION_OPTIONS.map(l => <option key={l} value={l}>{l === 'MR1' ? 'MR1 Block' : l === 'MR2' ? 'MR2 Block' : 'Poultry Farm'}</option>)}
                                </select>
                              );
                            })()}
                          </td>

                          {/* Task Type Dropdown */}
                          <td className="py-3 px-2 text-center align-middle">
                            <select
                              value={entry?.taskType || ''}
                              onChange={(e) => handleTaskTypeChange(emp.id, e.target.value)}
                              disabled={isAbsent}
                              className={`w-full max-w-[170px] text-[11px] font-bold border rounded-lg px-2 py-1.5 outline-none transition-colors cursor-pointer ${isAbsent
                                ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed opacity-60'
                                : entry?.taskType
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
                                  : 'bg-white text-gray-400 border-gray-300 focus:border-green-500'
                                }`}
                            >
                              <option value="">— None —</option>
                              {TASK_TYPE_OPTIONS.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </td>

                          {/* Full Day Radio Button */}
                          <td className="py-3 px-2 text-center align-middle" onClick={() => handleStatusChange(emp.id, 'full')}>
                            <div className="flex justify-center cursor-pointer p-2">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${status === 'full' ? 'border-green-500 bg-green-500 shadow-sm shadow-green-500/30' : 'border-gray-200 bg-gray-50 hover:border-green-300'
                                }`}>
                                {status === 'full' && <Check size={14} color="white" strokeWidth={3} />}
                              </div>
                            </div>
                          </td>

                          {/* Half Day Radio Button */}
                          <td className="py-3 px-2 text-center align-middle" onClick={() => handleStatusChange(emp.id, 'half')}>
                            <div className="flex justify-center cursor-pointer p-2">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${status === 'half' ? 'border-amber-400 bg-amber-400 shadow-sm shadow-amber-400/30' : 'border-gray-200 bg-gray-50 hover:border-amber-300'
                                }`}>
                                {status === 'half' && <Minus size={14} color="white" strokeWidth={3} />}
                              </div>
                            </div>
                          </td>

                          {/* Absent Radio Button */}
                          <td className="py-3 px-2 text-center align-middle" onClick={() => handleStatusChange(emp.id, 'absent')}>
                            <div className="flex justify-center cursor-pointer p-2">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${status === 'absent' ? 'border-red-500 bg-red-500 shadow-sm shadow-red-500/30' : 'border-gray-200 bg-gray-50 hover:border-red-300'
                                }`}>
                                {status === 'absent' && <X size={14} color="white" strokeWidth={3} />}
                              </div>
                            </div>
                          </td>
                        </>
                      )}

                      {/* Split Day toggle */}
                      <td className="py-3 px-2 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => handleToggleSplit(emp.id)}
                          disabled={isAbsent}
                          title="Split this day's work across two locations (half + half)"
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${isAbsent
                            ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed opacity-60'
                            : isSplit
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                            }`}
                        >
                          <SplitSquareHorizontal size={12} />
                          {isSplit ? 'Splitting' : 'Split'}
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Sticky Footer / Action Bar */}
        <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="text-xs font-bold text-gray-500">
            {unmarkedCount > 0
              ? <span className="text-amber-500 flex items-center gap-1.5"><AlertCircle size={14} /> {unmarkedCount} pending</span>
              : <span className="text-green-600 flex items-center gap-1.5"><CheckCircle2 size={14} /> All marked</span>
            }
          </div>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm font-black shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save size={16} /> {isLoading ? 'Saving...' : 'Save Register'}
          </button>
        </div>

      </div>
      {showPinModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-xl shadow-lg w-80">
            <h2 className="font-bold mb-3">Enter PIN to Unlock</h2>

            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full border p-2 rounded mb-3"
              placeholder="Enter PIN"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPinModal(false)}
                className="px-3 py-1 text-sm bg-gray-200 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handlePinSubmit}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
