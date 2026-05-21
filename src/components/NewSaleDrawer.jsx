import { useState, useEffect } from 'react';
import { X, Sprout, Calculator, ChevronRight, Leaf } from 'lucide-react';

export default function NewSaleDrawer({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    farm: 'MR1',
    qty1: '', rate1: '', discount1: '',
    qty2: '', rate2: '', discount2: '',
  });
  const [totals, setTotals] = useState({ sub1: 0, sub2: 0, net: 0 });
  const [step, setStep] = useState(1); // 2-step form for clarity

  useEffect(() => {
    const q1 = parseFloat(formData.qty1) || 0;
    const r1 = parseFloat(formData.rate1) || 0;
    const d1 = parseFloat(formData.discount1) || 0;
    const q2 = parseFloat(formData.qty2) || 0;
    const r2 = parseFloat(formData.rate2) || 0;
    const d2 = parseFloat(formData.discount2) || 0;
    const s1 = Math.max(0, q1 - d1) * r1;
    const s2 = Math.max(0, q2 - d2) * r2;
    setTotals({ sub1: s1, sub2: s2, net: s1 + s2 });
  }, [formData]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.({ ...formData, ...totals });
    onClose();
    setStep(1);
    setFormData({ date: new Date().toISOString().split('T')[0], farm: 'MR1', qty1: '', rate1: '', discount1: '', qty2: '', rate2: '', discount2: '' });
  };

  const fmt = (n) => n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(10,28,16,0.45)', backdropFilter: 'blur(3px)',
          opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Drawer Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '480px', zIndex: 50,
        background: '#fff',
        boxShadow: '-8px 0 40px rgba(10,28,16,0.15)',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Nunito', sans-serif",
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

        {/* ── DRAWER HEADER ── */}
        <div style={{
          padding: '20px 24px 18px',
          background: 'linear-gradient(135deg, #0d3320 0%, #1a5c35 100%)',
          position: 'relative', overflow: 'hidden', flexShrink: 0,
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', bottom: '-10px', left: '30%', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.12)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sprout size={20} color="#86efac" />
              </div>
              <div>
                <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '16px', margin: 0, letterSpacing: '-0.3px' }}>Record Coconut Sale</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '2px 0 0' }}>Estate yield data entry</p>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: '30px', height: '30px', border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.1)', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)',
              transition: 'background 0.2s',
            }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.35)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <X size={15} />
            </button>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', position: 'relative', zIndex: 1 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%', fontSize: '11px', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step >= s ? '#22c55e' : 'rgba(255,255,255,0.12)',
                  color: step >= s ? '#fff' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.3s',
                }}>{s}</div>
                <span style={{ fontSize: '11px', color: step >= s ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                  {s === 1 ? 'Sale Details' : '2nd Quality'}
                </span>
                {s < 2 && <ChevronRight size={12} color="rgba(255,255,255,0.25)" />}
              </div>
            ))}
          </div>
        </div>

        {/* ── FORM BODY ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <form id="drawer-sale-form" onSubmit={handleSubmit}>

            {/* Step 1 */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Date + Farm */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Date of Sale</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Estate Block</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['MR1', 'MR2'].map(f => (
                        <button key={f} type="button" onClick={() => setFormData({ ...formData, farm: f })} style={{
                          flex: 1, padding: '9px 0', borderRadius: '10px', fontSize: '12px', fontWeight: 800,
                          border: `2px solid ${formData.farm === f ? '#1b5e20' : '#e5e7eb'}`,
                          background: formData.farm === f ? '#f0fdf4' : '#fff',
                          color: formData.farm === f ? '#1b5e20' : '#9ca3af',
                          cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Nunito', sans-serif",
                        }}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 1st Quality section */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.8px' }}>1st Quality Yield</span>
                  </div>

                  <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={labelStyle}>Quantity (Nuts)</label>
                        <input type="number" name="qty1" value={formData.qty1} onChange={handleChange} placeholder="e.g. 6400" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Rate per Nut (Rs.)</label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#6b7280', fontWeight: 700 }}>Rs.</span>
                          <input type="number" name="rate1" value={formData.rate1} onChange={handleChange} placeholder="137" style={{ ...inputStyle, paddingLeft: '38px' }} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={{ ...labelStyle, color: '#d97706' }}>Discount Quantity <span style={{ fontWeight: 500 }}>(deducted before calc)</span></label>
                      <input type="number" name="discount1" value={formData.discount1} onChange={handleChange} placeholder="e.g. 265 nuts discounted" style={{ ...inputStyle, borderColor: '#fcd34d', background: '#fffbeb' }} />
                    </div>

                    {/* Live preview */}
                    {totals.sub1 > 0 && (
                      <div style={{ background: '#dcfce7', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>1st Quality Subtotal</span>
                        <span style={{ fontSize: '14px', fontWeight: 900, color: '#14532d' }}>Rs. {fmt(totals.sub1)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button type="button" onClick={() => setStep(2)} style={{
                  width: '100%', padding: '13px', background: 'linear-gradient(135deg, #1a5c35, #0d3320)',
                  color: '#fff', border: 'none', borderRadius: '12px', fontSize: '13px',
                  fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  letterSpacing: '0.3px',
                }}>
                  Next — Add 2nd Quality <ChevronRight size={15} />
                </button>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* 1st quality summary chip */}
                <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Leaf size={14} color="#16a34a" />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534' }}>1st Quality: {formData.qty1 || 0} nuts @ Rs.{formData.rate1 || 0}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: '#15803d' }}>Rs. {fmt(totals.sub1)}</span>
                </div>

                {/* 2nd Quality section */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }} />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px' }}>2nd Quality Yield <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></span>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={labelStyle}>Quantity (Nuts)</label>
                        <input type="number" name="qty2" value={formData.qty2} onChange={handleChange} placeholder="Optional" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Rate per Nut (Rs.)</label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#6b7280', fontWeight: 700 }}>Rs.</span>
                          <input type="number" name="rate2" value={formData.rate2} onChange={handleChange} placeholder="Optional" style={{ ...inputStyle, paddingLeft: '38px' }} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label style={{ ...labelStyle, color: '#d97706' }}>Discount Quantity</label>
                      <input type="number" name="discount2" value={formData.discount2} onChange={handleChange} placeholder="Optional" style={{ ...inputStyle, borderColor: '#fcd34d', background: '#fffbeb' }} />
                    </div>

                    {totals.sub2 > 0 && (
                      <div style={{ background: '#f1f5f9', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>2nd Quality Subtotal</span>
                        <span style={{ fontSize: '14px', fontWeight: 900, color: '#1e293b' }}>Rs. {fmt(totals.sub2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setStep(1)} style={{
                    flex: '0 0 auto', padding: '13px 18px', background: '#f1f5f9',
                    color: '#475569', border: 'none', borderRadius: '12px', fontSize: '13px',
                    fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                  }}>← Back</button>
                  <button form="drawer-sale-form" type="submit" style={{
                    flex: 1, padding: '13px', background: 'linear-gradient(135deg, #1a5c35, #0d3320)',
                    color: '#fff', border: 'none', borderRadius: '12px', fontSize: '13px',
                    fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                    letterSpacing: '0.3px',
                  }}>Save Entry</button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* ── NET TOTAL FOOTER ── */}
        <div style={{
          padding: '16px 24px', flexShrink: 0,
          borderTop: '1.5px solid #f0fdf4',
          background: 'linear-gradient(to right, #f0fdf4, #fff)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', background: '#dcfce7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calculator size={18} color="#16a34a" />
              </div>
              <div>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Net Invoice Total</p>
                <p style={{ fontSize: '20px', fontWeight: 900, color: '#0d3320', margin: '1px 0 0', letterSpacing: '-0.5px', fontFamily: "'Nunito', sans-serif" }}>
                  Rs. {fmt(totals.net)}
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>{formData.farm} Block</p>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#374151', margin: '2px 0 0' }}>{formData.date}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  color: '#374151', marginBottom: '6px', letterSpacing: '0.2px',
};

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '9px 12px', border: '1.5px solid #e5e7eb',
  borderRadius: '10px', fontSize: '13px', color: '#111827',
  outline: 'none', fontFamily: "'Nunito', sans-serif",
  background: '#fff', transition: 'border-color 0.2s',
};