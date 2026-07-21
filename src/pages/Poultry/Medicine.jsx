import { useState, useEffect } from "react";
import { Pill, Plus, Loader2, X, Check, Trash2, Pencil } from "lucide-react";
import {
  getPoultryBatches,
  getPoultryMedicine,
  createPoultryMedicine,
  updatePoultryMedicine,
  deletePoultryMedicine,
} from "../../services/api";
import { useToast } from "../../components/ToastProvider";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PoultryMedicine() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [data, setData] = useState([]);

  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editRow, setEditRow] = useState({});
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
      getPoultryMedicine(selectedBatchId)
        .then(setData)
        .catch(() => setData([]))
        .finally(() => setIsLoading(false));
    }
  }, [selectedBatchId]);

  const [newRow, setNewRow] = useState({
    date: new Date().toISOString().split("T")[0],
    medicineName: "",
    quantity: "",
    ratePerUnit: "",
    paidAmount: "",
    chequeNo: "",
    chequeDate: "",
  });

  const handleSave = async () => {
    if (!newRow.medicineName || !newRow.quantity || !newRow.ratePerUnit) {
      toast.error("Please fill required fields.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        date: newRow.date,
        batchId: parseInt(selectedBatchId),
        medicineName: newRow.medicineName,
        quantity: parseFloat(newRow.quantity),
        ratePerUnit: parseFloat(newRow.ratePerUnit),
        paidAmount: parseFloat(newRow.paidAmount || 0),
        chequeNo: newRow.chequeNo || "",
        chequeDate: newRow.chequeDate || null,
      };
      const saved = await createPoultryMedicine(payload);
      setData([saved, ...data]);
      setIsAdding(false);
      setNewRow({
        date: new Date().toISOString().split("T")[0],
        medicineName: "",
        quantity: "",
        ratePerUnit: "",
        paidAmount: "",
        chequeNo: "",
        chequeDate: "",
      });
      toast.success("Medicine record saved.");
    } catch {
      toast.error("Failed to save medicine record.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this medicine record?")) {
      try {
        await deletePoultryMedicine(id);
        setData(data.filter((item) => item.id !== id));
        toast.success("Medicine record deleted.");
      } catch {
        toast.error("Delete failed.");
      }
    }
  };

  const startEditing = (row) => {
    setEditingId(row.id);
    setEditRow({
      date: row.date,
      medicineName: row.medicine_name,
      quantity: row.quantity,
      ratePerUnit: row.rate_per_unit,
      paidAmount: row.paid_amount,
      chequeNo: row.cheque_no || "",
      chequeDate: row.cheque_date || "",
    });
  };

  const handleEditSave = async () => {
    if (!editRow.medicineName || !editRow.quantity || !editRow.ratePerUnit) {
      toast.error("Please fill required fields.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        medicineName: editRow.medicineName,
        quantity: parseFloat(editRow.quantity),
        ratePerUnit: parseFloat(editRow.ratePerUnit),
        paidAmount: parseFloat(editRow.paidAmount || 0),
        chequeNo: editRow.chequeNo || "",
        chequeDate: editRow.chequeDate || null,
      };
      const updated = await updatePoultryMedicine(editingId, payload);
      setData(data.map((item) => (item.id === editingId ? updated : item)));
      setEditingId(null);
      setEditRow({});
      toast.success("Medicine record updated.");
    } catch {
      toast.error("Failed to update medicine record.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditRow({});
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Nunito']">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-green-600/20">
            <Pill size={20} className="text-white" />
          </div>
          Medicine & Veterinary
        </h1>
      </div>

      {batches.length === 0 && !isLoading ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-sm text-gray-500">Create a bird batch before recording medicine.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <Pill size={16} className="text-green-600" />
              <h2 className="font-bold text-gray-800">Medicine Ledger</h2>
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
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:-translate-y-0.5 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
            >
              <Plus size={14} /> Add Medicine
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-10">
              <Loader2 className="animate-spin mx-auto text-green-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Medicine Details</th>
                    <th className="p-4 text-right">Cost</th>
                    <th className="p-4 text-right">Cash Paid</th>
                    <th className="p-4 text-right">Payable Bal.</th>
                    <th className="p-4 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {isAdding && (
                    <tr className="bg-green-50/30 border-b border-green-100 align-top">
                      <td className="p-3">
                        <input
                          type="date"
                          value={newRow.date}
                          onChange={(e) => setNewRow({ ...newRow, date: e.target.value })}
                          className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                          disabled={isSaving}
                        />
                      </td>
                      <td className="p-3 space-y-2">
                        <input
                          type="text"
                          placeholder="e.g. Vitamin supplement"
                          value={newRow.medicineName}
                          onChange={(e) => setNewRow({ ...newRow, medicineName: e.target.value })}
                          className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                          disabled={isSaving}
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={newRow.quantity}
                            onChange={(e) => setNewRow({ ...newRow, quantity: e.target.value })}
                            className="w-1/2 p-2 text-xs border border-gray-300 rounded outline-none"
                            disabled={isSaving}
                          />
                          <input
                            type="number"
                            placeholder="Rate"
                            value={newRow.ratePerUnit}
                            onChange={(e) => setNewRow({ ...newRow, ratePerUnit: e.target.value })}
                            className="w-1/2 p-2 text-xs border border-gray-300 rounded outline-none"
                            disabled={isSaving}
                          />
                        </div>
                      </td>
                      <td className="p-3 text-right pt-5 font-bold text-gray-800">
                        Rs. {fmt((parseFloat(newRow.quantity) || 0) * (parseFloat(newRow.ratePerUnit) || 0))}
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          placeholder="Cash Paid"
                          value={newRow.paidAmount}
                          onChange={(e) => setNewRow({ ...newRow, paidAmount: e.target.value })}
                          className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                          disabled={isSaving}
                        />
                      </td>
                      <td className="p-3 text-right pt-5 font-black text-red-600">
                        Rs. {fmt(
                          (parseFloat(newRow.quantity) || 0) * (parseFloat(newRow.ratePerUnit) || 0) -
                          (parseFloat(newRow.paidAmount) || 0)
                        )}
                      </td>
                      <td className="p-3 text-right pt-5">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setIsAdding(false)} disabled={isSaving} className="p-1.5 bg-gray-200 rounded text-gray-600 hover:bg-gray-300">
                            <X size={14} />
                          </button>
                          <button onClick={handleSave} disabled={isSaving} className="p-1.5 bg-green-600 rounded text-white shadow hover:bg-green-700">
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {data.length === 0 && !isAdding && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 font-bold">
                        No medicine records found.
                      </td>
                    </tr>
                  )}
                  {data.map((row) => {
                    const qty = parseFloat(row.quantity || 0);
                    const rate = parseFloat(row.rate_per_unit || 0);

                    if (editingId === row.id) {
                      return (
                        <tr key={row.id} className="bg-green-50/30 border-b border-green-100 align-top">
                          <td className="p-3">
                            <input
                              type="date"
                              value={editRow.date}
                              onChange={(e) => setEditRow({ ...editRow, date: e.target.value })}
                              className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                              disabled={isSaving}
                            />
                          </td>
                          <td className="p-3 space-y-2">
                            <input
                              type="text"
                              placeholder="e.g. Vitamin supplement"
                              value={editRow.medicineName}
                              onChange={(e) => setEditRow({ ...editRow, medicineName: e.target.value })}
                              className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                              disabled={isSaving}
                            />
                            <div className="flex gap-2">
                              <input
                                type="number"
                                placeholder="Qty"
                                value={editRow.quantity}
                                onChange={(e) => setEditRow({ ...editRow, quantity: e.target.value })}
                                className="w-1/2 p-2 text-xs border border-gray-300 rounded outline-none"
                                disabled={isSaving}
                              />
                              <input
                                type="number"
                                placeholder="Rate"
                                value={editRow.ratePerUnit}
                                onChange={(e) => setEditRow({ ...editRow, ratePerUnit: e.target.value })}
                                className="w-1/2 p-2 text-xs border border-gray-300 rounded outline-none"
                                disabled={isSaving}
                              />
                            </div>
                          </td>
                          <td className="p-3 text-right pt-5 font-bold text-gray-800">
                            Rs. {fmt((parseFloat(editRow.quantity) || 0) * (parseFloat(editRow.ratePerUnit) || 0))}
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              placeholder="Cash Paid"
                              value={editRow.paidAmount}
                              onChange={(e) => setEditRow({ ...editRow, paidAmount: e.target.value })}
                              className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                              disabled={isSaving}
                            />
                          </td>
                          <td className="p-3 text-right pt-5 font-black text-red-600">
                            Rs. {fmt(
                              (parseFloat(editRow.quantity) || 0) * (parseFloat(editRow.ratePerUnit) || 0) -
                              (parseFloat(editRow.paidAmount) || 0)
                            )}
                          </td>
                          <td className="p-3 text-right pt-5">
                            <div className="flex justify-end gap-2">
                              <button onClick={handleEditCancel} disabled={isSaving} className="p-1.5 bg-gray-200 rounded text-gray-600 hover:bg-gray-300">
                                <X size={14} />
                              </button>
                              <button onClick={handleEditSave} disabled={isSaving} className="p-1.5 bg-green-600 rounded text-white shadow hover:bg-green-700">
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                        <td className="p-4 font-bold text-gray-900">
                          {row.date}
                          {row.day_count != null && (
                            <span className="block text-[10px] font-bold text-amber-600 mt-0.5">
                              Day {row.day_count}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-gray-800">{row.medicine_name}</p>
                          <p className="text-xs text-gray-500">{qty} units @ Rs. {fmt(rate)}</p>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-black text-gray-900">Rs. {fmt(qty * rate)}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-bold text-green-700">Rs. {fmt(row.paid_amount)}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className={`font-black ${parseFloat(row.payable_balance) > 0 ? "text-red-600" : "text-gray-400"}`}>
                            Rs. {fmt(row.payable_balance)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => startEditing(row)}
                              disabled={isAdding || editingId !== null}
                              className="text-gray-400 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
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
                      <td className="p-4 font-black text-gray-700 text-xs uppercase tracking-wider">Totals</td>
                      <td className="p-4 text-xs text-gray-700 font-bold">
                        {data.reduce((sum, l) => sum + parseFloat(l.quantity || 0), 0)} units
                      </td>
                      <td className="p-4 text-right font-black text-gray-900">
                        Rs. {fmt(data.reduce((sum, l) => sum + (parseFloat(l.quantity || 0) * parseFloat(l.rate_per_unit || 0)), 0))}
                      </td>
                      <td className="p-4 text-right font-bold text-green-700">
                        Rs. {fmt(data.reduce((sum, l) => sum + parseFloat(l.paid_amount || 0), 0))}
                      </td>
                      <td className="p-4 text-right font-black text-red-600">
                        Rs. {fmt(data.reduce((sum, l) => sum + parseFloat(l.payable_balance || 0), 0))}
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
