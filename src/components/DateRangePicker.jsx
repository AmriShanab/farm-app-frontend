import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const iso = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const parse = (s) => new Date(s + "T00:00:00");
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const sameDay = (a, b) => a && b && iso(a) === iso(b);
const chip = (d) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${String(d.getFullYear()).slice(2)}`;

// Friday→Thursday week containing d.
const weekOf = (d) => {
  const back = (d.getDay() - 5 + 7) % 7;
  const start = addDays(d, -back);
  return { start, end: addDays(start, 6) };
};
const monthOf = (d) => ({
  start: new Date(d.getFullYear(), d.getMonth(), 1),
  end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
});

export default function DateRangePicker({ startDate, endDate, mode = "weekly", onChange }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => parse(endDate || iso(new Date())));
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => { if (open) setView(parse(endDate || iso(new Date()))); }, [open, endDate]);

  const start = startDate ? parse(startDate) : null;
  const end = endDate ? parse(endDate) : null;
  const snap = mode === "monthly" ? monthOf : weekOf;

  const commit = (d) => {
    const p = snap(d);
    onChange(iso(p.start), iso(p.end));
    setOpen(false);
  };

  const today = new Date();
  const presets = mode === "monthly"
    ? [0, 1, 2, 3].map((n) => ({
        label: n === 0 ? "This month" : n === 1 ? "Last month" : `${n} months ago`,
        date: new Date(today.getFullYear(), today.getMonth() - n, 15),
      }))
    : [0, 1, 2, 3].map((n) => ({
        label: n === 0 ? "This week" : n === 1 ? "Last week" : `${n} weeks ago`,
        date: addDays(today, -7 * n),
      }));

  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7; // Monday-first offset
  const gridStart = addDays(first, -lead);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2 shadow-sm text-sm font-bold text-gray-800 hover:border-green-400 transition-colors"
      >
        {start && end ? `${chip(start)} – ${chip(end)}` : "Select period"}
        <ChevronDown size={15} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 flex gap-8" style={{ minWidth: 540 }}>
          {/* Presets */}
          <div className="flex flex-col justify-between min-w-[130px]">
            <div className="space-y-1">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => commit(p.date)}
                  className="block w-full text-left px-2 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => commit(new Date())}
              className="text-left px-2 py-2 text-sm font-black text-blue-600 hover:underline"
            >
              Reset
            </button>
          </div>

          {/* Calendar */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className="font-black text-gray-900">{MONTHS[view.getMonth()]} {view.getFullYear()}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} className="p-1 rounded-lg hover:bg-gray-100">
                  <ChevronLeft size={18} className="text-gray-500" />
                </button>
                <button type="button" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} className="p-1 rounded-lg hover:bg-gray-100">
                  <ChevronRight size={18} className="text-gray-500" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-xs font-bold text-gray-400 pb-2">{w}</div>
              ))}
              {cells.map((d, i) => {
                const inMonth = d.getMonth() === view.getMonth();
                const inRange = start && end && d >= start && d <= end;
                const isStart = sameDay(d, start);
                const isEnd = sameDay(d, end);
                const edge = isStart || isEnd;
                const col = i % 7;
                const roundL = inRange && (isStart || col === 0);
                const roundR = inRange && (isEnd || col === 6);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => commit(d)}
                    className={`relative h-10 text-sm font-bold flex items-center justify-center
                      ${inRange ? "bg-blue-50" : ""}
                      ${roundL ? "rounded-l-full" : ""}
                      ${roundR ? "rounded-r-full" : ""}`}
                  >
                    <span
                      className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors
                        ${edge ? "bg-blue-600 text-white shadow-sm" : inMonth ? "text-gray-800 hover:bg-gray-100" : "text-gray-300"}`}
                    >
                      {d.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
