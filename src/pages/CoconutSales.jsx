import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  TrendingUp,
  Sprout,
  Leaf,
  Check,
  X,
  Loader2,
  AlertCircle,
  Trash2,
  Edit2,
  Save,
  Eye,
  CalendarClock,
} from "lucide-react";

// Import API services
import {
  getCoconutSales,
  createCoconutSale,
  updateCoconutSale,
  deleteCoconutSale,
  createHarvestExpense,
  getEmployees,
  markHarvestAttendanceBulk,
} from "../services/api";
import { useToast } from "../components/ToastProvider";
import { downloadCsv } from "../utils/csv";
import HarvestLaborPanel from "../components/HarvestLaborPanel";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const normalizeSaleRecord = (record, fallback = {}) => {
  const source =
    record &&
    typeof record === "object" &&
    "data" in record &&
    record.data &&
    typeof record.data === "object"
      ? record.data
      : record;

  return {
    ...fallback,
    ...(source || {}),
  };
};

const emptySaleForm = () => ({
  date: new Date().toISOString().split("T")[0],
  next_harvest_date: "",
  farm: "MR1",
  qty1: "",
  rate1: "",
  free_qty1: "", // Replaced free_qty1
  qty2: "",
  rate2: "",
  free_qty2: "", // Replaced free_qty2
  // --- New Harvest Expense Fields ---
  mainLabor: "",
  collectors: "",
  tractorDriver: "",
  foodExpenses: "",
});

const saleToForm = (sale) => ({
  date: sale?.date || new Date().toISOString().split("T")[0],
  next_harvest_date: sale?.next_harvest_date ?? "",
  farm: sale?.farm || "MR1",
  qty1: sale?.qty1 ?? "",
  rate1: sale?.rate1 ?? "",
  free_qty1: sale?.free_qty1 ?? "",
  qty2: sale?.qty2 ?? "",
  rate2: sale?.rate2 ?? "",
  free_qty2: sale?.free_qty2 ?? "",
  // Expenses aren't loaded into the edit form by default unless you fetch them,
  // so we leave them blank for existing records to prevent overwriting.
});

// Days until (or since) a target date. Positive = future, negative = overdue.
const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};

export default function CoconutSales() {
  const [farmFilter, setFarmFilter] = useState("MR1");
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  // API States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Panels & Modal States ---
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newRow, setNewRow] = useState(emptySaleForm());
  const [editSale, setEditSale] = useState(null);
  const [editRow, setEditRow] = useState(emptySaleForm());
  const [viewSale, setViewSale] = useState(null);
  const toast = useToast();

  // --- Harvest Attendance States ---
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [harvestAtt, setHarvestAtt] = useState({});

  // Helper to calculate total
  const calcNet = (row) => {
    const q1 = (parseFloat(row.qty1) || 0) - (parseFloat(row.free_qty1) || 0);
    const r1 = parseFloat(row.rate1) || 0;
    const q2 = (parseFloat(row.qty2) || 0) - (parseFloat(row.free_qty2) || 0);
    const r2 = parseFloat(row.rate2) || 0;

    return q1 * r1 + q2 * r2;
  };

  // --- Fetch Data ---
  useEffect(() => {
    let isActive = true;
    const loadSales = async () => {
      try {
        const data = await getCoconutSales(farmFilter);
        if (!isActive) return;

        const rows = Array.isArray(data) ? data : data?.data || [];
        setSales(rows.map((row) => normalizeSaleRecord(row)));
      } catch {
        if (isActive) {
          setError("Failed to load sales data. Please check your connection.");
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadSales();
    return () => {
      isActive = false;
    };
  }, [farmFilter]);

  useEffect(() => {
    if (!isAdding) return;
    let active = true;
    const fetchE = async () => {
      setEmpLoading(true);
      try {
        const data = await getEmployees(null, "active");
        if (active) setEmployees(Array.isArray(data) ? data : []);
      } catch {
        if (active) setEmployees([]);
      } finally {
        if (active) setEmpLoading(false);
      }
    };
    fetchE();
    return () => {
      active = false;
    };
  }, [isAdding]);

  const filtered = sales.filter((s) => !search || s.date.includes(search));

  // KPIs
  const totalRevenue = filtered.reduce(
    (a, s) => a + (Number(s.total) || calcNet(s)),
    0,
  );
  const totalNuts = filtered.reduce(
    (a, s) =>
      a +
      (Number(s.qty1 || 0) - Number(s.free_qty1 || 0)) +
      (Number(s.qty2 || 0) - Number(s.free_qty2 || 0)),
    0,
  );

  const toggleSelect = (id) =>
    setSelected((sel) =>
      sel.includes(id) ? sel.filter((i) => i !== id) : [...sel, id],
    );
  const toggleAll = () =>
    setSelected((sel) =>
      sel.length === filtered.length ? [] : filtered.map((s) => s.id),
    );

  const handleRowChange = (e) => {
    setNewRow((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditRowChange = (e) => {
    setEditRow((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openEditSale = (sale) => {
    setEditSale(normalizeSaleRecord(sale));
    setEditRow(saleToForm(sale));
  };

  const closeEditSale = () => {
    setEditSale(null);
    setEditRow(emptySaleForm());
    setIsSaving(false);
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewRow(emptySaleForm());
    setHarvestAtt({});
  };

  // --- API Actions ---
  const handleSaveRow = async () => {
    if (!newRow.qty1 || !newRow.rate1) {
      toast.warn("Please enter at least 1st Quality Quantity and Rate.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Create the Sale
      const salePayload = {
        date: newRow.date,
        next_harvest_date: newRow.next_harvest_date || null,
        farm: farmFilter, // Or newRow.farm depending on your UI layout
        qty1: parseFloat(newRow.qty1) || 0,
        rate1: parseFloat(newRow.rate1) || 0,
        free_qty1: parseFloat(newRow.free_qty1) || 0,
        qty2: parseFloat(newRow.qty2) || 0,
        rate2: parseFloat(newRow.rate2) || 0,
        free_qty2: parseFloat(newRow.free_qty2) || 0,
      };

      const savedRecord = await createCoconutSale(salePayload);

      // Calculate Attendance and Labor Costs FIRST
      const attendanceRecords = Object.entries(harvestAtt);
      const selectedEmployees = Object.entries(harvestAtt)
        .filter(([, status]) => status !== null)
        .map(([empId]) => {
          const emp = employees.find((e) => String(e.id) === String(empId));
          return {
            employeeId: Number(empId),
            status,
            wagePerDay: Number(emp?.wagePerDay || 0),
            name: emp?.name || "",
          };
        });

      const permanentLaborCost = selectedEmployees.reduce(
        (sum, emp) => sum + (emp.wagePerDay || 0),
        0,
      );

      // 2. Check if any expenses were entered, if so, create the expense record
      const hasExpenses =
        newRow.mainLabor ||
        newRow.collectors ||
        newRow.tractorDriver ||
        newRow.foodExpenses ||
        permanentLaborCost > 0;

      if (hasExpenses) {
        const expensePayload = {
          date: newRow.date,
          farm: farmFilter,
          main_labor: parseFloat(newRow.mainLabor) || 0,
          collectors: parseFloat(newRow.collectors) || 0,
          tractor_driver: parseFloat(newRow.tractorDriver) || 0,
          food_expenses: parseFloat(newRow.foodExpenses) || 0,

          // NEW FIELD
          permanent_labor_cost: permanentLaborCost,

          labor_source:
            selectedEmployees.length > 0 ? "from_attendance" : "manual",
          labor_snapshot: JSON.stringify(selectedEmployees),

          notes: "Linked to Coconut Sale",
        };
        await createHarvestExpense(expensePayload);
      }

      // 3. Mark harvest attendance if any employees were marked
      const saleId = normalizeSaleRecord(savedRecord).id;
      if (attendanceRecords.length > 0 && saleId) {
        await markHarvestAttendanceBulk({
          date: newRow.date,
          farm: farmFilter,
          saleId,
          records: attendanceRecords,
        });
      }

      // 4. Update the local UI state
      const completeRecord = normalizeSaleRecord(savedRecord, salePayload);
      completeRecord.total = calcNet(salePayload);

      setSales((prev) => [completeRecord, ...prev]);
      setIsAdding(false);
      setNewRow(emptySaleForm());
      setHarvestAtt({});
      const parts = [
        "Sale saved.",
        hasExpenses &&
          `Expenses + Permanent labor cost (Rs. ${permanentLaborCost.toFixed(2)}) logged`,
        attendanceRecords.length > 0 &&
          `${attendanceRecords.length} attendance record(s) marked.`,
      ].filter(Boolean);
      toast.success(parts.join(" "));
    } catch {
      toast.error("Failed to save records to database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSale = async () => {
    if (!editSale?.id) return;
    if (!editRow.qty1 || !editRow.rate1) {
      toast.warn("Please enter at least 1st Quality Quantity and Rate.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        date: editRow.date,
        next_harvest_date: editRow.next_harvest_date || null,
        farm: editRow.farm,
        qty1: parseFloat(editRow.qty1) || 0,
        rate1: parseFloat(editRow.rate1) || 0,
        free_qty1: parseFloat(editRow.free_qty1) || 0,
        qty2: parseFloat(editRow.qty2) || 0,
        rate2: parseFloat(editRow.rate2) || 0,
        free_qty2: parseFloat(editRow.free_qty2) || 0,
      };

      const updatedRecord = normalizeSaleRecord(
        await updateCoconutSale(editSale.id, payload),
        {
          ...editSale,
          ...payload,
        },
      );
      updatedRecord.total = updatedRecord.total || calcNet(payload);

      setSales((prev) =>
        prev.map((sale) => (sale.id === editSale.id ? updatedRecord : sale)),
      );
      closeEditSale();
      toast.success("Sales record updated successfully.");
    } catch {
      toast.error("Failed to update record.");
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteCoconutSale(id);
        setSales((prev) => prev.filter((s) => s.id !== id));
        toast.success("Record deleted successfully.");
      } catch {
        toast.error("Failed to delete record.");
      }
    }
  };

  const handleExportCsv = () => {
    downloadCsv(
      `coconut-sales-${farmFilter}.csv`,
      [
        { label: "Date", value: (row) => row.date || "" },
        { label: "Farm", value: (row) => row.farm || farmFilter || "" },
        { label: "Qty 1", value: (row) => row.qty1 ?? 0 },
        { label: "Rate 1", value: (row) => row.rate1 ?? 0 },
        { label: "Discount 1", value: (row) => row.free_qty1 ?? 0 },
        { label: "Qty 2", value: (row) => row.qty2 ?? 0 },
        { label: "Rate 2", value: (row) => row.rate2 ?? 0 },
        { label: "Discount 2", value: (row) => row.free_qty2 ?? 0 },
        {
          label: "Total",
          value: (row) => Number(row.total || calcNet(row)).toFixed(2),
        },
      ],
      filtered,
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Nunito'] pb-10">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-green-600/20">
              <Sprout size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Coconut Sales Ledger
            </h1>
          </div>
          <p className="text-sm font-medium text-gray-500 pl-[52px]">
            Manage estate yields and calculate net revenue
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => setIsAdding(true)}
            disabled={isAdding || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white border-none rounded-xl text-xs font-black shadow-md hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all"
          >
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      {/* ── ERROR STATE ── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm font-bold animate-in fade-in">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* ── PREMIUM KPI STAT CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[
          {
            title: "Total Revenue",
            amount: `Rs. ${fmt(totalRevenue)}`,
            badge: `${filtered.length} Trans.`,
            sub: "Recorded",
            icon: <TrendingUp size={14} />,
            chartColor: "#A5D6A7",
            path: "M0,40 L0,25 C 20,30 40,10 60,15 C 80,20 90,5 100,5 L100,40 Z",
          },
          {
            title: "Total Nuts Sold",
            amount: totalNuts.toLocaleString(),
            badge: `${farmFilter}`,
            sub: "Estate Block",
            icon: <Leaf size={14} />,
            chartColor: "#A5D6A7",
            path: "M0,40 L0,20 C 30,35 50,15 70,25 C 85,30 95,10 100,10 L100,40 Z",
          },
        ].map((card, i) => {
          const gradId = `grad-coconut-${i}`;
          return (
            <div
              key={i}
              className="relative overflow-hidden rounded-[1.25rem] p-4 bg-gradient-to-br from-green-700 to-green-800 text-white shadow-lg shadow-green-900/20 group border border-green-800/50 transition-all hover:shadow-green-900/40 hover:-translate-y-1 h-28"
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
                        stopColor={card.chartColor}
                        stopOpacity="0.4"
                      />
                      <stop
                        offset="100%"
                        stopColor={card.chartColor}
                        stopOpacity="0.0"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d={card.path}
                    fill={`url(#${gradId})`}
                    stroke={card.chartColor}
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── REDESIGNED UX: DEDICATED REGISTRATION PANEL ── */}
      {isAdding && (
        <div className="bg-gradient-to-b from-green-50 to-white border border-green-200 rounded-xl p-6 shadow-md mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-5 border-b border-green-100 pb-3">
            <h3 className="text-lg font-black text-green-900 flex items-center gap-2">
              <Sprout size={18} className="text-green-600" /> Record Harvest
              Yield Distribution
            </h3>
            <button
              onClick={cancelAdd}
              className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm border border-gray-200"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-4">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">
                Date of Sale
              </label>
              <input
                type="date"
                name="date"
                value={newRow.date}
                onChange={handleRowChange}
                className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none font-bold focus:border-green-500"
                disabled={isSaving}
              />
            </div>
            <div className="md:col-span-4">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">
                Next Harvest Date
                <span className="ml-1 text-gray-400 font-bold normal-case">(optional)</span>
              </label>
              <input
                type="date"
                name="next_harvest_date"
                value={newRow.next_harvest_date}
                onChange={handleRowChange}
                className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none font-bold focus:border-green-500"
                disabled={isSaving}
              />
            </div>
            <div className="md:col-span-4"></div>

            {/* 1st Quality Section */}
            <div className="md:col-span-12 p-4 rounded-xl border border-green-100 bg-green-50/20 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-12 font-bold text-sm text-green-800">
                1st Quality Grade
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  Paid Qty (Nuts)
                </label>
                <input
                  type="number"
                  name="qty1"
                  placeholder="0"
                  value={newRow.qty1}
                  onChange={handleRowChange}
                  className="w-full p-2.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-green-500 font-bold"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  Rate (Rs.)
                </label>
                <input
                  type="number"
                  name="rate1"
                  placeholder="0.00"
                  value={newRow.rate1}
                  onChange={handleRowChange}
                  className="w-full p-2.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-green-500 font-bold"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-blue-600 mb-1">
                  Free Coconuts (+)
                </label>
                <input
                  type="number"
                  name="free_qty1"
                  placeholder="0"
                  value={newRow.free_qty1}
                  onChange={handleRowChange}
                  className="w-full p-2.5 text-sm border border-blue-200 bg-blue-50/50 rounded-lg outline-none focus:border-blue-500 font-bold text-blue-700"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* 2nd Quality Section */}
            <div className="md:col-span-12 p-4 rounded-xl border border-gray-200 bg-gray-50/50 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-12 font-bold text-sm text-gray-800">
                2nd Quality Grade
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  Paid Qty (Nuts)
                </label>
                <input
                  type="number"
                  name="qty2"
                  placeholder="0"
                  value={newRow.qty2}
                  onChange={handleRowChange}
                  className="w-full p-2.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-green-500 font-bold"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  Rate (Rs.)
                </label>
                <input
                  type="number"
                  name="rate2"
                  placeholder="0.00"
                  value={newRow.rate2}
                  onChange={handleRowChange}
                  className="w-full p-2.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-green-500 font-bold"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-blue-600 mb-1">
                  Free Coconuts (+)
                </label>
                <input
                  type="number"
                  name="free_qty2"
                  placeholder="0"
                  value={newRow.free_qty2}
                  onChange={handleRowChange}
                  className="w-full p-2.5 text-sm border border-blue-200 bg-blue-50/50 rounded-lg outline-none focus:border-blue-500 font-bold text-blue-700"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* LINKED HARVEST EXPENSES */}
            <div className="md:col-span-12 mt-2">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Leaf size={16} className="text-green-600" /> Linked Harvest
                Expenses
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Main Labor
                  </label>
                  <input
                    type="number"
                    name="mainLabor"
                    value={newRow.mainLabor}
                    onChange={handleRowChange}
                    placeholder="Rs."
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold focus:border-green-500 outline-none"
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Collectors
                  </label>
                  <input
                    type="number"
                    name="collectors"
                    value={newRow.collectors}
                    onChange={handleRowChange}
                    placeholder="Rs."
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold focus:border-green-500 outline-none"
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Tractor Driver
                  </label>
                  <input
                    type="number"
                    name="tractorDriver"
                    value={newRow.tractorDriver}
                    onChange={handleRowChange}
                    placeholder="Rs."
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold focus:border-green-500 outline-none"
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Food Expenses
                  </label>
                  <input
                    type="number"
                    name="foodExpenses"
                    value={newRow.foodExpenses}
                    onChange={handleRowChange}
                    placeholder="Rs."
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold focus:border-green-500 outline-none"
                    disabled={isSaving}
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 font-medium italic">
                * Entering expenses here will automatically log them into the
                General Expenses ledger for {farmFilter}.
              </p>
            </div>

            <HarvestLaborPanel
              employees={employees}
              loading={empLoading}
              attendance={harvestAtt}
              onChange={(empId, status) =>
                setHarvestAtt((prev) => ({ ...prev, [empId]: status }))
              }
            />
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Calculated Invoice Earnings
              </p>
              <p className="text-xl font-black text-green-700">
                Rs. {fmt(calcNet(newRow))}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelAdd}
                disabled={isSaving}
                className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRow}
                disabled={isSaving}
                className="px-6 py-2.5 bg-green-600 rounded-lg text-white text-sm font-bold shadow-md hover:bg-green-700 flex items-center gap-2 transition-all"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}{" "}
                Record Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN LEDGER CONTAINER ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Filters Toolbar */}
        <div className="p-4 border-b border-gray-100 display flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
          <div className="flex bg-gray-200/60 p-1 rounded-xl gap-1">
            {["MR1", "MR2"].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setIsLoading(true);
                  setError(null);
                  setFarmFilter(f);
                  setIsAdding(false);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${farmFilter === f ? "bg-white text-green-900 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
              >
                {f} Yields
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by date..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold outline-none focus:border-green-500 shadow-sm"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 shadow-sm">
              <SlidersHorizontal size={13} className="text-gray-400" /> Filters
            </button>
          </div>
        </div>

        {/* Ledger Table Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4 text-left w-12">
                  <input
                    type="checkbox"
                    onChange={toggleAll}
                    checked={
                      selected.length > 0 && selected.length === filtered.length
                    }
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 accent-green-700"
                  />
                </th>
                <th className="p-4 text-left">Harvest Date</th>
                <th className="p-4 text-left">1st Quality (Nuts)</th>
                <th className="p-4 text-left">1st Rate / Free</th>
                <th className="p-4 text-left">2nd Quality (Nuts)</th>
                <th className="p-4 text-left">2nd Rate / Free</th>
                <th className="p-4 text-right">Invoice Total</th>
                <th className="p-4 text-right w-24"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="p-20 text-center text-green-600">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    <span className="text-xs font-bold">
                      Querying {farmFilter} Block Sales Data...
                    </span>
                  </td>
                </tr>
              )}

              {!isLoading &&
                filtered.map((sale) => {
                  const isSel = selected.includes(sale.id);
                  return (
                    <tr
                      key={sale.id}
                      onClick={() => setViewSale(sale)}
                      className={`border-t border-gray-50 transition-colors cursor-pointer ${isSel ? "bg-green-50/40" : "hover:bg-gray-50/40"}`}
                    >
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleSelect(sale.id)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500 accent-green-700 cursor-pointer"
                        />
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-gray-900">
                          {sale.date || "—"}
                        </p>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">
                          {sale.farm ? `${sale.farm} Block` : "—"}
                        </span>
                        {sale.next_harvest_date &&
                          (() => {
                            const d = daysUntil(sale.next_harvest_date);
                            const tone =
                              d < 0
                                ? "bg-red-50 text-red-600 border-red-100"
                                : d <= 7
                                  ? "bg-amber-50 text-amber-700 border-amber-100"
                                  : "bg-green-50 text-green-700 border-green-100";
                            const label =
                              d < 0
                                ? `Overdue ${Math.abs(d)}d`
                                : d === 0
                                  ? "Due today"
                                  : `in ${d}d`;
                            return (
                              <span
                                className={`mt-1 inline-flex items-center gap-1 border rounded px-1.5 py-0.5 text-[10px] font-black w-max ${tone}`}
                                title={`Next harvest: ${sale.next_harvest_date}`}
                              >
                                <CalendarClock size={10} /> Next: {label}
                              </span>
                            );
                          })()}
                      </td>

                      <td className="p-4 font-bold text-gray-900">
                        {Number(sale.qty1 || 0).toLocaleString()}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 font-medium">
                            Rs. {sale.rate1 || "—"}
                          </span>
                          {Number(sale.free_qty1 || 0) > 0 && (
                            <span className="bg-blue-50 text-blue-600 border border-blue-100 rounded px-1.5 py-0.5 text-[10px] font-black">
                              +{sale.free_qty1} Free
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 font-bold text-gray-600">
                        {Number(sale.qty2 || 0) > 0 ? (
                          Number(sale.qty2).toLocaleString()
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 font-medium">
                            {Number(sale.rate2 || 0) > 0 ? (
                              `Rs. ${sale.rate2}`
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </span>
                          {Number(sale.free_qty2 || 0) > 0 && (
                            <span className="bg-blue-50 text-blue-600 border border-blue-100 rounded px-1.5 py-0.5 text-[10px] font-black">
                              +{sale.free_qty2} Free
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-right font-black text-gray-900 text-base">
                        Rs. {fmt(sale.total || calcNet(sale))}
                      </td>

                      <td
                        className="p-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEditSale(sale)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(sale.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-12 text-center text-gray-400 font-bold"
                  >
                    No harvest distribution sales logs found for {farmFilter}{" "}
                    block criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Custom Scannable Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500">
            Filtered Summary:{" "}
            <span className="text-gray-800">
              {filtered.length} entries matching
            </span>
          </span>
          <div className="flex gap-1">
            <button className="p-1.5 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50">
              <ChevronLeft size={14} />
            </button>
            <button className="px-3 py-1 text-xs font-black rounded bg-gradient-to-br from-green-700 to-green-800 text-white">
              1
            </button>
            <button className="p-1.5 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── DETAIL VIEW MODAL ── */}
      {viewSale &&
        (() => {
          const s = viewSale;
          const net1 =
            (parseFloat(s.qty1) || 0) - (parseFloat(s.free_qty1) || 0);
          const sub1 = net1 * (parseFloat(s.rate1) || 0);
          const net2 =
            (parseFloat(s.qty2) || 0) - (parseFloat(s.free_qty2) || 0);
          const sub2 = net2 * (parseFloat(s.rate2) || 0);
          const grandTotal = sub1 + sub2;

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setViewSale(null)}
            >
              <div
                className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-green-700 to-green-800 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <Eye size={18} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-black">
                        Harvest Sale Detail
                      </h2>
                      <p className="text-xs text-green-200 font-medium">
                        {s.date} · {s.farm} Block · ID #{s.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewSale(null)}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Next Harvest */}
                  {s.next_harvest_date &&
                    (() => {
                      const d = daysUntil(s.next_harvest_date);
                      const tone =
                        d < 0
                          ? "border-red-200 bg-red-50 text-red-700"
                          : d <= 7
                            ? "border-amber-200 bg-amber-50 text-amber-800"
                            : "border-green-200 bg-green-50 text-green-800";
                      const label =
                        d < 0
                          ? `Overdue by ${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"}`
                          : d === 0
                            ? "Due today"
                            : `Due in ${d} day${d === 1 ? "" : "s"}`;
                      return (
                        <div
                          className={`rounded-xl border px-4 py-3 flex items-center justify-between ${tone}`}
                        >
                          <div className="flex items-center gap-2">
                            <CalendarClock size={16} />
                            <span className="text-xs font-black uppercase tracking-wider">
                              Next Harvest
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black">
                              {s.next_harvest_date}
                            </p>
                            <p className="text-[11px] font-bold opacity-80">
                              {label}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                  {/* 1st Quality */}
                  <div className="rounded-xl border border-green-100 bg-green-50/30 overflow-hidden">
                    <div className="px-4 py-2.5 bg-green-50 border-b border-green-100">
                      <span className="text-xs font-black text-green-800 uppercase tracking-wider">
                        1st Quality Grade
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-0 divide-x divide-gray-100">
                      <div className="px-4 py-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                          Paid Qty
                        </p>
                        <p className="text-lg font-black text-gray-900">
                          {Number(s.qty1 || 0).toLocaleString()} nuts
                        </p>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                          Rate
                        </p>
                        <p className="text-lg font-black text-gray-900">
                          Rs. {fmt(s.rate1)}
                        </p>
                      </div>
                      {Number(s.free_qty1 || 0) > 0 && (
                        <div className="px-4 py-3 col-span-2 border-t border-green-100 flex items-center gap-3">
                          <span className="text-[10px] font-bold text-blue-500 uppercase">
                            Free coconuts
                          </span>
                          <span className="font-black text-blue-600">
                            +{Number(s.free_qty1).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-gray-400 ml-auto">
                            Net qty: {net1.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="px-4 py-3 col-span-2 border-t border-green-100 flex justify-between items-center bg-green-50/50">
                        <span className="text-xs font-bold text-gray-500">
                          1st Grade Subtotal
                        </span>
                        <span className="text-base font-black text-green-700">
                          Rs. {fmt(sub1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2nd Quality */}
                  {(Number(s.qty2 || 0) > 0 || Number(s.rate2 || 0) > 0) && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50/30 overflow-hidden">
                      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                        <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
                          2nd Quality Grade
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-0 divide-x divide-gray-100">
                        <div className="px-4 py-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                            Paid Qty
                          </p>
                          <p className="text-lg font-black text-gray-900">
                            {Number(s.qty2 || 0).toLocaleString()} nuts
                          </p>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                            Rate
                          </p>
                          <p className="text-lg font-black text-gray-900">
                            Rs. {fmt(s.rate2)}
                          </p>
                        </div>
                        {Number(s.free_qty2 || 0) > 0 && (
                          <div className="px-4 py-3 col-span-2 border-t border-gray-100 flex items-center gap-3">
                            <span className="text-[10px] font-bold text-blue-500 uppercase">
                              Free coconuts
                            </span>
                            <span className="font-black text-blue-600">
                              +{Number(s.free_qty2).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-gray-400 ml-auto">
                              Net qty: {net2.toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="px-4 py-3 col-span-2 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                          <span className="text-xs font-bold text-gray-500">
                            2nd Grade Subtotal
                          </span>
                          <span className="text-base font-black text-gray-700">
                            Rs. {fmt(sub2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Grand Total */}
                  <div className="rounded-xl border-2 border-green-600 bg-green-600 px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-green-100 uppercase tracking-wider">
                        Total Invoice
                      </p>
                      <p className="text-[10px] text-green-200 mt-0.5">
                        {net1 + net2 > 0
                          ? `${(net1 + net2).toLocaleString()} net nuts`
                          : ""}
                      </p>
                    </div>
                    <p className="text-2xl font-black text-white">
                      Rs. {fmt(grandTotal)}
                    </p>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                  <button
                    onClick={() => setViewSale(null)}
                    className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setViewSale(null);
                      openEditSale(s);
                    }}
                    className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-green-700"
                  >
                    <Edit2 size={14} /> Edit Record
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ── MODAL DIALOG OVERLAY: ENTITY SYSTEM UPDATE ── */}
      {editSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[1.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-700">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">
                    Update Yield Record
                  </h2>
                  <p className="text-xs text-gray-400 font-medium">
                    Modifying payload ID #{editSale.id}
                  </p>
                </div>
              </div>
              <button
                onClick={closeEditSale}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    Date of Sale
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={editRow.date}
                    onChange={handleEditRowChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:border-green-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    Block Source
                  </label>
                  <div className="flex gap-2">
                    {["MR1", "MR2"].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() =>
                          setEditRow((prev) => ({ ...prev, farm: f }))
                        }
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${editRow.farm === f ? "bg-green-50 border-green-500 text-green-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                      >
                        {f} Block
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    Next Harvest Date{" "}
                    <span className="text-gray-400 font-bold normal-case">(optional)</span>
                  </label>
                  <input
                    type="date"
                    name="next_harvest_date"
                    value={editRow.next_harvest_date || ""}
                    onChange={handleEditRowChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:border-green-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Edit Grade 1 */}
              <div className="p-4 rounded-xl border border-green-100 bg-green-50/20 space-y-3">
                <h3 className="text-sm font-black text-green-800">
                  1st Quality Yield
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Paid Qty
                    </label>
                    <input
                      type="number"
                      name="qty1"
                      value={editRow.qty1}
                      onChange={handleEditRowChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Rate (Rs.)
                    </label>
                    <input
                      type="number"
                      name="rate1"
                      value={editRow.rate1}
                      onChange={handleEditRowChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-600 mb-1">
                      Free Coconuts (+)
                    </label>
                    <input
                      type="number"
                      name="free_qty1"
                      value={editRow.free_qty1}
                      onChange={handleEditRowChange}
                      className="w-full border border-blue-200 bg-blue-50 text-sm font-bold focus:border-blue-500 focus:outline-none text-blue-700"
                    />
                  </div>
                </div>
              </div>

              {/* Edit Grade 2 */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <h3 className="text-sm font-black text-gray-800">
                  2nd Quality Yield
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Paid Qty
                    </label>
                    <input
                      type="number"
                      name="qty2"
                      value={editRow.qty2}
                      onChange={handleEditRowChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Rate (Rs.)
                    </label>
                    <input
                      type="number"
                      name="rate2"
                      value={editRow.rate2}
                      onChange={handleEditRowChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-600 mb-1">
                      Free Coconuts (+)
                    </label>
                    <input
                      type="number"
                      name="free_qty2"
                      value={editRow.free_qty2}
                      onChange={handleEditRowChange}
                      className="w-full border border-blue-200 bg-blue-50 text-sm font-bold focus:border-blue-500 focus:outline-none text-blue-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                  Updated Net Total
                </p>
                <p className="text-xl font-black text-green-800">
                  Rs. {fmt(calcNet(editRow))}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeEditSale}
                  className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateSale}
                  disabled={isSaving}
                  className="bg-green-600 px-5 py-2 rounded-xl text-white font-bold text-sm shadow-sm hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}{" "}
                  Update Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
