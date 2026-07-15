import { useState, useEffect, useMemo } from "react";
import { Wheat, Plus, Loader2, X, Check, Trash2, Filter } from "lucide-react";
import {
  getPoultryBatches,
  getPoultryFeed,
  createPoultryFeed,
  deletePoultryFeed,
} from "../../services/api";
import { useToast } from "../../components/ToastProvider";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PoultryFeeds() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [data, setData] = useState([]);

  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [feedFilter, setFeedFilter] = useState("All");
  const toast = useToast();

  useEffect(() => {
    getPoultryBatches("active")
      .then((res) => {
        setBatches(res);
        if (res.length > 0) {
          setSelectedBatchId(res[0].id);
        } else {
          setIsLoadingFeed(false);
        }
      })
      .catch(() => setIsLoadingFeed(false));
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      getPoultryFeed(selectedBatchId)
        .then(setData)
        .catch(() => setData([]))
        .finally(() => setIsLoadingFeed(false));
    }
  }, [selectedBatchId]);

  const [newRow, setNewRow] = useState({
    date: new Date().toISOString().split("T")[0],
    feedType: "",
    quantity: "",
    ratePerUnit: "",
    paidBy: "investor",
    paidAmount: "",
    chequeNo: "",
    chequeDate: "",
  });

  const handleSave = async () => {
    if (
      !newRow.feedType ||
      !newRow.quantity ||
      !newRow.ratePerUnit ||
      !newRow.paidAmount
    ) {
      toast.error("Please fill required fields.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        date: newRow.date,
        batchId: parseInt(selectedBatchId),
        feedType: newRow.feedType,
        quantity: parseFloat(newRow.quantity),
        ratePerUnit: parseFloat(newRow.ratePerUnit),
        paidBy: newRow.paidBy,
        paidAmount: parseFloat(newRow.paidAmount),
        chequeNo: newRow.chequeNo || "",
        chequeDate: newRow.chequeDate || null,
      };
      const savedFeed = await createPoultryFeed(payload);
      setData([savedFeed, ...data]);
      setIsAdding(false);
      setNewRow({
        date: new Date().toISOString().split("T")[0],
        feedType: "",
        quantity: "",
        ratePerUnit: "",
        paidBy: "investor",
        paidAmount: "",
        chequeNo: "",
        chequeDate: "",
      });
      toast.success("Feed record saved successfully.");
    } catch {
      toast.error("Failed to save feed record.");
    } finally {
      setIsSaving(false);
    }
  };

  const feedTypes = useMemo(() => {
    const types = [...new Set(data.map((l) => l.feed_type || l.feedType).filter(Boolean))];
    types.sort((a, b) => a.localeCompare(b));
    return types;
  }, [data]);

  const filtered = useMemo(() => {
    if (feedFilter === "All") return data;
    return data.filter((l) => (l.feed_type || l.feedType) === feedFilter);
  }, [data, feedFilter]);

  const handleDelete = async (id) => {
    if (window.confirm("Delete this feed record?")) {
      try {
        await deletePoultryFeed(id);
        setData(data.filter((item) => item.id !== id));
        toast.success("Feed record deleted.");
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
            <Wheat size={20} className="text-white" />
          </div>
          Feed Management
        </h1>
      </div>

      {batches.length === 0 && !isLoadingFeed ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-sm text-gray-500">
            Create a bird batch before recording feed.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <Wheat size={16} className="text-green-600" />
              <h2 className="font-bold text-gray-800">Feed Ledger</h2>
              {batches.length > 0 && (
                <select
                  value={selectedBatchId}
                  onChange={(e) => {
                    if (selectedBatchId !== e.target.value) {
                      setIsLoadingFeed(true);
                      setFeedFilter("All");
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
              {feedTypes.length > 1 && (
                <select
                  value={feedFilter}
                  onChange={(e) => setFeedFilter(e.target.value)}
                  className="ml-2 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer"
                >
                  <option value="All">All Feed Types</option>
                  {feedTypes.map((ft) => (
                    <option key={ft} value={ft}>{ft}</option>
                  ))}
                </select>
              )}
            </div>
            <button
              onClick={() => setIsAdding(true)}
              disabled={isAdding || batches.length === 0}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:-translate-y-0.5 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
            >
              <Plus size={14} /> Add Feed
            </button>
          </div>

          {isLoadingFeed ? (
            <div className="text-center py-10">
              <Loader2 className="animate-spin mx-auto text-green-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Feed Details</th>
                    <th className="p-4 text-right">Cost Breakdown</th>
                    <th className="p-4 text-left">Payment Info</th>
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
                          onChange={(e) =>
                            setNewRow({ ...newRow, date: e.target.value })
                          }
                          className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                          disabled={isSaving}
                        />
                      </td>
                      <td className="p-3 space-y-2">
                        <input
                          type="text"
                          placeholder="e.g. Starter Pellets"
                          value={newRow.feedType}
                          onChange={(e) =>
                            setNewRow({ ...newRow, feedType: e.target.value })
                          }
                          className="w-full p-2 text-xs border border-gray-300 rounded outline-none"
                          disabled={isSaving}
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={newRow.quantity}
                            onChange={(e) =>
                              setNewRow({ ...newRow, quantity: e.target.value })
                            }
                            className="w-1/2 p-2 text-xs border border-gray-300 rounded outline-none"
                            disabled={isSaving}
                          />
                          <input
                            type="number"
                            placeholder="Rate"
                            value={newRow.ratePerUnit}
                            onChange={(e) =>
                              setNewRow({
                                ...newRow,
                                ratePerUnit: e.target.value,
                              })
                            }
                            className="w-1/2 p-2 text-xs border border-gray-300 rounded outline-none"
                            disabled={isSaving}
                          />
                        </div>
                      </td>
                      <td className="p-3 text-right pt-5 font-bold text-gray-800">
                        Rs.{" "}
                        {fmt(
                          (parseFloat(newRow.quantity) || 0) *
                            (parseFloat(newRow.ratePerUnit) || 0),
                        )}
                      </td>
                      <td className="p-3 space-y-2">
                        <div className="flex gap-2">
                          <select
                            value={newRow.paidBy}
                            onChange={(e) =>
                              setNewRow({ ...newRow, paidBy: e.target.value })
                            }
                            className="w-1/3 p-2 text-xs border border-gray-300 rounded outline-none bg-white"
                            disabled={isSaving}
                          >
                            <option value="investor">Investor</option>
                            <option value="farm">Farm Cash</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Amt Paid"
                            value={newRow.paidAmount}
                            onChange={(e) =>
                              setNewRow({
                                ...newRow,
                                paidAmount: e.target.value,
                              })
                            }
                            className="w-2/3 p-2 text-xs border border-gray-300 rounded outline-none"
                            disabled={isSaving}
                          />
                        </div>
                      </td>
                      <td className="p-3 text-right pt-5 font-black text-red-600">
                        Rs.{" "}
                        {fmt(
                          (parseFloat(newRow.quantity) || 0) *
                            (parseFloat(newRow.ratePerUnit) || 0) -
                            (parseFloat(newRow.paidAmount) || 0),
                        )}
                      </td>
                      <td className="p-3 text-right pt-5">
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
                  {filtered.length === 0 && !isAdding && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 font-bold">
                        {feedFilter !== "All" ? `No records for "${feedFilter}".` : "No feed records found."}
                      </td>
                    </tr>
                  )}
                  {filtered.map((log) => {
                    const qty = parseFloat(log.quantity || 0);
                    const rate = parseFloat(log.rate_per_unit || 0);
                    const totalCost = qty * rate;
                    return (
                      <tr
                        key={log.id}
                        className="border-t border-gray-50 hover:bg-gray-50/50"
                      >
                        <td className="p-4 font-bold text-gray-900">
                          {log.date}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-gray-800">
                            {log.feed_type}
                          </p>
                          <p className="text-xs text-gray-500">
                            {qty} units @ Rs. {fmt(rate)}
                          </p>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-black text-gray-900">
                            Rs. {fmt(totalCost)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded border border-gray-200">
                              {log.paid_by}
                            </span>
                            <span className="font-bold text-green-700">
                              Rs. {fmt(log.paid_amount)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span
                            className={`font-black ${parseFloat(log.payable_balance) > 0 ? "text-red-600" : "text-gray-400"}`}
                          >
                            Rs. {fmt(log.payable_balance)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                      <td className="p-4 font-black text-gray-700 text-xs uppercase tracking-wider">
                        {feedFilter !== "All" ? feedFilter : "Totals"}
                      </td>
                      <td className="p-4 text-xs text-gray-700 font-bold">
                        {filtered.reduce((sum, l) => sum + parseFloat(l.quantity || 0), 0)} units
                      </td>
                      <td className="p-4 text-right font-black text-gray-900">
                        Rs. {fmt(filtered.reduce((sum, l) => sum + (parseFloat(l.quantity || 0) * parseFloat(l.rate_per_unit || 0)), 0))}
                      </td>
                      <td className="p-4 text-right font-bold text-green-700">
                        Rs. {fmt(filtered.reduce((sum, l) => sum + parseFloat(l.paid_amount || 0), 0))}
                      </td>
                      <td className="p-4 text-right font-black text-red-600">
                        Rs. {fmt(filtered.reduce((sum, l) => sum + parseFloat(l.payable_balance || 0), 0))}
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
