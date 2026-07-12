import { useState, useEffect } from "react";
import { Users, Plus, Loader2 } from "lucide-react";
import { getInvestors, createInvestor } from "../../services/api";
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
  const toast = useToast();

  const [form, setForm] = useState({
    name: "",
    contactInfo: "",
    investmentAmount: "",
    ownershipPercent: "",
  });

  useEffect(() => {
    getInvestors()
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.contactInfo) {
      toast.error("Name and contact required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        contactInfo: form.contactInfo,
        investmentAmount: parseFloat(form.investmentAmount),
        ownershipPercent: parseFloat(form.ownershipPercent),
      };

      const res = await createInvestor(payload);

      setData((prev) => [res, ...prev]);
      setIsOpen(false);

      setForm({
        name: "",
        contactInfo: "",
        investmentAmount: "",
        ownershipPercent: "",
      });

      toast.success("Investor added successfully");
    } catch {
      toast.error("Failed to add investor");
    } finally {
      setIsSaving(false);
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
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold flex items-center gap-2">
              <Users size={16} className="text-green-600" />
              Investor Ledger
            </h2>
            <button
              onClick={() => setIsOpen(true)}
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
                  <th className="p-4 text-right">Investment</th>
                  <th className="p-4 text-right">Ownership %</th>
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
                      <td className="p-4">{inv.contact_info}</td>
                      <td className="p-4 text-right font-bold text-green-700">
                        {fmt(inv.investment_amount)}
                      </td>
                      <td className="p-4 text-right">
                        {inv.ownership_percent}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {isOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white w-[400px] p-5 rounded-xl shadow-xl space-y-3">
                <h3 className="font-bold text-lg">Add Investor</h3>
                <input
                  placeholder="Name"
                  className="w-full border p-2 rounded"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  placeholder="Contact"
                  className="w-full border p-2 rounded"
                  value={form.contactInfo}
                  onChange={(e) =>
                    setForm({ ...form, contactInfo: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Investment Amount"
                  className="w-full border p-2 rounded"
                  value={form.investmentAmount}
                  onChange={(e) =>
                    setForm({ ...form, investmentAmount: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Ownership %"
                  className="w-full border p-2 rounded"
                  value={form.ownershipPercent}
                  onChange={(e) =>
                    setForm({ ...form, ownershipPercent: e.target.value })
                  }
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1 bg-gray-200 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                  >
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
