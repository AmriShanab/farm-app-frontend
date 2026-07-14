import { useState, useEffect } from 'react';
import {
  ShieldCheck, Tractor, Plus, Loader2, Check, X, Trash2, Pencil,
  MapPin, AlertCircle, CircleDollarSign, Save
} from 'lucide-react';
import {
  getAssets, createAsset, updateAsset, deleteAsset
} from '../services/api';

const fmt = (n) => Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Helper to calculate exact warranty expiration
const calculateWarranty = (purchaseDate, months) => {
  if (!purchaseDate || !months) return { active: false, expiryDate: 'N/A' };
  
  const purchase = new Date(purchaseDate);
  const expiry = new Date(purchase.setMonth(purchase.getMonth() + parseInt(months)));
  const now = new Date();
  
  return {
    active: expiry >= now,
    expiryDate: expiry.toISOString().split('T')[0]
  };
};

export default function AssetManagement() {
  // Filters
  const [selectedFarm, setSelectedFarm] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  
  // Data States
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add Row States
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const emptyRow = {
    name: '', farm: 'MR1', purchaseDate: new Date().toISOString().split('T')[0],
    warrantyMonths: '12', purchaseCost: '', supplier: '', notes: ''
  };
  const [newRow, setNewRow] = useState(emptyRow);

  // Fetch Data
  useEffect(() => {
    setIsLoading(true);
    getAssets(selectedFarm, selectedStatus)
      .then(setAssets)
      .catch(() => setAssets([]))
      .finally(() => setIsLoading(false));
  }, [selectedFarm, selectedStatus]);

  // Handlers
  const closePanel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewRow(emptyRow);
  };

  const startEdit = (asset) => {
    setEditingId(asset.id);
    setNewRow({
      name: asset.name || '',
      farm: asset.farm || 'MR1',
      purchaseDate: asset.purchaseDate || asset.purchase_date || new Date().toISOString().split('T')[0],
      warrantyMonths: String(asset.warrantyMonths ?? asset.warranty_months ?? ''),
      purchaseCost: asset.purchaseCost ?? asset.purchase_cost ?? '',
      supplier: asset.supplier || '',
      notes: asset.notes || '',
    });
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!newRow.name || !newRow.purchaseCost || !newRow.purchaseDate) {
      alert("Please fill in the Asset Name, Cost, and Purchase Date.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...newRow,
        warrantyMonths: parseInt(newRow.warrantyMonths) || 0,
        purchaseCost: parseFloat(newRow.purchaseCost)
      };

      if (editingId) {
        const updated = await updateAsset(editingId, payload);
        setAssets(prev => prev.map(a => a.id === editingId ? { ...a, ...updated, ...payload, id: editingId } : a));
      } else {
        const savedApp = await createAsset(payload);
        setAssets([savedApp, ...assets]);
      }
      closePanel();
    } catch (err) { alert("Failed to save asset."); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to delete this asset record?")) {
      try {
        await deleteAsset(id);
        setAssets(assets.filter(item => item.id !== id));
      } catch (err) { alert("Delete failed."); }
    }
  };

  // KPIs
  const totalValue = assets.reduce((acc, curr) => acc + parseFloat(curr.purchaseCost || curr.purchase_cost || 0), 0);
  const activeWarranties = assets.filter(a => calculateWarranty(a.purchaseDate || a.purchase_date, a.warrantyMonths || a.warranty_months).active).length;

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Nunito']">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-green-600/20">
              <ShieldCheck size={20} className="text-white" />
            </div>
            Assets & Warranty Registry
          </h1>
          <p className="text-sm font-medium text-gray-500 pl-[52px]">
            Track high-value equipment, supplier details, and warranty lifecycles
          </p>
        </div>
      </div>

      {/* ── PREMIUM KPI STAT CARDS + FILTERS ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        <div className="md:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Total Asset Value',
                amount: `Rs. ${fmt(totalValue)}`,
                badge: `${assets.length} Assets`,
                sub: 'Recorded Value',
                icon: <CircleDollarSign size={14} />,
                chartColor: '#A3E635',
                path: "M0,40 L0,25 C 20,30 40,10 60,15 C 80,20 90,5 100,5 L100,40 Z"
              },
              {
                title: 'Warranty Coverage',
                amount: `${activeWarranties} / ${assets.length}`,
                badge: `${selectedStatus === 'under-warranty' ? 'Filtered' : 'All'}`,
                sub: 'Active / Total',
                icon: <ShieldCheck size={14} />,
                chartColor: '#60A5FA',
                path: "M0,40 L0,20 C 30,35 50,15 70,25 C 85,30 95,10 100,10 L100,40 Z"
              },
              {
                title: 'Equipment Count',
                amount: `${assets.length}`,
                badge: `${selectedFarm}`,
                sub: 'Selected Estate',
                icon: <Tractor size={14} />,
                chartColor: '#FBBF24',
                path: "M0,40 L0,15 C 25,10 45,30 65,20 C 85,10 95,25 100,20 L100,40 Z"
              }
            ].map((card, i) => {
              const gradId = `grad-assets-${i}`;
              return (
                <div key={i} className="relative overflow-hidden rounded-[1.25rem] p-4 bg-gradient-to-br from-green-700 to-green-800 text-white shadow-lg shadow-green-900/20 group border border-green-800/40 transition-all hover:shadow-green-900/40 hover:-translate-y-1 h-28">
                  <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[45px] opacity-20 bg-white transition-opacity duration-500 group-hover:opacity-40"></div>
                  <div className="flex justify-between items-center relative z-10 mb-1">
                    <span className="text-sm font-medium text-white/80">{card.title}</span>
                  </div>
                  <h3 className="text-2xl font-bold relative z-10 mb-3 tracking-tight truncate">{card.amount}</h3>
                  <div className="flex items-center gap-2 relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/20 text-white backdrop-blur-md">
                      {card.icon}
                      <span>{card.badge}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 truncate">{card.sub}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-[45%] opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                      <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={card.chartColor} stopOpacity="0.4" />
                          <stop offset="100%" stopColor={card.chartColor} stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d={card.path} fill={`url(#${gradId})`} stroke={card.chartColor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-4 flex items-start">
          <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-center gap-3 h-full">
            <select 
              value={selectedFarm} onChange={(e) => setSelectedFarm(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-700 text-sm font-bold rounded-lg px-3 py-3 outline-none cursor-pointer focus:border-green-500 w-full"
            >
              <option value="All">All Estates (MR1 & MR2)</option>
              <option value="MR1">MR1 Only</option>
              <option value="MR2">MR2 Only</option>
            </select>
            <select 
              value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-700 text-sm font-bold rounded-lg px-3 py-3 outline-none cursor-pointer focus:border-green-500 w-full"
            >
              <option value="All">All Warranties</option>
              <option value="under-warranty">Active Warranty Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── NEW UX: DEDICATED REGISTRATION PANEL ── */}
      {isAdding && (
        <div className="bg-gradient-to-b from-green-50 to-white border border-green-200 rounded-xl p-6 shadow-md mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-5 border-b border-green-100 pb-3">
            <h3 className="text-lg font-black text-green-900 flex items-center gap-2">
              {editingId ? <Pencil size={18} className="text-green-600"/> : <Tractor size={18} className="text-green-600"/>}
              {editingId ? 'Edit Asset' : 'Register New Asset'}
            </h3>
            <button onClick={closePanel} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm border border-gray-200">
              <X size={18} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Row 1 */}
            <div className="md:col-span-6">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Asset Name</label>
              <input type="text" placeholder="e.g. TAFE 45DI Tractor" value={newRow.name} onChange={e => setNewRow({...newRow, name: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none font-bold focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" disabled={isSaving} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Estate Location</label>
              <select value={newRow.farm} onChange={e => setNewRow({...newRow, farm: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none font-bold bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" disabled={isSaving}>
                <option value="MR1">MR1 Farm</option>
                <option value="MR2">MR2 Farm</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Purchase Date</label>
              <input type="date" value={newRow.purchaseDate} onChange={e => setNewRow({...newRow, purchaseDate: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none font-bold focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" disabled={isSaving} />
            </div>

            {/* Row 2 */}
            <div className="md:col-span-6">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Supplier / Vendor</label>
              <input type="text" placeholder="e.g. TAFE Motors Lanka" value={newRow.supplier} onChange={e => setNewRow({...newRow, supplier: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" disabled={isSaving} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Purchase Cost (Rs.)</label>
              <input type="number" placeholder="0.00" value={newRow.purchaseCost} onChange={e => setNewRow({...newRow, purchaseCost: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none font-black text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" disabled={isSaving} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Warranty (Months)</label>
              <input type="number" placeholder="e.g. 24" value={newRow.warrantyMonths} onChange={e => setNewRow({...newRow, warrantyMonths: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none font-bold focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" disabled={isSaving} />
            </div>

            {/* Row 3 */}
            <div className="md:col-span-12">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Additional Notes</label>
              <input type="text" placeholder="Details about serial numbers, specific conditions, etc." value={newRow.notes} onChange={e => setNewRow({...newRow, notes: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" disabled={isSaving} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button onClick={closePanel} disabled={isSaving} className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-green-600 rounded-lg text-white text-sm font-bold shadow-md hover:bg-green-700 flex items-center gap-2 transition-colors disabled:opacity-70">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? 'Saving...' : (editingId ? 'Update Asset' : 'Save Asset')}
            </button>
          </div>
        </div>
      )}

      {/* ── ASSET LEDGER TABLE (Read Only Layout) ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            Equipment Ledger
          </h2>
          {!isAdding && (
            <button 
              onClick={() => setIsAdding(true)} 
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:-translate-y-0.5 transition-transform flex items-center gap-2"
            >
              <Plus size={14} /> New Asset
            </button>
          )}
        </div>
        
        {isLoading ? (
          <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-green-600 mb-4" size={24} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 text-left">Asset Details</th>
                  <th className="p-4 text-left">Location</th>
                  <th className="p-4 text-left">Purchase & Supplier</th>
                  <th className="p-4 text-right">Investment (Rs.)</th>
                  <th className="p-4 text-center">Warranty Status</th>
                  <th className="p-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-gray-400 font-bold">No assets found matching criteria.</td></tr>
                ) : assets.map(asset => {
                  const pDate = asset.purchaseDate || asset.purchase_date;
                  const wMonths = asset.warrantyMonths || asset.warranty_months;
                  const warranty = calculateWarranty(pDate, wMonths);

                  return (
                    <tr key={asset.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{asset.name}</p>
                        {asset.notes && <p className="text-[11px] text-gray-500 mt-0.5 max-w-[200px] truncate">{asset.notes}</p>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide flex items-center w-max gap-1 ${asset.farm === 'MR1' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                          <MapPin size={10}/> {asset.farm}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-xs font-bold text-gray-800">{pDate}</p>
                        <p className="text-[11px] text-gray-500">{asset.supplier}</p>
                      </td>
                      <td className="p-4 text-right font-black text-gray-900">
                        Rs. {fmt(asset.purchaseCost || asset.purchase_cost)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            warranty.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {warranty.active ? <ShieldCheck size={12}/> : <AlertCircle size={12}/>} 
                            {warranty.active ? 'Covered' : 'Expired'}
                          </span>
                          <span className="text-[10px] text-gray-400 mt-1 font-bold">
                            Valid till: {warranty.expiryDate}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => startEdit(asset)} title="Edit" className="text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(asset.id)} title="Delete" className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}