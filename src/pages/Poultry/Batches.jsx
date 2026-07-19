import { useState, useEffect } from "react";
import { Layers, Plus, Loader2, X, Check, CalendarClock, Skull, Pencil } from "lucide-react";
import { getPoultryBatches, createPoultryBatch, updatePoultryBatch } from "../../services/api";
import { useToast } from "../../components/ToastProvider";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const batchDayNumber = (startDate) => {
  if (!startDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - start) / 86400000);
  return diff < 0 ? null : diff + 1;
};

const EMPTY_ROW = {
  date: new Date().toISOString().split("T")[0],
  supplier: "",
  notes: "",
  quantity: "",
  pricePerBird: "",
  paidAmount: "",
};

export default function PoultryBatches() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const [newRow, setNewRow] = useState(EMPTY_ROW);

  const [editingId, setEditingId] = useState(null);
  const [editRow, setEditRow] = useState(EMPTY_ROW);
  const [isEditSaving, setIsEditSaving] = useState(false);

  const startEditing = (batch) => {
    setIsAdding(false);
    setEditingId(batch.id);
    setEditRow({
      date: batch.date || "",
      supplier: batch.supplier || "",
      notes: batch.notes || "",
      quantity: String(batch.quantity || ""),
      pricePerBird: String(batch.price_per_bird || batch.pricePerBird || ""),
      paidAmount: String(batch.paid_amount ?? "0"),
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditRow(EMPTY_ROW);
  };

  const handleEditSave = async () => {
    if (!editRow.supplier || !editRow.quantity || !editRow.pricePerBird) {
      toast.error("Supplier, quantity and rate are required.");
      return;
    }
    setIsEditSaving(true);
    try {
      const updated = await updatePoultryBatch(editingId, {
        date: editRow.date,
        supplier: editRow.supplier,
        notes: editRow.notes,
        quantity: parseInt(editRow.quantity, 10),
        pricePerBird: parseFloat(editRow.pricePerBird),
        paidAmount: parseFloat(editRow.paidAmount || 0),
      });
      setData(data.map((b) => (b.id === editingId ? updated : b)));
      cancelEditing();
      toast.success("Batch updated.");
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
      toast.error("Supplier, quantity and rate are required.");
      return;
    }
    setIsSaving(true);
    try {
      const saved = await createPoultryBatch({
        date: newRow.date,
        supplier: newRow.supplier,
        notes: newRow.notes,
        quantity: parseInt(newRow.quantity, 10),
        pricePerBird: parseFloat(newRow.pricePerBird),
        paidAmount: parseFloat(newRow.paidAmount || 0),
      });
      setData([saved, ...data]);
      setIsAdding(false);
      setNewRow(EMPTY_ROW);
      toast.success("Batch saved.");
    } catch {
      toast.error("Failed to save batch.");
    } finally {
      setIsSaving(false);
    }
  };

  const totals = data.reduce(
    (acc, b) => {
      const qty = parseInt(b.quantity || 0, 10);
      const price = parseFloat(b.price_per_bird || b.pricePerBird || 0);
      const paid = parseFloat(b.paid_amount || 0);
      acc.qty += qty;
      acc.live += parseInt(b.live_birds || qty, 10);
      acc.cost += qty * price;
      acc.paid += paid;
      acc.balance += qty * price - paid;
      return acc;
    },
    { qty: 0, live: 0, cost: 0, paid: 0, balance: 0 },
  );

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
          <Loader2 className="animate-spin mx-auto text-green-600 mb-4" size={32} />
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Loading Data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Layers size={16} className="text-green-600" /> Active Flocks
            </h2>
            <button
              onClick={() => { setIsAdding(true); cancelEditing(); }}
              disabled={isAdding}
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
                  <th className="p-4 text-right">Batch Cost</th>
                  <th className="p-4 text-right">Paid</th>
                  <th className="p-4 text-right">Payable</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* ADD ROW */}
                {isAdding && (
                  <tr className="bg-green-50/30 border-b border-green-100">
                    <td className="p-2">
                      <input type="date" value={newRow.date}
                        onChange={(e) => setNewRow({ ...newRow, date: e.target.value })}
                        className="w-full p-2 text-xs border border-gray-300 rounded outline-none" disabled={isSaving} />
                    </td>
                    <td className="p-2 text-center text-[10px] text-gray-400 font-bold">—</td>
                    <td className="p-2">
                      <input type="text" placeholder="e.g. Batch 06-2026" value={newRow.notes}
                        onChange={(e) => setNewRow({ ...newRow, notes: e.target.value })}
                        className="w-full p-2 text-xs border border-gray-300 rounded outline-none" disabled={isSaving} />
                    </td>
                    <td className="p-2">
                      <input type="text" placeholder="Supplier Name" value={newRow.supplier}
                        onChange={(e) => setNewRow({ ...newRow, supplier: e.target.value })}
                        className="w-full p-2 text-xs border border-gray-300 rounded outline-none" disabled={isSaving} />
                    </td>
                    <td className="p-2">
                      <input type="number" placeholder="Qty" value={newRow.quantity}
                        onChange={(e) => setNewRow({ ...newRow, quantity: e.target.value })}
                        className="w-24 p-2 text-xs border border-gray-300 rounded outline-none text-right ml-auto block" disabled={isSaving} />
                    </td>
                    <td className="p-2 text-center text-[10px] text-gray-400 font-bold">—</td>
                    <td className="p-2">
                      <input type="number" placeholder="Rate/Bird" value={newRow.pricePerBird}
                        onChange={(e) => setNewRow({ ...newRow, pricePerBird: e.target.value })}
                        className="w-24 p-2 text-xs border border-gray-300 rounded outline-none text-right ml-auto block" disabled={isSaving} />
                    </td>
                    <td className="p-2">
                      <input type="number" placeholder="0.00" value={newRow.paidAmount}
                        onChange={(e) => setNewRow({ ...newRow, paidAmount: e.target.value })}
                        className="w-24 p-2 text-xs border border-green-300 rounded outline-none text-right ml-auto block" disabled={isSaving} />
                    </td>
                    <td className="p-2 text-center text-[10px] text-gray-400 font-bold">—</td>
                    <td className="p-2 text-center"><span className="text-[10px] font-bold text-gray-400 uppercase">Pending</span></td>
                    <td className="p-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAdding(false)} disabled={isSaving}
                          className="p-1.5 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"><X size={14} /></button>
                        <button onClick={handleSave} disabled={isSaving}
                          className="p-1.5 bg-green-600 rounded text-white shadow hover:bg-green-700">
                          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {data.length === 0 && !isAdding ? (
                  <tr>
                    <td colSpan={11} className="p-6 text-center text-gray-400 font-bold">No active batches found.</td>
                  </tr>
                ) : (
                  data.map((batch) => {
                    const price = parseFloat(batch.price_per_bird || batch.pricePerBird || 0);
                    const qty = parseInt(batch.quantity || 0, 10);
                    const paid = parseFloat(batch.paid_amount || 0);
                    const totalCost = parseFloat(batch.total_cost ?? qty * price);
                    const payable = parseFloat(batch.payable_balance ?? totalCost - paid);
                    const dayNo = batchDayNumber(batch.date);
                    const isEditing = editingId === batch.id;

                    return (
                      <tr key={batch.id}
                        className={`border-t border-gray-50 ${isEditing ? "bg-amber-50/30" : "hover:bg-gray-50/50"}`}>

                        {/* DATE */}
                        <td className="p-4 font-bold text-gray-900">
                          {isEditing
                            ? <input type="date" value={editRow.date}
                                onChange={(e) => setEditRow({ ...editRow, date: e.target.value })}
                                className="w-full p-2 text-xs border border-gray-300 rounded outline-none" disabled={isEditSaving} />
                            : batch.date}
                        </td>

                        {/* AGE */}
                        <td className="p-4 text-center">
                          {dayNo != null
                            ? <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-md text-xs font-black">
                                <CalendarClock size={12} /> Day {dayNo}
                              </span>
                            : <span className="text-gray-400 text-xs font-bold">—</span>}
                        </td>

                        {/* BATCH DETAILS */}
                        <td className="p-4">
                          {isEditing
                            ? <input type="text" placeholder="e.g. Batch 06-2026" value={editRow.notes}
                                onChange={(e) => setEditRow({ ...editRow, notes: e.target.value })}
                                className="w-full p-2 text-xs border border-gray-300 rounded outline-none" disabled={isEditSaving} />
                            : <>
                                <p className="font-bold text-gray-800">{batch.notes}</p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">ID: #{batch.id}</p>
                              </>}
                        </td>

                        {/* SUPPLIER */}
                        <td className="p-4">
                          {isEditing
                            ? <input type="text" placeholder="Supplier Name" value={editRow.supplier}
                                onChange={(e) => setEditRow({ ...editRow, supplier: e.target.value })}
                                className="w-full p-2 text-xs border border-gray-300 rounded outline-none" disabled={isEditSaving} />
                            : <span className="text-gray-600">{batch.supplier}</span>}
                        </td>

                        {/* INITIAL COUNT */}
                        <td className="p-4 text-right">
                          {isEditing
                            ? <input type="number" placeholder="Qty" value={editRow.quantity}
                                onChange={(e) => setEditRow({ ...editRow, quantity: e.target.value })}
                                className="w-24 p-2 text-xs border border-gray-300 rounded outline-none text-right ml-auto block" disabled={isEditSaving} />
                            : <><span className="font-black text-gray-900">{qty.toLocaleString()}</span>{" "}<span className="text-xs text-gray-500">Birds</span></>}
                        </td>

                        {/* LIVE BIRDS */}
                        <td className="p-4 text-right">
                          {parseInt(batch.total_deaths || 0) > 0
                            ? <div>
                                <span className="font-black text-gray-900">{parseInt(batch.live_birds || qty).toLocaleString()}</span>{" "}
                                <span className="text-xs text-gray-500">alive</span>
                                <p className="text-[10px] text-red-500 font-bold flex items-center justify-end gap-1 mt-0.5">
                                  <Skull size={10} /> {parseInt(batch.total_deaths).toLocaleString()} deaths
                                </p>
                              </div>
                            : <span className="text-xs text-gray-400 font-bold">No deaths</span>}
                        </td>

                        {/* BATCH COST (total) */}
                        <td className="p-4 text-right">
                          {isEditing
                            ? <input type="number" placeholder="Rate/Bird" value={editRow.pricePerBird}
                                onChange={(e) => setEditRow({ ...editRow, pricePerBird: e.target.value })}
                                className="w-24 p-2 text-xs border border-gray-300 rounded outline-none text-right ml-auto block" disabled={isEditSaving} />
                            : <>
                                <p className="font-black text-gray-900">Rs. {fmt(totalCost)}</p>
                                <p className="text-[10px] text-gray-500 font-bold">@ Rs. {fmt(price)} / Bird</p>
                              </>}
                        </td>

                        {/* PAID */}
                        <td className="p-4 text-right">
                          {isEditing
                            ? <input type="number" placeholder="0.00" value={editRow.paidAmount}
                                onChange={(e) => setEditRow({ ...editRow, paidAmount: e.target.value })}
                                className="w-24 p-2 text-xs border border-green-300 rounded outline-none text-right ml-auto block" disabled={isEditSaving} />
                            : <span className="font-bold text-green-700">Rs. {fmt(paid)}</span>}
                        </td>

                        {/* PAYABLE BALANCE */}
                        <td className="p-4 text-right">
                          {isEditing
                            ? <span className="text-[10px] text-gray-400 font-bold">auto</span>
                            : <span className={`font-bold ${payable > 0 ? "text-red-600" : "text-gray-400"}`}>
                                Rs. {fmt(payable)}
                              </span>}
                        </td>

                        {/* STATUS */}
                        <td className="p-4 text-center">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                            {batch.status}
                          </span>
                        </td>

                        {/* ACTIONS — always visible */}
                        <td className="p-4 text-right">
                          {isEditing
                            ? <div className="flex justify-end gap-2">
                                <button onClick={cancelEditing} disabled={isEditSaving}
                                  className="p-1.5 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"><X size={14} /></button>
                                <button onClick={handleEditSave} disabled={isEditSaving}
                                  className="p-1.5 bg-green-600 rounded text-white shadow hover:bg-green-700">
                                  {isEditSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                </button>
                              </div>
                            : <button onClick={() => startEditing(batch)}
                                disabled={isAdding || (editingId !== null && editingId !== batch.id)}
                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Edit batch">
                                <Pencil size={14} />
                              </button>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {data.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                    <td className="p-4 font-black text-gray-700 text-xs uppercase tracking-wider" colSpan={4}>Totals</td>
                    <td className="p-4 text-right font-black text-gray-900">
                      {totals.qty.toLocaleString()} <span className="text-xs text-gray-500 font-bold">Birds</span>
                    </td>
                    <td className="p-4 text-right font-black text-gray-900">
                      {totals.live.toLocaleString()} <span className="text-xs text-gray-500 font-bold">alive</span>
                    </td>
                    <td className="p-4 text-right font-black text-gray-900">Rs. {fmt(totals.cost)}</td>
                    <td className="p-4 text-right font-black text-green-700">Rs. {fmt(totals.paid)}</td>
                    <td className="p-4 text-right font-black text-red-600">Rs. {fmt(totals.balance)}</td>
                    <td className="p-4" colSpan={2}></td>
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
