import { useState, useEffect, Fragment } from "react";
import {
  Landmark,
  ReceiptText,
  Search,
  Plus,
  Loader2,
  Check,
  X,
  Trash2,
  Pencil,
  CreditCard,
  Wallet,
} from "lucide-react";
import {
  getOwnerFinancials,
  createOwnerFinancial,
  updateOwnerFinancial,
  deleteOwnerFinancial,
  searchCheques,
  createCheque,
} from "../services/api";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function FinanceManagement() {
  const [activeTab, setActiveTab] = useState("Owner Financials");

  // Data States
  const [financials, setFinancials] = useState([]);
  const [cheques, setCheques] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState("2026");
  const [chequeSearch, setChequeSearch] = useState("");

  // Fetch Data based on active tab
  useEffect(() => {
    Promise.resolve().then(() => setIsLoading(true));
    if (activeTab === "Owner Financials") {
      getOwnerFinancials(selectedYear)
        .then(setFinancials)
        .catch(() => setFinancials([]))
        .finally(() => setIsLoading(false));
    } else if (activeTab === "Cheque Tracker") {
      const timer = setTimeout(() => {
        searchCheques(chequeSearch)
          .then(setCheques)
          .catch(() => setCheques([]))
          .finally(() => setIsLoading(false));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, selectedYear, chequeSearch]);

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Nunito']">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-green-600/20">
              <Landmark size={20} className="text-white" />
            </div>
            Finance & Banking
          </h1>
          <p className="text-sm font-medium text-gray-500 pl-[52px]">
            Manage owner financials, leasing, and track global cheques
          </p>
        </div>
      </div>

      {/* ── SUB NAV TABS ── */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto custom-scrollbar">
        {[
          { id: "Owner Financials", icon: CreditCard },
          { id: "Cheque Tracker", icon: ReceiptText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "border-green-600 text-green-700 bg-green-50/50 rounded-t-xl"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <tab.icon size={16} /> {tab.id}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="pb-10">
        {activeTab === "Owner Financials" && (
          <OwnerFinancialsTab
            data={financials}
            setData={setFinancials}
            isLoading={isLoading}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />
        )}

        {activeTab === "Cheque Tracker" && (
          <ChequeTrackerTab
            data={cheques}
            isLoading={isLoading}
            search={chequeSearch}
            setSearch={setChequeSearch}
            onChequeAdded={() => {
              searchCheques(chequeSearch)
                .then(setCheques)
                .catch(() => setCheques([]));
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── TAB 1: OWNER FINANCIALS ────────────────────────────────────────────────
function OwnerFinancialsTab({
  data,
  setData,
  isLoading,
  selectedYear,
  setSelectedYear,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [newRow, setNewRow] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "leasing",
    description: "",
    amount: "",
    accountNo: "",
    referenceNo: "",
    chequeNo: "",
    chequeDate: "",
    chequePayee: "",
    chequeStatus: "Pending",
  });

  const [editingId, setEditingId] = useState(null);
  const [editRow, setEditRow] = useState({
    date: "",
    type: "leasing",
    description: "",
    amount: "",
    accountNo: "",
    referenceNo: "",
    chequeNo: "",
    chequeDate: "",
    chequePayee: "",
    chequeStatus: "Pending",
  });

  const totalLeasing = data
    .filter((d) => d.type === "leasing")
    .reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const totalOther = data
    .filter((d) => d.type !== "leasing")
    .reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? data.filter((r) =>
        [
          r.date,
          r.type,
          r.description,
          r.account_no || r.accountNo,
          r.reference_no || r.referenceNo,
          r.amount,
        ].some((v) => (v ?? "").toString().toLowerCase().includes(q)),
      )
    : data;
  const filteredTotal = filtered.reduce(
    (acc, curr) => acc + parseFloat(curr.amount || 0),
    0,
  );

  const handleSave = async () => {
    if (!newRow.description || !newRow.amount)
      return alert("Please fill description and amount.");

    const hasCheque = newRow.chequeNo.trim().length > 0;
    if (hasCheque && !newRow.chequeDate) {
      return alert("Please fill in Cheque Date.");
    }

    setIsSaving(true);
    try {
      const saved = await createOwnerFinancial({
        date: newRow.date,
        type: newRow.type,
        description: newRow.description,
        amount: parseFloat(newRow.amount),
        accountNo: newRow.accountNo,
        referenceNo: newRow.referenceNo,
      });

      if (hasCheque) {
        await createCheque({
          chequeNo: newRow.chequeNo,
          chequeDate: newRow.chequeDate,
          amount: parseFloat(newRow.amount),
          payee: newRow.chequePayee || newRow.description,
          category: "expenses",
          status: newRow.chequeStatus || "Pending",
        });
      }

      setData([saved, ...data]);
      setIsAdding(false);
      setNewRow({
        date: new Date().toISOString().split("T")[0],
        type: "leasing",
        description: "",
        amount: "",
        accountNo: "",
        referenceNo: "",
        chequeNo: "",
        chequeDate: "",
        chequePayee: "",
        chequeStatus: "Pending",
      });
    } catch (err) {
      console.error(err);
      alert("Error saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (record) => {
    setIsAdding(false);
    setEditingId(record.id);
    setEditRow({
      date: record.date || new Date().toISOString().split("T")[0],
      type: record.type || "leasing",
      description: record.description || "",
      amount: record.amount ?? "",
      accountNo: record.accountNo || record.account_no || "",
      referenceNo: record.referenceNo || record.reference_no || "",
      chequeNo: record.chequeNo || record.cheque_no || "",
      chequeDate: record.chequeDate || record.cheque_date || "",
      chequePayee: record.chequePayee || record.cheque_payee || "",
      chequeStatus: record.chequeStatus || record.cheque_status || "Pending",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRow({
      date: "",
      type: "leasing",
      description: "",
      amount: "",
      accountNo: "",
      referenceNo: "",
      chequeNo: "",
      chequeDate: "",
      chequePayee: "",
      chequeStatus: "Pending",
    });
  };

  const handleUpdate = async (record) => {
    if (!editRow.description || !editRow.amount)
      return alert("Please fill details.");
    setIsSaving(true);
    try {
      const payload = { ...editRow, amount: parseFloat(editRow.amount) };
      const updated = await updateOwnerFinancial(record.id, payload);
      setData(
        data.map((item) =>
          item.id === record.id
            ? { ...item, ...updated, ...payload, id: record.id }
            : item,
        ),
      );
      cancelEdit();
    } catch (err) {
      console.error(err);
      alert("Error updating.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete record?")) {
      await deleteOwnerFinancial(id);
      setData(data.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-600 to-green-800 text-white rounded-xl p-5 shadow-md flex items-center justify-between">
          <div>
            <p className="text-green-100 text-xs font-bold uppercase tracking-wider mb-1">
              Yearly Leasing
            </p>
            <h3 className="text-2xl font-black">Rs. {fmt(totalLeasing)}</h3>
          </div>
          <CreditCard size={32} className="opacity-30" />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
              Loans & Other
            </p>
            <h3 className="text-2xl font-black text-gray-900">
              Rs. {fmt(totalOther)}
            </h3>
          </div>
          <Wallet size={32} className="text-green-100" />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 text-gray-800 text-sm font-bold rounded-lg px-4 py-2 outline-none focus:border-green-500"
          >
            <option value="2026">2026 Financials</option>
            <option value="2025">2025 Financials</option>
          </select>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            Financial Ledger
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search description, ref, amount..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold outline-none focus:border-green-500 shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setIsAdding(true)}
              disabled={isAdding}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Plus size={14} /> Add Record
            </button>
          </div>
        </div>

        {isAdding && (
          <div className="p-4 border-b border-gray-100 bg-gray-50/20 animate-fadeIn">
            <div className="bg-white border-2 border-green-500/30 rounded-2xl p-5 shadow-sm space-y-4">
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-gray-150">
                <span className="font-extrabold text-green-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Plus size={16} /> Add Financial Record
                </span>
                <button
                  onClick={() => setIsAdding(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  disabled={isSaving}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Content */}
              <div className="space-y-4">
                {/* Row 1: DATE | REF NO | CATEGORY */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-505 uppercase tracking-wider mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newRow.date}
                      onChange={(e) =>
                        setNewRow({ ...newRow, date: e.target.value })
                      }
                      className="w-full p-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-green-600 font-bold"
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-505 uppercase tracking-wider mb-1">
                      Banking Ref / Acc No
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Account Ref"
                      value={newRow.accountNo}
                      onChange={(e) =>
                        setNewRow({ ...newRow, accountNo: e.target.value })
                      }
                      className="w-full p-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-green-600 font-bold"
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-505 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <select
                      value={newRow.type}
                      onChange={(e) =>
                        setNewRow({ ...newRow, type: e.target.value })
                      }
                      className="w-full p-2 text-xs border border-gray-300 rounded-lg outline-none bg-white focus:border-green-600 font-bold"
                      disabled={isSaving}
                    >
                      <option value="leasing">Leasing</option>
                      <option value="speed-draft">Speed Draft</option>
                      <option value="master-account">Master Account</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: DESCRIPTION */}
                <div>
                  <label className="block text-[10px] font-black text-gray-505 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Detailed description of the expense / transaction..."
                    value={newRow.description}
                    onChange={(e) =>
                      setNewRow({
                        ...newRow,
                        description: e.target.value,
                        chequePayee: newRow.chequePayee || e.target.value,
                      })
                    }
                    className="w-full p-2.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-green-600 font-bold"
                    disabled={isSaving}
                  />
                </div>

                {/* Row 3: TOTAL AMOUNT | CHEQUE NO | CHEQUE DATE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-505 uppercase tracking-wider mb-1">
                      Total Amount (Rs.)
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={newRow.amount}
                      onChange={(e) =>
                        setNewRow({ ...newRow, amount: e.target.value })
                      }
                      className="w-full p-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-green-600 font-black text-green-700"
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-505 uppercase tracking-wider mb-1">
                      Cheque No (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CHQ-XXX"
                      value={newRow.chequeNo}
                      onChange={(e) =>
                        setNewRow({ ...newRow, chequeNo: e.target.value })
                      }
                      className="w-full p-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-green-600 font-bold"
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-505 uppercase tracking-wider mb-1">
                      Cheque Date
                    </label>
                    <input
                      type="date"
                      value={newRow.chequeDate}
                      onChange={(e) =>
                        setNewRow({ ...newRow, chequeDate: e.target.value })
                      }
                      className="w-full p-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-green-600 font-bold"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  disabled={isSaving}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow"
                >
                  {isSaving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}{" "}
                  Save Record
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="animate-spin mx-auto text-green-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Category</th>
                  <th className="p-4 text-left">Description</th>
                  <th className="p-4 text-left">Banking Ref</th>
                  <th className="p-4 text-right">Amount (Rs.)</th>
                  <th className="p-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-10 text-center text-gray-400 font-bold text-sm"
                    >
                      {q
                        ? "No records match your search."
                        : "No records yet."}
                    </td>
                  </tr>
                )}
                {filtered.map((record) =>
                  editingId === record.id ? (
                    <Fragment key={record.id}>
                    <tr
                      className="bg-blue-50/30 border-b-0 border-blue-100"
                    >
                      <td className="p-2">
                        <input
                          type="date"
                          value={editRow.date}
                          onChange={(e) =>
                            setEditRow({ ...editRow, date: e.target.value })
                          }
                          className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                          disabled={isSaving}
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={editRow.type}
                          onChange={(e) =>
                            setEditRow({ ...editRow, type: e.target.value })
                          }
                          className="w-full p-2 text-xs border border-gray-300 rounded outline-none bg-white"
                          disabled={isSaving}
                        >
                          <option value="leasing">Leasing</option>
                          <option value="speed-draft">Speed Draft</option>
                          <option value="master-account">Master Account</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editRow.description}
                          onChange={(e) =>
                            setEditRow({
                              ...editRow,
                              description: e.target.value,
                            })
                          }
                          className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                          disabled={isSaving}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editRow.accountNo}
                          onChange={(e) =>
                            setEditRow({
                              ...editRow,
                              accountNo: e.target.value,
                            })
                          }
                          className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                          placeholder="Account No"
                          disabled={isSaving}
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          value={editRow.amount}
                          onChange={(e) =>
                            setEditRow({ ...editRow, amount: e.target.value })
                          }
                          className="w-32 p-2 text-xs border border-gray-300 rounded outline-none text-right"
                          disabled={isSaving}
                        />
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={cancelEdit}
                            disabled={isSaving}
                            className="p-1.5 bg-gray-200 rounded text-gray-600"
                          >
                            <X size={14} />
                          </button>
                          <button
                            onClick={() => handleUpdate(record)}
                            disabled={isSaving}
                            className="p-1.5 bg-green-600 rounded text-white shadow"
                          >
                            {isSaving ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr key={`${record.id}-extra`} className="bg-blue-50/30 border-b border-blue-100">
                      <td colSpan={6} className="px-2 pb-3 pt-0">
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Ref No</label>
                            <input type="text" value={editRow.referenceNo} onChange={(e) => setEditRow({ ...editRow, referenceNo: e.target.value })} className="w-full p-2 text-xs border border-gray-300 rounded outline-none" placeholder="Reference No" disabled={isSaving} />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Cheque No</label>
                            <input type="text" value={editRow.chequeNo} onChange={(e) => setEditRow({ ...editRow, chequeNo: e.target.value })} className="w-full p-2 text-xs border border-gray-300 rounded outline-none" placeholder="Cheque No" disabled={isSaving} />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Cheque Date</label>
                            <input type="date" value={editRow.chequeDate} onChange={(e) => setEditRow({ ...editRow, chequeDate: e.target.value })} className="w-full p-2 text-xs border border-gray-300 rounded outline-none" disabled={isSaving} />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Cheque Payee</label>
                            <input type="text" value={editRow.chequePayee} onChange={(e) => setEditRow({ ...editRow, chequePayee: e.target.value })} className="w-full p-2 text-xs border border-gray-300 rounded outline-none" placeholder="Payee" disabled={isSaving} />
                          </div>
                        </div>
                      </td>
                    </tr>
                    </Fragment>
                  ) : (
                    <tr
                      key={record.id}
                      className="border-t border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="p-4 font-bold text-gray-900">
                        {record.date}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${record.type === "leasing" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                        >
                          {record.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-800">
                        {record.description}
                      </td>
                      <td className="p-4 text-xs text-gray-500 font-bold uppercase">
                        {record.account_no || record.accountNo || "N/A"}
                      </td>
                      <td className="p-4 text-right font-black text-gray-900">
                        Rs. {fmt(record.amount)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(record)}
                            title="Edit"
                            className="text-gray-400 hover:text-blue-600 p-1"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            title="Delete"
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                    <td
                      className="p-4 font-black text-gray-700 text-xs uppercase tracking-wider"
                      colSpan={4}
                    >
                      {q
                        ? `Filtered (${filtered.length} of ${data.length})`
                        : `Totals (${data.length} entries)`}
                    </td>
                    <td className="p-4 text-right font-black text-gray-900">
                      Rs. {fmt(q ? filteredTotal : totalLeasing + totalOther)}
                    </td>
                    <td className="p-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>{" "}
      {/* Modal removed to follow PoultryExpenses inline styling */}
    </div>
  );
}

// ─── TAB 2: CHEQUE TRACKER ──────────────────────────────────────────────────
function ChequeTrackerTab({
  data,
  isLoading,
  search,
  setSearch,
  onChequeAdded,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newCheque, setNewCheque] = useState({
    chequeNo: "",
    chequeDate: new Date().toISOString().split("T")[0],
    amount: "",
    payee: "",
    category: "manual",
    status: "Pending",
  });

  const handleSaveCheque = async () => {
    if (!newCheque.chequeNo || !newCheque.amount || !newCheque.payee) {
      return alert("Please fill in cheque number, amount, and payee.");
    }
    setIsSaving(true);
    try {
      await createCheque({
        chequeNo: newCheque.chequeNo,
        chequeDate: newCheque.chequeDate,
        amount: parseFloat(newCheque.amount),
        payee: newCheque.payee,
        category: newCheque.category,
        status: newCheque.status,
      });
      setIsAdding(false);
      setNewCheque({
        chequeNo: "",
        chequeDate: new Date().toISOString().split("T")[0],
        amount: "",
        payee: "",
        category: "manual",
        status: "Pending",
      });
      if (onChequeAdded) onChequeAdded();
    } catch (err) {
      console.error(err);
      alert("Error saving cheque.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div>
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            Cheque Registry
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Search for cheques issued across all farm modules.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          <div className="relative w-full md:w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search Cheque No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold outline-none focus:border-green-500 shadow-sm"
            />
          </div>
          <button
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors whitespace-nowrap w-full sm:w-auto justify-center"
          >
            <Plus size={14} /> Add Cheque
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="p-4 border-b border-gray-100 bg-gray-50/20 animate-fadeIn">
          <div className="bg-white border-2 border-green-500/30 rounded-2xl p-5 shadow-sm space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-gray-150">
              <span className="font-extrabold text-green-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Plus size={16} /> Add Cheque Entry
              </span>
              <button
                onClick={() => setIsAdding(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                disabled={isSaving}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Row 1: DATE | CATEGORY | STATUS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">
                    Cheque Date
                  </label>
                  <input
                    type="date"
                    value={newCheque.chequeDate}
                    onChange={(e) =>
                      setNewCheque({ ...newCheque, chequeDate: e.target.value })
                    }
                    className="w-full p-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-green-600 font-bold"
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={newCheque.category}
                    onChange={(e) =>
                      setNewCheque({ ...newCheque, category: e.target.value })
                    }
                    className="w-full p-2 text-xs border border-gray-300 rounded-lg outline-none bg-white focus:border-green-600 font-bold"
                    disabled={isSaving}
                  >
                    <option value="manual">Manual Entry</option>
                    <option value="advances">Advances</option>
                    <option value="salary">Salary</option>
                    <option value="expenses">Expenses</option>
                    <option value="poultry">Poultry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={newCheque.status}
                    onChange={(e) =>
                      setNewCheque({ ...newCheque, status: e.target.value })
                    }
                    className="w-full p-2 text-xs border border-gray-300 rounded-lg outline-none bg-white focus:border-green-600 font-bold"
                    disabled={isSaving}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Cleared">Cleared</option>
                  </select>
                </div>
              </div>

              {/* Row 2: PAYEE / VENDOR */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">
                  Payee / Vendor
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe / Supplier Name"
                  value={newCheque.payee}
                  onChange={(e) =>
                    setNewCheque({ ...newCheque, payee: e.target.value })
                  }
                  className="w-full p-2.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-green-600 font-bold"
                  disabled={isSaving}
                />
              </div>

              {/* Row 3: CHEQUE NO | TOTAL AMOUNT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">
                    Cheque Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CHQ-92831"
                    value={newCheque.chequeNo}
                    onChange={(e) =>
                      setNewCheque({ ...newCheque, chequeNo: e.target.value })
                    }
                    className="w-full p-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-green-600 font-bold"
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">
                    Total Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newCheque.amount}
                    onChange={(e) =>
                      setNewCheque({ ...newCheque, amount: e.target.value })
                    }
                    className="w-full p-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-green-600 font-black text-green-700"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCheque}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow"
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}{" "}
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-20">
          <Loader2 className="animate-spin mx-auto text-green-600" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4 text-left">Cheque Details</th>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Payee / Vendor</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-12 text-center text-gray-400 font-bold"
                  >
                    No cheques found.
                  </td>
                </tr>
              ) : (
                data.map((cheque) => (
                  <tr
                    key={cheque.id}
                    className="border-t border-gray-50 hover:bg-gray-50/50"
                  >
                    <td className="p-4">
                      <span className="font-black text-gray-800 bg-gray-100 px-2 py-1 rounded tracking-widest">
                        {cheque.chequeNo}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-600">
                      {cheque.cheque_date}
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      {cheque.payee}
                    </td>
                    <td className="p-4 text-gray-600 font-medium capitalize">
                      {cheque.category}
                    </td>
                    <td className="p-4 text-right font-black text-green-700">
                      Rs. {fmt(cheque.amount)}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          cheque.status === "Cleared"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {cheque.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {data.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                  <td
                    className="p-4 font-black text-gray-700 text-xs uppercase tracking-wider"
                    colSpan={4}
                  >
                    Totals ({data.length} cheques)
                  </td>
                  <td className="p-4 text-right font-black text-green-700">
                    Rs.{" "}
                    {fmt(
                      data.reduce(
                        (sum, c) => sum + (parseFloat(c.amount) || 0),
                        0,
                      ),
                    )}
                  </td>
                  <td className="p-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
