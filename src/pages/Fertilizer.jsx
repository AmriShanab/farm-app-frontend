import { useState, useEffect } from 'react';
import {
  Sprout, CalendarClock, Plus, Loader2, Check, X, Trash2, Pencil,
  MapPin, CircleDollarSign, Scale, Users
} from 'lucide-react';
import {
  getFertilizers, getFertilizerDue, createFertilizer, updateFertilizer, deleteFertilizer
} from '../services/api';

const fmt = (n) => Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function FertilizerManagement() {
  const [activeTab, setActiveTab] = useState('Ledger');
  
  // Filters
  const [selectedFarm, setSelectedFarm] = useState('MR1');
  const [selectedYear, setSelectedYear] = useState('2026');
  
  // Data States
  const [ledgerData, setLedgerData] = useState([]);
  const [dueData, setDueData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add Row States
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newRow, setNewRow] = useState({
    date: new Date().toISOString().split('T')[0],
    farm: 'MR1', fertilizerName: '', unitCost: '', quantity: '', laborCost: ''
  });

  // Inline Edit States
  const [editingId, setEditingId] = useState(null);
  const [editRow, setEditRow] = useState({
    date: '', farm: 'MR1', fertilizerName: '', unitCost: '', quantity: '', laborCost: ''
  });

  // Fetch Data
  useEffect(() => {
    setIsLoading(true);
    if (activeTab === 'Ledger') {
      getFertilizers(selectedFarm, selectedYear)
        .then(setLedgerData)
        .catch(() => setLedgerData([]))
        .finally(() => setIsLoading(false));
    } else if (activeTab === 'Due Schedule') {
      getFertilizerDue()
        .then(setDueData)
        .catch(() => setDueData([]))
        .finally(() => setIsLoading(false));
    }
  }, [activeTab, selectedFarm, selectedYear]);

  // Handlers
  const handleSave = async () => {
    if (!newRow.fertilizerName || !newRow.quantity || !newRow.unitCost) {
      alert("Please fill in Fertilizer Name, Quantity, and Unit Cost.");
      return;
    }
    
    setIsSaving(true);
    try {
      const payload = {
        date: newRow.date,
        farm: newRow.farm,
        fertilizerName: newRow.fertilizerName,
        unitCost: parseFloat(newRow.unitCost),
        quantity: parseFloat(newRow.quantity),
        laborCost: parseFloat(newRow.laborCost) || 0
      };
      
      const savedApp = await createFertilizer(payload);
      setLedgerData([savedApp, ...ledgerData]);
      setIsAdding(false);
      setNewRow({ 
        date: new Date().toISOString().split('T')[0], 
        farm: selectedFarm === 'All' ? 'MR1' : selectedFarm, 
        fertilizerName: '', unitCost: '', quantity: '', laborCost: '' 
      });
    } catch (err) {
      alert("Failed to save fertilizer application.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteFertilizer(id);
        setLedgerData(ledgerData.filter(item => item.id !== id));
      } catch (err) {
        alert("Delete failed.");
      }
    }
  };

  const startEdit = (app) => {
    setIsAdding(false);
    setEditingId(app.id);
    setEditRow({
      date: app.date || new Date().toISOString().split('T')[0],
      farm: app.farm || 'MR1',
      fertilizerName: app.fertilizerName || app.fertilizer_name || '',
      unitCost: app.unitCost ?? app.unit_cost ?? '',
      quantity: app.quantity ?? '',
      laborCost: app.laborCost ?? app.labor_cost ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRow({ date: '', farm: 'MR1', fertilizerName: '', unitCost: '', quantity: '', laborCost: '' });
  };

  const handleUpdate = async (app) => {
    if (!editRow.fertilizerName || !editRow.quantity || !editRow.unitCost) {
      alert("Please fill in Fertilizer Name, Quantity, and Unit Cost.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        date: editRow.date,
        farm: editRow.farm,
        fertilizerName: editRow.fertilizerName,
        unitCost: parseFloat(editRow.unitCost),
        quantity: parseFloat(editRow.quantity),
        laborCost: parseFloat(editRow.laborCost) || 0,
      };
      const updated = await updateFertilizer(app.id, payload);
      setLedgerData(prev => prev.map(item => item.id === app.id ? { ...item, ...updated, ...payload, id: app.id } : item));
      cancelEdit();
    } catch (err) {
      alert("Failed to update fertilizer application.");
    } finally {
      setIsSaving(false);
    }
  };

  // KPIs for Ledger
  const totalMaterialCost = ledgerData.reduce((acc, curr) => acc + (parseFloat(curr.quantity) * parseFloat(curr.unitCost || curr.unit_cost)), 0);
  const totalLaborCost = ledgerData.reduce((acc, curr) => acc + parseFloat(curr.laborCost || curr.labor_cost || 0), 0);
  const totalQuantity = ledgerData.reduce((acc, curr) => acc + parseFloat(curr.quantity || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Nunito']">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-green-600/20">
              <Sprout size={20} className="text-white" />
            </div>
            Fertilizer Operations
          </h1>
          <p className="text-sm font-medium text-gray-500 pl-[52px]">
            Track soil nutrition applications and upcoming schedules
          </p>
        </div>
        
        {/* Global Filters (Only show on Ledger tab) */}
        {activeTab === 'Ledger' && (
          <div className="flex gap-2">
            <select 
              value={selectedFarm} 
              onChange={(e) => setSelectedFarm(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-xl px-4 py-2 outline-none cursor-pointer shadow-sm focus:border-green-500"
            >
              <option value="All">All Farms</option>
              <option value="MR1">MR1 Farm</option>
              <option value="MR2">MR2 Farm</option>
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-xl px-4 py-2 outline-none cursor-pointer shadow-sm focus:border-green-500"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
        )}
      </div>

      {/* ── TABS ── */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('Ledger')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'Ledger' ? 'border-green-600 text-green-700 bg-green-50/50 rounded-t-xl' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Sprout size={16} /> Application Ledger
        </button>
        <button
          onClick={() => setActiveTab('Due Schedule')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'Due Schedule' ? 'border-green-600 text-green-700 bg-green-50/50 rounded-t-xl' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <CalendarClock size={16} /> Upcoming / Due
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <Loader2 className="animate-spin mx-auto text-green-600 mb-4" size={32} />
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Loading Data...</p>
        </div>
      ) : (
        <>
          {/* ── TAB: LEDGER ── */}
          {activeTab === 'Ledger' && (
            <div className="space-y-6">
              
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Applied</p>
                    <h3 className="text-xl font-black text-gray-900">{totalQuantity} <span className="text-sm text-gray-500 font-bold">Units</span></h3>
                  </div>
                  <Scale size={28} className="text-green-200" />
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Material Cost</p>
                    <h3 className="text-xl font-black text-green-700">Rs. {fmt(totalMaterialCost)}</h3>
                  </div>
                  <CircleDollarSign size={28} className="text-green-200" />
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Labor Cost</p>
                    <h3 className="text-xl font-black text-orange-600">Rs. {fmt(totalLaborCost)}</h3>
                  </div>
                  <Users size={28} className="text-orange-200" />
                </div>
              </div>

              {/* Ledger Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="font-bold text-gray-800">Application Records</h2>
                  <button 
                    onClick={() => setIsAdding(true)} disabled={isAdding}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:-translate-y-0.5 transition-transform flex items-center gap-2 disabled:opacity-50"
                  >
                    <Plus size={14} /> Add Application
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4 text-left">Date</th>
                        <th className="p-4 text-left">Farm</th>
                        <th className="p-4 text-left">Fertilizer Type</th>
                        <th className="p-4 text-right">Quantity</th>
                        <th className="p-4 text-right">Costs (Rs.)</th>
                        <th className="p-4 text-right">Total (Rs.)</th>
                        <th className="p-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* ADD ROW */}
                      {isAdding && (
                        <tr className="bg-green-50/30 border-b border-green-100 align-top">
                          <td className="p-3"><input type="date" value={newRow.date} onChange={e => setNewRow({...newRow, date: e.target.value})} className="w-full p-2 text-xs border border-gray-300 rounded outline-none" disabled={isSaving} /></td>
                          <td className="p-3">
                            <select value={newRow.farm} onChange={e => setNewRow({...newRow, farm: e.target.value})} className="w-full p-2 text-xs border border-gray-300 rounded outline-none bg-white" disabled={isSaving}>
                              <option value="MR1">MR1</option>
                              <option value="MR2">MR2</option>
                            </select>
                          </td>
                          <td className="p-3"><input type="text" placeholder="e.g. Muriate of Potash" value={newRow.fertilizerName} onChange={e => setNewRow({...newRow, fertilizerName: e.target.value})} className="w-full p-2 text-xs border border-gray-300 rounded outline-none" disabled={isSaving} /></td>
                          <td className="p-3 text-right"><input type="number" placeholder="Qty" value={newRow.quantity} onChange={e => setNewRow({...newRow, quantity: e.target.value})} className="w-24 p-2 text-xs border border-gray-300 rounded outline-none text-right ml-auto" disabled={isSaving} /></td>
                          <td className="p-3 space-y-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-[10px] text-gray-400">Unit:</span>
                              <input type="number" placeholder="Unit Rate" value={newRow.unitCost} onChange={e => setNewRow({...newRow, unitCost: e.target.value})} className="w-20 p-2 text-xs border border-gray-300 rounded outline-none text-right" disabled={isSaving} />
                            </div>
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-[10px] text-gray-400">Labor:</span>
                              <input type="number" placeholder="Labor Cost" value={newRow.laborCost} onChange={e => setNewRow({...newRow, laborCost: e.target.value})} className="w-20 p-2 text-xs border border-gray-300 rounded outline-none text-right" disabled={isSaving} />
                            </div>
                          </td>
                          <td className="p-3 text-right pt-6 font-black text-gray-900">
                            Rs. {fmt(((parseFloat(newRow.quantity)||0) * (parseFloat(newRow.unitCost)||0)) + (parseFloat(newRow.laborCost)||0))}
                          </td>
                          <td className="p-3 text-right pt-5">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setIsAdding(false)} disabled={isSaving} className="p-1.5 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"><X size={14}/></button>
                              <button onClick={handleSave} disabled={isSaving} className="p-1.5 bg-green-600 rounded text-white shadow hover:bg-green-700">{isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}</button>
                            </div>
                          </td>
                        </tr>
                      )}
                      
                      {ledgerData.length === 0 && !isAdding ? (
                        <tr><td colSpan={7} className="p-6 text-center text-gray-400 font-bold">No applications found for this filter.</td></tr>
                      ) : ledgerData.map(app => {
                        // Handle backend variable names (camelCase vs snake_case)
                        const name = app.fertilizerName || app.fertilizer_name;
                        const qty = parseFloat(app.quantity || 0);
                        const unitCost = parseFloat(app.unitCost || app.unit_cost || 0);
                        const laborCost = parseFloat(app.laborCost || app.labor_cost || 0);
                        const totalCost = (qty * unitCost) + laborCost;

                        if (editingId === app.id) {
                          return (
                            <tr key={app.id} className="bg-blue-50/30 border-t border-blue-100 align-top">
                              <td className="p-3"><input type="date" value={editRow.date} onChange={e => setEditRow({...editRow, date: e.target.value})} className="w-full p-2 text-xs border border-gray-300 rounded outline-none" disabled={isSaving} /></td>
                              <td className="p-3">
                                <select value={editRow.farm} onChange={e => setEditRow({...editRow, farm: e.target.value})} className="w-full p-2 text-xs border border-gray-300 rounded outline-none bg-white" disabled={isSaving}>
                                  <option value="MR1">MR1</option>
                                  <option value="MR2">MR2</option>
                                </select>
                              </td>
                              <td className="p-3"><input type="text" value={editRow.fertilizerName} onChange={e => setEditRow({...editRow, fertilizerName: e.target.value})} className="w-full p-2 text-xs border border-gray-300 rounded outline-none" disabled={isSaving} /></td>
                              <td className="p-3 text-right"><input type="number" value={editRow.quantity} onChange={e => setEditRow({...editRow, quantity: e.target.value})} className="w-24 p-2 text-xs border border-gray-300 rounded outline-none text-right ml-auto" disabled={isSaving} /></td>
                              <td className="p-3 space-y-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-[10px] text-gray-400">Unit:</span>
                                  <input type="number" value={editRow.unitCost} onChange={e => setEditRow({...editRow, unitCost: e.target.value})} className="w-20 p-2 text-xs border border-gray-300 rounded outline-none text-right" disabled={isSaving} />
                                </div>
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-[10px] text-gray-400">Labor:</span>
                                  <input type="number" value={editRow.laborCost} onChange={e => setEditRow({...editRow, laborCost: e.target.value})} className="w-20 p-2 text-xs border border-gray-300 rounded outline-none text-right" disabled={isSaving} />
                                </div>
                              </td>
                              <td className="p-3 text-right pt-6 font-black text-gray-900">
                                Rs. {fmt(((parseFloat(editRow.quantity)||0) * (parseFloat(editRow.unitCost)||0)) + (parseFloat(editRow.laborCost)||0))}
                              </td>
                              <td className="p-3 text-right pt-5">
                                <div className="flex justify-end gap-2">
                                  <button onClick={cancelEdit} disabled={isSaving} className="p-1.5 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"><X size={14}/></button>
                                  <button onClick={() => handleUpdate(app)} disabled={isSaving} className="p-1.5 bg-green-600 rounded text-white shadow hover:bg-green-700">{isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}</button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={app.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                            <td className="p-4 font-bold text-gray-900">{app.date}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide flex items-center w-max gap-1 ${app.farm === 'MR1' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                <MapPin size={10}/> {app.farm}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-gray-800">{name}</td>
                            <td className="p-4 text-right font-black text-gray-900">{qty}</td>
                            <td className="p-4 text-right text-xs">
                              <p className="text-gray-500"><span className="font-bold text-gray-400 mr-1">Unit:</span>Rs. {fmt(unitCost)}</p>
                              <p className="text-gray-500"><span className="font-bold text-gray-400 mr-1">Labor:</span>Rs. {fmt(laborCost)}</p>
                            </td>
                            <td className="p-4 text-right font-black text-green-700">Rs. {fmt(totalCost)}</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => startEdit(app)} title="Edit" className="text-gray-400 hover:text-blue-600 transition-colors p-1"><Pencil size={14} /></button>
                                <button onClick={() => handleDelete(app.id)} title="Delete" className="text-gray-400 hover:text-red-500 transition-colors p-1"><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: DUE SCHEDULE ── */}
          {activeTab === 'Due Schedule' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-8 text-center">
              {dueData.length === 0 ? (
                <>
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                    <Check size={28} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-2">All Caught Up!</h3>
                  <p className="text-sm text-gray-500 font-medium max-w-md mx-auto">
                    There are currently no fertilizer applications due. Your schedule is clear.
                  </p>
                </>
              ) : (
                <div className="text-left">
                  <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                    <CalendarClock className="text-amber-500" /> Upcoming Schedules
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dueData.map((dueItem, idx) => (
                      <div key={idx} className="border border-amber-200 bg-amber-50 rounded-xl p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="bg-amber-200 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">DUE SOON</span>
                          <span className="font-bold text-gray-900">{dueItem.dueDate || dueItem.due_date}</span>
                        </div>
                        <h4 className="font-black text-lg text-gray-800 mb-1">{dueItem.fertilizerName || dueItem.fertilizer_name || 'Scheduled Fertilizer'}</h4>
                        <p className="text-sm text-gray-600 flex items-center gap-1 font-bold">
                          <MapPin size={14} className="text-gray-400"/> {dueItem.farm} 
                          {dueItem.block && <span className="text-gray-400 font-normal"> - Block {dueItem.block}</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}