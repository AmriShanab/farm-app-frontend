import { useState, useEffect } from "react";
import { Egg, Plus, Loader2, X, Check, Trash2 } from "lucide-react";
import {
  getPoultryBatches,
  getPoultrySales,
  createPoultrySale,
  deletePoultrySale,
} from "../../services/api";
import { useToast } from "../../components/ToastProvider";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PoultrySales() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [data, setData] = useState([]);

  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSales, setIsLoadingSales] = useState(true);
  const toast = useToast();

  useEffect(() => {
    getPoultryBatches("active")
      .then((res) => {
        setBatches(res);
        if (res.length > 0) {
          setSelectedBatchId(res[0].id);
        } else {
          setIsLoadingSales(false);
        }
      })
      .catch(() => setIsLoadingSales(false));
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      getPoultrySales(selectedBatchId)
        .then(setData)
        .catch(() => setData([]))
        .finally(() => setIsLoadingSales(false));
    }
  }, [selectedBatchId]);

  const [newRow, setNewRow] = useState({
    date: new Date().toISOString().split("T")[0],
    buyerName: "",
    category: "chicks",
    quantity: "",
    rate: "",
    chicksSold: "",
    weightKilos: "",
    pricePerKg: "",
  });

  const getCategoryLabel = (category) => {
    if (category === "manure") return "Manure";
    return category;
  };

  const handleSave = async () => {
    if (newRow.category === "chicks") {
      if (!newRow.chicksSold || !newRow.weightKilos || !newRow.pricePerKg) {
        toast.error("Please fill chicks count, weight, and price.");
        return;
      }
    } else {
      if (!newRow.quantity || !newRow.rate) {
        toast.error("Please fill quantity and rate.");
        return;
      }
    }
    setIsSaving(true);
    try {
      let payload = {
        date: newRow.date,
        batchId: parseInt(selectedBatchId),
        category: newRow.category,
        buyerName: newRow.buyerName,
      };

      if (newRow.category === "chicks") {
        payload.chicksSold = parseInt(newRow.chicksSold);
        payload.weightKilos = parseFloat(newRow.weightKilos);
        payload.pricePerKg = parseFloat(newRow.pricePerKg);
        payload.totalPrice = payload.weightKilos * payload.pricePerKg;
      } else {
        payload.quantity = parseFloat(newRow.quantity);
        payload.rate = parseFloat(newRow.rate);
        payload.totalPrice = payload.quantity * payload.rate;
      }

      const savedSale = await createPoultrySale(payload);
      setData([savedSale, ...data]);
      setIsAdding(false);
      setNewRow({
        date: new Date().toISOString().split("T")[0],
        buyerName: "",
        category: "chicks",
        quantity: "",
        rate: "",
        chicksSold: "",
        weightKilos: "",
        pricePerKg: "",
      });
      toast.success("Poultry sale saved successfully.");
    } catch {
      toast.error("Failed to save sale.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this sale?")) {
      try {
        await deletePoultrySale(id);
        setData(data.filter((item) => item.id !== id));
        toast.success("Sale deleted.");
      } catch {
        toast.error("Delete failed.");
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Nunito']">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-green-600/20">
            <Egg size={20} className="text-white" />
          </div>
          Poultry Sales
        </h1>
      </div>

      {batches.length === 0 && !isLoadingSales ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-sm text-gray-500">
            Create a bird batch before recording sales.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <Egg size={16} className="text-green-600" />
              <h2 className="font-bold text-gray-800">Sales Ledger</h2>
              {batches.length > 0 && (
                <select
                  value={selectedBatchId}
                  onChange={(e) => {
                    if (selectedBatchId !== e.target.value) {
                      setIsLoadingSales(true);
                      setSelectedBatchId(e.target.value);
                    }
                  }}
                  className="ml-2 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer focus:border-green-500"
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
              disabled={isAdding || batches.length === 0}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:-translate-y-0.5 transition-transform flex items-center gap-2 disabled:opacity-50"
            >
              <Plus size={14} /> Add Sale
            </button>
          </div>

          {isLoadingSales ? (
            <div className="text-center py-10">
              <Loader2 className="animate-spin mx-auto text-green-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Buyer</th>
                    <th className="p-4 text-left">Category</th>
                    <th className="p-4 text-right">Details</th>
                    <th className="p-4 text-right">Pricing</th>
                    <th className="p-4 text-right">Total Revenue</th>
                    <th className="p-4 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {isAdding && (
                    <tr className="bg-green-50/30 border-b border-green-100">
                      <td className="p-2 align-top pt-3">
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
                      <td className="p-2 align-top pt-3">
                        <input
                          type="text"
                          placeholder="Buyer Name"
                          value={newRow.buyerName}
                          onChange={(e) =>
                            setNewRow({ ...newRow, buyerName: e.target.value })
                          }
                          className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                          disabled={isSaving}
                        />
                      </td>
                      <td className="p-2 align-top pt-3">
                        <select
                          value={newRow.category}
                          onChange={(e) =>
                            setNewRow({ ...newRow, category: e.target.value })
                          }
                          className="w-full p-2 text-xs border border-gray-300 rounded outline-none bg-white"
                          disabled={isSaving}
                        >
                          <option value="chicks">Chicks</option>
                          <option value="manure">Manure</option>
                        </select>
                      </td>
                      <td className="p-2 text-right align-top pt-3">
                        {newRow.category === "chicks" ? (
                          <div className="flex flex-col gap-2 items-end">
                            <input
                              type="number"
                              placeholder="Chicks"
                              value={newRow.chicksSold}
                              onChange={(e) =>
                                setNewRow({
                                  ...newRow,
                                  chicksSold: e.target.value,
                                })
                              }
                              className="w-24 p-2 text-xs border border-gray-300 rounded outline-none text-right"
                              disabled={isSaving}
                            />
                            <input
                              type="number"
                              placeholder="Weight (Kg)"
                              value={newRow.weightKilos}
                              onChange={(e) =>
                                setNewRow({
                                  ...newRow,
                                  weightKilos: e.target.value,
                                })
                              }
                              className="w-24 p-2 text-xs border border-gray-300 rounded outline-none text-right"
                              disabled={isSaving}
                            />
                          </div>
                        ) : (
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
                        )}
                      </td>
                      <td className="p-2 text-right align-top pt-3">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-gray-500 font-bold">
                            Rs.
                          </span>
                          {newRow.category === "chicks" ? (
                            <input
                              type="number"
                              placeholder="Per Kg"
                              value={newRow.pricePerKg}
                              onChange={(e) =>
                                setNewRow({
                                  ...newRow,
                                  pricePerKg: e.target.value,
                                })
                              }
                              className="w-20 p-2 text-xs border border-gray-300 rounded outline-none text-right"
                              disabled={isSaving}
                            />
                          ) : (
                            <input
                              type="number"
                              placeholder="Rate"
                              value={newRow.rate}
                              onChange={(e) =>
                                setNewRow({ ...newRow, rate: e.target.value })
                              }
                              className="w-20 p-2 text-xs border border-gray-300 rounded outline-none text-right"
                              disabled={isSaving}
                            />
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right font-black text-green-700 align-top pt-4">
                        Rs.{" "}
                        {fmt(
                          newRow.category === "chicks"
                            ? (parseFloat(newRow.weightKilos) || 0) *
                                (parseFloat(newRow.pricePerKg) || 0)
                            : (parseFloat(newRow.quantity) || 0) *
                                (parseFloat(newRow.rate) || 0),
                        )}
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
                  {data.map((sale) => {
                    const qty = parseFloat(sale.quantity || 0);
                    const rate = parseFloat(sale.rate || 0);
                    return (
                      <tr
                        key={sale.id}
                        className="border-t border-gray-50 hover:bg-gray-50/50"
                      >
                        <td className="p-4 font-bold text-gray-900 align-top">
                          {sale.date}
                        </td>
                        <td className="p-4 align-top text-gray-700">
                          {sale.buyer_name || "-"}
                        </td>
                        <td className="p-4 align-top">
                          <span
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${sale.category === "chicks" ? "bg-yellow-100 text-yellow-700" : "bg-emerald-100 text-emerald-700"}`}
                          >
                            {getCategoryLabel(sale.category)}
                          </span>
                        </td>
                        <td className="p-4 text-right align-top">
                          {sale.category === "chicks" ? (
                            <>
                              <div className="font-bold text-gray-800">
                                {sale.chicks_sold}{" "}
                                <span className="text-xs text-gray-500 font-normal">
                                  Chicks
                                </span>
                              </div>
                              <div className="font-bold text-gray-800 mt-1">
                                {sale.weight_kilos}{" "}
                                <span className="text-xs text-gray-500 font-normal">
                                  Kilos
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="font-bold text-gray-800">
                              {qty.toLocaleString()}{" "}
                              <span className="text-xs text-gray-500 font-normal">
                                {getCategoryLabel(sale.category)}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right text-gray-500 align-top">
                          Rs.{" "}
                          {fmt(
                            sale.category === "chicks"
                              ? sale.price_per_kg
                              : rate,
                          )}{" "}
                          {sale.category === "chicks" ? "/ kg" : "/ unit"}
                        </td>
                        <td className="p-4 text-right font-black text-green-700 align-top">
                          + Rs.{" "}
                          {fmt(
                            sale.total_price || sale.total_amount || qty * rate,
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDelete(sale.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {data.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                      <td className="p-4 font-black text-gray-700 text-xs uppercase tracking-wider" colSpan={5}>Totals ({data.length} sales)</td>
                      <td className="p-4 text-right font-black text-green-700">
                        + Rs. {fmt(data.reduce((sum, s) => sum + (parseFloat(s.total_price || s.total_amount) || (parseFloat(s.quantity || 0) * parseFloat(s.rate || 0))), 0))}
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
