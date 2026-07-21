import { useState, useEffect } from "react";
import { Skull, Plus, Loader2, Trash2, Pencil, Check, X, Bird } from "lucide-react";
import {
  getPoultryBatches,
  getPoultryMortality,
  savePoultryMortality,
  updatePoultryMortality,
  deletePoultryMortality,
} from "../../services/api";
import { useToast } from "../../components/ToastProvider";

export default function PoultryMortality() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState({ date: new Date().toISOString().split("T")[0], count: "", notes: "" });

  const [editingId, setEditingId] = useState(null);
  const [editRow, setEditRow] = useState({ count: "", notes: "" });

  const toast = useToast();

  useEffect(() => {
    getPoultryBatches("active")
      .then((res) => {
        setBatches(res);
        if (res.length > 0) setSelectedBatchId(String(res[0].id));
        else setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedBatchId) return;
    setIsLoading(true);
    getPoultryMortality(selectedBatchId, null)
      .then((res) => setRecords(res || []))
      .catch(() => setRecords([]))
      .finally(() => setIsLoading(false));
  }, [selectedBatchId]);

  const totalDeaths = records.reduce((s, r) => s + parseInt(r.count || 0, 10), 0);
  const selectedBatch = batches.find((b) => String(b.id) === selectedBatchId);

  const handleAdd = async () => {
    if (!newRow.date || !newRow.count || parseInt(newRow.count, 10) < 0) {
      toast.error("Date and count are required.");
      return;
    }
    setIsSaving(true);
    try {
      await savePoultryMortality({
        date: newRow.date,
        records: [{ batchId: parseInt(selectedBatchId), count: parseInt(newRow.count, 10), notes: newRow.notes || null }],
      });
      const fresh = await getPoultryMortality(selectedBatchId, null);
      setRecords(fresh || []);
      setNewRow({ date: new Date().toISOString().split("T")[0], count: "", notes: "" });
      setIsAdding(false);
      toast.success("Mortality record saved.");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSave = async (id) => {
    if (editRow.count === "" || parseInt(editRow.count, 10) < 0) {
      toast.error("Count is required.");
      return;
    }
    setIsSaving(true);
    try {
      await updatePoultryMortality(id, { count: parseInt(editRow.count, 10), notes: editRow.notes || null });
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, count: editRow.count, notes: editRow.notes } : r))
      );
      setEditingId(null);
      toast.success("Updated.");
    } catch {
      toast.error("Failed to update.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this mortality record?")) return;
    try {
      await deletePoultryMortality(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      toast.success("Deleted.");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-red-700 to-red-900 rounded-lg flex items-center justify-center shadow-sm">
              <Skull size={16} color="#fca5a5" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Mortality Tracker</h1>
          </div>
          <p className="text-xs font-medium text-gray-500 pl-11">
            Record daily bird deaths per batch and view day-wise mortality report
          </p>
        </div>

        <button
          onClick={() => { setIsAdding(true); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-red-700 transition-colors"
        >
          <Plus size={16} /> Add Record
        </button>
      </div>

      {/* Batch Selector */}
      <div className="mb-4">
        <select
          value={selectedBatchId}
          onChange={(e) => setSelectedBatchId(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 bg-white shadow-sm outline-none focus:border-red-400 transition-colors"
        >
          {batches.map((b) => (
            <option key={b.id} value={String(b.id)}>
              {b.notes || `Batch #${b.id}`} — {b.quantity} birds
            </option>
          ))}
          {batches.length === 0 && <option value="">No active batches</option>}
        </select>
      </div>

      {/* Summary Cards */}
      {selectedBatch && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Total Birds</p>
            <p className="text-2xl font-black text-gray-900">{parseInt(selectedBatch.quantity || 0).toLocaleString()}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-red-400 mb-1">Total Deaths</p>
            <p className="text-2xl font-black text-red-700">{totalDeaths.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 mb-1">Mortality %</p>
            <p className="text-2xl font-black text-emerald-700">
              {selectedBatch.quantity > 0 ? ((totalDeaths / selectedBatch.quantity) * 100).toFixed(1) : "0.0"}%
            </p>
          </div>
        </div>
      )}

      {/* Add Record Form */}
      {isAdding && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={newRow.date}
              onChange={(e) => setNewRow((p) => ({ ...p, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold bg-white outline-none focus:border-red-400"
            />
          </div>
          <div className="w-28">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Deaths</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={newRow.count}
              onChange={(e) => setNewRow((p) => ({ ...p, count: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-black bg-white outline-none focus:border-red-400"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Notes (optional)</label>
            <input
              type="text"
              placeholder="e.g. disease, heat stress…"
              value={newRow.notes}
              onChange={(e) => setNewRow((p) => ({ ...p, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-red-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={isSaving}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
            <Bird size={16} className="text-red-500" />
            Day-wise Mortality Report
          </h2>
          <span className="text-xs font-bold text-gray-400">{records.length} record{records.length !== 1 ? "s" : ""}</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={24} className="animate-spin mr-2" /> Loading…
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <Skull size={32} className="text-gray-200" />
            <p className="text-sm font-bold">No mortality records for this batch</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-gray-500">Date</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-red-400 text-center">Deaths</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Notes</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, i) => (
                  <tr key={rec.id} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                    {editingId === rec.id ? (
                      <>
                        <td className="py-3 px-5 text-sm font-bold text-gray-700">
                          {new Date(rec.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          {rec.day_count != null && (
                            <span className="block text-[10px] font-bold text-amber-600 mt-0.5">
                              Day {rec.day_count}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={editRow.count}
                            onChange={(e) => setEditRow((p) => ({ ...p, count: e.target.value }))}
                            className="w-20 text-center text-sm font-black border border-red-300 rounded-lg py-1 outline-none focus:border-red-500 bg-red-50"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={editRow.notes}
                            onChange={(e) => setEditRow((p) => ({ ...p, notes: e.target.value }))}
                            className="w-full text-sm border border-gray-200 rounded-lg py-1 px-2 outline-none focus:border-red-400"
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => handleEditSave(rec.id)}
                              disabled={isSaving}
                              className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-5 text-sm font-bold text-gray-800">
                          {new Date(rec.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          {rec.day_count != null && (
                            <span className="block text-[10px] font-bold text-amber-600 mt-0.5">
                              Day {rec.day_count}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${parseInt(rec.count) > 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
                            {parseInt(rec.count || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500 font-medium">{rec.notes || "—"}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => { setEditingId(rec.id); setEditRow({ count: String(rec.count), notes: rec.notes || "" }); setIsAdding(false); }}
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(rec.id)}
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-red-50 border-t-2 border-red-100">
                  <td className="py-3 px-5 text-xs font-black uppercase tracking-wider text-red-600" colSpan={1}>Total</td>
                  <td className="py-3 px-4 text-center text-sm font-black text-red-700">{totalDeaths.toLocaleString()}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
