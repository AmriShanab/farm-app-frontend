import { useState, useEffect } from "react";
import { Users, Plus, Loader2, Trash2, Pencil } from "lucide-react";
import { getInvestors, createInvestor, updateInvestor, deleteInvestor } from "../../services/api";
import { useToast } from "../../components/ToastProvider";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PoultryInvestors() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const toast = useToast();

  const [form, setForm] = useState({
    name: "",
    contactInfo: "",
    investmentAmount: "",
  });

  useEffect(() => {
    getInvestors()
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleEdit = (inv) => {
    setEditingId(inv.id);
    setForm({
      name: inv.name,
      contactInfo: inv.contact_info || "",
      investmentAmount: inv.investment_amount?.toString() || "",
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        contactInfo: form.contactInfo,
        investmentAmount: parseFloat(form.investmentAmount || 0),
      };

      if (editingId) {
        const res = await updateInvestor(editingId, payload);
        setData((prev) => prev.map((i) => (i.id === editingId ? res : i)));
        toast.success("Investor updated successfully");
      } else {
        const res = await createInvestor(payload);
        setData((prev) => [res, ...prev]);
        toast.success("Investor added successfully");
      }
      setIsOpen(false);
      setEditingId(null);
      setForm({ name: "", contactInfo: "", investmentAmount: "" });
    } catch {
      toast.error(editingId ? "Failed to update investor" : "Failed to add investor");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this investor?")) return;
    try {
      await deleteInvestor(id);
      setData((prev) => prev.filter((i) => i.id !== id));
      toast.success("Investor removed");
    } catch {
      toast.error("Failed to delete investor");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Nunito']">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-green-600/20">
            <Users size={20} className="text-white" />
          </div>
          Poultry Investors
        </h1>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <Loader2 className="animate-spin mx-auto text-green-600 mb-4" size={32} />
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Loading Data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold flex items-center gap-2">
              <Users size={16} className="text-green-600" />
              Investor Ledger
            </h2>
            <button
              onClick={() => { setEditingId(null); setForm({ name: "", contactInfo: "", investmentAmount: "" }); setIsOpen(true); }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"
            >
              <Plus size={14} /> Add Investor
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase">
                <tr>
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">Contact</th>
                  <th className="p-4 text-right">Investment Amount</th>
                  <th className="p-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-400">
                      No investors found
                    </td>
                  </tr>
                ) : (
                  data.map((inv) => (
                    <tr key={inv.id} className="border-t hover:bg-gray-50">
                      <td className="p-4 font-bold">{inv.name}</td>
                      <td className="p-4">{inv.contact_info || "-"}</td>
                      <td className="p-4 text-right font-bold text-green-700">
                        Rs. {fmt(inv.investment_amount)}
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button onClick={() => handleEdit(inv)} className="text-gray-400 hover:text-green-600">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(inv.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {data.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                    <td className="p-4 font-black text-gray-700 text-xs uppercase tracking-wider" colSpan={2}>
                      Total ({data.length} investors)
                    </td>
                    <td className="p-4 text-right font-black text-green-700">
                      Rs. {fmt(data.reduce((sum, i) => sum + parseFloat(i.investment_amount || 0), 0))}
                    </td>
                    <td className="p-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {isOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white w-[400px] p-5 rounded-xl shadow-xl space-y-3">
                <h3 className="font-bold text-lg">{editingId ? "Edit Investor" : "Add Investor"}</h3>
                <input
                  placeholder="Name *"
                  className="w-full border p-2 rounded"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  placeholder="Contact Info"
                  className="w-full border p-2 rounded"
                  value={form.contactInfo}
                  onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Investment Amount (Rs.)"
                  className="w-full border p-2 rounded"
                  value={form.investmentAmount}
                  onChange={(e) => setForm({ ...form, investmentAmount: e.target.value })}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => { setIsOpen(false); setEditingId(null); setForm({ name: "", contactInfo: "", investmentAmount: "" }); }} className="px-3 py-1 bg-gray-200 rounded">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={isSaving} className="px-3 py-1 bg-green-600 text-white rounded">
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
