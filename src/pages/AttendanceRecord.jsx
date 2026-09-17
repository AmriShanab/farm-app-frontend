import { useState, useEffect, Fragment } from 'react';
import {
  ClipboardList, Calendar, CheckCircle2, AlertCircle,
  Users, Minus, MapPin, ChevronDown, ChevronRight, Search, TrendingUp,
  SplitSquareHorizontal, Loader2
} from 'lucide-react';
import { getEmployees, getAttendanceHistory, getAttendanceSummary } from '../services/api';
import { useToast } from '../components/ToastProvider';

const FARMS = ['All', 'MR1', 'MR2', 'Poultry'];

const StatusBadge = ({ status }) => {
  if (status === 'full') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-green-100 text-green-700 border border-green-200">
      <CheckCircle2 size={11} /> Full Day
    </span>
  );
  if (status === 'half') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
      <Minus size={11} /> Half Day
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
      <AlertCircle size={11} /> Absent
    </span>
  );
};

const StatCard = ({ title, value, sub, color, icon }) => {
  const colors = {
    green:  { bg: 'from-[#166534] to-[#14532d]', chart: '#A5D6A7' },
    amber:  { bg: 'from-[#92400e] to-[#78350f]',  chart: '#FCD34D' },
    red:    { bg: 'from-[#991b1b] to-[#7f1d1d]',  chart: '#FCA5A5' },
    blue:   { bg: 'from-[#1e3a5f] to-[#1e40af]',  chart: '#93C5FD' },
  };
  const c = colors[color] || colors.green;

  return (
    <div className={`relative overflow-hidden rounded-[1.25rem] p-4 bg-gradient-to-br ${c.bg} text-white shadow-lg border border-white/10 transition-all hover:-translate-y-1`}>
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[45px] opacity-20 bg-white" />
      <div className="relative z-10 mb-1 text-sm font-medium text-white/80">{title}</div>
      <div className="relative z-10 text-2xl font-black tracking-tight mb-2">{value}</div>
      <div className="relative z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/20 backdrop-blur-md">
        {icon}
        <span>{sub}</span>
      </div>
    </div>
  );
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Group records sharing a date (a split day) so they render as one row.
const groupRecordsByDate = (records) => {
  const groups = [];
  for (let i = 0; i < records.length;) {
    const date = records[i].date;
    const group = [records[i]];
    let j = i + 1;
    while (j < records.length && records[j].date === date) {
      group.push(records[j]);
      j++;
    }
    groups.push(group);
    i = j;
  }
  return groups;
};

// The day-by-day attendance table — reused by the single-employee view and by
// each expanded row of the All-Employees summary. `homeFarm` drives the
// cross-farm highlight on the Location column.
function DetailRecordsTable({ records, homeFarm, compact = false }) {
  if (!records || records.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        <ClipboardList size={28} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm font-bold">No attendance records found for this period.</p>
      </div>
    );
  }
  const recordGroups = groupRecordsByDate(records);
  return (
    <table className={`w-full text-left border-collapse whitespace-nowrap ${compact ? 'min-w-[520px]' : 'min-w-[600px]'}`}>
      <thead>
        <tr className="bg-gray-50 border-b border-gray-100">
          <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-gray-500 w-[15%]">Day</th>
          <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-gray-500 w-[20%]">Date</th>
          <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-gray-500 w-[20%]">Status</th>
          <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-gray-500 w-[20%]">
            <div className="flex items-center gap-1"><MapPin size={11} /> Location</div>
          </th>
          <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-gray-500">Task</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {recordGroups.map(group => {
          const rec = group[0];
          const isSplit = group.length > 1;
          const d = new Date(rec.date + 'T00:00:00');
          const dayName = DAY_NAMES[d.getDay()];
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          const formatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

          return (
            <tr key={rec.id} className={`hover:bg-gray-50/80 transition-colors ${isWeekend ? 'bg-blue-50/30' : ''} ${isSplit ? 'bg-blue-50/40' : ''}`}>
              <td className="py-3 px-5">
                <span className={`text-xs font-black ${isWeekend ? 'text-blue-500' : 'text-gray-500'}`}>
                  {dayName}
                </span>
              </td>
              <td className="py-3 px-5 text-sm font-bold text-gray-800">
                {formatted}
                {isSplit && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                    <SplitSquareHorizontal size={10} /> Split Day
                  </span>
                )}
              </td>
              <td className="py-3 px-5">
                <div className="flex flex-col gap-1">
                  {group.map(g => <StatusBadge key={g.id} status={g.status} />)}
                </div>
              </td>
              <td className="py-3 px-5">
                <div className="flex flex-col gap-1">
                  {group.map(g => {
                    const crossFarm = g.location_worked && g.location_worked !== homeFarm;
                    return g.location_worked ? (
                      <span key={g.id} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border w-fit ${
                        crossFarm
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        <MapPin size={10} />
                        {g.location_worked}
                        {crossFarm && <span className="text-blue-400 ml-0.5">↗</span>}
                      </span>
                    ) : (
                      <span key={g.id} className="text-gray-300 text-xs font-bold">—</span>
                    );
                  })}
                </div>
              </td>
              <td className="py-3 px-5">
                <div className="flex flex-col gap-1">
                  {group.map(g => g.task_type ? (
                    <span key={g.id} className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg w-fit">
                      {g.task_type}
                    </span>
                  ) : (
                    <span key={g.id} className="text-gray-300 text-xs font-bold">—</span>
                  ))}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Days-worked breakdown for an employee's records: per location (MR1/MR2/…)
// and per harvest task. A full day counts as 1, a half day as 0.5.
function LocationTaskSummary({ records }) {
  const weight = (s) => (s === 'full' ? 1 : s === 'half' ? 0.5 : 0);
  const locations = {};
  const tasks = {};
  let total = 0;
  for (const r of records || []) {
    const w = weight(r.status);
    if (w === 0) continue;
    total += w;
    if (r.location_worked) locations[r.location_worked] = (locations[r.location_worked] || 0) + w;
    if (r.task_type) tasks[r.task_type] = (tasks[r.task_type] || 0) + w;
  }
  const locEntries = Object.entries(locations);
  const taskEntries = Object.entries(tasks);
  const locatedDays = locEntries.reduce((s, [, n]) => s + n, 0);
  const unspecified = total - locatedDays; // worked days with no location recorded
  if (total === 0) return null;

  const dayLbl = (n) => `${n} day${n === 1 ? '' : 's'}`;

  return (
    <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mr-1">
        Days worked
      </span>
      {locEntries.map(([loc, n]) => (
        <span key={loc} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white border border-gray-200 text-gray-700">
          <MapPin size={10} className="text-green-600" />
          {loc}
          <strong className="text-green-700">{dayLbl(n)}</strong>
        </span>
      ))}
      {unspecified > 0 && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white border border-gray-200 text-gray-400">
          No location
          <strong className="text-gray-500">{dayLbl(unspecified)}</strong>
        </span>
      )}
      {taskEntries.map(([task, n]) => (
        <span key={task} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-800">
          {task}
          <strong>{dayLbl(n)}</strong>
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-green-600 text-white ml-auto">
        Total {dayLbl(total)}
      </span>
    </div>
  );
}

export default function AttendanceRecord() {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [employees, setEmployees] = useState([]);
  const [farmFilter, setFarmFilter] = useState('All');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [result, setResult] = useState(null);
  const [summary, setSummary] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [empsLoading, setEmpsLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    setEmpsLoading(true);
    getEmployees(farmFilter === 'All' ? null : farmFilter)
      .then(data => {
        setEmployees(data);
        setSelectedEmpId('');
        setResult(null);
        setSummary(null);
        setExpandedRows({});
      })
      .catch(() => toast.error('Failed to load employees.'))
      .finally(() => setEmpsLoading(false));
  }, [farmFilter]);

  const handleSearch = async () => {
    if (!selectedEmpId) { toast.warn('Please select an employee.'); return; }
    if (!startDate || !endDate) { toast.warn('Please select a date range.'); return; }
    if (startDate > endDate) { toast.warn('Start date must be before end date.'); return; }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setSummary(null);
    setExpandedRows({});
    try {
      if (selectedEmpId === 'all') {
        const data = await getAttendanceSummary(farmFilter, startDate, endDate);
        setSummary(data);
      } else {
        const data = await getAttendanceHistory(selectedEmpId, startDate, endDate);
        setResult(data);
      }
    } catch {
      setError('Failed to load attendance records.');
    } finally {
      setIsLoading(false);
    }
  };

  // Drill from the all-employees summary into a single employee's detail.
  const viewOne = async (empId) => {
    setSelectedEmpId(String(empId));
    setIsLoading(true);
    setError(null);
    setResult(null);
    setSummary(null);
    try {
      const data = await getAttendanceHistory(empId, startDate, endDate);
      setResult(data);
    } catch {
      setError('Failed to load attendance records.');
    } finally {
      setIsLoading(false);
    }
  };

  // Expand/collapse an employee's day-by-day records inside the summary table.
  // Records are fetched once on first expand and cached.
  const toggleRow = async (empId) => {
    const current = expandedRows[empId];
    if (current?.open) {
      setExpandedRows(prev => ({ ...prev, [empId]: { ...prev[empId], open: false } }));
      return;
    }
    if (current?.records) {
      setExpandedRows(prev => ({ ...prev, [empId]: { ...prev[empId], open: true } }));
      return;
    }
    setExpandedRows(prev => ({ ...prev, [empId]: { open: true, loading: true, records: null, error: null } }));
    try {
      const data = await getAttendanceHistory(empId, startDate, endDate);
      setExpandedRows(prev => ({ ...prev, [empId]: { open: true, loading: false, records: data.records ?? [], error: null } }));
    } catch {
      setExpandedRows(prev => ({ ...prev, [empId]: { open: true, loading: false, records: null, error: 'Failed to load records.' } }));
    }
  };

  const filteredRecords = result?.records ?? [];

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-green-800 to-green-900 rounded-lg flex items-center justify-center shadow-sm">
              <ClipboardList size={16} color="#86efac" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Attendance Record</h1>
          </div>
          <p className="text-xs font-medium text-gray-500 pl-11">
            View an employee's attendance history — working days, location and shift type
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">

          {/* Farm filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Farm</label>
            <select
              value={farmFilter}
              onChange={e => setFarmFilter(e.target.value)}
              className="text-sm font-bold border border-gray-200 bg-white rounded-xl px-3 py-2 outline-none shadow-sm cursor-pointer min-w-[120px]"
            >
              {FARMS.map(f => <option key={f} value={f}>{f === 'All' ? 'All Farms' : `${f} Staff`}</option>)}
            </select>
          </div>

          {/* Employee selector */}
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Employee</label>
            <select
              value={selectedEmpId}
              onChange={e => { setSelectedEmpId(e.target.value); setResult(null); setSummary(null); setExpandedRows({}); }}
              disabled={empsLoading}
              className="text-sm font-bold border border-gray-200 bg-white rounded-xl px-3 py-2 outline-none shadow-sm cursor-pointer disabled:opacity-60"
            >
              <option value="">— Select employee —</option>
              <option value="all">All Employees</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.farm})</option>
              ))}
            </select>
          </div>

          {/* Start date */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">From</label>
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm gap-2">
              <Calendar size={14} className="text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-bold text-gray-800 cursor-pointer"
              />
            </div>
          </div>

          {/* End date */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">To</label>
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm gap-2">
              <Calendar size={14} className="text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-bold text-gray-800 cursor-pointer"
              />
            </div>
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            disabled={isLoading || !selectedEmpId}
            className="px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm font-black shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Search size={15} />
            {isLoading ? 'Loading...' : 'View Record'}
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* RESULTS */}
      {result && (
        <>
          {/* Employee info pill */}
          <div className="flex items-center gap-3 mb-5 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-black text-sm border border-green-200 shrink-0">
              {result.employee.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-black text-gray-900">{result.employee.name}</p>
              <p className="text-xs text-gray-500 font-medium">
                {result.employee.role || 'Staff'} &nbsp;·&nbsp; Home: <strong className="text-green-700">{result.employee.farm}</strong>
                &nbsp;·&nbsp; ₹{result.employee.wagePerDay.toLocaleString()}/day
                &nbsp;·&nbsp; <span className="capitalize">{result.employee.payFrequency}</span>
              </p>
            </div>
            <div className="ml-auto text-xs font-bold text-gray-400 hidden sm:block">
              {result.startDate} → {result.endDate}
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatCard
              title="Full Days" value={result.summary.fullDays}
              sub="Full shifts worked" color="green" icon={<CheckCircle2 size={13} />}
            />
            <StatCard
              title="Half Days" value={result.summary.halfDays}
              sub="Half shifts worked" color="amber" icon={<Minus size={13} />}
            />
            <StatCard
              title="Absent Days" value={result.summary.absentDays}
              sub="Did not report" color="red" icon={<AlertCircle size={13} />}
            />
            {typeof result.summary.splitDays === 'number' && (
              <StatCard
                title="Split Days" value={result.summary.splitDays}
                sub="Worked 2 locations" color="blue" icon={<SplitSquareHorizontal size={13} />}
              />
            )}
            <StatCard
              title="Gross Earnings" value={`₹${result.summary.grossPay.toLocaleString()}`}
              sub="For this period" color="blue" icon={<TrendingUp size={13} />}
            />
          </div>

          {/* Records table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <p className="text-sm font-black text-gray-700">
                {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
              </p>
              <span className="text-xs font-bold text-gray-400">
                {result.summary.totalRecorded} days recorded out of selected range
              </span>
            </div>

            <div className="overflow-x-auto">
              <DetailRecordsTable records={filteredRecords} homeFarm={result.employee.farm} />
            </div>
          </div>
        </>
      )}

      {/* ALL-EMPLOYEES SUMMARY */}
      {summary && (
        <>
          <div className="flex items-center gap-3 mb-5 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-green-700 border border-green-200 shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-base font-black text-gray-900">
                All Employees{summary.farm && summary.farm !== 'all' ? ` · ${summary.farm}` : ''}
              </p>
              <p className="text-xs text-gray-500 font-medium">
                {summary.employees.length} employee{summary.employees.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="ml-auto text-xs font-bold text-gray-400 hidden sm:block">
              {summary.startDate} → {summary.endDate}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              {summary.employees.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Users size={36} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-bold">No employees found for this selection.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[760px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="py-3 pl-5 pr-2 w-8"></th>
                      <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-gray-500">Employee</th>
                      <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-gray-500">Home Farm</th>
                      <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-gray-500 text-center">Full</th>
                      <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-gray-500 text-center">Half</th>
                      <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-gray-500 text-center">Absent</th>
                      <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-gray-500 text-center">Split</th>
                      <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-gray-500 text-right">Gross</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {summary.employees.map(emp => {
                      const row = expandedRows[emp.id];
                      const isOpen = !!row?.open;
                      return (
                        <Fragment key={emp.id}>
                          <tr
                            className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${isOpen ? 'bg-green-50/40' : ''}`}
                            onClick={() => toggleRow(emp.id)}
                          >
                            <td className="py-3 pl-5 pr-2 text-gray-400">
                              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </td>
                            <td className="py-3 px-5">
                              <button
                                onClick={(e) => { e.stopPropagation(); viewOne(emp.id); }}
                                className="text-sm font-black text-green-700 hover:text-green-800 hover:underline text-left"
                                title="Open full-page record"
                              >
                                {emp.name}
                              </button>
                              {emp.role && <div className="text-[11px] text-gray-400 font-semibold">{emp.role}</div>}
                            </td>
                            <td className="py-3 px-5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                <MapPin size={10} /> {emp.farm}
                              </span>
                            </td>
                            <td className="py-3 px-5 text-center text-sm font-black text-green-700">{emp.fullDays}</td>
                            <td className="py-3 px-5 text-center text-sm font-black text-amber-600">{emp.halfDays}</td>
                            <td className="py-3 px-5 text-center text-sm font-black text-red-600">{emp.absentDays}</td>
                            <td className="py-3 px-5 text-center text-sm font-black text-blue-600">{emp.splitDays}</td>
                            <td className="py-3 px-5 text-right text-sm font-black text-gray-900">₹{Number(emp.grossPay).toLocaleString()}</td>
                          </tr>
                          {isOpen && (
                            <tr className="bg-gray-50/40">
                              <td colSpan={8} className="px-3 sm:px-5 pb-4 pt-1">
                                <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                                  {row.loading ? (
                                    <div className="p-8 text-center text-gray-400">
                                      <Loader2 size={22} className="animate-spin mx-auto" />
                                    </div>
                                  ) : row.error ? (
                                    <div className="p-6 text-center text-red-600 text-sm font-bold">{row.error}</div>
                                  ) : (
                                    <>
                                      <LocationTaskSummary records={row.records} />
                                      <div className="overflow-x-auto">
                                        <DetailRecordsTable records={row.records} homeFarm={emp.farm} compact />
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                      <td className="py-3 px-5 text-xs font-black uppercase tracking-wider text-gray-700" colSpan={3}>
                        Totals ({summary.employees.length})
                      </td>
                      <td className="py-3 px-5 text-center text-sm font-black text-green-700">
                        {summary.employees.reduce((s, e) => s + e.fullDays, 0)}
                      </td>
                      <td className="py-3 px-5 text-center text-sm font-black text-amber-600">
                        {summary.employees.reduce((s, e) => s + e.halfDays, 0)}
                      </td>
                      <td className="py-3 px-5 text-center text-sm font-black text-red-600">
                        {summary.employees.reduce((s, e) => s + e.absentDays, 0)}
                      </td>
                      <td className="py-3 px-5 text-center text-sm font-black text-blue-600">
                        {summary.employees.reduce((s, e) => s + e.splitDays, 0)}
                      </td>
                      <td className="py-3 px-5 text-right text-sm font-black text-gray-900">
                        ₹{summary.employees.reduce((s, e) => s + Number(e.grossPay), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty state before search */}
      {!result && !summary && !isLoading && !error && (
        <div className="p-16 text-center text-gray-400">
          <ClipboardList size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm font-bold text-gray-500">Select an employee and date range, then click View Record.</p>
        </div>
      )}
    </div>
  );
}
