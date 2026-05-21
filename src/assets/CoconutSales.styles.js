export const thStyle = (align = 'left', width) => ({
  padding: '10px 14px',
  fontSize: '10.5px', fontWeight: 800,
  color: '#6b7a6b', textTransform: 'uppercase', letterSpacing: '0.7px',
  textAlign: align,
  ...(width ? { width } : {}),
});

export const tdStyle = (width) => ({
  padding: '12px 14px',
  verticalAlign: 'middle',
  ...(width ? { width } : {}),
});

export const inputStyle = {
  padding: '6px 8px',
  borderRadius: '6px',
  border: '1.5px solid #d1d5db',
  fontSize: '12px',
  fontWeight: 600,
  fontFamily: "'Nunito', sans-serif",
  color: '#111827',
  outline: 'none',
  transition: 'border-color 0.2s',
};

export const pageBtn = (active) => ({
  width: '28px', height: '28px', borderRadius: '7px',
  border: active ? 'none' : '1.5px solid #e5e7eb',
  background: active ? 'linear-gradient(135deg, #1a5c35, #0d3320)' : '#fff',
  color: active ? '#fff' : '#6b7280',
  fontSize: '12px', fontWeight: 800, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'Nunito', sans-serif",
  boxShadow: active ? '0 2px 8px rgba(13,51,32,0.3)' : 'none',
});
