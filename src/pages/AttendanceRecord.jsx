import { useState, useEffect } from 'react';
import {
  ClipboardList, Calendar, CheckCircle2, AlertCircle,
  Users, Minus, MapPin, ChevronDown, Search, TrendingUp
} from 'lucide-react';
import { getEmployees, getAttendanceHistory } from '../services/api';
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

export default function AttendanceRecord() {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [employees, setEmployees] = useState([]);
  const [farmFilter, setFarmFilter] = useState('All');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [result, setResult] = useState(null);
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
    try {
      const data = await getAttendanceHistory(selectedEmpId, startDate, endDate);
      setResult(data);
    } catch {
      setError('Failed to load attendance records.');
    } finally {
      setIsLoading(false);
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
              onChange={e => { setSelectedEmpId(e.target.value); setResult(null); }}
              disabled={empsLoading}
              className="text-sm font-bold border border-gray-200 bg-white rounded-xl px-3 py-2 outline-none shadow-sm cursor-pointer disabled:opacity-60"
            >
              <option value="">— Select employee —</option>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
              {filteredRecords.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <ClipboardList size={36} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-bold">No attendance records found for this period.</p>
                  <p className="text-xs mt-1">Try adjusting the date range or check if attendance was marked.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
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
                    {filteredRecords.map(rec => {
                      const d = new Date(rec.date + 'T00:00:00');
                      const dayName = DAY_NAMES[d.getDay()];
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      const formatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                      const crossFarm = rec.location_worked && rec.location_worked !== result.employee.farm;

                      return (
                        <tr key={rec.id} className={`hover:bg-gray-50/80 transition-colors ${isWeekend ? 'bg-blue-50/30' : ''}`}>
                          <td className="py-3 px-5">
                            <span className={`text-xs font-black ${isWeekend ? 'text-blue-500' : 'text-gray-500'}`}>
                              {dayName}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-sm font-bold text-gray-800">{formatted}</td>
                          <td className="py-3 px-5">
                            <StatusBadge status={rec.status} />
                          </td>
                          <td className="py-3 px-5">
                            {rec.location_worked ? (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                                crossFarm
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-gray-100 text-gray-600 border-gray-200'
                              }`}>
                                <MapPin size={10} />
                                {rec.location_worked}
                                {crossFarm && <span className="text-blue-400 ml-0.5">↗</span>}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-xs font-bold">—</span>
                            )}
                          </td>
                          <td className="py-3 px-5">
                            {rec.task_type ? (
                              <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                                {rec.task_type}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-xs font-bold">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty state before search */}
      {!result && !isLoading && !error && (
        <div className="p-16 text-center text-gray-400">
          <ClipboardList size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm font-bold text-gray-500">Select an employee and date range, then click View Record.</p>
        </div>
      )}
    </div>
  );
}
