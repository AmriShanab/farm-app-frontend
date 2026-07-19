import { useState, useEffect } from "react";
import { Layers, Plus, Loader2, X, Check, CalendarClock, Skull, Pencil } from "lucide-react";
import { getPoultryBatches, createPoultryBatch, updatePoultryBatch } from "../../services/api";
import { useToast } from "../../components/ToastProvider";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Inclusive day number since a batch started: start date itself is "Day 1".
const batchDayNumber = (startDate) => {
  if (!startDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - start) / 86400000);
  return diff < 0 ? null : diff + 1;
};

export default function PoultryBatches() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const [newRow, setNewRow] = useState({
    date: new Date().toISOString().split("T")[0],
    supplier: "",
    notes: "",
    quantity: "",
    pricePerBird: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [editRow, setEditRow] = useState({ date: "", supplier: "", notes: "", quantity: "", pricePerBird: "" });
  const [isEditSaving, setIsEditSaving] = useState(false);

  const startEditing = (batch) => {
    setEditingId(batch.id);
    setEditRow({
      date: batch.date || "",
      supplier: batch.supplier || "",
      notes: batch.notes || "",
      quantity: String(batch.quantity || ""),
      pricePerBird: String(batch.price_per_bird || batch.pricePerBird || ""),
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditRow({ date: "", supplier: "", notes: "", quantity: "", pricePerBird: "" });
  };

  const handleEditSave = async () => {
    if (!editRow.supplier || !editRow.quantity || !editRow.pricePerBird) {
      toast.error("Fill required fields.");
      return;
    }
    setIsEditSaving(true);
    try {
      const payload = {
        date: editRow.date,
        supplier: editRow.supplier,
        notes: editRow.notes,
        quantity: parseInt(editRow.quantity, 10),
        pricePerBird: parseFloat(editRow.pricePerBird),
      };
      const updated = await updatePoultryBatch(editingId, payload);
      setData(data.map((b) => (b.id === editingId ? updated : b)));
      cancelEditing();
      toast.success("Batch updated successfully.");
    } catch {
      toast.error("Failed to update batch.");
    } finally {
      setIsEditSaving(false);
    }
  };

  useEffect(() => {
    getPoultryBatches("active")
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    if (!newRow.supplier || !newRow.quantity || !newRow.pricePerBird) {
      toast.error("Fill required fields.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        date: newRow.date,
        supplier: newRow.supplier,
        notes: newRow.notes,
        quantity: parseInt(newRow.quantity, 10),
        pricePerBird: parseFloat(newRow.pricePerBird),
      };
      const savedBatch = await createPoultryBatch(payload);
      setData([savedBatch, ...data]);
      setIsAdding(false);
      setNewRow({
        date: new Date().toISOString().split("T")[0],
        supplier: "",
        notes: "",
        quantity: "",
        pricePerBird: "",
      });
      toast.success("Batch saved successfully.");
    } catch {
      toast.error("Failed to save batch.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Nunito']">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-green-600/20">
            <Layers size={20} className="text-white" />
          </div>
          Active Batches
        </h1>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <Loader2
            className="animate-spin mx-auto text-green-600 mb-4"
            size={32}
          />
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Loading Data...
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Layers size={16} className="text-green-600" /> Active Flocks
            </h2>
            <button
              onClick={() => setIsAdding(true)}
              disabled={isAdding || editingId !== null}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:-translate-y-0.5 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
            >
              <Plus size={14} /> New Batch
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-center">Age</th>
                  <th className="p-4 text-left">Batch Details</th>
                  <th className="p-4 text-left">Supplier</th>
                  <th className="p-4 text-right">Initial Count</th>
                  <th className="p-4 text-right">Live Birds</th>
                  <th className="p-4 text-right">Cost Analysis</th>
                  <th className="p-4 text-center">Status</th>
                  {(isAdding || editingId !== null) && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {isAdding && (
                  <tr className="bg-green-50/30 border-b border-green-100">
                    <td className="p-2">
                      <input
                        type="date"
                        value={newRow.date}
                        onChange={(e) =>
                          setNewRow({ ...newRow, date: e.target.value })
                        }
                        className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                        disabled={isSaving}
                      />
                    </td>
                    <td className="p-2 text-center text-[10px] text-gray-400 font-bold">
                      —
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="e.g. Batch 06-2026"
                        value={newRow.notes}
                        onChange={(e) =>
                          setNewRow({ ...newRow, notes: e.target.value })
                        }
                        className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                        disabled={isSaving}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Supplier Name"
                        value={newRow.supplier}
                        onChange={(e) =>
                          setNewRow({ ...newRow, supplier: e.target.value })
                        }
                        className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                        disabled={isSaving}
                      />
                    </td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={newRow.quantity}
                        onChange={(e) =>
                          setNewRow({ ...newRow, quantity: e.target.value })
                        }
                        className="w-24 p-2 text-xs border border-gray-300 rounded outline-none text-right ml-auto"
                        disabled={isSaving}
                      />
                    </td>
                    <td className="p-2 text-center text-[10px] text-gray-400 font-bold">—</td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs text-gray-500 font-bold">
                          Rs.
                        </span>
                        <input
                          type="number"
                          placeholder="Rate/Bird"
                          value={newRow.pricePerBird}
                          onChange={(e) =>
                            setNewRow({
                              ...newRow,
                              pricePerBird: e.target.value,
                            })
                          }
                          className="w-20 p-2 text-xs border border-gray-300 rounded outline-none text-right"
                          disabled={isSaving}
                        />
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        Pending
                      </span>
                    </td>
                    <td className="p-2 text-right">
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
                          className="p-1.5 bg-green-600 rounded text-white shadow hover:bg-green-700"
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
                )}
                {data.length === 0 && !isAdding ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-gray-400 font-bold"
                    >
                      No active batches found.
                    </td>
                  </tr>
                ) : (
                  data.map((batch) => {
                    const price = parseFloat(
                      batch.price_per_bird || batch.pricePerBird || 0,
                    );
                    const qty = parseInt(batch.quantity || 0, 10);
                    const dayNo = batchDayNumber(batch.date);
                    const isEditing = editingId === batch.id;
                    return (
                      <tr
                        key={batch.id}
                        className={`border-t border-gray-50 ${isEditing ? "bg-amber-50/30" : "hover:bg-gray-50/50"}`}
                      >
                        <td className="p-4 font-bold text-gray-900">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editRow.date}
                              onChange={(e) => setEditRow({ ...editRow, date: e.target.value })}
                              className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                              disabled={isEditSaving}
                            />
                          ) : (
                            batch.date
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {isEditing ? (
                            dayNo != null ? (
                              <span
                                className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-md text-xs font-black"
                                title={`Started ${batch.date}`}
                              >
                                <CalendarClock size={12} /> Day {dayNo}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs font-bold">—</span>
                            )
                          ) : dayNo != null ? (
                            <span
                              className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-md text-xs font-black"
                              title={`Started ${batch.date}`}
                            >
                              <CalendarClock size={12} /> Day {dayNo}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs font-bold">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <input
                              type="text"
                              placeholder="e.g. Batch 06-2026"
                              value={editRow.notes}
                              onChange={(e) => setEditRow({ ...editRow, notes: e.target.value })}
                              className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                              disabled={isEditSaving}
                            />
                          ) : (
                            <>
                              <p className="font-bold text-gray-800">
                                {batch.notes}
                              </p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                                ID: #{batch.id}
                              </p>
                            </>
                          )}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <input
                              type="text"
                              placeholder="Supplier Name"
                              value={editRow.supplier}
                              onChange={(e) => setEditRow({ ...editRow, supplier: e.target.value })}
                              className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                              disabled={isEditSaving}
                            />
                          ) : (
                            <span className="text-gray-600">{batch.supplier}</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              placeholder="Qty"
                              value={editRow.quantity}
                              onChange={(e) => setEditRow({ ...editRow, quantity: e.target.value })}
                              className="w-24 p-2 text-xs border border-gray-300 rounded outline-none text-right ml-auto"
                              disabled={isEditSaving}
                            />
                          ) : (
                            <>
                              <span className="font-black text-gray-900">
                                {qty.toLocaleString()}
                              </span>{" "}
                              <span className="text-xs text-gray-500">Birds</span>
                            </>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {isEditing ? (
                            parseInt(batch.total_deaths || 0) > 0 ? (
                              <div>
                                <span className="font-black text-gray-900">
                                  {parseInt(batch.live_birds || qty).toLocaleString()}
                                </span>{" "}
                                <span className="text-xs text-gray-500">alive</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-bold">No deaths</span>
                            )
                          ) : parseInt(batch.total_deaths || 0) > 0 ? (
                            <div>
                              <span className="font-black text-gray-900">
                                {parseInt(batch.live_birds || qty).toLocaleString()}
                              </span>{" "}
                              <span className="text-xs text-gray-500">alive</span>
                              <p className="text-[10px] text-red-500 font-bold flex items-center justify-end gap-1 mt-0.5">
                                <Skull size={10} /> {parseInt(batch.total_deaths).toLocaleString()} deaths
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 font-bold">No deaths</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-xs text-gray-500 font-bold">Rs.</span>
                              <input
                                type="number"
                                placeholder="Rate/Bird"
                                value={editRow.pricePerBird}
                                onChange={(e) => setEditRow({ ...editRow, pricePerBird: e.target.value })}
                                className="w-20 p-2 text-xs border border-gray-300 rounded outline-none text-right"
                                disabled={isEditSaving}
                              />
                            </div>
                          ) : (
                            <>
                              <p className="font-black text-green-700">
                                Rs. {fmt(price * qty)}
                              </p>
                              <p className="text-[10px] text-gray-500 font-bold">
                                @ Rs. {fmt(price)} / Bird
                              </p>
                            </>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                            {batch.status}
                          </span>
                        </td>
                        {(isAdding || editingId !== null) && (
                          <td className="p-4 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={cancelEditing}
                                  disabled={isEditSaving}
                                  className="p-1.5 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"
                                >
                                  <X size={14} />
                                </button>
                                <button
                                  onClick={handleEditSave}
                                  disabled={isEditSaving}
                                  className="p-1.5 bg-green-600 rounded text-white shadow hover:bg-green-700"
                                >
                                  {isEditSaving ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Check size={14} />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditing(batch)}
                                disabled={isAdding || (editingId !== null && editingId !== batch.id)}
                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Edit batch"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
              {data.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                    <td className="p-4 font-black text-gray-700 text-xs uppercase tracking-wider" colSpan={2}>Totals</td>
                    <td className="p-4"></td>
                    <td className="p-4"></td>
                    <td className="p-4 text-right font-black text-gray-900">
                      {data.reduce((sum, b) => sum + parseInt(b.quantity || 0, 10), 0).toLocaleString()} <span className="text-xs text-gray-500 font-bold">Birds</span>
                    </td>
                    <td className="p-4 text-right font-black text-gray-900">
                      {data.reduce((sum, b) => sum + parseInt(b.live_birds || b.quantity || 0, 10), 0).toLocaleString()} <span className="text-xs text-gray-500 font-bold">alive</span>
                    </td>
                    <td className="p-4 text-right font-black text-green-700">
                      Rs. {fmt(data.reduce((sum, b) => sum + (parseInt(b.quantity || 0, 10) * parseFloat(b.price_per_bird || b.pricePerBird || 0)), 0))}
                    </td>
                    <td className="p-4"></td>
                    {(isAdding || editingId !== null) && <td></td>}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
