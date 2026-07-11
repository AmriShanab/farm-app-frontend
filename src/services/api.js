// src/services/api.js

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);

const AUTH_STORAGE_KEY = "mrfarm_auth";

const readStoredAuth = (storage) => {
  if (typeof window === "undefined" || !storage) {
    return null;
  }

  try {
    const raw = storage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getStoredAuth = () => {
  return (
    readStoredAuth(window.sessionStorage) || readStoredAuth(window.localStorage)
  );
};

export const saveStoredAuth = ({ username, password, remember = false }) => {
  if (typeof window === "undefined") {
    return;
  }

  const payload = JSON.stringify({ username, password });
  const targetStorage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;

  targetStorage.setItem(AUTH_STORAGE_KEY, payload);
  otherStorage.removeItem(AUTH_STORAGE_KEY);
};

export const clearStoredAuth = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getAuthCredentials = () => {
  const stored = getStoredAuth();
  const username = stored?.username || import.meta.env.VITE_API_USER || "admin";
  const password =
    stored?.password || import.meta.env.VITE_API_PASS || "admin123";

  return { username, password };
};

// Helper function to generate headers with Basic Auth
export const getHeaders = () => {
  const { username, password } = getAuthCredentials();
  const headers = new Headers();
  headers.set("Authorization", "Basic " + btoa(`${username}:${password}`));
  headers.set("Content-Type", "application/json");
  return headers;
};

export const loginWithCredentials = async ({
  username,
  password,
  remember = false,
}) => {
  const headers = new Headers();
  headers.set("Authorization", "Basic " + btoa(`${username}:${password}`));

  const response = await fetch(`${BASE_URL}/ping`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error("Invalid username or password");
  }

  saveStoredAuth({ username, password, remember });
  return true;
};

const unwrapApiData = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return payload;
};

const normalizeCashewSale = (record) => {
  if (!record || typeof record !== "object") {
    return record;
  }

  const normalized = { ...record };

  if ("labor_cost" in normalized && !("laborCost" in normalized)) {
    normalized.laborCost = normalized.labor_cost;
  }

  return normalized;
};

const normalizeGeneralExpenseRecord = (record) => {
  if (!record || typeof record !== "object") {
    return record;
  }

  const normalized = { ...record };

  if ("main_labor" in normalized && !("mainLabor" in normalized))
    normalized.mainLabor = normalized.main_labor;
  if ("food_expenses" in normalized && !("foodExpenses" in normalized))
    normalized.foodExpenses = normalized.food_expenses;
  if ("tractor_driver" in normalized && !("tractorDriver" in normalized))
    normalized.tractorDriver = normalized.tractor_driver;
  if ("bill_amount" in normalized && !("billAmount" in normalized))
    normalized.billAmount = normalized.bill_amount;
  if ("units_used" in normalized && !("unitsUsed" in normalized))
    normalized.unitsUsed = normalized.units_used;
  if ("rate_per_liter" in normalized && !("ratePerLiter" in normalized))
    normalized.ratePerLiter = normalized.rate_per_liter;
  if ("total_cost" in normalized && !("totalCost" in normalized))
    normalized.totalCost = normalized.total_cost;
  if ("cheque_no" in normalized && !("chequeNo" in normalized))
    normalized.chequeNo = normalized.cheque_no;
  if ("cheque_date" in normalized && !("chequeDate" in normalized))
    normalized.chequeDate = normalized.cheque_date;
  if ("permanent_labor_cost" in normalized && !("permanentLaborCost" in normalized))
    normalized.permanentLaborCost = normalized.permanent_labor_cost;
  if ("meter_id" in normalized && !("meterId" in normalized))
    normalized.meterId = normalized.meter_id;

  return normalized;
};

// --- COCONUT SALES ENDPOINTS ---

export const getCoconutSales = async (farm) => {
  try {
    const url =
      farm && farm !== "All"
        ? `${BASE_URL}/sales/coconuts?farm=${farm}`
        : `${BASE_URL}/sales/coconuts`;

    const response = await fetch(url, { method: "GET", headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch coconut sales");
    return unwrapApiData(await response.json()) || [];
  } catch (error) {
    console.error("API Error (getCoconutSales):", error);
    throw error;
  }
};

export const createCoconutSale = async (saleData) => {
  try {
    const response = await fetch(`${BASE_URL}/sales/coconuts`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(saleData),
    });
    if (!response.ok) throw new Error("Failed to create record");
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (createCoconutSale):", error);
    throw error;
  }
};

export const updateCoconutSale = async (id, saleData) => {
  try {
    const response = await fetch(`${BASE_URL}/sales/coconuts/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(saleData),
    });
    if (!response.ok) throw new Error("Failed to update record");
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (updateCoconutSale):", error);
    throw error;
  }
};

export const deleteCoconutSale = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/sales/coconuts/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete record");
    return true;
  } catch (error) {
    console.error("API Error (deleteCoconutSale):", error);
    throw error;
  }
};

// --- CASHEW SALES ENDPOINTS ---

export const getCashewSales = async (year) => {
  try {
    const url = year
      ? `${BASE_URL}/sales/cashews?year=${year}`
      : `${BASE_URL}/sales/cashews`;

    const response = await fetch(url, { method: "GET", headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch cashew sales");
    const data = unwrapApiData(await response.json()) || [];
    return Array.isArray(data) ? data.map(normalizeCashewSale) : data;
  } catch (error) {
    console.error("API Error (getCashewSales):", error);
    throw error;
  }
};

export const createCashewSale = async (saleData) => {
  try {
    const response = await fetch(`${BASE_URL}/sales/cashews`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(saleData),
    });
    if (!response.ok) throw new Error("Failed to create record");
    return normalizeCashewSale(unwrapApiData(await response.json()) || {});
  } catch (error) {
    console.error("API Error (createCashewSale):", error);
    throw error;
  }
};

export const updateCashewSale = async (id, saleData) => {
  try {
    const response = await fetch(`${BASE_URL}/sales/cashews/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(saleData),
    });
    if (!response.ok) throw new Error("Failed to update record");
    return normalizeCashewSale(unwrapApiData(await response.json()) || {});
  } catch (error) {
    console.error("API Error (updateCashewSale):", error);
    throw error;
  }
};

export const deleteCashewSale = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/sales/cashews/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete record");
    return true;
  } catch (error) {
    console.error("API Error (deleteCashewSale):", error);
    throw error;
  }
};

// --- OTHER INCOME ENDPOINTS ---

export const getOtherIncomes = async (farm) => {
  try {
    const url =
      farm && farm !== "All"
        ? `${BASE_URL}/sales/other?farm=${farm}`
        : `${BASE_URL}/sales/other`;

    const response = await fetch(url, { method: "GET", headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch other incomes");
    return unwrapApiData(await response.json()) || [];
  } catch (error) {
    console.error("API Error (getOtherIncomes):", error);
    throw error;
  }
};

export const createOtherIncome = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/sales/other`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create record");
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (createOtherIncome):", error);
    throw error;
  }
};

export const updateOtherIncome = async (id, data) => {
  try {
    const response = await fetch(`${BASE_URL}/sales/other/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update record");
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (updateOtherIncome):", error);
    throw error;
  }
};

export const deleteOtherIncome = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/sales/other/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete record");
    return true;
  } catch (error) {
    console.error("API Error (deleteOtherIncome):", error);
    throw error;
  }
};

// --- HR: EMPLOYEES ENDPOINTS ---

export const getEmployees = async (farm, status = "active") => {
  try {
    // If farm is "All", we omit the farm query param to get everyone
    let url = `${BASE_URL}/hr/employees?status=${status}`;
    if (farm && farm !== "All") {
      url += `&farm=${farm}`;
    }

    const response = await fetch(url, { method: "GET", headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch employees");
    return unwrapApiData(await response.json()) || [];
  } catch (error) {
    console.error("API Error (getEmployees):", error);
    throw error;
  }
};

export const createEmployee = async (employeeData) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/employees`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(employeeData),
    });
    if (!response.ok) throw new Error("Failed to create employee");
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (createEmployee):", error);
    throw error;
  }
};

export const updateEmployee = async (id, employeeData) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/employees/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(employeeData),
    });
    if (!response.ok) throw new Error("Failed to update employee");
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (updateEmployee):", error);
    throw error;
  }
};

export const deleteEmployee = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/employees/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete employee");
    return true;
  } catch (error) {
    console.error("API Error (deleteEmployee):", error);
    throw error;
  }
};

export const markHarvestAttendanceBulk = async ({ date, farm, saleId, records }) => {
  try {
    const body = {
      date,
      records: records.map((r) => ({
        empId: r.employeeId,
        status: r.status,
        locationWorked: farm,
        is_harvest_day: 1,
        linked_sale_id: saleId,
      })),
    };
    const response = await fetch(`${BASE_URL}/hr/attendance/bulk`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Failed to mark harvest attendance");
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (markHarvestAttendanceBulk):", error);
    throw error;
  }
};

// --- ATTENDANCE ENDPOINTS ---

export const getAttendance = async (date, farm) => {
  try {
    const q = `?date=${encodeURIComponent(date)}${farm ? `&farm=${encodeURIComponent(farm)}` : ""}`;
    const response = await fetch(`${BASE_URL}/hr/attendance${q}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch attendance");
    const data = unwrapApiData(await response.json()) || [];
    // Each employee may have 0, 1, or 2+ segments for the day (a day can be
    // split across more than one location, e.g. half at MR1 + half at MR2).
    return Array.isArray(data)
      ? data.map((r) => ({
          employeeId: r.employee_id ?? r.employeeId ?? null,
          name: r.name,
          farm: r.home_farm ?? r.farm,
          home_farm: r.home_farm ?? r.farm,
          wagePerDay: r.wage_per_day ?? r.wagePerDay ?? 0,
          segments: Array.isArray(r.segments)
            ? r.segments.map((s) => ({
                attendanceId: s.attendance_id ?? s.attendanceId ?? null,
                status: s.status,
                locationWorked: s.location_worked ?? s.locationWorked ?? null,
                taskType: s.task_type ?? s.taskType ?? null,
              }))
            : [],
        }))
      : [];
  } catch (error) {
    console.error("API Error (getAttendance):", error);
    throw error;
  }
};

export const saveAttendanceBulk = async (date, records) => {
  try {
    const body = { date, records };
    const response = await fetch(`${BASE_URL}/hr/attendance/bulk`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Failed to save attendance bulk");
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (saveAttendanceBulk):", error);
    throw error;
  }
};

export const getAttendanceHistory = async (employeeId, startDate, endDate) => {
  try {
    const q = `?employeeId=${encodeURIComponent(employeeId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    const response = await fetch(`${BASE_URL}/hr/attendance/history${q}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch attendance history");
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (getAttendanceHistory):", error);
    throw error;
  }
};

export const updateAttendance = async (attendanceId, data) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/attendance/${attendanceId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update attendance");
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (updateAttendance):", error);
    throw error;
  }
};

// --- ADVANCES (HR) ENDPOINTS ---

export const getAdvances = async (params = {}) => {
  try {
    const qs = [];
    if (params.status) qs.push(`status=${encodeURIComponent(params.status)}`);
    if (params.empId) qs.push(`empId=${encodeURIComponent(params.empId)}`);
    const q = qs.length ? `?${qs.join("&")}` : "";
    const response = await fetch(`${BASE_URL}/hr/advances${q}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch advances");
    const raw = unwrapApiData(await response.json()) || [];
    // Normalize backend fields to frontend-friendly shape
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => ({
      id: String(r.id ?? r.advance_id ?? r._id ?? ""),
      empId: String(r.employee_id ?? r.empId ?? r.employeeId ?? ""),
      name: r.employee_name ?? r.name ?? r.employeeName ?? "",
      role: r.role ?? r.job_role ?? "",
      date: r.date || r.created_at || "",
      amount:
        typeof r.amount === "string" ? parseFloat(r.amount) : (r.amount ?? 0),
      repaidAmount: Number(r.repaid_amount ?? r.repaidAmount ?? 0),
      status:
        (r.status || "").toString().toLowerCase() === "deducted"
          ? "Deducted"
          : (r.status || "").toString().toLowerCase() === "unpaid"
            ? "Unpaid"
            : r.status || "",
      chequeNo: r.cheque_no ?? r.chequeNo ?? null,
      chequeDate: r.cheque_date ?? r.chequeDate ?? null,
      notes: r.notes ?? "",
    }));
  } catch (error) {
    console.error("API Error (getAdvances):", error);
    throw error;
  }
};

export const createAdvance = async (payload) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/advances`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to create advance");
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (createAdvance):", error);
    throw error;
  }
};

export const updateAdvance = async (id, payload) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/advances/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to update advance");
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (updateAdvance):", error);
    throw error;
  }
};

// --- PAYROLL ENDPOINTS ---

export const getPayrollPreview = async ({ startDate, endDate, farm, payFrequency }) => {
  try {
    const qs = [];
    if (startDate) qs.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) qs.push(`endDate=${encodeURIComponent(endDate)}`);
    if (farm) qs.push(`farm=${encodeURIComponent(farm)}`);
    if (payFrequency) qs.push(`payFrequency=${encodeURIComponent(payFrequency)}`);
    const q = qs.length ? `?${qs.join("&")}` : "";

    const response = await fetch(`${BASE_URL}/hr/payroll/preview${q}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch payroll preview");

    const payload = unwrapApiData(await response.json()) || {};
    const payouts = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.payouts)
        ? payload.payouts
        : [];

    return payouts.map((row) => ({
      empId: String(
        row.empId ?? row.employee_id ?? row.employeeId ?? row.id ?? "",
      ),
      name: row.name ?? row.employee_name ?? row.employeeName ?? "",
      role: row.role ?? row.job_role ?? "",
      farm: row.farm ?? row.homeFarm ?? "",

      wagePerDay: Number(
        row.wagePerDay ?? row.wage ?? row.base_wage ?? row.wage_per_day ?? 0,
      ),

      fullDays: Number(row.fullDays ?? 0),
      halfDays: Number(row.halfDays ?? 0),
      absentDays: Number(row.absentDays ?? 0),

      grossPay: Number(row.gross ?? row.grossPay ?? 0),
      advanceDeducted: Number(row.advanceDeducted ?? 0),
      advanceOutstanding: Number(
        row.advanceOutstanding ?? row.advanceDeducted ?? 0,
      ),
      advanceDetails: Array.isArray(row.advanceDetails) ? row.advanceDetails : [],
      netPay: Number(row.netPay ?? row.net_pay ?? 0),

      harvestDays: Number(row.harvestDays ?? 0),
      harvestLaborCost: Number(row.harvestLaborCost ?? 0),
    }));
  } catch (error) {
    console.error("API Error (getPayrollPreview):", error);
    throw error;
  }
};

export const finalizePayroll = async (payload) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/payroll/finalize`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to finalize payroll");
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (finalizePayroll):", error);
    throw error;
  }
};

export const getPayrollRunDetails = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/payroll/history/${id}`, { method: "GET", headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch payroll run details");
    const payload = unwrapApiData(await response.json()) || {};
    const payouts = Array.isArray(payload.payouts) ? payload.payouts : [];

    return {
      run: payload.run || {},
      payouts: payouts.map((row) => ({
        empId: String(row.empId ?? row.employee_id ?? row.employeeId ?? row.id ?? ""),
        name: row.name ?? row.employee_name ?? row.employeeName ?? "",
        role: row.role ?? row.job_role ?? "",
        farm: row.employee_farm ?? row.farm ?? row.homeFarm ?? "",

        wagePerDay: Number(row.wage ?? row.base_wage ?? row.wage_per_day ?? row.wagePerDay ?? 0),

        fullDays: Number(row.fullDays ?? 0),
        halfDays: Number(row.halfDays ?? 0),
        absentDays: Number(row.absentDays ?? 0),

        grossPay: Number(row.gross ?? row.grossPay ?? 0),
        advanceDeducted: Number(row.advanceDeducted ?? 0),
        advanceDetails: Array.isArray(row.advanceDetails) ? row.advanceDetails : [],
        netPay: Number(row.netPay ?? row.net_pay ?? 0),
      }))
    };
  } catch (error) {
    console.error("API Error (getPayrollRunDetails):", error);
    throw error;
  }
};

export const getPayrollHistory = async ({ year, farm }) => {
  try {
    const qs = [];
    if (year) qs.push(`year=${encodeURIComponent(year)}`);
    if (farm) qs.push(`farm=${encodeURIComponent(farm)}`);
    const q = qs.length ? `?${qs.join("&")}` : "";

    const response = await fetch(`${BASE_URL}/hr/payroll/history${q}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch payroll history");

    const payload = unwrapApiData(await response.json()) || [];
    const historyRows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.data)
        ? payload.data
        : [];
    return historyRows.map((row) => {
      const startDate = row.start_date ?? row.startDate ?? ""; // ← was only checking startDate
      const endDate = row.end_date ?? row.endDate ?? ""; // ← was only checking endDate

      return {
        id: String(row.id ?? ""),
        period: startDate && endDate ? `${startDate} to ${endDate}` : "",
        farm: row.farm ?? "",
        employeeCount: Number(row.employee_count ?? row.employeeCount ?? 0), // ← was missing employee_count
        totalGross: Number(row.total_gross ?? row.totalGross ?? 0),
        totalDeductions: Number(
          row.total_deductions ?? row.totalDeductions ?? 0,
        ),
        totalNet: Number(
          row.total_net_paid ?? row.totalNet ?? row.total_net ?? 0,
        ), // ← was missing total_net_paid
        finalizedAt: row.finalized_at ?? row.finalizedAt ?? "", // ← was missing finalized_at
        startDate,
        endDate,
      };
    });
  } catch (error) {
    console.error("API Error (getPayrollHistory):", error);
    throw error;
  }
};

// NEW — add to api.js after getPayrollHistory
export const getFinalizedEmployees = async ({ farm, startDate, endDate }) => {
  try {
    const qs = [];
    if (farm) qs.push(`farm=${encodeURIComponent(farm)}`);
    if (startDate) qs.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) qs.push(`endDate=${encodeURIComponent(endDate)}`);
    const q = qs.length ? `?${qs.join("&")}` : "";

    const response = await fetch(`${BASE_URL}/hr/payroll/finalized${q}`, {
      method: "GET",
      headers: getHeaders(),
    });
    console.log("getFinalizedEmployees response status:", response);

    // If endpoint doesn't exist yet (404), return empty — fall back to sessionStorage
    if (response.status === 404) return [];
    if (!response.ok) throw new Error("Failed to fetch finalized employees");

    const json = await response.json();
    const payload = json?.data ?? unwrapApiData(json) ?? [];
    const rows = Array.isArray(payload) ? payload : [];

    // Expecting: [{ empId: 1 }, { empId: 3 }] or [{ emp_id: 1 }]
    return rows
      .map((row) =>
        String(
          row.empId ?? row.emp_id ?? row.employeeId ?? row.employee_id ?? "",
        ),
      )
      .filter(Boolean);
  } catch {
    return []; // Always degrade gracefully
  }
};

// --- MANAGER SALARY ENDPOINTS ---

export const getManagerSalaries = async (year) => {
  try {
    const q = year ? `?year=${encodeURIComponent(year)}` : "";
    const response = await fetch(`${BASE_URL}/hr/manager-salary${q}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch manager salaries");

    const payload = unwrapApiData(await response.json()) || [];
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.data)
        ? payload.data
        : [];

    return rows.map((row) => ({
      id: String(row.id ?? row.manager_salary_id ?? row.managerSalaryId ?? ""),
      empId: String(row.empId ?? row.employee_id ?? row.employeeId ?? ""),
      employeeName: row.employee_name ?? row.employeeName ?? row.name ?? "",
      month: Number(row.month ?? 0),
      year: Number(row.year ?? year ?? 0),
      amount: Number(row.amount ?? 0),
      chequeNo: row.chequeNo ?? row.cheque_no ?? "",
      chequeDate: row.chequeDate ?? row.cheque_date ?? null,
      createdAt: row.created_at ?? row.createdAt ?? "",
    }));
  } catch (error) {
    console.error("API Error (getManagerSalaries):", error);
    throw error;
  }
};

export const createManagerSalary = async (payload) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/manager-salary`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to create manager salary");
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (createManagerSalary):", error);
    throw error;
  }
};

export const updateManagerSalary = async (id, payload) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/manager-salary/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to update manager salary");
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (updateManagerSalary):", error);
    throw error;
  }
};

// --- POULTRY MANAGEMENT ENDPOINTS ---

// --- POULTRY: INVESTOR ENDPOINTS ---

export const getInvestors = async () => {
  const response = await fetch(`${BASE_URL}/poultry/investors`, {
    headers: getHeaders(),
  });
  return unwrapApiData(await response.json()) || [];
};

export const getInvestorById = async (id) => {
  const response = await fetch(`${BASE_URL}/poultry/investors/${id}`, {
    headers: getHeaders(),
  });
  return unwrapApiData(await response.json()) || {};
};

export const createInvestor = async (data) => {
  const response = await fetch(`${BASE_URL}/poultry/investors`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return unwrapApiData(await response.json()) || {};
};

// --- POULTRY: BATCH ENDPOINTS ---

export const getPoultryBatches = async (status = "active") => {
  const response = await fetch(`${BASE_URL}/poultry/batches?status=${status}`, {
    headers: getHeaders(),
  });
  return unwrapApiData(await response.json()) || [];
};

export const createPoultryBatch = async (data) => {
  const response = await fetch(`${BASE_URL}/poultry/batches`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create batch");
  return unwrapApiData(await response.json()) || {};
};

export const updatePoultryBatch = async (id, data) => {
  const response = await fetch(`${BASE_URL}/poultry/batches/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update batch");
  return unwrapApiData(await response.json()) || {};
};

// --- POULTRY: FEED ENDPOINTS ---

export const getPoultryFeed = async (batchId) => {
  const url = batchId
    ? `${BASE_URL}/poultry/feed?batchId=${batchId}`
    : `${BASE_URL}/poultry/feed`;
  const response = await fetch(url, { headers: getHeaders() });
  return unwrapApiData(await response.json()) || [];
};

export const createPoultryFeed = async (data) => {
  const response = await fetch(`${BASE_URL}/poultry/feed`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to record feed");
  return unwrapApiData(await response.json()) || {};
};

export const updatePoultryFeed = async (id, data) => {
  const response = await fetch(`${BASE_URL}/poultry/feed/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update feed");
  return unwrapApiData(await response.json()) || {};
};

export const deletePoultryFeed = async (id) => {
  const response = await fetch(`${BASE_URL}/poultry/feed/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete feed record");
  return true;
};

// --- POULTRY: SALES ENDPOINTS ---

export const getPoultrySales = async (batchId) => {
  const url = batchId
    ? `${BASE_URL}/poultry/sales?batchId=${batchId}`
    : `${BASE_URL}/poultry/sales`;
  const response = await fetch(url, { headers: getHeaders() });
  return unwrapApiData(await response.json()) || [];
};

export const createPoultrySale = async (data) => {
  const response = await fetch(`${BASE_URL}/poultry/sales`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to record sale");
  return unwrapApiData(await response.json()) || {};
};

export const updatePoultrySale = async (id, data) => {
  const response = await fetch(`${BASE_URL}/poultry/sales/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update sale");
  return unwrapApiData(await response.json()) || {};
};

export const deletePoultrySale = async (id) => {
  const response = await fetch(`${BASE_URL}/poultry/sales/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete sale record");
  return true;
};

// --- POULTRY: PROFIT DISTRIBUTION ENDPOINTS ---

export const getPoultryProfit = async (batchId, period) => {
  const response = await fetch(
    `${BASE_URL}/poultry/profit?batchId=${batchId}&period=${period}`,
    { headers: getHeaders() },
  );
  return unwrapApiData(await response.json());
};

export const distributePoultryProfit = async (data) => {
  const response = await fetch(`${BASE_URL}/poultry/profit/distribute`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to finalize profit distribution");
  return unwrapApiData(await response.json());
};

// --- OPERATIONS: FERTILIZER ENDPOINTS ---

export const getFertilizers = async (farm, year) => {
  let url = `${BASE_URL}/fertilizer?`;
  if (farm && farm !== "All") url += `farm=${farm}&`;
  if (year) url += `year=${year}`;

  const response = await fetch(url, { headers: getHeaders() });
  return unwrapApiData(await response.json()) || [];
};

export const getFertilizerDue = async () => {
  const response = await fetch(`${BASE_URL}/fertilizer/due`, {
    headers: getHeaders(),
  });
  return unwrapApiData(await response.json()) || [];
};

export const createFertilizer = async (data) => {
  const response = await fetch(`${BASE_URL}/fertilizer`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to record fertilizer application");
  return unwrapApiData(await response.json()) || {};
};

export const updateFertilizer = async (id, data) => {
  const response = await fetch(`${BASE_URL}/fertilizer/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update fertilizer application");
  return unwrapApiData(await response.json()) || {};
};

export const deleteFertilizer = async (id) => {
  const response = await fetch(`${BASE_URL}/fertilizer/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete fertilizer record");
  return true;
};

const USE_MOCK_DATA = false;

const mockOwnerData = [
  {
    id: 1,
    date: "2026-05-01",
    type: "leasing",
    description: "TAFE Tractor Monthly Lease",
    amount: "45000.00",
    accountNo: "ACC-7788",
    referenceNo: "LEASE-2026-05",
  },
  {
    id: 2,
    date: "2026-05-15",
    type: "loan_repayment",
    description: "BOC Agricultural Loan",
    amount: "120000.00",
    accountNo: "ACC-1122",
    referenceNo: "LN-8899",
  },
];

// const mockChequeData = [
//   {
//     id: 101,
//     date: "2026-05-24",
//     chequeNo: "CHQ-00400",
//     amount: "80000.00",
//     payee: "Sathosa Agri",
//     category: "Poultry Feed",
//     status: "Cleared",
//   },
//   {
//     id: 102,
//     date: "2026-05-28",
//     chequeNo: "CHQ-00301",
//     amount: "12500.00",
//     payee: "CEB",
//     category: "Utility Bill",
//     status: "Pending",
//   },
//   {
//     id: 103,
//     date: "2026-06-01",
//     chequeNo: "CHQ-00200",
//     amount: "8000.00",
//     payee: "SolarTech",
//     category: "Maintenance",
//     status: "Pending",
//   },
// ];

// --- FINANCE ENDPOINTS ---

export const getOwnerFinancials = async (year) => {
  if (USE_MOCK_DATA)
    return new Promise((res) => setTimeout(() => res(mockOwnerData), 400));
  const response = await fetch(`${BASE_URL}/finance/owner?year=${year}`, {
    headers: getHeaders(),
  });
  return unwrapApiData(await response.json()) || [];
};

export const createOwnerFinancial = async (data) => {
  if (USE_MOCK_DATA)
    return new Promise((res) =>
      setTimeout(() => res({ id: Date.now(), ...data }), 600),
    );
  const response = await fetch(`${BASE_URL}/finance/owner`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return unwrapApiData(await response.json());
};

export const deleteOwnerFinancial = async (id) => {
  if (USE_MOCK_DATA)
    return new Promise((res) => setTimeout(() => res(true), 400));
  const response = await fetch(`${BASE_URL}/finance/owner/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return response.ok;
};

export const searchCheques = async (chequeNo) => {
  const response = await fetch(
    `${BASE_URL}/finance/cheques?chequeNo=${chequeNo || ""}`,
    { headers: getHeaders() },
  );

  const result = unwrapApiData(await response.json()) || [];

  return result.map((item) => ({
    id: item.id,
    chequeNo: item.cheque_no,
    cheque_date: item.cheque_date,
    payee: item.description,
    category: item.source,
    amount: item.amount,
    status: item.status || "Pending",
  }));
};

// --- ASSET & WARRANTY ENDPOINTS ---

// (Assuming USE_MOCK_DATA is still defined at the top of your file)

const mockAssetData = [
  {
    id: 1,
    name: "TAFE 45DI Tractor",
    farm: "MR1",
    purchaseDate: "2025-06-15",
    warrantyMonths: 24,
    purchaseCost: 1850000.0,
    supplier: "TAFE Motors Lanka",
    notes: "Main field tractor",
  },
  {
    id: 2,
    name: "Honda Water Pump 3HP",
    farm: "MR2",
    purchaseDate: "2023-01-10",
    warrantyMonths: 12,
    purchaseCost: 85000.0,
    supplier: "Browns Hardware",
    notes: "Irrigation pump (MR2)",
  },
  {
    id: 3,
    name: "Solar Inverter 5kW",
    farm: "MR2",
    purchaseDate: "2026-02-01",
    warrantyMonths: 60,
    purchaseCost: 350000.0,
    supplier: "SolarTech PVT",
    notes: "Off-grid setup",
  },
];

export const getAssets = async (farm, status) => {
  if (USE_MOCK_DATA) {
    return new Promise((res) =>
      setTimeout(() => {
        let filtered = [...mockAssetData];
        if (farm && farm !== "All")
          filtered = filtered.filter((a) => a.farm === farm);
        // Mock basic status filtering
        if (status && status === "under-warranty") {
          filtered = filtered.filter((a) => {
            const expiry = new Date(a.purchaseDate);
            expiry.setMonth(expiry.getMonth() + parseInt(a.warrantyMonths));
            return expiry >= new Date();
          });
        }
        res(filtered);
      }, 400),
    );
  }

  let url = `${BASE_URL}/assets?`;
  if (farm && farm !== "All") url += `farm=${farm}&`;
  if (status && status !== "All") url += `status=${status}`;

  const response = await fetch(url, { headers: getHeaders() });
  return unwrapApiData(await response.json()) || [];
};

export const createAsset = async (data) => {
  if (USE_MOCK_DATA)
    return new Promise((res) =>
      setTimeout(() => res({ id: Date.now(), ...data }), 600),
    );

  const response = await fetch(`${BASE_URL}/assets`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create asset");
  return unwrapApiData(await response.json());
};

export const updateAsset = async (id, data) => {
  if (USE_MOCK_DATA)
    return new Promise((res) => setTimeout(() => res({ id, ...data }), 600));

  const response = await fetch(`${BASE_URL}/assets/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update asset");
  return unwrapApiData(await response.json());
};

export const deleteAsset = async (id) => {
  if (USE_MOCK_DATA)
    return new Promise((res) => setTimeout(() => res(true), 400));

  const response = await fetch(`${BASE_URL}/assets/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return response.ok;
};

// --- GENERAL EXPENSES ENDPOINTS ---

// (Assuming USE_MOCK_DATA, BASE_URL, getHeaders, unwrapApiData are defined above)

// 1. HARVEST EXPENSES
export const getHarvestExpenses = async (farm, year) => {
  if (USE_MOCK_DATA)
    return new Promise((res) => setTimeout(() => res([]), 300));
  const response = await fetch(
    `${BASE_URL}/expenses/harvest?farm=${farm}&year=${year}`,
    { headers: getHeaders() },
  );
  const payload = unwrapApiData(await response.json()) || [];
  return Array.isArray(payload)
    ? payload.map(normalizeGeneralExpenseRecord)
    : [];
};
export const createHarvestExpense = async (data) => {
  if (USE_MOCK_DATA)
    return new Promise((res) =>
      setTimeout(() => res({ id: Date.now(), ...data }), 500),
    );
  const response = await fetch(`${BASE_URL}/expenses/harvest`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create harvest expense");
  return normalizeGeneralExpenseRecord(unwrapApiData(await response.json()));
};
export const deleteHarvestExpense = async (id) => {
  if (USE_MOCK_DATA)
    return new Promise((res) => setTimeout(() => res(true), 300));
  const response = await fetch(`${BASE_URL}/expenses/harvest/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return response.ok;
};

// 2. MAINTENANCE EXPENSES
export const getMaintenanceExpenses = async (farm) => {
  if (USE_MOCK_DATA)
    return new Promise((res) => setTimeout(() => res([]), 300));
  const response = await fetch(
    `${BASE_URL}/expenses/maintenance?farm=${farm}`,
    { headers: getHeaders() },
  );
  const payload = unwrapApiData(await response.json()) || [];
  return Array.isArray(payload)
    ? payload.map(normalizeGeneralExpenseRecord)
    : [];
};
export const createMaintenanceExpense = async (data) => {
  if (USE_MOCK_DATA)
    return new Promise((res) =>
      setTimeout(() => res({ id: Date.now(), ...data }), 500),
    );
  const response = await fetch(`${BASE_URL}/expenses/maintenance`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create maintenance expense");
  return normalizeGeneralExpenseRecord(unwrapApiData(await response.json()));
};
export const deleteMaintenanceExpense = async (id) => {
  if (USE_MOCK_DATA)
    return new Promise((res) => setTimeout(() => res(true), 300));
  const response = await fetch(`${BASE_URL}/expenses/maintenance/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return response.ok;
};

// 3. CEB BILLS
export const getCEBBills = async (farm, year) => {
  if (USE_MOCK_DATA)
    return new Promise((res) => setTimeout(() => res([]), 300));
  const response = await fetch(
    `${BASE_URL}/expenses/ceb?farm=${farm}&year=${year}`,
    { headers: getHeaders() },
  );
  const payload = unwrapApiData(await response.json()) || [];
  return Array.isArray(payload)
    ? payload.map(normalizeGeneralExpenseRecord)
    : [];
};
export const createCEBBill = async (data) => {
  if (USE_MOCK_DATA)
    return new Promise((res) =>
      setTimeout(() => res({ id: Date.now(), ...data }), 500),
    );
  const response = await fetch(`${BASE_URL}/expenses/ceb`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create CEB bill");
  return normalizeGeneralExpenseRecord(unwrapApiData(await response.json()));
};
export const deleteCEBBill = async (id) => {
  if (USE_MOCK_DATA)
    return new Promise((res) => setTimeout(() => res(true), 300));
  const response = await fetch(`${BASE_URL}/expenses/ceb/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return response.ok;
};

// 4. FUEL LOGS
export const getFuelLogs = async (farm) => {
  if (USE_MOCK_DATA)
    return new Promise((res) => setTimeout(() => res([]), 300));
  const response = await fetch(`${BASE_URL}/expenses/fuel?farm=${farm}`, {
    headers: getHeaders(),
  });
  const payload = unwrapApiData(await response.json()) || [];
  return Array.isArray(payload)
    ? payload.map(normalizeGeneralExpenseRecord)
    : [];
};
export const createFuelLog = async (data) => {
  if (USE_MOCK_DATA)
    return new Promise((res) =>
      setTimeout(() => res({ id: Date.now(), ...data }), 500),
    );
  const response = await fetch(`${BASE_URL}/expenses/fuel`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create fuel log");
  return normalizeGeneralExpenseRecord(unwrapApiData(await response.json()));
};
export const deleteFuelLog = async (id) => {
  if (USE_MOCK_DATA)
    return new Promise((res) => setTimeout(() => res(true), 300));
  const response = await fetch(`${BASE_URL}/expenses/fuel/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return response.ok;
};

// 5. MACHINERY EXPENSES
export const getMachineryExpenses = async (year) => {
  if (USE_MOCK_DATA)
    return new Promise((res) => setTimeout(() => res([]), 300));
  const response = await fetch(`${BASE_URL}/expenses/machinery?year=${year}`, {
    headers: getHeaders(),
  });
  const payload = unwrapApiData(await response.json()) || [];
  return Array.isArray(payload)
    ? payload.map(normalizeGeneralExpenseRecord)
    : [];
};
export const createMachineryExpense = async (data) => {
  if (USE_MOCK_DATA)
    return new Promise((res) =>
      setTimeout(() => res({ id: Date.now(), ...data }), 500),
    );
  const response = await fetch(`${BASE_URL}/expenses/machinery`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create machinery expense");
  return normalizeGeneralExpenseRecord(unwrapApiData(await response.json()));
};
export const deleteMachineryExpense = async (id) => {
  if (USE_MOCK_DATA)
    return new Promise((res) => setTimeout(() => res(true), 300));
  const response = await fetch(`${BASE_URL}/expenses/machinery/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return response.ok;
};
