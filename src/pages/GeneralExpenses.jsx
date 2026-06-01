import { useState, useEffect } from 'react';
import { 
  Plus, Loader2, Check, X, Trash2, MapPin, 
  Leaf, Wrench, Zap, Fuel, Settings, Calculator, Save
} from 'lucide-react';
import { 
  getHarvestExpenses, createHarvestExpense, deleteHarvestExpense,
  getMaintenanceExpenses, createMaintenanceExpense, deleteMaintenanceExpense,
  getCEBBills, createCEBBill, deleteCEBBill,
  getFuelLogs, createFuelLog, deleteFuelLog,
  getMachineryExpenses, createMachineryExpense, deleteMachineryExpense
} from '../services/api';

const fmt = (n) => Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function GeneralExpenses() {
  const [activeTab, setActiveTab] = useState('harvest');
  const [selectedFarm, setSelectedFarm] = useState('MR1');
  const [selectedYear, setSelectedYear] = useState('2026');
  
  const tabs = [
    { id: 'harvest', label: 'Harvest', icon: Leaf },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'ceb', label: 'CEB Bills', icon: Zap },
    { id: 'fuel', label: 'Fuel Logs', icon: Fuel },
    { id: 'machinery', label: 'Machinery', icon: Settings },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Nunito']">
      
      {/* ── HEADER & GLOBAL FILTERS ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-green-600/20">
              <Calculator size={20} className="text-white" />
            </div>
            General Expenses
          </h1>
          <p className="text-sm font-medium text-gray-500 pl-[52px]">
            Manage operational costs, utilities, and field labor expenses.
          </p>
        </div>
        
        <div className="flex gap-2">
          <select 
            value={selectedFarm} onChange={(e) => setSelectedFarm(e.target.value)}
            className="bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-xl px-4 py-2 outline-none cursor-pointer shadow-sm focus:border-green-500"
          >
            <option value="All">All Estates</option>
            <option value="MR1">MR1 Farm</option>
            <option value="MR2">MR2 Farm</option>
          </select>
          <select 
            value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-xl px-4 py-2 outline-none cursor-pointer shadow-sm focus:border-green-500"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* ── SUB NAV TABS ── */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto custom-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-green-600 text-green-700 bg-green-50/50 rounded-t-xl' 
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ── DYNAMIC CONTENT AREA ── */}
      <div className="pb-10">
        <ExpenseCategoryTab category={activeTab} farm={selectedFarm} year={selectedYear} />
      </div>
    </div>
  );
}

// ─── UNIFIED TAB COMPONENT (Routing to explicit API functions) ─────────────
function ExpenseCategoryTab({ category, farm, year }) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Generic form state covering all possible payload combinations
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0], farm: 'MR1', notes: '', description: '',
    mainLabor: '', collectors: '', tractorDriver: '', foodExpenses: '', 
    categoryType: '', amount: '', chequeNo: '', chequeDate: '', 
    unitsUsed: '', billAmount: '', vehicle: '', liters: '', ratePerLiter: '' 
  });

  // Explicitly call the exact GET function based on category
  useEffect(() => {
    setIsLoading(true);
    let fetchPromise;
    if (category === 'harvest') fetchPromise = getHarvestExpenses(farm, year);
    else if (category === 'maintenance') fetchPromise = getMaintenanceExpenses(farm); // Farm only per Postman
    else if (category === 'ceb') fetchPromise = getCEBBills(farm, year);
    else if (category === 'fuel') fetchPromise = getFuelLogs(farm); // Farm only per Postman
    else if (category === 'machinery') fetchPromise = getMachineryExpenses(year); // Year only per Postman

    fetchPromise
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setIsLoading(false));
  }, [category, farm, year]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let savedRecord;

      // Explicitly map payload and call exact POST function
      if (category === 'harvest') {
        savedRecord = await createHarvestExpense({
          date: form.date, farm: form.farm, notes: form.notes,
          mainLabor: parseFloat(form.mainLabor||0), collectors: parseFloat(form.collectors||0),
          tractorDriver: parseFloat(form.tractorDriver||0), foodExpenses: parseFloat(form.foodExpenses||0)
        });
      } else if (category === 'maintenance') {
        savedRecord = await createMaintenanceExpense({
          date: form.date, farm: form.farm, category: form.categoryType, description: form.description,
          amount: parseFloat(form.amount||0), chequeNo: form.chequeNo || "", chequeDate: form.chequeDate || null
        });
      } else if (category === 'ceb') {
        savedRecord = await createCEBBill({
          date: form.date, farm: form.farm, billAmount: parseFloat(form.billAmount||0),
          unitsUsed: parseFloat(form.unitsUsed||0), chequeNo: form.chequeNo || "", chequeDate: form.chequeDate || null
        });
      } else if (category === 'fuel') {
        savedRecord = await createFuelLog({
          date: form.date, farm: form.farm, vehicle: form.vehicle,
          liters: parseFloat(form.liters||0), ratePerLiter: parseFloat(form.ratePerLiter||0),
          totalCost: (parseFloat(form.liters||0) * parseFloat(form.ratePerLiter||0))
        });
      } else if (category === 'machinery') {
        savedRecord = await createMachineryExpense({
          date: form.date, farm: form.farm, type: form.categoryType, description: form.description,
          amount: parseFloat(form.amount||0), chequeNo: form.chequeNo || "", chequeDate: form.chequeDate || null
        });
      }

      setData([savedRecord, ...data]);
      setIsAdding(false);
      
      // Reset form
      setForm({
        date: new Date().toISOString().split('T')[0], farm: 'MR1', notes: '', description: '',
        mainLabor: '', collectors: '', tractorDriver: '', foodExpenses: '',
        categoryType: '', amount: '', chequeNo: '', chequeDate: '',
        unitsUsed: '', billAmount: '', vehicle: '', liters: '', ratePerLiter: ''
      });
    } catch (err) { alert(`Failed to save ${category} record.`); } 
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to delete this record?")) {
      try {
        if (category === 'harvest') await deleteHarvestExpense(id);
        else if (category === 'maintenance') await deleteMaintenanceExpense(id);
        else if (category === 'ceb') await deleteCEBBill(id);
        else if (category === 'fuel') await deleteFuelLog(id);
        else if (category === 'machinery') await deleteMachineryExpense(id);
        
        setData(data.filter(item => item.id !== id));
      } catch (err) { alert("Delete failed."); }
    }
  };

  const calcTotal = () => {
    return data.reduce((acc, curr) => {
      if (category === 'harvest') return acc + (parseFloat(curr.mainLabor||0) + parseFloat(curr.collectors||0) + parseFloat(curr.tractorDriver||0) + parseFloat(curr.foodExpenses||0));
      if (category === 'ceb') return acc + parseFloat(curr.billAmount||0);
      if (category === 'fuel') return acc + parseFloat(curr.totalCost||0);
      return acc + parseFloat(curr.amount||0);
    }, 0);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ── DEDICATED REGISTRATION PANEL (UX Redesign) ── */}
      {isAdding && (
        <div className="bg-gradient-to-b from-green-50 to-white border border-green-200 rounded-xl p-6 shadow-md mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-5 border-b border-green-100 pb-3">
            <h3 className="text-lg font-black text-green-900 capitalize flex items-center gap-2">
              <Plus size={18} className="text-green-600"/> Add {category} Expense
            </h3>
            <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm border border-gray-200"><X size={18} /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Common Fields */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-green-500 font-bold" disabled={isSaving} />
            </div>
            
            {/* Conditional Farm Select (Machinery has no farm in Postman payload requirement, but we'll include it for consistency or hide it based on strict spec) */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Estate Location</label>
              <select value={form.farm} onChange={e => setForm({...form, farm: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none bg-white focus:border-green-500 font-bold" disabled={isSaving}>
                <option value="MR1">MR1 Farm</option><option value="MR2">MR2 Farm</option>
              </select>
            </div>

            {/* Dynamic Fields based on Category */}
            {category === 'harvest' && (
              <>
                <div className="md:col-span-6"><label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Notes</label><input type="text" placeholder="e.g. May harvest" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-green-500" /></div>
                <div className="md:col-span-3"><label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Main Labor (Rs.)</label><input type="number" placeholder="0.00" value={form.mainLabor} onChange={e => setForm({...form, mainLabor: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none text-right focus:border-green-500" /></div>
                <div className="md:col-span-3"><label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Collectors (Rs.)</label><input type="number" placeholder="0.00" value={form.collectors} onChange={e => setForm({...form, collectors: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none text-right focus:border-green-500" /></div>
                <div className="md:col-span-3"><label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Tractor Driver (Rs.)</label><input type="number" placeholder="0.00" value={form.tractorDriver} onChange={e => setForm({...form, tractorDriver: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none text-right focus:border-green-500" /></div>
                <div className="md:col-span-3"><label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Food Expenses (Rs.)</label><input type="number" placeholder="0.00" value={form.foodExpenses} onChange={e => setForm({...form, foodExpenses: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none text-right focus:border-green-500" /></div>
              </>
            )}

            {(category === 'maintenance' || category === 'machinery') && (
              <>
                <div className="md:col-span-6"><label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">{category === 'machinery' ? 'Type' : 'Category'}</label><input type="text" placeholder={category === 'machinery' ? 'e.g. parts' : 'e.g. plumbing, solar'} value={form.categoryType} onChange={e => setForm({...form, categoryType: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-green-500" /></div>
                <div className="md:col-span-12"><label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Description</label><input type="text" placeholder="Detailed description of the expense..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-green-500" /></div>
                <div className="md:col-span-4"><label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Total Amount (Rs.)</label><input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none text-right font-black focus:border-green-500" /></div>
                <div className="md:col-span-4"><label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Cheque No (Optional)</label><input type="text" placeholder="e.g. CHQ-XXX" value={form.chequeNo} onChange={e => setForm({...form, chequeNo: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-green-500" /></div>
                <div className="md:col-span-4"><label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Cheque Date</label><input type="date" value={form.chequeDate} onChange={e => setForm({...form, chequeDate: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-green-500" /></div>
              </>
            )}

            {category === 'ceb' && (
              <>
                <div className="md:col-span-6"><label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Units Used</label><input type="number" placeholder="Total kWh" value={form.unitsUsed} onChange={e => setForm({...form, unitsUsed: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none text-right focus:border-green-500" /></div>
                <div className="md:col-span-12"><label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Bill Amount (Rs.)</label><input type="number" placeholder="0.00" value={form.bill_amount} onChange={e => setForm({...form, billAmount: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none text-right font-black focus:border-green-500" /></div>
                <div className="md:col-span-6"><label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Cheque No (Optional)</label><input type="text" placeholder="e.g. CHQ-XXX" value={form.chequeNo} onChange={e => setForm({...form, chequeNo: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-green-500" /></div>
                <div className="md:col-span-6"><label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Cheque Date</label><input type="date" value={form.chequeDate} onChange={e => setForm({...form, chequeDate: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-green-500" /></div>
              </>
            )}

            {category === 'fuel' && (
              <>
                <div className="md:col-span-6"><label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Vehicle / Equipment</label><input type="text" placeholder="e.g. TAFE Tractor" value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none font-bold focus:border-green-500" /></div>
                <div className="md:col-span-6"></div> {/* Spacer */}
                <div className="md:col-span-6"><label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Liters</label><input type="number" placeholder="0.0" value={form.liters} onChange={e => setForm({...form, liters: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none text-right focus:border-green-500" /></div>
                <div className="md:col-span-6"><label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">Rate / Liter (Rs.)</label><input type="number" placeholder="0.00" value={form.ratePerLiter} onChange={e => setForm({...form, ratePerLiter: e.target.value})} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none text-right focus:border-green-500" /></div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button onClick={() => setIsAdding(false)} disabled={isSaving} className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-green-600 rounded-lg text-white text-sm font-bold shadow-md hover:bg-green-700 flex items-center gap-2 transition-colors disabled:opacity-70">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Record
            </button>
          </div>
        </div>
      )}

      {/* ── EXPENSE LEDGER TABLE ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="font-bold text-gray-800 capitalize flex items-center gap-2">Equipment & Expenses Ledger</h2>
            <p className="text-xs text-gray-500 mt-0.5">Total Recorded: <span className="font-black text-gray-900">Rs. {fmt(calcTotal())}</span></p>
          </div>
          {!isAdding && (
            <button onClick={() => setIsAdding(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:-translate-y-0.5 transition-transform flex items-center gap-2">
              <Plus size={14} /> Add {category}
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
                  <th className="p-4 text-left">Date & Location</th>
                  
                  {/* Dynamic Headers */}
                  {category === 'harvest' && <><th className="p-4 text-left">Notes</th><th className="p-4 text-right">Labor Breakdown (Rs.)</th></>}
                  {(category === 'maintenance' || category === 'machinery') && <><th className="p-4 text-left">Details</th><th className="p-4 text-left">Cheque Info</th></>}
                  {category === 'ceb' && <><th className="p-4 text-right">Units</th><th className="p-4 text-left">Cheque Info</th></>}
                  {category === 'fuel' && <><th className="p-4 text-left">Vehicle</th><th className="p-4 text-right">Fuel Details</th></>}
                  
                  <th className="p-4 text-right">Total Cost (Rs.)</th>
                  <th className="p-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-400 font-bold">No records found for this filter.</td></tr>
                ) : data.map(row => {
                  
                  // Calculate row total dynamically
                  let rowTotal = parseFloat(row.amount || row.billAmount || row.totalCost || 0);
                  if (category === 'harvest') {
                    rowTotal = parseFloat(row.mainLabor||0) + parseFloat(row.collectors||0) + parseFloat(row.tractorDriver||0) + parseFloat(row.foodExpenses||0);
                  }

                  return (
                    <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{row.date}</p>
                        <span className={`mt-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide flex items-center w-max gap-1 ${row.farm === 'MR1' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                          <MapPin size={10}/> {row.farm}
                        </span>
                      </td>

                      {/* Dynamic Cells */}
                      {category === 'harvest' && (
                        <>
                          <td className="p-4 text-gray-700 font-medium">{row.notes}</td>
                          <td className="p-4 text-right text-[11px] text-gray-500">
                            <p>Main: Rs.{fmt(row.mainLabor)} | Collect: Rs.{fmt(row.collectors)}</p>
                            <p>Tractor: Rs.{fmt(row.tractorDriver)} | Food: Rs.{fmt(row.foodExpenses)}</p>
                          </td>
                        </>
                      )}

                      {(category === 'maintenance' || category === 'machinery') && (
                        <>
                          <td className="p-4">
                            <span className="text-[10px] uppercase font-black tracking-wider text-green-600 block mb-0.5">{row.category || row.type}</span>
                            <p className="font-bold text-gray-800">{row.description}</p>
                          </td>
                          <td className="p-4">
                            {row.chequeNo ? (
                              <><p className="font-bold text-gray-700">{row.chequeNo}</p><p className="text-[11px] text-gray-500">{row.chequeDate}</p></>
                            ) : (<span className="text-gray-400 text-xs font-bold italic">Cash / Direct</span>)}
                          </td>
                        </>
                      )}

                      {category === 'ceb' && (
                        <>
                          <td className="p-4 text-right font-black text-gray-700">{row.unitsUsed} kWh</td>
                          <td className="p-4">
                            {row.chequeNo ? (
                              <><p className="font-bold text-gray-700">{row.chequeNo}</p><p className="text-[11px] text-gray-500">{row.chequeDate}</p></>
                            ) : (<span className="text-gray-400 text-xs font-bold italic">Cash / Direct</span>)}
                          </td>
                        </>
                      )}

                      {category === 'fuel' && (
                        <>
                          <td className="p-4 font-bold text-gray-800">{row.vehicle}</td>
                          <td className="p-4 text-right text-gray-600 font-medium">
                            {row.liters}L @ Rs.{fmt(row.ratePerLiter)}
                          </td>
                        </>
                      )}

                      <td className="p-4 text-right font-black text-gray-900">
                        Rs. {fmt(rowTotal)}
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDelete(row.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"><Trash2 size={14} /></button>
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