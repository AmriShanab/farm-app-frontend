import { useState, useEffect } from "react";
import { Receipt, Plus, Loader2, X, Check, Trash2, Pencil } from "lucide-react";
import {
  getPoultryBatches,
  getPoultryExpenses,
  createPoultryExpense,
  deletePoultryExpense,
  updatePoultryExpense,
} from "../../services/api";
import { useToast } from "../../components/ToastProvider";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PoultryExpenses() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [data, setData] = useState([]);

  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editRow, setEditRow] = useState({ date: "", description: "", amount: "" });
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    getPoultryBatches("active")
      .then((res) => {
        setBatches(res);
        if (res.length > 0) {
          setSelectedBatchId(res[0].id);
        } else {
          setIsLoading(false);
        }
      })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      setIsLoading(true);
      getPoultryExpenses(selectedBatchId)
        .then(setData)
        .catch(() => setData([]))
        .finally(() => setIsLoading(false));
    }
  }, [selectedBatchId]);

  const [newRow, setNewRow] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
  });

  const handleSave = async () => {
    if (!newRow.description || !newRow.amount) {
      toast.error("Please fill description and amount.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        date: newRow.date,
        batch_id: parseInt(selectedBatchId),
        description: newRow.description,
        amount: parseFloat(newRow.amount),
      };
      const saved = await createPoultryExpense(payload);
      setData([saved, ...data]);
      setIsAdding(false);
      setNewRow({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
      });
      toast.success("Expense saved.");
    } catch {
      toast.error("Failed to save expense.");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (row) => {
    setEditingId(row.id);
    setEditRow({
      date: row.date || "",
      description: row.description || "",
      amount: row.amount || "",
    });
  };

  const handleEditSave = async () => {
    if (!editRow.description || !editRow.amount) {
      toast.error("Please fill description and amount.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        date: editRow.date,
        description: editRow.description,
        amount: parseFloat(editRow.amount),
      };
      const updated = await updatePoultryExpense(editingId, payload);
      setData(data.map((item) => (item.id === editingId ? updated : item)));
      setEditingId(null);
      toast.success("Expense updated.");
    } catch {
      toast.error("Failed to update expense.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this expense?")) {
      try {
        await deletePoultryExpense(id);
        setData(data.filter((item) => item.id !== id));
        toast.success("Expense deleted.");
      } catch {
        toast.error("Delete failed.");
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Nunito']">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Receipt size={20} className="text-white" />
          </div>
          Additional Expenses
        </h1>
      </div>

      {batches.length === 0 && !isLoading ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-sm text-gray-500">
            Create a bird batch before recording expenses.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <Receipt size={16} className="text-orange-600" />
              <h2 className="font-bold text-gray-800">Expense Ledger</h2>
              {batches.length > 0 && (
                <select
                  value={selectedBatchId}
                  onChange={(e) => {
                    if (selectedBatchId !== e.target.value) {
                      setIsLoading(true);
                      setSelectedBatchId(e.target.value);
                    }
                  }}
                  className="ml-2 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      Batch {b.notes || `#${b.id}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <button
              onClick={() => setIsAdding(true)}
              disabled={isAdding || editingId !== null || batches.length === 0}
              className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:-translate-y-0.5 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
            >
              <Plus size={14} /> Add Expense
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-10">
              <Loader2 className="animate-spin mx-auto text-orange-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Description</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {isAdding && (
                    <tr className="bg-orange-50/30 border-b border-orange-100 align-top">
                      <td className="p-3">
                        <input
                          type="date"
                          value={newRow.date}
                          onChange={(e) => setNewRow({ ...newRow, date: e.target.value })}
                          className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                          disabled={isSaving}
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          placeholder="e.g. Transport cost, Labour charge"
                          value={newRow.description}
                          onChange={(e) => setNewRow({ ...newRow, description: e.target.value })}
                          className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                          disabled={isSaving}
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          placeholder="Amount"
                          value={newRow.amount}
                          onChange={(e) => setNewRow({ ...newRow, amount: e.target.value })}
                          className="w-full p-2 text-xs border border-gray-300 rounded outline-none text-right"
                          disabled={isSaving}
                        />
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setIsAdding(false)}
                            disabled={isSaving}
                            className="p-1.5 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"
                          >
                            <X size={14} />
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="p-1.5 bg-orange-500 rounded text-white shadow hover:bg-orange-600"
                          >
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {data.length === 0 && !isAdding && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400 font-bold">
                        No additional expenses recorded.
                      </td>
                    </tr>
                  )}
                  {data.map((row) => {
                    if (editingId === row.id) {
                      return (
                        <tr key={row.id} className="bg-amber-50/30 border-b border-amber-100 align-top">
                          <td className="p-3">
                            <input
                              type="date"
                              value={editRow.date}
                              onChange={(e) => setEditRow({ ...editRow, date: e.target.value })}
                              className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                              disabled={isSaving}
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={editRow.description}
                              onChange={(e) => setEditRow({ ...editRow, description: e.target.value })}
                              className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                              disabled={isSaving}
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={editRow.amount}
                              onChange={(e) => setEditRow({ ...editRow, amount: e.target.value })}
                              className="w-full p-2 text-xs border border-gray-300 rounded outline-none text-right"
                              disabled={isSaving}
                            />
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingId(null)}
                                disabled={isSaving}
                                className="p-1.5 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"
                              >
                                <X size={14} />
                              </button>
                              <button
                                onClick={handleEditSave}
                                disabled={isSaving}
                                className="p-1.5 bg-green-600 rounded text-white shadow hover:bg-green-700"
                              >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                        <td className="p-4 font-bold text-gray-900">{row.date}</td>
                        <td className="p-4 font-bold text-gray-800">{row.description}</td>
                        <td className="p-4 text-right font-black text-gray-900">Rs. {fmt(row.amount)}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => startEditing(row)}
                              disabled={isAdding || editingId !== null}
                              className="text-gray-400 hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(row.id)}
                              disabled={isAdding || editingId !== null}
                              className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {data.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                      <td className="p-4 font-black text-gray-700 text-xs uppercase tracking-wider">Total</td>
                      <td className="p-4 text-xs text-gray-700 font-bold">{data.length} entries</td>
                      <td className="p-4 text-right font-black text-gray-900">
                        Rs. {fmt(data.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0))}
                      </td>
                      <td className="p-4"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
