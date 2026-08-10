import { useRef, useState, useEffect } from "react";
import { Eraser, Check, PenLine } from "lucide-react";

// A small draw-with-finger/mouse signature pad. When `value` (a PNG data URL)
// exists it shows the saved signature with a "Re-sign" option; otherwise it
// shows a canvas to draw on, with Clear / Save.
export default function SignaturePad({ value, onSave, saving }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [editing, setEditing] = useState(!value);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!editing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
  }, [editing]);

  const pos = (e) => {
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - r.left) * (c.width / r.width), y: (cy - r.top) * (c.height / r.height) };
  };
  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setDirty(true);
  };
  const end = () => {
    drawing.current = false;
  };
  const clear = () => {
    const c = canvasRef.current;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
    setDirty(false);
  };
  const save = () => onSave(canvasRef.current.toDataURL("image/png"));

  if (value && !editing) {
    return (
      <div>
        <div className="border border-gray-200 rounded-lg bg-white p-2 flex items-center justify-center">
          <img src={value} alt="Employee signature" className="max-h-24" />
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 text-xs font-bold text-blue-600 inline-flex items-center gap-1 hover:underline"
        >
          <PenLine size={12} /> Re-sign
        </button>
      </div>
    );
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={480}
        height={140}
        className="w-full border border-dashed border-gray-300 rounded-lg bg-gray-50 touch-none cursor-crosshair"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={clear}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-bold inline-flex items-center gap-1 hover:bg-gray-50"
        >
          <Eraser size={12} /> Clear
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="px-3 py-1.5 rounded-lg bg-green-700 text-white text-xs font-black inline-flex items-center gap-1 disabled:opacity-50 hover:bg-green-800"
        >
          <Check size={12} /> {saving ? "Saving…" : "Save signature"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-3 py-1.5 rounded-lg text-gray-500 text-xs font-bold hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
