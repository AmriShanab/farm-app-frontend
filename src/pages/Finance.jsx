import { useState, useEffect } from 'react';
import { 
  Landmark, ReceiptText, Search, Plus, Loader2, Check, X, Trash2, 
  CreditCard, Wallet, FileText, ArrowRight
} from 'lucide-react';
import { 
  getOwnerFinancials, createOwnerFinancial, deleteOwnerFinancial, searchCheques 
} from '../services/api';

const fmt = (n) => Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function FinanceManagement() {
  const [activeTab, setActiveTab] = useState('Owner Financials');
  
  // Data States
  const [financials, setFinancials] = useState([]);
  const [cheques, setCheques] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [chequeSearch, setChequeSearch] = useState('');

  // Fetch Data based on active tab
  useEffect(() => {
    setIsLoading(true);
    if (activeTab === 'Owner Financials') {
      getOwnerFinancials(selectedYear)
        .then(setFinancials)
        .catch(() => setFinancials([]))
        .finally(() => setIsLoading(false));
    } else if (activeTab === 'Cheque Tracker') {
      const timer = setTimeout(() => {
        searchCheques(chequeSearch)
          .then(setCheques)
          .catch(() => setCheques([]))
          .finally(() => setIsLoading(false));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, selectedYear, chequeSearch]);

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Nunito']">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-green-600/20">
              <Landmark size={20} className="text-white" />
            </div>
            Finance & Banking
          </h1>
          <p className="text-sm font-medium text-gray-500 pl-[52px]">
            Manage owner financials, leasing, and track global cheques
          </p>
        </div>
      </div>

      {/* ── SUB NAV TABS ── */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto custom-scrollbar">
        {[
          { id: 'Owner Financials', icon: CreditCard },
          { id: 'Cheque Tracker', icon: ReceiptText }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-green-600 text-green-700 bg-green-50/50 rounded-t-xl' 
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <tab.icon size={16} /> {tab.id}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="pb-10">
        {activeTab === 'Owner Financials' && (
          <OwnerFinancialsTab 
            data={financials} 
            setData={setFinancials} 
            isLoading={isLoading} 
            selectedYear={selectedYear} 
            setSelectedYear={setSelectedYear} 
          />
        )}
        
        {activeTab === 'Cheque Tracker' && (
          <ChequeTrackerTab 
            data={cheques} 
            isLoading={isLoading} 
            search={chequeSearch} 
            setSearch={setChequeSearch} 
          />
        )}
      </div>
    </div>
  );
}

// ─── TAB 1: OWNER FINANCIALS ────────────────────────────────────────────────
function OwnerFinancialsTab({ data, setData, isLoading, selectedYear, setSelectedYear }) {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [newRow, setNewRow] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'leasing', description: '', amount: '', accountNo: '', referenceNo: ''
  });

  const totalLeasing = data.filter(d => d.type === 'leasing').reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const totalOther = data.filter(d => d.type !== 'leasing').reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

  const handleSave = async () => {
    if (!newRow.description || !newRow.amount) return alert("Please fill details.");
    setIsSaving(true);
    try {
      const saved = await createOwnerFinancial({ ...newRow, amount: parseFloat(newRow.amount) });
      setData([saved, ...data]);
      setIsAdding(false);
      setNewRow({ date: new Date().toISOString().split('T')[0], type: 'leasing', description: '', amount: '', accountNo: '', referenceNo: '' });
    } catch (err) { alert("Error saving."); } 
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete record?")) {
      await deleteOwnerFinancial(id);
      setData(data.filter(item => item.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-600 to-green-800 text-white rounded-xl p-5 shadow-md flex items-center justify-between">
          <div>
            <p className="text-green-100 text-xs font-bold uppercase tracking-wider mb-1">Yearly Leasing</p>
            <h3 className="text-2xl font-black">Rs. {fmt(totalLeasing)}</h3>
          </div>
          <CreditCard size={32} className="opacity-30" />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Loans & Other</p>
            <h3 className="text-2xl font-black text-gray-900">Rs. {fmt(totalOther)}</h3>
          </div>
          <Wallet size={32} className="text-green-100" />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center">
           <select 
            value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 text-gray-800 text-sm font-bold rounded-lg px-4 py-2 outline-none focus:border-green-500"
          >
            <option value="2026">2026 Financials</option>
            <option value="2025">2025 Financials</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">Financial Ledger</h2>
          <button onClick={() => setIsAdding(true)} disabled={isAdding} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors">
            <Plus size={14} /> Add Record
          </button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Category</th>
                  <th className="p-4 text-left">Description</th>
                  <th className="p-4 text-left">Banking Ref</th>
                  <th className="p-4 text-right">Amount (Rs.)</th>
                  <th className="p-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {isAdding && (
                  <tr className="bg-green-50/30 border-b border-green-100">
                    <td className="p-2"><input type="date" value={newRow.date} onChange={e => setNewRow({...newRow, date: e.target.value})} className="w-full p-2 text-xs border border-gray-300 rounded outline-none" disabled={isSaving} /></td>
                    <td className="p-2">
                      <select value={newRow.type} onChange={e => setNewRow({...newRow, type: e.target.value})} className="w-full p-2 text-xs border border-gray-300 rounded outline-none bg-white" disabled={isSaving}>
                        <option value="leasing">Leasing</option>
                        <option value="loan_repayment">Loan Repayment</option>
                        <option value="other">Other</option>
                      </select>
                    </td>
                    <td className="p-2"><input type="text" placeholder="Description" value={newRow.description} onChange={e => setNewRow({...newRow, description: e.target.value})} className="w-full p-2 text-xs border border-gray-300 rounded outline-none" disabled={isSaving} /></td>
                    <td className="p-2"><input type="text" placeholder="Acc / Ref No" value={newRow.accountNo} onChange={e => setNewRow({...newRow, accountNo: e.target.value})} className="w-full p-2 text-xs border border-gray-300 rounded outline-none" disabled={isSaving} /></td>
                    <td className="p-2 text-right"><input type="number" placeholder="Amount" value={newRow.amount} onChange={e => setNewRow({...newRow, amount: e.target.value})} className="w-32 p-2 text-xs border border-gray-300 rounded outline-none text-right" disabled={isSaving} /></td>
                    <td className="p-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAdding(false)} disabled={isSaving} className="p-1.5 bg-gray-200 rounded text-gray-600"><X size={14}/></button>
                        <button onClick={handleSave} disabled={isSaving} className="p-1.5 bg-green-600 rounded text-white shadow">{isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}</button>
                      </div>
                    </td>
                  </tr>
                )}
                {data.map(record => (
                  <tr key={record.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-gray-900">{record.date}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${record.type === 'leasing' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {record.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-800">{record.description}</td>
                    <td className="p-4 text-xs text-gray-500 font-bold uppercase">{record.accountNo || 'N/A'}</td>
                    <td className="p-4 text-right font-black text-gray-900">Rs. {fmt(record.amount)}</td>
                    <td className="p-4 text-right"><button onClick={() => handleDelete(record.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TAB 2: CHEQUE TRACKER ──────────────────────────────────────────────────
function ChequeTrackerTab({ data, isLoading, search, setSearch }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div>
          <h2 className="font-bold text-gray-800 flex items-center gap-2">Cheque Registry</h2>
          <p className="text-xs text-gray-500 font-medium">Search for cheques issued across all farm modules.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" placeholder="Search Cheque No..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold outline-none focus:border-green-500 shadow-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4 text-left">Cheque Details</th>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Payee / Vendor</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-gray-400 font-bold">No cheques found.</td></tr>
              ) : data.map(cheque => (
                <tr key={cheque.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="p-4"><span className="font-black text-gray-800 bg-gray-100 px-2 py-1 rounded tracking-widest">{cheque.chequeNo}</span></td>
                  <td className="p-4 font-bold text-gray-600">{cheque.cheque_date}</td>
                  <td className="p-4 font-bold text-gray-900">{cheque.payee}</td>
                  <td className="p-4 text-gray-600 font-medium">{cheque.category}</td>
                  <td className="p-4 text-right font-black text-green-700">Rs. {fmt(cheque.amount)}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      cheque.status === 'Cleared' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>{cheque.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}