// src/services/api.js

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

// Helper function to generate headers with Basic Auth
const getHeaders = () => {
  const headers = new Headers();
  headers.set('Authorization', 'Basic ' + btoa('admin:admin123'));
  headers.set('Content-Type', 'application/json');
  return headers;
};

const unwrapApiData = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
};

const normalizeCashewSale = (record) => {
  if (!record || typeof record !== 'object') {
    return record;
  }

  const normalized = { ...record };

  if ('labor_cost' in normalized && !('laborCost' in normalized)) {
    normalized.laborCost = normalized.labor_cost;
  }

  return normalized;
};

// --- COCONUT SALES ENDPOINTS ---

export const getCoconutSales = async (farm) => {
  try {
    const url = farm && farm !== 'All' 
      ? `${BASE_URL}/sales/coconuts?farm=${farm}`
      : `${BASE_URL}/sales/coconuts`;
      
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch coconut sales');
    return unwrapApiData(await response.json()) || [];
  } catch (error) {
    console.error("API Error (getCoconutSales):", error);
    throw error;
  }
};

export const createCoconutSale = async (saleData) => {
  try {
    const response = await fetch(`${BASE_URL}/sales/coconuts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(saleData)
    });
    if (!response.ok) throw new Error('Failed to create record');
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (createCoconutSale):", error);
    throw error;
  }
};

export const updateCoconutSale = async (id, saleData) => {
  try {
    const response = await fetch(`${BASE_URL}/sales/coconuts/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(saleData)
    });
    if (!response.ok) throw new Error('Failed to update record');
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (updateCoconutSale):", error);
    throw error;
  }
};

export const deleteCoconutSale = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/sales/coconuts/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete record');
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
      
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch cashew sales');
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
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(saleData)
    });
    if (!response.ok) throw new Error('Failed to create record');
    return normalizeCashewSale(unwrapApiData(await response.json()) || {});
  } catch (error) {
    console.error("API Error (createCashewSale):", error);
    throw error;
  }
};

export const updateCashewSale = async (id, saleData) => {
  try {
    const response = await fetch(`${BASE_URL}/sales/cashews/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(saleData)
    });
    if (!response.ok) throw new Error('Failed to update record');
    return normalizeCashewSale(unwrapApiData(await response.json()) || {});
  } catch (error) {
    console.error("API Error (updateCashewSale):", error);
    throw error;
  }
};

export const deleteCashewSale = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/sales/cashews/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete record');
    return true;
  } catch (error) {
    console.error("API Error (deleteCashewSale):", error);
    throw error;
  }
};


// --- OTHER INCOME ENDPOINTS ---

export const getOtherIncomes = async (farm) => {
  try {
    const url = farm && farm !== 'All' 
      ? `${BASE_URL}/sales/other?farm=${farm}`
      : `${BASE_URL}/sales/other`;
      
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch other incomes');
    return unwrapApiData(await response.json()) || [];
  } catch (error) {
    console.error("API Error (getOtherIncomes):", error);
    throw error;
  }
};

export const createOtherIncome = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/sales/other`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create record');
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (createOtherIncome):", error);
    throw error;
  }
};

export const updateOtherIncome = async (id, data) => {
  try {
    const response = await fetch(`${BASE_URL}/sales/other/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update record');
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (updateOtherIncome):", error);
    throw error;
  }
};

export const deleteOtherIncome = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/sales/other/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete record');
    return true;
  } catch (error) {
    console.error("API Error (deleteOtherIncome):", error);
    throw error;
  }
};


// --- HR: EMPLOYEES ENDPOINTS ---

export const getEmployees = async (farm, status = 'active') => {
  try {
    // If farm is "All", we omit the farm query param to get everyone
    let url = `${BASE_URL}/hr/employees?status=${status}`;
    if (farm && farm !== 'All') {
      url += `&farm=${farm}`;
    }
      
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch employees');
    return unwrapApiData(await response.json()) || [];
  } catch (error) {
    console.error("API Error (getEmployees):", error);
    throw error;
  }
};

export const createEmployee = async (employeeData) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/employees`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(employeeData)
    });
    if (!response.ok) throw new Error('Failed to create employee');
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (createEmployee):", error);
    throw error;
  }
};

export const updateEmployee = async (id, employeeData) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/employees/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(employeeData)
    });
    if (!response.ok) throw new Error('Failed to update employee');
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error("API Error (updateEmployee):", error);
    throw error;
  }
};

export const deleteEmployee = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/employees/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete employee');
    return true;
  } catch (error) {
    console.error("API Error (deleteEmployee):", error);
    throw error;
  }
};

// --- ATTENDANCE ENDPOINTS ---

export const getAttendance = async (date, farm) => {
  try {
    const q = `?date=${encodeURIComponent(date)}${farm ? `&farm=${encodeURIComponent(farm)}` : ''}`;
    const response = await fetch(`${BASE_URL}/hr/attendance${q}`, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch attendance');
    const data = unwrapApiData(await response.json()) || [];
    return Array.isArray(data) ? data.map(r => ({
      employeeId: r.employee_id ?? r.employeeId ?? null,
      name: r.name,
      farm: r.farm,
      wagePerDay: r.wage_per_day ?? r.wagePerDay ?? 0,
      status: r.status,
      attendanceId: r.attendance_id ?? r.attendanceId ?? null,
    })) : [];
  } catch (error) {
    console.error('API Error (getAttendance):', error);
    throw error;
  }
};

export const saveAttendanceBulk = async (date, records) => {
  try {
    const body = { date, records };
    const response = await fetch(`${BASE_URL}/hr/attendance/bulk`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('Failed to save attendance bulk');
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error('API Error (saveAttendanceBulk):', error);
    throw error;
  }
};

export const updateAttendance = async (attendanceId, data) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/attendance/${attendanceId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update attendance');
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error('API Error (updateAttendance):', error);
    throw error;
  }
};

// --- ADVANCES (HR) ENDPOINTS ---

export const getAdvances = async (params = {}) => {
  try {
    const qs = [];
    if (params.status) qs.push(`status=${encodeURIComponent(params.status)}`);
    if (params.empId) qs.push(`empId=${encodeURIComponent(params.empId)}`);
    const q = qs.length ? `?${qs.join('&')}` : '';
    const response = await fetch(`${BASE_URL}/hr/advances${q}`, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch advances');
    const raw = unwrapApiData(await response.json()) || [];
    // Normalize backend fields to frontend-friendly shape
    if (!Array.isArray(raw)) return [];
    return raw.map(r => ({
      id: String(r.id ?? r.advance_id ?? r._id ?? ''),
      empId: String(r.employee_id ?? r.empId ?? r.employeeId ?? ''),
      name: r.employee_name ?? r.name ?? r.employeeName ?? '',
      role: r.role ?? r.job_role ?? '',
      date: r.date || r.created_at || '',
      amount: typeof r.amount === 'string' ? parseFloat(r.amount) : (r.amount ?? 0),
      status: (r.status || '').toString().toLowerCase() === 'deducted' ? 'Deducted' : ((r.status || '').toString().toLowerCase() === 'unpaid' ? 'Unpaid' : (r.status || '')),
      chequeNo: r.cheque_no ?? r.chequeNo ?? null,
      chequeDate: r.cheque_date ?? r.chequeDate ?? null,
      notes: r.notes ?? ''
    }));
  } catch (error) {
    console.error('API Error (getAdvances):', error);
    throw error;
  }
};

export const createAdvance = async (payload) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/advances`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create advance');
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error('API Error (createAdvance):', error);
    throw error;
  }
};

export const updateAdvance = async (id, payload) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/advances/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update advance');
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error('API Error (updateAdvance):', error);
    throw error;
  }
};

// --- PAYROLL ENDPOINTS ---

export const getPayrollPreview = async ({ startDate, endDate, farm }) => {
  try {
    const qs = [];
    if (startDate) qs.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) qs.push(`endDate=${encodeURIComponent(endDate)}`);
    if (farm) qs.push(`farm=${encodeURIComponent(farm)}`);
    const q = qs.length ? `?${qs.join('&')}` : '';

    const response = await fetch(`${BASE_URL}/hr/payroll/preview${q}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch payroll preview');

    const payload = unwrapApiData(await response.json()) || {};
    const payouts = Array.isArray(payload) ? payload : (Array.isArray(payload.payouts) ? payload.payouts : []);

    return payouts.map((row) => ({
      empId: String(row.empId ?? row.employee_id ?? row.employeeId ?? row.id ?? ''),
      name: row.name ?? row.employee_name ?? row.employeeName ?? '',
      role: row.role ?? row.job_role ?? '',
      type: row.type ?? row.pay_type ?? row.payType ?? 'Daily',
      wage: Number(row.wage ?? row.base_wage ?? row.baseWage ?? row.wage_per_day ?? row.wagePerDay ?? 0),
      daysWorked: row.daysWorked ?? row.days_worked ?? row.days_worked_total ?? 0,
      gross: Number(row.gross ?? row.grossPay ?? row.gross_pay ?? 0),
      advanceDeduction: Number(row.advanceDeducted ?? row.advance_deducted ?? row.advanceDeduction ?? 0),
      netPay: Number(row.netPay ?? row.net_pay ?? row.net ?? 0),
      status: row.status ?? 'Draft',
    }));
  } catch (error) {
    console.error('API Error (getPayrollPreview):', error);
    throw error;
  }
};

export const finalizePayroll = async (payload) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/payroll/finalize`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to finalize payroll');
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error('API Error (finalizePayroll):', error);
    throw error;
  }
};

export const getPayrollHistory = async ({ year, farm }) => {
  try {
    const qs = [];
    if (year) qs.push(`year=${encodeURIComponent(year)}`);
    if (farm) qs.push(`farm=${encodeURIComponent(farm)}`);
    const q = qs.length ? `?${qs.join('&')}` : '';

    const response = await fetch(`${BASE_URL}/hr/payroll/history${q}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch payroll history');

    const payload = unwrapApiData(await response.json()) || [];
    const historyRows = Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : []);

    return historyRows.map((row) => {
      const startDate = row.startDate ?? row.start_date ?? '';
      const endDate = row.endDate ?? row.end_date ?? '';
      const totalNet = Number(row.totalNet ?? row.total_net ?? row.total_net_paid ?? row.net ?? 0);

      return {
        id: String(row.id ?? row.payroll_id ?? row.payrollId ?? ''),
        period: row.period ?? row.pay_period ?? row.payPeriod ?? (startDate && endDate ? `${startDate} to ${endDate}` : ''),
        farm: row.farm ?? '',
        employeeCount: Number(row.employeeCount ?? row.employee_count ?? 0),
        totalGross: Number(row.totalGross ?? row.total_gross ?? row.gross ?? 0),
        totalDeductions: Number(row.totalDeductions ?? row.total_deductions ?? row.deductions ?? 0),
        totalNet,
        finalizedAt: row.finalizedAt ?? row.finalized_at ?? row.created_at ?? '',
        startDate,
        endDate,
      };
    });
  } catch (error) {
    console.error('API Error (getPayrollHistory):', error);
    throw error;
  }
};

// --- MANAGER SALARY ENDPOINTS ---

export const getManagerSalaries = async (year) => {
  try {
    const q = year ? `?year=${encodeURIComponent(year)}` : '';
    const response = await fetch(`${BASE_URL}/hr/manager-salary${q}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch manager salaries');

    const payload = unwrapApiData(await response.json()) || [];
    const rows = Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : []);

    return rows.map((row) => ({
      id: String(row.id ?? row.manager_salary_id ?? row.managerSalaryId ?? ''),
      empId: String(row.empId ?? row.employee_id ?? row.employeeId ?? ''),
      employeeName: row.employee_name ?? row.employeeName ?? row.name ?? '',
      month: Number(row.month ?? 0),
      year: Number(row.year ?? year ?? 0),
      amount: Number(row.amount ?? 0),
      chequeNo: row.chequeNo ?? row.cheque_no ?? '',
      chequeDate: row.chequeDate ?? row.cheque_date ?? null,
      createdAt: row.created_at ?? row.createdAt ?? '',
    }));
  } catch (error) {
    console.error('API Error (getManagerSalaries):', error);
    throw error;
  }
};

export const createManagerSalary = async (payload) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/manager-salary`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create manager salary');
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error('API Error (createManagerSalary):', error);
    throw error;
  }
};

export const updateManagerSalary = async (id, payload) => {
  try {
    const response = await fetch(`${BASE_URL}/hr/manager-salary/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update manager salary');
    return unwrapApiData(await response.json()) || {};
  } catch (error) {
    console.error('API Error (updateManagerSalary):', error);
    throw error;
  }
};

// --- POULTRY MANAGEMENT ENDPOINTS ---

// --- POULTRY: INVESTOR ENDPOINTS ---

export const getInvestors = async () => {
  const response = await fetch(`${BASE_URL}/poultry/investors`, { headers: getHeaders() });
  return unwrapApiData(await response.json()) || [];
};

export const getInvestorById = async (id) => {
  const response = await fetch(`${BASE_URL}/poultry/investors/${id}`, { headers: getHeaders() });
  return unwrapApiData(await response.json()) || {};
};

export const createInvestor = async (data) => {
  const response = await fetch(`${BASE_URL}/poultry/investors`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return unwrapApiData(await response.json()) || {};
};

// --- POULTRY: BATCH ENDPOINTS ---

export const getPoultryBatches = async (status = 'active') => {
  const response = await fetch(`${BASE_URL}/poultry/batches?status=${status}`, { headers: getHeaders() });
  return unwrapApiData(await response.json()) || [];
};

export const createPoultryBatch = async (data) => {
  const response = await fetch(`${BASE_URL}/poultry/batches`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create batch');
  return unwrapApiData(await response.json()) || {};
};

export const updatePoultryBatch = async (id, data) => {
  const response = await fetch(`${BASE_URL}/poultry/batches/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update batch');
  return unwrapApiData(await response.json()) || {};
};


// --- POULTRY: FEED ENDPOINTS ---

export const getPoultryFeed = async (batchId) => {
  const url = batchId ? `${BASE_URL}/poultry/feed?batchId=${batchId}` : `${BASE_URL}/poultry/feed`;
  const response = await fetch(url, { headers: getHeaders() });
  return unwrapApiData(await response.json()) || [];
};

export const createPoultryFeed = async (data) => {
  const response = await fetch(`${BASE_URL}/poultry/feed`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to record feed');
  return unwrapApiData(await response.json()) || {};
};

export const updatePoultryFeed = async (id, data) => {
  const response = await fetch(`${BASE_URL}/poultry/feed/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update feed');
  return unwrapApiData(await response.json()) || {};
};

export const deletePoultryFeed = async (id) => {
  const response = await fetch(`${BASE_URL}/poultry/feed/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete feed record');
  return true;
};

// --- POULTRY: SALES ENDPOINTS ---

export const getPoultrySales = async (batchId) => {
  const url = batchId ? `${BASE_URL}/poultry/sales?batchId=${batchId}` : `${BASE_URL}/poultry/sales`;
  const response = await fetch(url, { headers: getHeaders() });
  return unwrapApiData(await response.json()) || [];
};

export const createPoultrySale = async (data) => {
  const response = await fetch(`${BASE_URL}/poultry/sales`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to record sale');
  return unwrapApiData(await response.json()) || {};
};

export const updatePoultrySale = async (id, data) => {
  const response = await fetch(`${BASE_URL}/poultry/sales/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update sale');
  return unwrapApiData(await response.json()) || {};
};

export const deletePoultrySale = async (id) => {
  const response = await fetch(`${BASE_URL}/poultry/sales/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete sale record');
  return true;
};

// --- POULTRY: PROFIT DISTRIBUTION ENDPOINTS ---

export const getPoultryProfit = async (batchId, period) => {
  const response = await fetch(`${BASE_URL}/poultry/profit?batchId=${batchId}&period=${period}`, { headers: getHeaders() });
  return unwrapApiData(await response.json());
};

export const distributePoultryProfit = async (data) => {
  const response = await fetch(`${BASE_URL}/poultry/profit/distribute`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to finalize profit distribution');
  return unwrapApiData(await response.json());
};