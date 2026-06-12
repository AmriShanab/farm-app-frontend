import { Loader2, Users } from 'lucide-react';

const STATUS_CONFIG = [
  { key: 'full', label: 'Full Day', active: 'bg-green-100 border-green-400 text-green-700' },
  { key: 'half', label: 'Half Day', active: 'bg-yellow-100 border-yellow-400 text-yellow-700' },
  { key: 'absent', label: 'Absent', active: 'bg-red-100 border-red-300 text-red-600' },
];

export default function HarvestLaborPanel({ employees, loading, attendance, onChange }) {
  return (
    <div className="md:col-span-12 mt-2">
      <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
        <Users size={16} className="text-blue-600" /> Harvest Day Attendance
      </h3>

      <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-xs font-bold">
            <Loader2 size={16} className="animate-spin" /> Loading employees...
          </div>
        ) : employees.length === 0 ? (
          <p className="text-center py-6 text-xs text-gray-400 font-medium">No active employees found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2 text-left">Employee</th>
                <th className="px-4 py-2 text-left hidden sm:table-cell">Role</th>
                <th className="px-4 py-2 text-right">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, idx) => {
                const current = attendance[emp.id] ?? null;
                return (
                  <tr key={emp.id} className={`border-t border-gray-100 ${idx % 2 !== 0 ? 'bg-white' : ''}`}>
                    <td className="px-4 py-2.5 font-bold text-gray-800">{emp.name}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs hidden sm:table-cell">
                      {emp.role ?? emp.job_role ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1.5 justify-end">
                        {STATUS_CONFIG.map((s) => (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => onChange(emp.id, current === s.key ? null : s.key)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all ${
                              current === s.key
                                ? s.active
                                : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-[11px] text-gray-400 mt-2 font-medium italic">
        * Marked attendance will be automatically linked to this harvest sale as harvest day records.
      </p>
    </div>
  );
}
