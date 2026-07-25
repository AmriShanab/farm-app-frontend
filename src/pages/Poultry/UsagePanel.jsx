import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Loader2, Boxes, Check } from "lucide-react";
import {
  getPoultryFeedStock,
  getPoultryFeedUsage,
  createPoultryFeedUsage,
  deletePoultryFeedUsage,
  getPoultryMedicineStock,
  getPoultryMedicineUsage,
  createPoultryMedicineUsage,
  deletePoultryMedicineUsage,
} from "../../services/api";
import { useToast } from "../../components/ToastProvider";

const FRACTIONS = [
  { label: "0", value: 0 },
  { label: "¼", value: 0.25 },
  { label: "½", value: 0.5 },
  { label: "¾", value: 0.75 },
];

// Render a decimal quantity as whole + unicode fraction, e.g. 2.75 -> "2¾".
const fmtQty = (n) => {
  const num = Number(n || 0);
  const whole = Math.floor(num + 0.0001);
  const frac = Math.round((num - whole) * 100) / 100;
  const label = frac === 0.25 ? "¼" : frac === 0.5 ? "½" : frac === 0.75 ? "¾" : "";
  if (label && whole === 0) return label;
  return label ? `${whole}${label}` : String(whole);
};

export default function UsagePanel({ kind, batchId }) {
  const isFeed = kind === "feed";
  const itemKey = isFeed ? "feed_type" : "medicine_name";
  const api = isFeed
    ? {
        stock: getPoultryFeedStock,
        list: getPoultryFeedUsage,
        create: createPoultryFeedUsage,
        remove: deletePoultryFeedUsage,
        payloadKey: "feedType",
        itemLabel: "Feed Type",
      }
    : {
        stock: getPoultryMedicineStock,
        list: getPoultryMedicineUsage,
        create: createPoultryMedicineUsage,
        remove: deletePoultryMedicineUsage,
        payloadKey: "medicineName",
        itemLabel: "Medicine",
      };

  const [stock, setStock] = useState([]);
  const [usage, setUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    item: "",
    whole: "",
    frac: 0,
    notes: "",
  });

  const load = useCallback(() => {
    if (!batchId) return;
    setLoading(true);
    Promise.all([api.stock(batchId), api.list(batchId)])
      .then(([s, u]) => {
        setStock(Array.isArray(s) ? s : []);
        setUsage(Array.isArray(u) ? u : []);
      })
      .catch(() => {
        setStock([]);
        setUsage([]);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId, kind]);

  useEffect(() => {
    load();
  }, [load]);

  const amount = (parseInt(form.whole || 0, 10) || 0) + Number(form.frac || 0);
  const selectedStock = stock.find((s) => s[itemKey] === form.item);
  const remaining = selectedStock ? Number(selectedStock.remaining) : 0;
  const overStock = form.item && amount > remaining + 0.001;

  const handleAdd = async () => {
    if (!form.item) return toast.error("Pick an item.");
    if (amount <= 0) return toast.error("Enter an amount used.");
    if (amount > remaining + 0.001) return toast.error(`Only ${fmtQty(remaining)} left in stock.`);
    setSaving(true);
    try {
      await api.create({
        date: form.date,
        batchId: parseInt(batchId, 10),
        [api.payloadKey]: form.item,
        quantity: amount,
        notes: form.notes || null,
      });
      toast.success("Usage recorded.");
      setForm((f) => ({ ...f, whole: "", frac: 0, notes: "" }));
      load();
    } catch (e) {
      toast.error(e?.message || "Failed to record usage.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.remove(id);
      load();
    } catch {
      toast.error("Failed to delete usage record.");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="animate-spin mx-auto text-green-600" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Remaining stock cards */}
      <div>
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Boxes size={14} className="text-gray-400" /> Remaining Stock
        </h3>
        {stock.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400 font-bold">
            No purchases yet — record {isFeed ? "feed" : "medicine"} purchases first.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stock.map((s) => {
              const rem = Number(s.remaining);
              const low = rem <= 0;
              return (
                <div
                  key={s[itemKey]}
                  className={`rounded-xl border p-3 shadow-sm ${low ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}
                >
                  <p className="text-[11px] font-bold text-gray-500 truncate" title={s[itemKey]}>{s[itemKey]}</p>
                  <p className={`text-xl font-black ${low ? "text-red-600" : "text-gray-900"}`}>{fmtQty(rem)}</p>
                  <p className="text-[10px] text-gray-400 font-bold">
                    used {fmtQty(s.used)} of {fmtQty(s.purchased)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add usage form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Record Usage</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold bg-white outline-none focus:border-green-500"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-gray-600 mb-1">{api.itemLabel}</label>
            <select
              value={form.item}
              onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold bg-white outline-none focus:border-green-500"
            >
              <option value="">Select…</option>
              {stock.map((s) => (
                <option key={s[itemKey]} value={s[itemKey]} disabled={Number(s.remaining) <= 0}>
                  {s[itemKey]} ({fmtQty(s.remaining)} left)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">Amount</label>
            <div className="flex gap-1">
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.whole}
                onChange={(e) => setForm((f) => ({ ...f, whole: e.target.value }))}
                className="w-14 px-2 py-2 border border-gray-200 rounded-lg text-sm font-bold bg-white outline-none focus:border-green-500 text-center"
              />
              <select
                value={form.frac}
                onChange={(e) => setForm((f) => ({ ...f, frac: Number(e.target.value) }))}
                className="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-sm font-bold bg-white outline-none focus:border-green-500"
              >
                {FRACTIONS.map((fr) => (
                  <option key={fr.value} value={fr.value}>{fr.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">Notes</label>
            <input
              type="text"
              value={form.notes}
              placeholder="optional"
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold bg-white outline-none focus:border-green-500"
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className={`text-[11px] font-bold ${overStock ? "text-red-600" : "text-gray-400"}`}>
            {form.item
              ? overStock
                ? `Only ${fmtQty(remaining)} left in stock`
                : `Using ${fmtQty(amount)} · ${fmtQty(remaining)} in stock`
              : "Pick an item to see stock"}
          </p>
          <button
            onClick={handleAdd}
            disabled={saving || overStock || !form.item || amount <= 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-black shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Record
          </button>
        </div>
      </div>

      {/* Usage log */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-800 text-sm">Usage Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">{api.itemLabel}</th>
                <th className="p-4 text-right">Used</th>
                <th className="p-4 text-left">Notes</th>
                <th className="p-4 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {usage.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400 font-bold">No usage recorded yet.</td></tr>
              ) : (
                usage.map((u) => (
                  <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-gray-900">
                      {u.date}
                      {u.day_count != null && (
                        <span className="block text-[10px] font-bold text-amber-600 mt-0.5">Day {u.day_count}</span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-gray-700">{u[itemKey]}</td>
                    <td className="p-4 text-right font-black text-gray-900">{fmtQty(u.quantity)}</td>
                    <td className="p-4 text-gray-500">{u.notes || "—"}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-gray-300 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
