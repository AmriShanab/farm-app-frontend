import { useState, useEffect } from 'react';
import {
  CalendarCheck, Calendar, CheckCircle2, AlertCircle,
  Users, Save, Check, X, Search, UserCheck, Minus, MapPin
} from 'lucide-react';
import { getAttendance, saveAttendanceBulk, updateAttendance } from '../services/api';
import { useToast } from '../components/ToastProvider';

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

// --- MAIN PAGE COMPONENT ---
export default function DailyAttendance() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  // States to hold attendance status and dynamic locations
  const [attendance, setAttendance] = useState({}); // { id: 1, 0.5, 0 }
  const [locations, setLocations] = useState({});   // { id: 'MR1', 'Poultry', etc. }

  const [employees, setEmployees] = useState([]);
  const [farm, setFarm] = useState('MR1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const filteredEmployees = employees.filter(emp =>
    !search || emp.name.toLowerCase().includes(search.toLowerCase()) || (emp.role || '').toLowerCase().includes(search.toLowerCase())
  );

  // Derived KPIs
  const presentCount = Object.values(attendance).filter(val => val === 1 || val === 0.5).length;
  const absentCount = Object.values(attendance).filter(val => val === 0).length;
  const unmarkedCount = employees.length - Object.keys(attendance).length;

  const handleStatusChange = async (id, status) => {
    setAttendance(prev => ({ ...prev, [id]: status }));

    const emp = employees.find(e => String(e.employeeId || e.id) === String(id));

    if (!locations[id] && emp) {
      setLocations(prev => ({ ...prev, [id]: emp.farm }));
    }

    const attendanceId = emp?.attendanceId;
    const statusStr = status === 1 ? 'full' : status === 0.5 ? 'half' : 'absent';
    const locToSave = status === 0 ? null : (locations[id] || emp?.farm);

    if (attendanceId) {
      try {
        await updateAttendance(attendanceId, { status: statusStr, locationWorked: locToSave });
      } catch {
        toast.error('Failed to update attendance.');
      }
    }
  };

  const handleLocationChange = async (id, newLocation) => {
    setLocations(prev => ({ ...prev, [id]: newLocation }));

    const emp = employees.find(e => String(e.employeeId || e.id) === String(id));
    const attendanceId = emp?.attendanceId;
    const currentStatus = attendance[id];

    if (attendanceId && currentStatus !== undefined && currentStatus !== 0) {
      const statusStr = currentStatus === 1 ? 'full' : 'half';
      try {
        await updateAttendance(attendanceId, { status: statusStr, locationWorked: newLocation });
      } catch {
        toast.error('Failed to update location.');
      }
    }
  };

  const handleMarkAllPresent = () => {
    const allPresent = {};
    const allLocs = { ...locations };
    filteredEmployees.forEach(emp => {
      const id = String(emp.employeeId || emp.id);
      allPresent[id] = 1;
      if (!allLocs[id]) {
        allLocs[id] = emp.farm; 
      }
    });
    setAttendance(prev => ({ ...prev, ...allPresent }));
    setLocations(allLocs);
  };

  const handleSave = async () => {
    if (unmarkedCount > 0) {
      toast.warn(`You still have ${unmarkedCount} unmarked employees! Please mark everyone before saving.`);
      return;
    }

    const records = employees.map(emp => {
      const id = String(emp.employeeId || emp.id);
      const status = attendance[id];
      const statusStr = status === 1 ? 'full' : status === 0.5 ? 'half' : 'absent';

      const loc = statusStr === 'absent' ? null : (locations[id] || emp.farm);

      return {
        empId: emp.employeeId || parseInt(emp.id, 10),
        status: statusStr,
        locationWorked: loc 
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
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAttendance(selectedDate, farm);
        if (!active) return;
        const emps = data.map(d => ({
          id: String(d.employeeId),
          employeeId: d.employeeId,
          name: d.name,
          role: d.role || '',
          farm: d.home_farm || d.farm, // Use home_farm from the new API alias
          wagePerDay: d.wagePerDay,
          attendanceId: d.attendanceId,
          status: d.status,
        }));
        setEmployees(emps);

        // Build attendance & locations map
        const att = {};
        const locs = {};
        data.forEach(d => {
          const key = String(d.employeeId);
          if (d.status === 'full') att[key] = 1;
          else if (d.status === 'half') att[key] = 0.5;
          else if (d.status === 'absent') att[key] = 0;

          // Hydrate location worked map (fallback to home_farm if missing)
          locs[key] = d.locationWorked || d.location_worked || d.home_farm || d.farm;
        });

        setAttendance(att);
        setLocations(locs);
      } catch {
        if (active) setError('Failed to load attendance.');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [selectedDate, farm]);

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
            Grid-style attendance register supporting cross-farm deployment
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
                setAttendance({}); // Reset when date changes
                setLocations({});
              }}
              className="bg-transparent border-none outline-none text-sm font-bold text-gray-800 pr-3 cursor-pointer"
            />
          </div>

          <select value={farm} onChange={(e) => { setFarm(e.target.value); setAttendance({}); setLocations({}); }} className="text-sm font-bold border border-gray-200 bg-white rounded-xl px-3 py-1.5 outline-none shadow-sm cursor-pointer">
            <option value="MR1">MR1 Staff</option>
            <option value="MR2">MR2 Staff</option>
            <option value="Poultry">Poultry Staff</option>
          </select>
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">

        {/* Toolbar */}
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
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[750px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-gray-500 w-[30%]">Employee</th>

                {/* NEW LOCATION COLUMN */}
                <th className="py-3 px-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 w-[25%] text-center">
                  Location Worked
                </th>

                <th className="py-3 px-2 text-center w-[15%]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-600">Full Day</span>
                  </div>
                </th>
                <th className="py-3 px-2 text-center w-[15%]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Half Day</span>
                  </div>
                </th>
                <th className="py-3 px-2 text-center w-[15%]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Absent</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-400 text-sm font-semibold">
                    No employees found matching your search.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => {
                  const status = attendance[emp.id];
                  const isAbsent = status === 0;

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50/80 transition-colors group">

                      {/* Employee Name & Details */}
                      <td className="py-3 px-5">
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

                      {/* Location Worked Dropdown */}
                      <td className="py-3 px-2 text-center align-middle">
                        <select
                          value={locations[emp.id] || emp.farm}
                          onChange={(e) => handleLocationChange(emp.id, e.target.value)}
                          disabled={isAbsent}
                          className={`w-3/4 max-w-[140px] text-[11px] font-bold border rounded-lg px-2 py-1.5 outline-none transition-colors cursor-pointer ${isAbsent
                              ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed opacity-60'
                              : locations[emp.id] && locations[emp.id] !== emp.farm
                                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' // Highlight if working cross-farm
                                : 'bg-white text-gray-700 border-gray-300 focus:border-green-500'
                            }`}
                        >
                          <option value="MR1">MR1 Block</option>
                          <option value="MR2">MR2 Block</option>
                          <option value="Poultry">Poultry Farm</option>
                        </select>
                      </td>

                      {/* Full Day Radio Button */}
                      <td className="py-3 px-2 text-center align-middle" onClick={() => handleStatusChange(emp.id, 1)}>
                        <div className="flex justify-center cursor-pointer p-2">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${status === 1 ? 'border-green-500 bg-green-500 shadow-sm shadow-green-500/30' : 'border-gray-200 bg-gray-50 hover:border-green-300'
                            }`}>
                            {status === 1 && <Check size={14} color="white" strokeWidth={3} />}
                          </div>
                        </div>
                      </td>

                      {/* Half Day Radio Button */}
                      <td className="py-3 px-2 text-center align-middle" onClick={() => handleStatusChange(emp.id, 0.5)}>
                        <div className="flex justify-center cursor-pointer p-2">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${status === 0.5 ? 'border-amber-400 bg-amber-400 shadow-sm shadow-amber-400/30' : 'border-gray-200 bg-gray-50 hover:border-amber-300'
                            }`}>
                            {status === 0.5 && <Minus size={14} color="white" strokeWidth={3} />}
                          </div>
                        </div>
                      </td>

                      {/* Absent Radio Button */}
                      <td className="py-3 px-2 text-center align-middle" onClick={() => handleStatusChange(emp.id, 0)}>
                        <div className="flex justify-center cursor-pointer p-2">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${status === 0 ? 'border-red-500 bg-red-500 shadow-sm shadow-red-500/30' : 'border-gray-200 bg-gray-50 hover:border-red-300'
                            }`}>
                            {status === 0 && <X size={14} color="white" strokeWidth={3} />}
                          </div>
                        </div>
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
    </div>
  );
}