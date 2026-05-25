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