import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  Download,
  Search,
  SlidersHorizontal,
  Wallet,
  Banknote,
  FileCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  X,
  CalendarDays,
} from "lucide-react";
import { useToast } from "../components/ToastProvider";
import {
  createManagerSalary,
  finalizePayroll,
  getEmployees,
  getFinalizedEmployees,
  getManagerSalaries,
  getPayrollHistory,
  getPayrollPreview,
  getPayrollRunDetails,
  updateManagerSalary,
} from "../services/api";
import { downloadCsv } from "../utils/csv";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const toNumber = (value) => Number(value ?? 0) || 0;

const normalizeManagerSalaryRow = (row) => ({
  id: String(row.id ?? crypto.randomUUID()),
  empId: String(row.empId ?? ""),
  employeeName: row.employeeName ?? "",
  month: toNumber(row.month),
  year: toNumber(row.year),
  amount: toNumber(row.amount),
  chequeNo: row.chequeNo ?? "",
  chequeDate: row.chequeDate ?? "",
  createdAt: row.createdAt ?? "",
});

const monthLabel = (month) =>
  new Date(2000, month - 1, 1).toLocaleString("en-US", { month: "long" });

const managerSalaryToForm = (row, fallbackYear) => ({
  empId: row?.empId ?? "",
  month: row?.month ?? Number(new Date().getMonth() + 1),
  year: row?.year ?? Number(fallbackYear),
  amount: row?.amount ?? "",
  chequeNo: row?.chequeNo ?? "",
  chequeDate: row?.chequeDate ?? "",
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
    startDate: friday.toISOString().split("T")[0],
    endDate: thursday.toISOString().split("T")[0],
  };
};

export default function RunPayroll() {
  const salaryWeek = getSalaryWeek();
  const [payrollData, setPayrollData] = useState([]);
  const [historyRows, setHistoryRows] = useState([]);
  const [search, setSearch] = useState("");

  const [finalizedMap, setFinalizedMap] = useState({});
  const [individualSaving, setIndividualSaving] = useState({});

  const [breakdownEmp, setBreakdownEmp] = useState(null);
  const [historicalRun, setHistoricalRun] = useState(null);
  const [finalizeEmp, setFinalizeEmp] = useState(null);
  const [deductAmount, setDeductAmount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(salaryWeek.startDate);
  const [endDate, setEndDate] = useState(salaryWeek.endDate);
  const [payFrequency, setPayFrequency] = useState("weekly");

  const [managerYear, setManagerYear] = useState("2026");
  const [managerSalaries, setManagerSalaries] = useState([]);
  const [managerEmployees, setManagerEmployees] = useState([]);
  const [managerError, setManagerError] = useState(null);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [managerEdit, setManagerEdit] = useState(null);
  const [managerRow, setManagerRow] = useState(
    managerSalaryToForm(null, "2026"),
  );
  const [isManagerSaving, setIsManagerSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [preview, history, finalizedEmpIds] = await Promise.all([
          getPayrollPreview({ startDate, endDate, payFrequency }),
          getPayrollHistory({ year: startDate.slice(0, 4) }),
          getFinalizedEmployees({ startDate, endDate }),
        ]);

        if (!active) return;

        const normalizedRows = (Array.isArray(preview) ? preview : []).map(
          (emp) => ({
            ...emp,
            employeeId: parseInt(emp.employeeId ?? emp.empId ?? emp.id, 10),
          }),
        );

        setPayrollData(normalizedRows);
        const storageKey = `finalized:${startDate}:${endDate}`;

        if (finalizedEmpIds.length > 0) {
          const map = Object.fromEntries(
            finalizedEmpIds.map((id) => [id, true]),
          );
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
      } catch {
        if (active) {
          setError("Failed to sync payroll data.");
          setPayrollData([]);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [startDate, endDate, payFrequency]);
  useEffect(() => {
    let active = true;
    const loadEmployees = async () => {
      try {
        const employees = await getEmployees("All");
        if (!active) return;
        const managers = (Array.isArray(employees) ? employees : [])
          .filter((emp) => (emp.role || "").toLowerCase().includes("manager"))
          .map((emp) => ({
            id: String(emp.id ?? emp.employeeId ?? emp.empId ?? ""),
            name: emp.name ?? emp.employee_name ?? emp.employeeName ?? "",
            role: emp.role ?? "",
          }));
        setManagerEmployees(managers);
      } catch {
        if (active) setManagerEmployees([]);
      }
    };

    loadEmployees();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadManagerSalaries = async () => {
      setManagerError(null);
      try {
        const rows = await getManagerSalaries(managerYear);
        if (!active) return;
        setManagerSalaries(
          Array.isArray(rows) ? rows.map(normalizeManagerSalaryRow) : [],
        );
      } catch {
        if (active) {
          setManagerError("Failed to load manager salaries.");
          setManagerSalaries([]);
        }
      }
    };

    loadManagerSalaries();
    return () => {
      active = false;
    };
  }, [managerYear]);

  const filtered = useMemo(() => {
    return payrollData.filter(
      (emp) =>
        !search ||
        emp.name?.toLowerCase().includes(search.toLowerCase()) ||
        emp.role?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [payrollData, search]);

  const totalGross = payrollData.reduce((sum, emp) => sum + emp.grossPay, 0);
  const totalDeductions = payrollData.reduce(
    (sum, emp) => sum + emp.advanceDeducted,
    0,
  );
  const totalNetPayout = payrollData.reduce((sum, emp) => sum + emp.netPay, 0);

  const handleFinalizeSingle = (emp) => {
    const rawEmpId = emp.employeeId || emp.empId || emp.id;

    if (!rawEmpId || isNaN(parseInt(rawEmpId, 10))) {
      toast.error(`Could not resolve a valid Employee ID for ${emp.name}`);
      return;
    }

    // Default recovery: full outstanding, capped at gross (backend default)
    setDeductAmount(Number(emp.advanceDeducted || 0));
    setFinalizeEmp(emp);
  };

  const confirmFinalize = async () => {
    const emp = finalizeEmp;
    if (!emp) return;

    const rawEmpId = emp.employeeId || emp.empId || emp.id;
    const empIdStr = String(rawEmpId);
    const gross = Number(emp.grossPay || 0);
    const maxDeduct = Math.min(Number(emp.advanceOutstanding || 0), gross);
    const deduct = Number(deductAmount) || 0;

    if (deduct < 0 || deduct > maxDeduct + 0.01) {
      toast.warn(
        `Advance recovery must be between Rs. 0 and Rs. ${fmt(maxDeduct)}.`,
      );
      return;
    }

    const payload = {
      farm: emp.farm,
      startDate,
      endDate,
      empId: parseInt(rawEmpId, 10),
      grossPay: gross,
      advanceDeducted: deduct,
      netPay: Math.max(0, gross - deduct),
    };

    setFinalizeEmp(null);
    setIndividualSaving((prev) => ({ ...prev, [empIdStr]: true }));
    try {
      await finalizePayroll(payload);

      setFinalizedMap((prev) => {
        const next = { ...prev, [empIdStr]: true };
        const storageKey = `finalized:${startDate}:${endDate}`;
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });

      // Reflect the chosen recovery in the on-screen row until next refresh
      setPayrollData((prev) =>
        prev.map((row) =>
          String(row.employeeId) === empIdStr
            ? {
                ...row,
                advanceDeducted: deduct,
                netPay: Math.max(0, gross - deduct),
              }
            : row,
        ),
      );

      toast.success(`Payroll successfully secured for ${emp.name}.`);
    } catch {
      toast.error(`System error finalizing record for ${emp.name}.`);
    } finally {
      setIndividualSaving((prev) => ({ ...prev, [empIdStr]: false }));
    }
  };

  const handleViewHistoricalRun = async (runRow) => {
    try {
      const details = await getPayrollRunDetails(runRow.id);
      setHistoricalRun({ ...runRow, payouts: details.payouts });
    } catch {
      toast.error("Failed to load historical breakdown.");
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
    if (
      !managerRow.empId ||
      !managerRow.month ||
      !managerRow.year ||
      !managerRow.amount
    ) {
      toast.warn("Please select a manager, month, year and amount.");
      return;
    }

    const payload = {
      empId: Number(managerRow.empId),
      month: Number(managerRow.month),
      year: Number(managerRow.year),
      amount: Number(managerRow.amount),
      chequeNo: managerRow.chequeNo || "",
      chequeDate: managerRow.chequeDate || null,
    };

    setIsManagerSaving(true);
    try {
      const saved = managerEdit
        ? await updateManagerSalary(managerEdit.id, payload)
        : await createManagerSalary(payload);

      const selectedManager = managerEmployees.find(
        (emp) => String(emp.id) === String(payload.empId),
      );
      const record = normalizeManagerSalaryRow({
        ...(saved || {}),
        id: saved?.id ?? managerEdit?.id ?? String(Date.now()),
        empId: saved?.empId ?? payload.empId,
        employeeName: saved?.employeeName ?? selectedManager?.name ?? "",
        month: saved?.month ?? payload.month,
        year: saved?.year ?? payload.year,
        amount: saved?.amount ?? payload.amount,
        chequeNo: saved?.chequeNo ?? payload.chequeNo,
        chequeDate: saved?.chequeDate ?? payload.chequeDate,
      });

      setManagerSalaries((prev) =>
        managerEdit
          ? prev.map((item) => (item.id === record.id ? record : item))
          : [record, ...prev],
      );
      toast.success(
        managerEdit ? "Manager salary updated." : "Manager salary added.",
      );
      closeManagerModal();
    } catch {
      toast.error("Failed to save manager salary.");
      setIsManagerSaving(false);
    }
  };

  const handleExportCsv = () => {
    downloadCsv(
      `payroll-all-${startDate}-to-${endDate}.csv`,
      [
        { label: "Employee", value: (row) => row.name },
        {
          label: "Wage / Day",
          value: (row) => row.wagePerDay?.toFixed(2) || "0.00",
        },
        { label: "Full Days", value: (row) => row.fullDays },
        { label: "Half Days", value: (row) => row.halfDays },
        { label: "Absent Days", value: (row) => row.absentDays },
        { label: "Gross Pay", value: (row) => row.grossPay.toFixed(2) },
        { label: "Basic", value: (row) => (row.basicPay || 0).toFixed(2) },
        { label: "Allowance", value: (row) => (row.allowancePay || 0).toFixed(2) },
        { label: "Advance", value: (row) => row.advanceDeducted.toFixed(2) },
        { label: "Net Pay", value: (row) => row.netPay.toFixed(2) },
      ],
      filtered,
    );
  };

  return (
    <div
      style={{
        fontFamily: "'Nunito', sans-serif",
        maxWidth: "1400px",
        margin: "0 auto",
        paddingBottom: "40px",
      }}
    >
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-green-800 to-green-900 rounded-lg flex items-center justify-center shadow-sm">
              <Calculator size={16} color="#86efac" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              Run Payroll
            </h1>
          </div>
          <p className="text-xs font-medium text-gray-500 pl-11">
            Review live dry-run computations, modify distribution groups, and
            lock records individually.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <CalendarDays size={14} className="text-gray-400" />
            <select
              value={payFrequency}
              onChange={(e) => setPayFrequency(e.target.value)}
              className="text-sm font-bold text-gray-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="weekly">Weekly Schedule</option>
              <option value="monthly">Monthly Schedule</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Start
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm font-semibold text-gray-800 bg-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              End
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm font-semibold text-gray-800 bg-transparent outline-none"
            />
          </div>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 shadow-sm hover:text-green-700 transition-colors"
          >
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
            title: "Total Gross Wages",
            amount: `Rs. ${fmt(totalGross)}`,
            badge: "Unsettled Gross",
            sub: "Base calculation",
            icon: <Wallet size={14} />,
            path: "M0,40 L0,25 C 20,30 40,10 60,15 C 80,20 90,5 100,5 L100,40 Z",
          },
          {
            title: "Advances Recovered",
            amount: `Rs. ${fmt(totalDeductions)}`,
            badge: "Deductions Map",
            sub: "From outstanding advances",
            icon: <Banknote size={14} />,
            path: "M0,40 L0,20 C 30,35 50,15 70,25 C 85,30 95,10 100,10 L100,40 Z",
          },
          {
            title: "Net Capital Allocation",
            amount: `Rs. ${fmt(totalNetPayout)}`,
            badge: "Liquid Liquidity",
            sub: "Actual cash flow required",
            icon: <CheckCircle2 size={14} />,
            path: "M0,40 L0,15 C 25,10 45,30 65,20 C 85,10 95,25 100,20 L100,40 Z",
          },
        ].map((card, i) => {
          const gradId = `grad-pay-${i}`;
          const chartColor = "#A5D6A7";

          return (
            <div
              key={i}
              className="relative overflow-hidden rounded-[1.25rem] p-4 bg-gradient-to-br from-[#166534] to-[#14532d] text-white shadow-lg shadow-green-900/20 group border border-green-800/50 transition-all hover:shadow-green-900/40 hover:-translate-y-1"
            >
              <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[45px] opacity-20 bg-white transition-opacity duration-500 group-hover:opacity-40"></div>
              <div className="flex justify-between items-center relative z-10 mb-1">
                <span className="text-sm font-medium text-white/80">
                  {card.title}
                </span>
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
                <svg
                  viewBox="0 0 100 40"
                  preserveAspectRatio="none"
                  className="w-full h-full"
                >
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={chartColor}
                        stopOpacity="0.4"
                      />
                      <stop
                        offset="100%"
                        stopColor={chartColor}
                        stopOpacity="0.0"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d={card.path}
                    fill={`url(#${gradId})`}
                    stroke={chartColor}
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── PAYROLL TABLE ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1.5px solid #e8ede8",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1.5px solid #f0f4f0",
            display: "flex",
            alignItems: "center",
            justifycontent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-bold shadow-sm capitalize">
              {payFrequency} View: {startDate} - {endDate}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search
                size={13}
                style={{
                  position: "absolute",
                  left: "11px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                }}
              />
              <input
                type="text"
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  paddingLeft: "32px",
                  paddingRight: "12px",
                  paddingTop: "7px",
                  paddingBottom: "7px",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: "9px",
                  fontSize: "12px",
                  color: "#374151",
                  outline: "none",
                  fontFamily: "'Nunito', sans-serif",
                  width: "200px",
                  background: "#fafafa",
                }}
              />
            </div>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "7px 13px",
                border: "1.5px solid #e5e7eb",
                borderRadius: "9px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#374151",
                background: "#fff",
                cursor: "pointer",
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              <SlidersHorizontal size={13} color="#9ca3af" /> Options
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              whiteSpace: "nowrap",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#fafafa",
                  borderBottom: "1.5px solid #f0f4f0",
                }}
              >
                {[
                  "Employee",
                  "Wage / Day",
                  "Full Days",
                  "Half Days",
                  "Absent Days",
                  "Gross Pay",
                  "Advance",
                  "Net Pay",
                  "Actions",
                ].map((h, i) => (
                  <th
                    key={h}
                    style={thStyle(i >= 1 && i <= 7 ? "right" : "left")}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const empIdStr = String(emp.employeeId);
                const isItemFinalized = finalizedMap[empIdStr];
                const isItemSaving = individualSaving[empIdStr];

                return (
                  <tr
                    key={empIdStr}
                    className="border-b border-gray-50 hover:bg-gray-50/50"
                  >
                    <td style={tdStyle()}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs flex-shrink-0">
                          {emp.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-gray-900">
                            {emp.name}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                            {emp.role}
                          </span>
                          {emp.harvestDays > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 w-max">
                              🌿 {emp.harvestDays} harvest day
                              {emp.harvestDays !== 1 ? "s" : ""} · Rs.{" "}
                              {fmt(emp.harvestLaborCost)} → Harvest Exp.
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ ...tdStyle(), textAlign: "right" }}>
                      Rs. {fmt(emp.wagePerDay)}
                    </td>

                    <td style={{ ...tdStyle(), textAlign: "right" }}>
                      {emp.fullDays}
                    </td>

                    <td style={{ ...tdStyle(), textAlign: "right" }}>
                      {emp.halfDays}
                    </td>

                    <td style={{ ...tdStyle(), textAlign: "right" }}>
                      {emp.absentDays}
                    </td>

                    <td style={{ ...tdStyle(), textAlign: "right" }}>
                      <div className="font-bold text-gray-900">
                        Rs. {fmt(emp.grossPay)}
                      </div>
                      {emp.grossPay > 0 && (
                        <div className="text-[10px] font-semibold text-gray-400 mt-0.5">
                          B: {fmt(emp.basicPay)} · A: {fmt(emp.allowancePay)}
                        </div>
                      )}
                    </td>

                    <td
                      style={{
                        ...tdStyle(),
                        textAlign: "right",
                        color: emp.advanceDeducted > 0 ? "#b45309" : "#9ca3af",
                      }}
                    >
                      {emp.advanceDeducted > 0
                        ? `Rs. ${fmt(emp.advanceDeducted)}`
                        : "—"}
                    </td>

                    <td
                      style={{
                        ...tdStyle(),
                        textAlign: "right",
                        fontWeight: 900,
                        color: "#166534",
                      }}
                    >
                      Rs. {fmt(emp.netPay)}
                    </td>

                    <td style={tdStyle()}>
                      {isItemFinalized ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                            <CheckCircle2 size={12} /> Settled
                          </span>
                          <button
                            onClick={() => setBreakdownEmp(emp)}
                            className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm flex items-center gap-1"
                          >
                            <FileCheck size={12} /> Slip
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleFinalizeSingle(emp)}
                            disabled={isItemSaving}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                          >
                            {isItemSaving ? "Processing..." : "Finalize Pay"}
                          </button>
                          <button
                            onClick={() => setBreakdownEmp(emp)}
                            className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm flex items-center gap-1"
                          >
                            <FileCheck size={12} /> Slip
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid #e5e7eb', background: 'rgba(249,250,251,0.8)' }}>
                  <td style={{ ...tdStyle(), fontWeight: 900, color: '#374151', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Totals</td>
                  <td style={{ ...tdStyle(), textAlign: 'right' }}></td>
                  <td style={{ ...tdStyle(), textAlign: 'right', fontWeight: 900, color: '#374151' }}>{filtered.reduce((s, e) => s + (e.fullDays || 0), 0)}</td>
                  <td style={{ ...tdStyle(), textAlign: 'right', fontWeight: 900, color: '#374151' }}>{filtered.reduce((s, e) => s + (e.halfDays || 0), 0)}</td>
                  <td style={{ ...tdStyle(), textAlign: 'right' }}></td>
                  <td style={{ ...tdStyle(), textAlign: 'right', fontWeight: 900, color: '#374151' }}>Rs. {fmt(filtered.reduce((s, e) => s + (e.grossPay || 0), 0))}</td>
                  <td style={{ ...tdStyle(), textAlign: 'right', fontWeight: 900, color: '#b45309' }}>Rs. {fmt(filtered.reduce((s, e) => s + (e.advanceDeducted || 0), 0))}</td>
                  <td style={{ ...tdStyle(), textAlign: 'right', fontWeight: 900, color: '#166534' }}>Rs. {fmt(filtered.reduce((s, e) => s + (e.netPay || 0), 0))}</td>
                  <td style={tdStyle()}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1.5px solid #f0f4f0",
            display: "flex",
            alignItems: "center",
            justifycontent: "space-between",
            background: "#fafafa",
          }}
        >
          <span style={{ fontSize: "12px", color: "#6b7a6b", fontWeight: 600 }}>
            Showing{" "}
            <strong style={{ color: "#0d1f0d" }}>{filtered.length}</strong>{" "}
            calculation blocks parsed
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button style={pageBtn(false)}>
              <ChevronLeft size={13} />
            </button>
            <button style={pageBtn(true)}>1</button>
            <button style={pageBtn(false)}>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── HISTORICAL ARCHIVES ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-gray-900">
                Payroll History Log
              </h2>
              <p className="text-xs text-gray-500">
                Locked entries across all farms
              </p>
            </div>
            <div className="text-xs font-bold text-gray-500">
              {historyRows.length} record(s)
            </div>
          </div>
          <div className="overflow-y-auto max-h-[300px]">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                  <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Period
                  </th>
                  <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center">
                    Staff
                  </th>
                  <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-right">
                    Gross
                  </th>
                  <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-right">
                    Advance
                  </th>
                  <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-right">
                    Cash Paid
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 px-4 text-xs text-gray-400 text-center"
                    >
                      No historical locks detected.
                    </td>
                  </tr>
                ) : (
                  historyRows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => handleViewHistoricalRun(row)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="py-2.5 px-4 text-xs font-bold text-gray-800">
                        {row.period}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-gray-700 text-center">
                        {row.employeeCount || "-"}
                      </td>
                      <td className="py-2.5 px-4 text-xs font-bold text-gray-700 text-right">
                        Rs. {fmt(row.totalGross)}
                      </td>
                      <td className="py-2.5 px-4 text-xs font-bold text-orange-700 text-right">
                        {row.totalDeductions > 0
                          ? `Rs. ${fmt(row.totalDeductions)}`
                          : "—"}
                      </td>
                      <td className="py-2.5 px-4 text-xs font-black text-gray-900 text-right">
                        Rs. {fmt(row.totalNet)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {historyRows.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                    <td className="py-2.5 px-4 text-[10px] font-black text-gray-700 uppercase tracking-wider">Totals</td>
                    <td className="py-2.5 px-4"></td>
                    <td className="py-2.5 px-4 text-right text-xs font-black text-gray-900">Rs. {fmt(historyRows.reduce((s, r) => s + (parseFloat(r.totalGross) || 0), 0))}</td>
                    <td className="py-2.5 px-4 text-right text-xs font-black text-orange-700">Rs. {fmt(historyRows.reduce((s, r) => s + (parseFloat(r.totalDeductions) || 0), 0))}</td>
                    <td className="py-2.5 px-4 text-right text-xs font-black text-gray-900">Rs. {fmt(historyRows.reduce((s, r) => s + (parseFloat(r.totalNet) || 0), 0))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-gray-900">
                Manager Payroll Fixed Allocation
              </h2>
              <p className="text-xs text-gray-500">
                Monthly direct allocations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={managerYear}
                onChange={(e) => setManagerYear(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-xs font-bold text-gray-700 outline-none"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
              <button
                onClick={() => openManagerModal()}
                className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-xs font-black shadow-sm"
              >
                <Plus size={12} /> Add Payout
              </button>
            </div>
          </div>

          {managerError && (
            <div className="mx-4 mt-2 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-bold">
              {managerError}
            </div>
          )}

          <div className="overflow-y-auto max-h-[300px]">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                  <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Manager
                  </th>
                  <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Month
                  </th>
                  <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-right">
                    Amount
                  </th>
                  <th className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {managerSalaries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 px-4 text-xs text-gray-400 text-center"
                    >
                      No fixed manager items loaded.
                    </td>
                  </tr>
                ) : (
                  managerSalaries.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 text-xs font-semibold text-gray-800">
                        {row.employeeName || row.empId}
                      </td>
                      <td className="py-2 px-4 text-xs text-gray-600">
                        {monthLabel(row.month)} {row.year}
                      </td>
                      <td className="py-2 px-4 text-xs font-bold text-gray-900 text-right">
                        Rs. {fmt(row.amount)}
                      </td>
                      <td className="py-2 px-4 text-xs text-center">
                        <button
                          onClick={() => openManagerModal(row)}
                          className="text-gray-400 hover:text-green-700 p-1 rounded transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {managerSalaries.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                    <td className="py-2.5 px-4 text-[10px] font-black text-gray-700 uppercase tracking-wider" colSpan={2}>Totals</td>
                    <td className="py-2.5 px-4 text-right text-xs font-black text-gray-900">Rs. {fmt(managerSalaries.reduce((s, r) => s + (r.amount || 0), 0))}</td>
                    <td className="py-2.5 px-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* ── MANAGER SALARY ASSIGNMENT MODAL ── */}
      {isManagerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeManagerModal}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  {managerEdit ? "Edit Manager Salary" : "Add Manager Salary"}
                </h3>
                <p className="text-xs text-gray-500">
                  Record salary payments for managers
                </p>
              </div>
              <button
                onClick={closeManagerModal}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Manager
                  <select
                    value={managerRow.empId}
                    onChange={(e) =>
                      setManagerRow((prev) => ({
                        ...prev,
                        empId: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 outline-none"
                  >
                    <option value="">Select manager</option>
                    {managerEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Amount
                  <input
                    type="number"
                    value={managerRow.amount}
                    onChange={(e) =>
                      setManagerRow((prev) => ({
                        ...prev,
                        amount: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 outline-none"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Month
                  <select
                    value={managerRow.month}
                    onChange={(e) =>
                      setManagerRow((prev) => ({
                        ...prev,
                        month: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(
                      (month) => (
                        <option key={month} value={month}>
                          {monthLabel(month)}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Year
                  <input
                    type="number"
                    value={managerRow.year}
                    onChange={(e) =>
                      setManagerRow((prev) => ({
                        ...prev,
                        year: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 outline-none"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Cheque No
                  <input
                    type="text"
                    value={managerRow.chequeNo}
                    onChange={(e) =>
                      setManagerRow((prev) => ({
                        ...prev,
                        chequeNo: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 outline-none"
                  />
                </label>
                <label className="grid gap-1 text-xs font-bold text-gray-600">
                  Cheque Date
                  <input
                    type="date"
                    value={managerRow.chequeDate}
                    onChange={(e) =>
                      setManagerRow((prev) => ({
                        ...prev,
                        chequeDate: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 outline-none"
                  />
                </label>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/60">
              <button
                onClick={closeManagerModal}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveManagerSalary}
                disabled={isManagerSaving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-black shadow-md disabled:opacity-60"
              >
                {isManagerSaving
                  ? "Saving..."
                  : managerEdit
                    ? "Update Salary"
                    : "Add Salary"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FINALIZE PAY MODAL ── */}
      {finalizeEmp &&
        (() => {
          const gross = Number(finalizeEmp.grossPay || 0);
          const outstanding = Number(finalizeEmp.advanceOutstanding || 0);
          const maxDeduct = Math.min(outstanding, gross);
          const deduct = Number(deductAmount) || 0;
          const netCash = Math.max(0, gross - deduct);
          const carryForward = Math.max(0, outstanding - deduct);

          return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setFinalizeEmp(null)}
              />
              <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-5 border-b border-green-200 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 mb-1">
                      Finalize Pay — {finalizeEmp.name}
                    </h3>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {startDate} → {endDate}
                    </p>
                  </div>
                  <button
                    onClick={() => setFinalizeEmp(null)}
                    className="p-1.5 rounded-full text-gray-400 hover:bg-white hover:text-gray-700 transition-all shadow-sm"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="p-5 grid gap-4 text-sm bg-white">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                        Gross Pay
                      </span>
                      <span className="font-bold text-gray-800">
                        Rs. {fmt(gross)}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                        Advances Outstanding
                      </span>
                      <span className="font-bold text-orange-700">
                        Rs. {fmt(outstanding)}
                      </span>
                    </div>
                  </div>

                  {/* Basic + Allowance split that will be recorded on the payslip */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                        Basic (EPF)
                      </span>
                      <span className="font-bold text-gray-800">
                        Rs. {fmt(finalizeEmp.basicPay)}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                        Allowance
                      </span>
                      <span className="font-bold text-blue-700">
                        Rs. {fmt(finalizeEmp.allowancePay)}
                      </span>
                    </div>
                  </div>

                  {finalizeEmp.advanceDetails?.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-black text-gray-600 uppercase tracking-wider">
                        Open Advances
                      </div>
                      <ul className="divide-y divide-gray-50 max-h-32 overflow-y-auto">
                        {finalizeEmp.advanceDetails.map((adv) => (
                          <li
                            key={adv.id}
                            className="p-2.5 px-4 flex justify-between items-center text-xs"
                          >
                            <span className="font-bold text-gray-600 text-[11px] bg-gray-100 px-2.5 py-1 rounded-md">
                              {adv.date}
                            </span>
                            <span className="font-bold text-gray-800">
                              Rs. {fmt(adv.amount)}
                              {Number(adv.repaidAmount) > 0 && (
                                <span className="text-[10px] text-gray-400 font-semibold ml-1.5">
                                  (of {fmt(adv.originalAmount)})
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <label className="grid gap-1.5">
                    <span className="text-xs font-black text-gray-600 uppercase tracking-wider">
                      Advance to Recover Now (Rs.)
                    </span>
                    <input
                      type="number"
                      min="0"
                      max={maxDeduct}
                      step="0.01"
                      value={deductAmount}
                      onChange={(e) => setDeductAmount(e.target.value)}
                      className="w-full bg-white border-2 border-amber-200 focus:border-amber-400 rounded-xl px-3 py-2.5 text-base font-black text-gray-900 outline-none"
                    />
                    <span className="text-[11px] font-semibold text-gray-400">
                      Max recoverable this run: Rs. {fmt(maxDeduct)}
                      {carryForward > 0 &&
                        ` · Rs. ${fmt(carryForward)} will carry to the next run`}
                    </span>
                  </label>

                  <div className="bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
                    <span className="text-xs font-black text-green-900 uppercase tracking-wider">
                      Cash to Pay
                    </span>
                    <span className="text-2xl font-black text-green-700 drop-shadow-sm">
                      Rs. {fmt(netCash)}
                    </span>
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/60">
                  <button
                    onClick={() => setFinalizeEmp(null)}
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmFinalize}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-black shadow-md"
                  >
                    Lock &amp; Pay Rs. {fmt(netCash)}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ── PAYROLL BREAKDOWN MODAL ── */}
      {breakdownEmp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setBreakdownEmp(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-5 border-b border-green-200 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-1">
                  {breakdownEmp.name}
                </h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {breakdownEmp.role} &middot;{" "}
                  {breakdownEmp.farm || breakdownEmp.homeFarm}
                </p>
              </div>
              <button
                onClick={() => setBreakdownEmp(null)}
                className="p-1.5 rounded-full text-gray-400 hover:bg-white hover:text-gray-700 transition-all shadow-sm"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 grid gap-4 text-sm bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                    Wage / Day
                  </span>
                  <span className="font-bold text-gray-800">
                    Rs. {fmt(breakdownEmp.wagePerDay)}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                    Total Gross
                  </span>
                  <span className="font-bold text-green-700">
                    Rs. {fmt(breakdownEmp.grossPay)}
                  </span>
                </div>
              </div>

              {/* Salary composition for EPF/ETF: Basic + Allowance = Gross */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-black text-gray-600 uppercase tracking-wider">
                  Salary Composition (EPF)
                </div>
                <div className="p-4 grid grid-cols-2 divide-x divide-gray-100 text-center">
                  <div>
                    <span className="block text-lg font-black text-gray-900">
                      Rs. {fmt(breakdownEmp.basicPay)}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      Basic Salary
                    </span>
                  </div>
                  <div>
                    <span className="block text-lg font-black text-blue-700">
                      Rs. {fmt(breakdownEmp.allowancePay)}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      Allowance
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-black text-gray-600 uppercase tracking-wider">
                  Attendance
                </div>
                <div className="p-4 grid grid-cols-3 divide-x divide-gray-100 text-center">
                  <div>
                    <span className="block text-2xl font-black text-gray-800">
                      {breakdownEmp.fullDays}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Full Days
                    </span>
                  </div>
                  <div>
                    <span className="block text-2xl font-black text-gray-800">
                      {breakdownEmp.halfDays}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Half Days
                    </span>
                  </div>
                  <div>
                    <span className="block text-2xl font-black text-gray-800">
                      {breakdownEmp.absentDays}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Absent
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-black text-gray-600 uppercase tracking-wider flex justify-between">
                  <span>Advance Deductions</span>
                  <span className="text-orange-700">
                    −Rs. {fmt(breakdownEmp.advanceDeducted)}
                  </span>
                </div>
                {!breakdownEmp.advanceDetails ||
                breakdownEmp.advanceDetails.length === 0 ? (
                  <div className="p-4 text-xs font-medium text-gray-400 italic text-center">
                    No advances deducted for this period.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-50 max-h-40 overflow-y-auto">
                    {breakdownEmp.advanceDetails.map((adv) => (
                      <li
                        key={adv.id}
                        className="p-3 flex justify-between items-center text-xs"
                      >
                        <span className="font-bold text-gray-600 text-[11px] bg-gray-100 px-2.5 py-1 rounded-md">
                          {adv.date}
                        </span>
                        <span className="font-bold text-red-600">
                          Rs. {fmt(adv.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200 rounded-xl p-4 flex justify-between items-center mt-2 shadow-sm">
                <span className="text-xs font-black text-green-900 uppercase tracking-wider">
                  Final Net Pay
                </span>
                <span className="text-2xl font-black text-green-700 drop-shadow-sm">
                  Rs. {fmt(breakdownEmp.netPay)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORICAL RUN DETAILS MODAL ── */}
      {historicalRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setHistoricalRun(null)}
          />
          <div className="relative z-10 w-full max-w-5xl rounded-[1.5rem] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-blue-600" /> Locked
                  Payroll Run History
                </h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
                  {historicalRun.period} &middot; Farm: {historicalRun.farm}{" "}
                  &middot; {historicalRun.payouts?.length || 0} Staff Paid
                </p>
              </div>
              <button
                onClick={() => setHistoricalRun(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white border border-gray-200 transition-colors shadow-sm bg-gray-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-white">
              <table className="w-full text-left whitespace-nowrap bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4 text-right">Wage/Day</th>
                    <th className="py-3 px-4 text-right">Days W</th>
                    <th className="py-3 px-4 text-right">Gross</th>
                    <th className="py-3 px-4 text-right">Advances</th>
                    <th className="py-3 px-4 text-right">Net Paid</th>
                    <th className="py-3 px-4 text-center">Breakdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historicalRun.payouts?.map((emp) => (
                    <tr
                      key={emp.empId}
                      className="hover:bg-green-50/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-gray-900 text-xs flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[10px] uppercase">
                          {emp.name.substring(0, 2)}
                        </div>
                        {emp.name}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs font-medium text-gray-600">
                        Rs. {fmt(emp.wagePerDay)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs font-bold text-gray-700">
                        {(emp.fullDays || 0) + (emp.halfDays || 0) / 2}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-gray-900 font-bold">
                        Rs. {fmt(emp.grossPay)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-orange-700 font-bold">
                        {emp.advanceDeducted > 0
                          ? `Rs. ${fmt(emp.advanceDeducted)}`
                          : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs font-black text-green-700 text-[13px]">
                        Rs. {fmt(emp.netPay)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setBreakdownEmp(emp)}
                          className="px-3 py-1.5 text-[10px] font-bold text-blue-700 bg-white border border-blue-200 rounded-lg shadow-sm hover:bg-blue-50 transition-colors uppercase tracking-wider flex items-center justify-center gap-1 mx-auto"
                        >
                          <FileCheck size={12} /> View Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!historicalRun.payouts ||
                    historicalRun.payouts.length === 0) && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-xs font-bold text-gray-400"
                      >
                        No staff found for this specific run.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = (align = "left", width) => ({
  padding: "10px 18px",
  fontSize: "10.5px",
  fontWeight: 800,
  color: "#6b7a6b",
  textTransform: "uppercase",
  letterSpacing: "0.7px",
  textAlign: align,
  ...(width ? { width } : {}),
});

const tdStyle = (width) => ({
  padding: "14px 18px",
  verticalAlign: "middle",
  ...(width ? { width } : {}),
});

const pageBtn = (active) => ({
  width: "28px",
  height: "28px",
  borderRadius: "7px",
  border: active ? "none" : "1.5px solid #e5e7eb",
  background: active ? "linear-gradient(135deg, #16a34a, #15803d)" : "#fff",
  color: active ? "#fff" : "#6b7280",
  fontSize: "12px",
  fontWeight: 800,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifycontent: "center",
  fontFamily: "'Nunito', sans-serif",
  boxShadow: active ? "0 2px 8px rgba(22,163,74,0.3)" : "none",
});
