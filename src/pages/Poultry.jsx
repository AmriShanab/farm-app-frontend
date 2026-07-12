import { useState, useEffect } from "react";
import {
  Bird,
  Users,
  Layers,
  Wheat,
  Egg,
  PieChart,
  Plus,
  Loader2,
  Check,
  X,
  Trash2,
  Wallet,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  getInvestors,
  getPoultryBatches,
  createPoultryBatch,
  getPoultryFeed,
  createPoultryFeed,
  deletePoultryFeed,
  getPoultrySales,
  createPoultrySale,
  deletePoultrySale,
  getPoultryProfit,
  distributePoultryProfit,
  createInvestor,
} from "../services/api";
import { useToast } from "../components/ToastProvider";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PoultryManagement() {
  const [activeSub, setActiveSub] = useState("Profit Distribution"); // Set default to test the new tab
  const [data, setData] = useState([]);
  const [auxData, setAuxData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const subNavs = [
    { name: "Investors", icon: Users },
    { name: "Batches", icon: Layers },
    { name: "Feeds", icon: Wheat },
    { name: "Poultry Sales", icon: Egg },
    { name: "Profit Distribution", icon: PieChart },
  ];

  // Dynamically load data based on the active tab
  useEffect(() => {
    if (activeSub === "Investors") {
      getInvestors()
        .then(setData)
        .catch(() => setData([]))
        .finally(() => setIsLoading(false));
    } else if (activeSub === "Batches") {
      getPoultryBatches("active")
        .then(setData)
        .catch(() => setData([]))
        .finally(() => setIsLoading(false));
    } else if (
      activeSub === "Feeds" ||
      activeSub === "Poultry Sales" ||
      activeSub === "Profit Distribution"
    ) {
      // These tabs require an active batch context
      getPoultryBatches("active")
        .then((batchData) => {
          setAuxData(batchData);
          if (batchData.length > 0) {
            if (activeSub === "Feeds") return getPoultryFeed(batchData[0].id);
            if (activeSub === "Poultry Sales")
              return getPoultrySales(batchData[0].id);
            if (activeSub === "Profit Distribution") return null; // Handled inside the component
          }
          return [];
        })
        .then((res) => {
          if (res !== null) setData(res);
        })
        .catch(() => setData([]))
        .finally(() => setIsLoading(false));
    } else {
      setTimeout(() => {
        setData([]);
        setIsLoading(false);
      }, 0);
    }
  }, [activeSub]);

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Nunito']">
      {/* Module Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-green-600/20">
            <Bird size={20} className="text-white" />
          </div>
          Poultry Management
        </h1>
      </div>

      {/* Sub Navigation */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto custom-scrollbar">
        {subNavs.map((nav) => (
          <button
            key={nav.name}
            onClick={() => {
              if (activeSub !== nav.name) {
                setIsLoading(true);
                setActiveSub(nav.name);
              }
            }}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeSub === nav.name
                ? "border-green-600 text-green-700 bg-green-50/50 rounded-t-xl"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <nav.icon size={16} /> {nav.name}
          </button>
        ))}
      </div>

      {/* Dynamic Content Area */}
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
        <div className="pb-10">
          {activeSub === "Investors" && <InvestorsTable data={data} />}
          {activeSub === "Batches" && (
            <BatchesTable data={data} setData={setData} />
          )}
          {activeSub === "Feeds" && (
            <FeedsTable data={data} setData={setData} batches={auxData} />
          )}
          {activeSub === "Poultry Sales" && (
            <PoultrySalesTable
              data={data}
              setData={setData}
              batches={auxData}
            />
          )}
          {activeSub === "Profit Distribution" && (
            <ProfitDistributionTab batches={auxData} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── INVESTORS TABLE ─────────────────────────────────────────────────────────
function InvestorsTable({ data: initialData }) {
  const [data, setData] = useState(initialData || []);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const [form, setForm] = useState({
    name: "",
    contactInfo: "",
    investmentAmount: "",
    ownershipPercent: "",
  });

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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* HEADER */}
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

      {/* TABLE */}
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
                  <td className="p-4 text-right">{inv.ownership_percent}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
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
  );
}

// ─── BATCHES TABLE ───────────────────────────────────────────────────────────
function BatchesTable({ data, setData }) {
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <Layers size={16} className="text-green-600" /> Active Flocks
        </h2>
        <button
          onClick={() => setIsAdding(true)}
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
              <th className="p-4 text-left">Batch Details</th>
              <th className="p-4 text-left">Supplier</th>
              <th className="p-4 text-right">Initial Count</th>
              <th className="p-4 text-right">Cost Analysis</th>
              <th className="p-4 text-center">Status</th>
              {isAdding && <th className="p-4 text-right">Actions</th>}
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
                <td className="p-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-xs text-gray-500 font-bold">Rs.</span>
                    <input
                      type="number"
                      placeholder="Rate/Bird"
                      value={newRow.pricePerBird}
                      onChange={(e) =>
                        setNewRow({ ...newRow, pricePerBird: e.target.value })
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
                  colSpan={6}
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
                return (
                  <tr
                    key={batch.id}
                    className="border-t border-gray-50 hover:bg-gray-50/50"
                  >
                    <td className="p-4 font-bold text-gray-900">
                      {batch.date}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{batch.notes}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                        ID: #{batch.id}
                      </p>
                    </td>
                    <td className="p-4 text-gray-600">{batch.supplier}</td>
                    <td className="p-4 text-right">
                      <span className="font-black text-gray-900">
                        {qty.toLocaleString()}
                      </span>{" "}
                      <span className="text-xs text-gray-500">Birds</span>
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-black text-green-700">
                        Rs. {fmt(price * qty)}
                      </p>
                      <p className="text-[10px] text-gray-500 font-bold">
                        @ Rs. {fmt(price)} / Bird
                      </p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                        {batch.status}
                      </span>
                    </td>
                    {isAdding && <td></td>}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── FEEDS TABLE ─────────────────────────────────────────────────────────────
function FeedsTable({ data, setData, batches }) {
  const [selectedBatchId, setSelectedBatchId] = useState(
    batches.length > 0 ? batches[0].id : "",
  );
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (selectedBatchId) {
      getPoultryFeed(selectedBatchId)
        .then(setData)
        .catch(() => setData([]))
        .finally(() => setIsLoadingFeed(false));
    }
  }, [selectedBatchId, setData]);

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

  if (batches.length === 0)
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
        <p className="text-sm text-gray-500">
          Create a bird batch before recording feed.
        </p>
      </div>
    );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <Wheat size={16} className="text-green-600" />
          <h2 className="font-bold text-gray-800">Feed Ledger</h2>
          <select
            value={selectedBatchId}
            onChange={(e) => {
              if (selectedBatchId !== e.target.value) {
                setIsLoadingFeed(true);
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
        </div>
        <button
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
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
                          setNewRow({ ...newRow, ratePerUnit: e.target.value })
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
                          setNewRow({ ...newRow, paidAmount: e.target.value })
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
              {data.map((log) => {
                const qty = parseFloat(log.quantity || 0);
                const rate = parseFloat(log.rate_per_unit || 0);
                const totalCost = qty * rate;
                return (
                  <tr
                    key={log.id}
                    className="border-t border-gray-50 hover:bg-gray-50/50"
                  >
                    <td className="p-4 font-bold text-gray-900">{log.date}</td>
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{log.feed_type}</p>
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
          </table>
        </div>
      )}
    </div>
  );
}

// ─── POULTRY SALES TABLE ─────────────────────────────────────────────────────
function PoultrySalesTable({ data, setData, batches }) {
  const [selectedBatchId, setSelectedBatchId] = useState(
    batches.length > 0 ? batches[0].id : "",
  );
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSales, setIsLoadingSales] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (selectedBatchId) {
      getPoultrySales(selectedBatchId)
        .then(setData)
        .catch(() => setData([]))
        .finally(() => setIsLoadingSales(false));
    }
  }, [selectedBatchId, setData]);

  const [newRow, setNewRow] = useState({
    date: new Date().toISOString().split("T")[0],
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

  if (batches.length === 0)
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
        <p className="text-sm text-gray-500">
          Create a bird batch before recording sales.
        </p>
      </div>
    );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <Egg size={16} className="text-green-600" />
          <h2 className="font-bold text-gray-800">Sales Ledger</h2>
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
        </div>
        <button
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
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
                            setNewRow({ ...newRow, chicksSold: e.target.value })
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
                            setNewRow({ ...newRow, pricePerKg: e.target.value })
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
                        sale.category === "chicks" ? sale.price_per_kg : rate,
                      )}{" "}
                      {sale.category === "chicks" ? "/ kg" : "/ unit"}
                    </td>
                    <td className="p-4 text-right font-black text-green-700 align-top">
                      + Rs.{" "}
                      {fmt(sale.total_price || sale.total_amount || qty * rate)}
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
          </table>
        </div>
      )}
    </div>
  );
}

// ─── PROFIT DISTRIBUTION TAB ──────────────────────────────────────────────────
function ProfitDistributionTab({ batches }) {
  const [selectedBatchId, setSelectedBatchId] = useState(
    batches.length > 0 ? batches[0].id : "",
  );

  // Default to current month YYYY-MM
  const currentPeriod = new Date().toISOString().substring(0, 7);
  const [period, setPeriod] = useState(currentPeriod);

  const [profitData, setProfitData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (selectedBatchId && period) {
      getPoultryProfit(selectedBatchId, period)
        .then(setProfitData)
        .catch(() => setProfitData(null))
        .finally(() => setIsLoading(false));
    }
  }, [selectedBatchId, period]);

  const handleFinalize = async () => {
    if (!profitData || !profitData.investorShares) return;
    if (!window.confirm(`Finalize profit distribution for ${period}?`)) return;

    setIsFinalizing(true);
    try {
      const payload = {
        batchId: parseInt(selectedBatchId),
        period: period,
        distributions: profitData.investorShares.map((inv) => ({
          investorId: inv.investorId,
          shareAmount: inv.shareAmount,
        })),
      };

      await distributePoultryProfit(payload);
      toast.success("Profit distribution successfully finalized!");
    } catch {
      toast.error("Failed to finalize distribution.");
    } finally {
      setIsFinalizing(false);
    }
  };

  if (batches.length === 0)
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
        <p className="text-sm text-gray-500">Create a bird batch first.</p>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Batch:
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => {
              if (selectedBatchId !== e.target.value) {
                setIsLoading(true);
                setSelectedBatchId(e.target.value);
              }
            }}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm font-bold rounded-lg px-3 py-2 outline-none cursor-pointer focus:border-green-500"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                Batch {b.notes || `#${b.id}`}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Period:
          </label>
          <input
            type="month"
            value={period}
            onChange={(e) => {
              if (period !== e.target.value) {
                setIsLoading(true);
                setPeriod(e.target.value);
              }
            }}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm font-bold rounded-lg px-3 py-2 outline-none focus:border-green-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <Loader2
            className="animate-spin mx-auto text-green-600 mb-4"
            size={32}
          />
        </div>
      ) : profitData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Total Income
              </p>
              <h3 className="text-2xl font-black text-gray-900">
                Rs. {fmt(profitData.totalIncome)}
              </h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Total Expenses
              </p>
              <h3 className="text-2xl font-black text-red-600">
                Rs. {fmt(profitData.totalExpenses)}
              </h3>
              <p className="text-[10px] text-gray-400 mt-1">
                Batch: {fmt(profitData.batchCost)} | Feed:{" "}
                {fmt(profitData.totalFeedCost)}
              </p>
            </div>
            <div
              className={`border rounded-xl p-5 shadow-sm ${profitData.netProfit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p
                    className={`text-xs font-bold uppercase tracking-wider mb-1 ${profitData.netProfit >= 0 ? "text-green-700" : "text-red-700"}`}
                  >
                    Net {profitData.netProfit >= 0 ? "Profit" : "Loss"}
                  </p>
                  <h3
                    className={`text-2xl font-black ${profitData.netProfit >= 0 ? "text-green-800" : "text-red-800"}`}
                  >
                    {profitData.netProfit < 0 ? "-" : ""}Rs.{" "}
                    {fmt(Math.abs(profitData.netProfit))}
                  </h3>
                </div>
                {profitData.netProfit >= 0 ? (
                  <TrendingUp size={24} className="text-green-600" />
                ) : (
                  <TrendingDown size={24} className="text-red-600" />
                )}
              </div>
            </div>
          </div>

          {/* Investor Share Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
              <Wallet size={16} className="text-blue-600" />
              <h2 className="font-bold text-gray-800">
                Investor Share Distribution
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4 text-left">Investor Name</th>
                    <th className="p-4 text-center">Stake</th>
                    <th className="p-4 text-right">Calculated Share</th>
                  </tr>
                </thead>
                <tbody>
                  {profitData.investorShares?.map((inv) => {
                    const isLoss = inv.shareAmount < 0;
                    return (
                      <tr
                        key={inv.investorId}
                        className="border-t border-gray-50 hover:bg-gray-50/50"
                      >
                        <td className="p-4 font-bold text-gray-900">
                          {inv.name}
                        </td>
                        <td className="p-4 text-center font-bold text-blue-600 bg-blue-50/30">
                          {inv.ownershipPercent}%
                        </td>
                        <td
                          className={`p-4 text-right font-black ${isLoss ? "text-red-600" : "text-green-700"}`}
                        >
                          {isLoss ? "-" : "+"} Rs.{" "}
                          {fmt(Math.abs(inv.shareAmount))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleFinalize}
                disabled={
                  isFinalizing || profitData.investorShares?.length === 0
                }
                className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:-translate-y-0.5 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
              >
                {isFinalizing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Finalize {period} Distribution
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-500 font-bold">
          No profit data available for this period.
        </div>
      )}
    </div>
  );
}
