import { useState, useEffect } from 'react';
import { X, Calculator, Sprout } from 'lucide-react';

export default function NewSaleModal({ isOpen, onClose }) {
  // Form State matching the client's exact ledger columns
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    farm: 'MR1',
    qty1: '',
    rate1: '',
    discount: '',
    qty2: '',
    rate2: '',
  });

  // Auto-calculated totals state
  const [totals, setTotals] = useState({ subtotal1: 0, subtotal2: 0, netTotal: 0 });

  // Real-time calculation effect
  useEffect(() => {
    const q1 = parseFloat(formData.qty1) || 0;
    const r1 = parseFloat(formData.rate1) || 0;
    const d1 = parseFloat(formData.discount) || 0;
    const q2 = parseFloat(formData.qty2) || 0;
    const r2 = parseFloat(formData.rate2) || 0;

    // Based on client's ledger logic: Discount applies to 1st quality quantity
    const sub1 = Math.max(0, (q1 - d1)) * r1; 
    const sub2 = q2 * r2;

    setTotals({
      subtotal1: sub1,
      subtotal2: sub2,
      netTotal: sub1 + sub2
    });
  }, [formData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Saving Sale:", { ...formData, ...totals });
    // Connect to your API/State store here later
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-2xl rounded-[1.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sprout size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text font-heading">Record Coconut Sale</h2>
              <p className="text-xs text-earth">Estate yield data entry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto">
          <form id="sale-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Top Row: General Info */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-text mb-1.5">Date of Sale</label>
                <input 
                  type="date" name="date" value={formData.date} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-text focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text mb-1.5">Estate Farm</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setFormData({...formData, farm: 'MR1'})}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${formData.farm === 'MR1' ? 'bg-primary-light/20 border-primary text-primary' : 'border-gray-200 text-earth hover:bg-gray-50'}`}>
                    MR1 Block
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, farm: 'MR2'})}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${formData.farm === 'MR2' ? 'bg-primary-light/20 border-primary text-primary' : 'border-gray-200 text-earth hover:bg-gray-50'}`}>
                    MR2 Block
                  </button>
                </div>
              </div>
            </div>

            {/* Middle Row: 1st Quality (With distinct styling) */}
            <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
              <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                1st Quality Yield
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-earth mb-1">Quantity (Nuts)</label>
                  <input type="number" name="qty1" value={formData.qty1} onChange={handleChange} placeholder="e.g. 6400" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-earth mb-1">Rate (Rs.)</label>
                  <input type="number" name="rate1" value={formData.rate1} onChange={handleChange} placeholder="e.g. 137" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-600 mb-1">Discount Qty (-)</label>
                  <input type="number" name="discount" value={formData.discount} onChange={handleChange} placeholder="e.g. 265" className="w-full border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none" />
                </div>
              </div>
            </div>

            {/* Bottom Row: 2nd Quality */}
            <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4">
              <h3 className="text-sm font-bold text-text">2nd Quality Yield</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-earth mb-1">Quantity (Nuts)</label>
                  <input type="number" name="qty2" value={formData.qty2} onChange={handleChange} placeholder="Optional" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-earth mb-1">Rate (Rs.)</label>
                  <input type="number" name="rate2" value={formData.rate2} onChange={handleChange} placeholder="Optional" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none" />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer: Live Calculator & Actions */}
        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          
          {/* Live Total Display */}
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm text-primary">
                <Calculator size={20} />
             </div>
             <div>
                <p className="text-xs font-bold text-earth uppercase tracking-wider mb-0.5">Calculated Net Total</p>
                <p className="text-2xl font-bold text-text font-heading">
                  Rs. {totals.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
             </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-earth hover:text-text transition-colors">
              Cancel
            </button>
            <button form="sale-form" type="submit" className="btn-primary px-6 py-2.5 text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
              Save Entry
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}