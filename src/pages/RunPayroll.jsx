import { useEffect, useMemo, useState } from 'react';
import {
  Calculator, Download, Search, SlidersHorizontal,
  Wallet, Banknote, FileCheck, CheckCircle2, ChevronLeft, ChevronRight,
  Plus, Edit2, X
} from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import { createManagerSalary, finalizePayroll, getEmployees, getManagerSalaries, getPayrollHistory, getPayrollPreview, updateManagerSalary } from '../services/api';

const fmt = (n) => n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const toNumber = (value) => Number(value ?? 0) || 0;

const payrollPeriodLabel = (startDate, endDate) => `${startDate} to ${endDate}`;

const normalizePreviewRow = (row) => ({
  id: String(row.empId ?? row.employeeId ?? row.id ?? row.name ?? crypto.randomUUID()),
  name: row.name ?? '',
  role: row.role ?? '',
  type: row.type ?? 'Daily',
  wage: toNumber(row.wage),
  fullDays: toNumber(row.fullDays),
  halfDays: toNumber(row.halfDays),
  absentDays: toNumber(row.absentDays),
  daysWorked: row.daysWorked ?? (toNumber(row.fullDays) + (toNumber(row.halfDays) * 0.5)),
  gross: toNumber(row.gross),
  advanceDeduction: toNumber(row.advanceDeduction),
  status: row.status ?? 'Draft',
  netPay: row.netPay ?? Math.max(0, toNumber(row.gross) - toNumber(row.advanceDeduction)),
});

const normalizeHistoryRow = (row) => ({
  id: String(row.id ?? crypto.randomUUID()),
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

export default function RunPayroll() {
  const [payrollData, setPayrollData] = useState([]);
  const [historyRows, setHistoryRows] = useState([]);
  const [search, setSearch] = useState('');
  const [isFinalized, setIsFinalized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('2026-05-18');
  const [endDate, setEndDate] = useState('2026-05-24');
  const [farm, setFarm] = useState('MR1');
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

    const loadPayroll = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const preview = await getPayrollPreview({ startDate, endDate, farm });
        if (!active) return;
        setPayrollData(Array.isArray(preview) ? preview.map(normalizePreviewRow) : []);
      } catch {
        if (active) {
          setError('Failed to load payroll preview.');
          setPayrollData([]);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadPayroll();
    return () => { active = false; };
  }, [startDate, endDate, farm]);

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

  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      try {
        const rows = await getPayrollHistory({ year: startDate.slice(0, 4), farm });
        if (!active) return;
        setHistoryRows(Array.isArray(rows) ? rows.map(normalizeHistoryRow) : []);
      } catch {
        if (active) setHistoryRows([]);
      }
    };

    loadHistory();
    return () => { active = false; };
  }, [startDate, farm]);

  const filtered = useMemo(() => payrollData.filter(emp =>
    !search || emp.name.toLowerCase().includes(search.toLowerCase()) || emp.role.toLowerCase().includes(search.toLowerCase())
  ), [payrollData, search]);

  // --- KPI Math ---
  // Net Pay = Gross - Advances
  const totalGross = payrollData.reduce((sum, emp) => sum + emp.gross, 0);
  const totalDeductions = payrollData.reduce((sum, emp) => sum + emp.advanceDeduction, 0);
  const totalNetPayout = totalGross - totalDeductions;

  // --- Action Handler ---
  const handleFinalizePayroll = async () => {
    if (!payrollData.length) {
      toast.warn('No payroll data available to finalize.');
      return;
    }

    if (!confirm('Are you sure you want to finalize this payroll? This will permanently deduct the advances and mark the payroll as Paid.')) {
      return;
    }

    const payload = {
      period: payrollPeriodLabel(startDate, endDate),
      startDate,
      endDate,
      farm,
      employeePayouts: payrollData.map(emp => ({
        empId: Number(emp.id),
        grossPay: toNumber(emp.gross),
        advanceDeducted: toNumber(emp.advanceDeduction),
        netPay: toNumber(emp.netPay ?? emp.gross - emp.advanceDeduction),
      })),
    };

    setIsSaving(true);
    try {
      await finalizePayroll(payload);
      setIsFinalized(true);
      toast.success('Payroll finalized successfully.');
    } catch {
      toast.error('Failed to finalize payroll.');
    } finally {
      setIsSaving(false);
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
            Review calculated wages, verify deductions, and finalize payouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Start</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm font-semibold text-gray-800 bg-transparent outline-none" />
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">End</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm font-semibold text-gray-800 bg-transparent outline-none" />
          </div>
          <select value={farm} onChange={e => setFarm(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 shadow-sm">
            <option value="MR1">MR1</option>
            <option value="MR2">MR2</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 shadow-sm hover:text-green-700 transition-colors">
            <Download size={14} /> Export Payslips
          </button>
          {!isFinalized && (
            <button 
              onClick={handleFinalizePayroll}
              disabled={isSaving || isLoading}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FileCheck size={16} /> {isSaving ? 'Finalizing...' : 'Finalize & Pay'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 font-semibold shadow-sm">
          Loading payroll preview...
        </div>
      )}

      {/* ── PREMIUM KPI STAT CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          {
            title: 'Total Gross Wages',
            amount: `Rs. ${fmt(totalGross)}`,
            badge: 'Before Deductions',
            sub: 'Base calculation',
            icon: <Wallet size={14} />,
            path: "M0,40 L0,25 C 20,30 40,10 60,15 C 80,20 90,5 100,5 L100,40 Z"
          },
          {
            title: 'Advances Deducted',
            amount: `Rs. ${fmt(totalDeductions)}`,
            badge: 'Recovered',
            sub: 'From pending cash advances',
            icon: <Banknote size={14} />,
            path: "M0,40 L0,20 C 30,35 50,15 70,25 C 85,30 95,10 100,10 L100,40 Z"
          },
          {
            title: 'Net Cash Required',
            amount: `Rs. ${fmt(totalNetPayout)}`,
            badge: 'Final Payout',
            sub: 'Actual cash to distribute',
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
        <div style={{ padding: '14px 18px', borderBottom: '1.5px solid #f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          
          <div className="flex items-center gap-3">
             <div className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-bold shadow-sm">
                Period: May 18 - May 24, 2026
             </div>
             {isFinalized && (
                <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-bold flex items-center gap-1">
                   <CheckCircle2 size={14} /> Payroll Finalized
                </div>
             )}
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

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1.5px solid #f0f4f0' }}>
                {['Employee', 'Base Rate', 'Days Worked', 'Gross Earnings', 'Advances Deducted', 'Net Payable', 'Status'].map((h, i) => (
                  <th key={h} style={thStyle(i >= 3 && i <= 5 ? 'right' : 'left')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, idx) => {
                const netPay = emp.netPay ?? (emp.gross - emp.advanceDeduction);
                
                return (
                  <tr key={emp.id} style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: idx % 2 === 0 ? '#fff' : '#fafafa',
                    transition: 'background 0.15s',
                  }}
                    onMouseOver={e => { e.currentTarget.style.background = '#f8fff8'; }}
                    onMouseOut={e => { e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafafa'; }}
                  >
                    {/* Employee Identity */}
                    <td style={tdStyle()}>
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs border border-green-200">
                            {emp.name.substring(0, 2).toUpperCase()}
                         </div>
                         <div className="flex flex-col">
                            <span style={{ fontWeight: 800, color: '#0d1f0d', fontSize: '13px' }}>{emp.name}</span>
                            <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600 }}>{emp.role}</span>
                         </div>
                      </div>
                    </td>

                    {/* Base Rate */}
                    <td style={tdStyle()}>
                      <span style={{ color: '#475569', fontWeight: 600 }}>Rs. {fmt(emp.wage)}</span>
                      <span className="text-[10px] text-gray-400 ml-1">/{emp.type === 'Daily' ? 'Day' : 'Mo'}</span>
                    </td>

                    {/* Days Worked */}
                    <td style={tdStyle()}>
                      <span className={`inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-md text-xs font-bold ${emp.daysWorked === 'N/A' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                         {typeof emp.daysWorked === 'number' ? emp.daysWorked.toFixed(1).replace(/\.0$/, '') : emp.daysWorked}
                      </span>
                    </td>

                    {/* Gross Earnings */}
                    <td style={{ ...tdStyle(), textAlign: 'right' }}>
                       <span style={{ color: '#1f2937', fontWeight: 700 }}>Rs. {fmt(emp.gross)}</span>
                    </td>

                    {/* Advance Deductions */}
                    <td style={{ ...tdStyle(), textAlign: 'right' }}>
                      {emp.advanceDeduction > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-600 font-bold text-xs border border-red-100">
                           - Rs. {fmt(emp.advanceDeduction)}
                        </span>
                      ) : (
                        <span className="text-gray-300 font-medium text-xs">Rs. 0.00</span>
                      )}
                    </td>

                    {/* Net Payable */}
                    <td style={{ ...tdStyle(), textAlign: 'right' }}>
                       <span style={{ color: '#0d3320', fontWeight: 900, fontSize: '14px' }}>Rs. {fmt(netPay)}</span>
                    </td>

                      {/* Status */}
                    <td style={tdStyle()}>
                      {emp.status === 'Draft' ? (
                         <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">Review</span>
                      ) : (
                         <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">Paid</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1.5px solid #f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
          <span style={{ fontSize: '12px', color: '#6b7a6b', fontWeight: 600 }}>
            Showing <strong style={{ color: '#0d1f0d' }}>{filtered.length}</strong> employees processed
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button style={pageBtn(false)}><ChevronLeft size={13} /></button>
            <button style={pageBtn(true)}>1</button>
            <button style={pageBtn(false)}><ChevronRight size={13} /></button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-gray-900">Payroll History</h2>
            <p className="text-xs text-gray-500">Recent finalized payroll runs for {farm}</p>
          </div>
          <div className="text-xs font-bold text-gray-500">{historyRows.length} record(s)</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Period</th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Employees</th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Net</th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Finalized</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historyRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-sm text-gray-400 text-center">No payroll history found.</td>
                </tr>
              ) : (
                historyRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-semibold text-gray-800">{row.period}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{row.employeeCount || '-'}</td>
                    <td className="py-3 px-4 text-sm font-bold text-gray-900">Rs. {fmt(row.totalNet)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{row.finalizedAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-gray-900">Manager Salary</h2>
            <p className="text-xs text-gray-500">Add and update manager monthly salary records</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={managerYear} onChange={e => setManagerYear(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 shadow-sm">
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
            <button onClick={() => openManagerModal()} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all">
              <Plus size={16} /> Add Manager Salary
            </button>
          </div>
        </div>

        {managerError && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold">{managerError}</div>
        )}

        {managerLoading ? (
          <div className="px-4 py-6 text-sm text-gray-500 font-semibold">Loading manager salaries...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Manager</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Month</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Year</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Amount</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Cheque</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Cheque Date</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {managerSalaries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 px-4 text-sm text-gray-400 text-center">No manager salary records found.</td>
                  </tr>
                ) : (
                  managerSalaries.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-semibold text-gray-800">{row.employeeName || row.empId}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{monthLabel(row.month)}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{row.year}</td>
                      <td className="py-3 px-4 text-sm font-bold text-gray-900">Rs. {fmt(row.amount)}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{row.chequeNo || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{row.chequeDate || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        <button onClick={() => openManagerModal(row)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-green-300 hover:text-green-700 transition-colors text-xs font-bold">
                          <Edit2 size={14} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isManagerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeManagerModal} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-gray-900">{managerEdit ? 'Edit Manager Salary' : 'Add Manager Salary'}</h3>
                <p className="text-xs text-gray-500">Record salary payments for the manager</p>
              </div>
              <button onClick={closeManagerModal} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Manager
                  <select value={managerRow.empId} onChange={e => setManagerRow(prev => ({ ...prev, empId: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800">
                    <option value="">Select manager</option>
                    {managerEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Amount
                  <input type="number" value={managerRow.amount} onChange={e => setManagerRow(prev => ({ ...prev, amount: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800" />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Month
                  <select value={managerRow.month} onChange={e => setManagerRow(prev => ({ ...prev, month: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>{monthLabel(month)}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Year
                  <input type="number" value={managerRow.year} onChange={e => setManagerRow(prev => ({ ...prev, year: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800" />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Cheque No
                  <input type="text" value={managerRow.chequeNo} onChange={e => setManagerRow(prev => ({ ...prev, chequeNo: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800" />
                </label>
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Cheque Date
                  <input type="date" value={managerRow.chequeDate} onChange={e => setManagerRow(prev => ({ ...prev, chequeDate: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800" />
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

// ── Shared Inline Styles ──

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
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'Nunito', sans-serif",
  boxShadow: active ? '0 2px 8px rgba(22,163,74,0.3)' : 'none',
});