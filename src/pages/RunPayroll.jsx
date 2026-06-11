import { useEffect, useMemo, useState } from 'react';
import {
  Calculator, Download, Search, SlidersHorizontal,
  Wallet, Banknote, FileCheck, CheckCircle2, ChevronLeft, ChevronRight,
  Plus, Edit2, X, CalendarDays
} from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import {
  createManagerSalary, finalizePayroll, getEmployees,
  getFinalizedEmployees,  // ← add this
  getManagerSalaries, getPayrollHistory, getPayrollPreview, updateManagerSalary
} from '../services/api'; import { downloadCsv } from '../utils/csv';

const fmt = (n) => Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const toNumber = (value) => Number(value ?? 0) || 0;

const payrollPeriodLabel = (startDate, endDate) => `${startDate} to ${endDate}`;

const normalizeHistoryRow = (row) => ({
  id: String(row.id ?? `${Date.now()}-${Math.random()}`),
  period: row.period ?? '',
  farm: row.farm ?? '',
  employeeCount: toNumber(row.employeeCount),
  totalGross: toNumber(row.totalGross),
  totalDeductions: toNumber(row.totalDeductions),
  totalNet: toNumber(row.totalNet),
  finalizedAt: row.finalizedAt ?? '',
});

const monthLabel = (month) => new Date(2000, month - 1, 1).toLocaleString('en-US', { month: 'long' });

const managerSalaryToForm = (row, fallbackYear) => ({
  empId: row?.empId ?? '',
  month: row?.month ?? Number(new Date().getMonth() + 1),
  year: row?.year ?? Number(fallbackYear),
  amount: row?.amount ?? '',
  chequeNo: row?.chequeNo ?? '',
  chequeDate: row?.chequeDate ?? '',
});

const normalizeManagerSalaryRow = (row) => ({
  id: String(row.id ?? crypto.randomUUID()),
  empId: String(row.empId ?? ''),
  employeeName: row.employeeName ?? '',
  month: toNumber(row.month),
  year: toNumber(row.year),
  amount: toNumber(row.amount),
  chequeNo: row.chequeNo ?? '',
  chequeDate: row.chequeDate ?? '',
  createdAt: row.createdAt ?? '',
});

const getSalaryWeek = () => {
  const today = new Date();
  const day = today.getDay();

  let friday = new Date(today);
  let thursday = new Date(today);

  if (day >= 5) {
    friday.setDate(today.getDate() - (day - 5));
    thursday.setDate(friday.getDate() + 6);
  } else {
    friday.setDate(today.getDate() - (day + 2));
    thursday = new Date(friday);
    thursday.setDate(friday.getDate() + 6);
  }

  return {
    startDate: friday.toISOString().split('T')[0],
    endDate: thursday.toISOString().split('T')[0],
  };
};

export default function RunPayroll() {
  const salaryWeek = getSalaryWeek();
  const [payrollData, setPayrollData] = useState([]);
  const [historyRows, setHistoryRows] = useState([]);
  const [search, setSearch] = useState('');

  // Track finalization map per individual employee: { [empId]: true/false }
  const [finalizedMap, setFinalizedMap] = useState({});
  const [individualSaving, setIndividualSaving] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(salaryWeek.startDate);
  const [endDate, setEndDate] = useState(salaryWeek.endDate);
  const [farm, setFarm] = useState('MR1');
  const [payFrequency, setPayFrequency] = useState('weekly');

  const [managerYear, setManagerYear] = useState('2026');
  const [managerSalaries, setManagerSalaries] = useState([]);
  const [managerEmployees, setManagerEmployees] = useState([]);
  const [managerLoading, setManagerLoading] = useState(false);
  const [managerError, setManagerError] = useState(null);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [managerEdit, setManagerEdit] = useState(null);
  const [managerRow, setManagerRow] = useState(managerSalaryToForm(null, '2026'));
  const [isManagerSaving, setIsManagerSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [preview, history, finalizedEmpIds] = await Promise.all([
          getPayrollPreview({ startDate, endDate, farm, payFrequency }),
          getPayrollHistory({ year: startDate.slice(0, 4), farm }),
          getFinalizedEmployees({ farm, startDate, endDate }),
        ]);

        if (!active) return;

        const normalizedRows = (Array.isArray(preview) ? preview : []).map(emp => ({
          ...emp,
          employeeId: parseInt(
            emp.employeeId ?? emp.empId ?? emp.id,
            10
          ),
        }));

        setPayrollData(normalizedRows);
        const storageKey = `finalized:${farm}:${startDate}:${endDate}`;

        if (finalizedEmpIds.length > 0) {
          const map = Object.fromEntries(finalizedEmpIds.map(id => [id, true]));
          sessionStorage.setItem(storageKey, JSON.stringify(map));
          setFinalizedMap(map);
        } else {
          try {
            const stored = sessionStorage.getItem(storageKey);
            setFinalizedMap(stored ? JSON.parse(stored) : {});
          } catch {
            setFinalizedMap({});
          }
        }

        setHistoryRows(Array.isArray(history) ? history : []);

      } catch (err) {
        if (active) {
          setError('Failed to sync payroll data.');
          setPayrollData([]);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadData();
    return () => { active = false; };
  }, [startDate, endDate, farm, payFrequency]);
  useEffect(() => {
    let active = true;
    const loadEmployees = async () => {
      try {
        const employees = await getEmployees('All');
        if (!active) return;
        const managers = (Array.isArray(employees) ? employees : [])
          .filter(emp => (emp.role || '').toLowerCase().includes('manager'))
          .map(emp => ({
            id: String(emp.id ?? emp.employeeId ?? emp.empId ?? ''),
            name: emp.name ?? emp.employee_name ?? emp.employeeName ?? '',
            role: emp.role ?? '',
          }));
        setManagerEmployees(managers);
      } catch {
        if (active) setManagerEmployees([]);
      }
    };

    loadEmployees();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadManagerSalaries = async () => {
      setManagerLoading(true);
      setManagerError(null);
      try {
        const rows = await getManagerSalaries(managerYear);
        if (!active) return;
        setManagerSalaries(Array.isArray(rows) ? rows.map(normalizeManagerSalaryRow) : []);
      } catch {
        if (active) {
          setManagerError('Failed to load manager salaries.');
          setManagerSalaries([]);
        }
      } finally {
        if (active) setManagerLoading(false);
      }
    };

    loadManagerSalaries();
    return () => { active = false; };
  }, [managerYear]);



  const filtered = useMemo(() => {
    return payrollData.filter(emp =>
      !search ||
      emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.role?.toLowerCase().includes(search.toLowerCase())
    );
  }, [payrollData, search]);

  const totalGross = payrollData.reduce((sum, emp) => sum + emp.grossPay, 0);
  const totalDeductions = payrollData.reduce((sum, emp) => sum + emp.advanceDeducted, 0);
  const totalNetPayout = payrollData.reduce((sum, emp) => sum + emp.netPay, 0);

  const handleFinalizeSingle = async (emp) => {
    const rawEmpId = emp.employeeId || emp.empId || emp.id;
    const empIdStr = String(rawEmpId);

    if (!rawEmpId || isNaN(parseInt(rawEmpId, 10))) {
      toast.error(`Could not resolve a valid Employee ID for ${emp.name}`);
      return;
    }

    if (!confirm(`Are you sure you want to lock and finalize salary payout for ${emp.name}?`)) {
      return;
    }

    const payload = {
      farm,
      startDate,
      endDate,
      empId: parseInt(rawEmpId, 10),
      grossPay: Number(emp.grossPay || 0),
      advanceDeducted: Number(emp.advanceDeducted || 0),
      netPay: Number(emp.netPay || 0),
    };

    setIndividualSaving(prev => ({ ...prev, [empIdStr]: true }));
    try {
      await finalizePayroll(payload);

      setFinalizedMap(prev => {
        const next = { ...prev, [empIdStr]: true };
        const storageKey = `finalized:${farm}:${startDate}:${endDate}`;
        try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { }
        return next;
      });

      toast.success(`Payroll successfully secured for ${emp.name}.`);
    } catch {
      toast.error(`System error finalizing record for ${emp.name}.`);
    }
  };

  const openManagerModal = (row = null) => {
    setManagerEdit(row);
    setManagerRow(managerSalaryToForm(row, managerYear));
    setIsManagerModalOpen(true);
  };

  const closeManagerModal = () => {
    setIsManagerModalOpen(false);
    setManagerEdit(null);
    setManagerRow(managerSalaryToForm(null, managerYear));
    setIsManagerSaving(false);
  };

  const handleSaveManagerSalary = async () => {
    if (!managerRow.empId || !managerRow.month || !managerRow.year || !managerRow.amount) {
      toast.warn('Please select a manager, month, year and amount.');
      return;
    }

    const payload = {
      empId: Number(managerRow.empId),
      month: Number(managerRow.month),
      year: Number(managerRow.year),
      amount: Number(managerRow.amount),
      chequeNo: managerRow.chequeNo || '',
      chequeDate: managerRow.chequeDate || null,
    };

    setIsManagerSaving(true);
    try {
      const saved = managerEdit
        ? await updateManagerSalary(managerEdit.id, payload)
        : await createManagerSalary(payload);

      const selectedManager = managerEmployees.find(emp => String(emp.id) === String(payload.empId));
      const record = normalizeManagerSalaryRow({
        ...(saved || {}),
        id: saved?.id ?? managerEdit?.id ?? String(Date.now()),
        empId: saved?.empId ?? payload.empId,
        employeeName: saved?.employeeName ?? selectedManager?.name ?? '',
        month: saved?.month ?? payload.month,
        year: saved?.year ?? payload.year,
        amount: saved?.amount ?? payload.amount,
        chequeNo: saved?.chequeNo ?? payload.chequeNo,
        chequeDate: saved?.chequeDate ?? payload.chequeDate,
      });

      setManagerSalaries(prev => managerEdit
        ? prev.map(item => (item.id === record.id ? record : item))
        : [record, ...prev]
      );
      toast.success(managerEdit ? 'Manager salary updated.' : 'Manager salary added.');
      closeManagerModal();
    } catch {
      toast.error('Failed to save manager salary.');
      setIsManagerSaving(false);
    }
  };

  const handleExportCsv = () => {
    downloadCsv(
      `payroll-${farm}-${startDate}-to-${endDate}.csv`,
      [
        { label: 'Employee', value: row => row.name },
        { label: 'Wage / Day', value: row => row.wagePerDay?.toFixed(2) || '0.00' },
        { label: 'Full Days', value: row => row.fullDays },
        { label: 'Half Days', value: row => row.halfDays },
        { label: 'Absent Days', value: row => row.absentDays },
        { label: 'Gross Pay', value: row => row.grossPay.toFixed(2) },
        { label: 'Advance', value: row => row.advanceDeducted.toFixed(2) },
        { label: 'Net Pay', value: row => row.netPay.toFixed(2) },
      ],
      filtered
    );
  };

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-green-800 to-green-900 rounded-lg flex items-center justify-center shadow-sm">
              <Calculator size={16} color="#86efac" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Run Payroll</h1>
          </div>
          <p className="text-xs font-medium text-gray-500 pl-11">
            Review live dry-run computations, modify distribution groups, and lock records individually.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <CalendarDays size={14} className="text-gray-400" />
            <select value={payFrequency} onChange={e => setPayFrequency(e.target.value)} className="text-sm font-bold text-gray-700 bg-transparent outline-none cursor-pointer">
              <option value="weekly">Weekly Schedule</option>
              <option value="monthly">Monthly Schedule</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Start</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm font-semibold text-gray-800 bg-transparent outline-none" />
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">End</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm font-semibold text-gray-800 bg-transparent outline-none" />
          </div>
          <select value={farm} onChange={e => setFarm(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 shadow-sm cursor-pointer">
            <option value="MR1">MR1 Block</option>
            <option value="MR2">MR2 Block</option>
            <option value="Poultry">Poultry Farm</option>
          </select>
          <button onClick={handleExportCsv} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 shadow-sm hover:text-green-700 transition-colors">
            <Download size={14} /> Export Sheets
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="animate-pulse space-y-3 mb-6">
          <div className="h-12 bg-gray-100 rounded-xl"></div>
          <div className="h-12 bg-gray-100 rounded-xl"></div>
          <div className="h-12 bg-gray-100 rounded-xl"></div>
        </div>
      )}

      {/* ── PREMIUM KPI STAT CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          {
            title: 'Total Gross Wages',
            amount: `Rs. ${fmt(totalGross)}`,
            badge: 'Unsettled Gross',
            sub: 'Base calculation',
            icon: <Wallet size={14} />,
            path: "M0,40 L0,25 C 20,30 40,10 60,15 C 80,20 90,5 100,5 L100,40 Z"
          },
          {
            title: 'Advances Recovered',
            amount: `Rs. ${fmt(totalDeductions)}`,
            badge: 'Deductions Map',
            sub: 'From outstanding advances',
            icon: <Banknote size={14} />,
            path: "M0,40 L0,20 C 30,35 50,15 70,25 C 85,30 95,10 100,10 L100,40 Z"
          },
          {
            title: 'Net Capital Allocation',
            amount: `Rs. ${fmt(totalNetPayout)}`,
            badge: 'Liquid Liquidity',
            sub: 'Actual cash flow required',
            icon: <CheckCircle2 size={14} />,
            path: "M0,40 L0,15 C 25,10 45,30 65,20 C 85,10 95,25 100,20 L100,40 Z"
          }
        ].map((card, i) => {
          const gradId = `grad-pay-${i}`;
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

      {/* ── PAYROLL TABLE ── */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1.5px solid #e8ede8', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '14px 18px', borderBottom: '1.5px solid #f0f4f0', display: 'flex', alignItems: 'center', justifycontent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-bold shadow-sm capitalize">
              {payFrequency} View: {startDate} - {endDate}
            </div>
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
              />
            </div>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '7px 13px', border: '1.5px solid #e5e7eb',
              borderRadius: '9px', fontSize: '12px', fontWeight: 600, color: '#374151',
              background: '#fff', cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
            }}>
              <SlidersHorizontal size={13} color="#9ca3af" /> Options
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1.5px solid #f0f4f0' }}>
                {['Employee', 'Wage / Day', 'Full Days', 'Half Days', 'Absent Days', 'Gross Pay', 'Advance', 'Net Pay', 'Actions'].map((h, i) => (
                  <th key={h} style={thStyle((i >= 1 && i <= 7) ? 'right' : 'left')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const empIdStr = String(emp.employeeId);
                const isItemFinalized = finalizedMap[empIdStr];
                const isItemSaving = individualSaving[empIdStr];

                return (
                  <tr key={empIdStr} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td style={tdStyle()}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                          {emp.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{emp.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{emp.role}</span>
                        </div>
                      </div>
                    </td>

                    <td style={{ ...tdStyle(), textAlign: 'right' }}>
                      Rs. {fmt(emp.wagePerDay)}
                    </td>

                    <td style={{ ...tdStyle(), textAlign: 'right' }}>
                      {emp.fullDays}
                    </td>

                    <td style={{ ...tdStyle(), textAlign: 'right' }}>
                      {emp.halfDays}
                    </td>

                    <td style={{ ...tdStyle(), textAlign: 'right' }}>
                      {emp.absentDays}
                    </td>

                    <td style={{ ...tdStyle(), textAlign: 'right' }}>
                      Rs. {fmt(emp.grossPay)}
                    </td>

                    <td style={{ ...tdStyle(), textAlign: 'right', color: emp.advanceDeducted > 0 ? '#b45309' : '#9ca3af' }}>
                      {emp.advanceDeducted > 0 ? `Rs. ${fmt(emp.advanceDeducted)}` : '—'}
                    </td>

                    <td style={{ ...tdStyle(), textAlign: 'right', fontWeight: 900, color: '#166534' }}>
                      Rs. {fmt(emp.netPay)}
                    </td>

                    <td style={tdStyle()}>
                      {isItemFinalized ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                          <CheckCircle2 size={12} /> Settled
                        </span>
                      ) : (
                        <button
                          onClick={() => handleFinalizeSingle(emp)}
                          disabled={isItemSaving}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                        >
                          {isItemSaving ? 'Processing...' : 'Finalize Pay'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1.5px solid #f0f4f0', display: 'flex', alignItems: 'center', justifycontent: 'space-between', background: '#fafafa' }}>
          <span style={{ fontSize: '12px', color: '#6b7a6b', fontWeight: 600 }}>
            Showing <strong style={{ color: '#0d1f0d' }}>{filtered.length}</strong> calculation blocks parsed
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button style={pageBtn(false)}><ChevronLeft size={13} /></button>
            <button style={pageBtn(true)}>1</button>
            <button style={pageBtn(false)}><ChevronRight size={13} /></button>
          </div>
        </div>
      </div>

      {/* ── HISTORICAL ARCHIVES ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-gray-900">Payroll History Log</h2>
              <p className="text-xs text-gray-500">Locked entries for {farm}</p>
            </div>
            <div className="text-xs font-bold text-gray-500">{historyRows.length} record(s)</div>
          </div>
          <div className="overflow-y-auto max-h-[300px]">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                  <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Period</th>
                  <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center">Staff</th>
                  <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-right">Net Distributed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 px-4 text-xs text-gray-400 text-center">No historical locks detected.</td>
                  </tr>
                ) : (
                  historyRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-4 text-xs font-bold text-gray-800">{row.period}</td>
                      <td className="py-2.5 px-4 text-xs text-gray-700 text-center">{row.employeeCount || '-'}</td>
                      <td className="py-2.5 px-4 text-xs font-black text-gray-900 text-right">Rs. {fmt(row.totalNet)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-gray-900">Manager Payroll Fixed Allocation</h2>
              <p className="text-xs text-gray-500">Monthly direct allocations</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={managerYear} onChange={e => setManagerYear(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-xs font-bold text-gray-700 outline-none">
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
              <button onClick={() => openManagerModal()} className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-xs font-black shadow-sm">
                <Plus size={12} /> Add Payout
              </button>
            </div>
          </div>

          {managerError && (
            <div className="mx-4 mt-2 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-bold">{managerError}</div>
          )}

          <div className="overflow-y-auto max-h-[300px]">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                  <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Manager</th>
                  <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Month</th>
                  <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {managerSalaries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 px-4 text-xs text-gray-400 text-center">No fixed manager items loaded.</td>
                  </tr>
                ) : (
                  managerSalaries.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 text-xs font-semibold text-gray-800">{row.employeeName || row.empId}</td>
                      <td className="py-2 px-4 text-xs text-gray-600">{monthLabel(row.month)} {row.year}</td>
                      <td className="py-2 px-4 text-xs font-bold text-gray-900 text-right">Rs. {fmt(row.amount)}</td>
                      <td className="py-2 px-4 text-xs text-center">
                        <button onClick={() => openManagerModal(row)} className="text-gray-400 hover:text-green-700 p-1 rounded transition-colors">
                          <Edit2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MANAGER SALARY ASSIGNMENT MODAL ── */}
      {isManagerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeManagerModal} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-gray-900">{managerEdit ? 'Edit Manager Salary' : 'Add Manager Salary'}</h3>
                <p className="text-xs text-gray-500">Record salary payments for managers</p>
              </div>
              <button onClick={closeManagerModal} className="p-2 rounded-lg text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Manager
                  <select value={managerRow.empId} onChange={e => setManagerRow(prev => ({ ...prev, empId: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 outline-none">
                    <option value="">Select manager</option>
                    {managerEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Amount
                  <input type="number" value={managerRow.amount} onChange={e => setManagerRow(prev => ({ ...prev, amount: Number(e.target.value) }))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 outline-none" />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Month
                  <select value={managerRow.month} onChange={e => setManagerRow(prev => ({ ...prev, month: Number(e.target.value) }))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 outline-none">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>{monthLabel(month)}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Year
                  <input type="number" value={managerRow.year} onChange={e => setManagerRow(prev => ({ ...prev, year: Number(e.target.value) }))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 outline-none" />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Cheque No
                  <input type="text" value={managerRow.chequeNo} onChange={e => setManagerRow(prev => ({ ...prev, chequeNo: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 outline-none" />
                </label>
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Cheque Date
                  <input type="date" value={managerRow.chequeDate} onChange={e => setManagerRow(prev => ({ ...prev, chequeDate: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 outline-none" />
                </label>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/60">
              <button onClick={closeManagerModal} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveManagerSalary} disabled={isManagerSaving} className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-black shadow-md disabled:opacity-60">
                {isManagerSaving ? 'Saving...' : (managerEdit ? 'Update Salary' : 'Add Salary')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = (align = 'left', width) => ({
  padding: '10px 18px',
  fontSize: '10.5px', fontWeight: 800,
  color: '#6b7a6b', textTransform: 'uppercase', letterSpacing: '0.7px',
  textAlign: align,
  ...(width ? { width } : {}),
});

const tdStyle = (width) => ({
  padding: '14px 18px',
  verticalAlign: 'middle',
  ...(width ? { width } : {}),
});

const pageBtn = (active) => ({
  width: '28px', height: '28px', borderRadius: '7px',
  border: active ? 'none' : '1.5px solid #e5e7eb',
  background: active ? 'linear-gradient(135deg, #16a34a, #15803d)' : '#fff',
  color: active ? '#fff' : '#6b7280',
  fontSize: '12px', fontWeight: 800, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifycontent: 'center',
  fontFamily: "'Nunito', sans-serif",
  boxShadow: active ? '0 2px 8px rgba(22,163,74,0.3)' : 'none',
});