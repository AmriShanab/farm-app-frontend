import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Bird,
  CalendarDays,
  Download,
  Leaf,
  Loader2,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { getHeaders } from '../services/api';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

const money = (value) =>
  Number(value || 0).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const number = (value) =>
  Number(value || 0).toLocaleString('en-LK', { maximumFractionDigits: 2 });

const formatDate = (value) => {
  if (!value) return 'Present';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-LK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const titleCase = (value) =>
  String(value || '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());

function SummaryCard({ label, value, tone, icon: Icon }) {
  const tones = {
    green: 'bg-green-50 text-green-800 border-green-100',
    red: 'bg-rose-50 text-rose-800 border-rose-100',
    blue: 'bg-sky-50 text-sky-800 border-sky-100',
  };

  return (
    <div className={`rounded-2xl border p-5 ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wider opacity-70">{label}</p>
        <Icon size={19} />
      </div>
      <p className="mt-3 text-2xl font-black">Rs. {money(value)}</p>
    </div>
  );
}

function ProfitCard({ value }) {
  const positive = Number(value) >= 0;
  return (
    <div className={`rounded-2xl border p-5 ${positive ? 'bg-emerald-700 border-emerald-800' : 'bg-rose-700 border-rose-800'} text-white`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wider text-white/75">Net profit / loss</p>
        {positive ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
      </div>
      <p className="mt-3 text-2xl font-black">{positive ? '' : '-'}Rs. {money(Math.abs(value))}</p>
    </div>
  );
}

function AmountRows({ rows, totalLabel = 'Total' }) {
  const visibleRows = rows.filter((row) => Number(row.value) !== 0);
  const total = rows.reduce((sum, row) => sum + Number(row.value || 0), 0);

  return (
    <div className="divide-y divide-gray-100">
      {visibleRows.length === 0 && (
        <p className="py-5 text-sm text-gray-400">No records in this cycle.</p>
      )}
      {visibleRows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4 py-3 text-sm">
          <span className="text-gray-600">{row.label}</span>
          <span className="font-bold text-gray-900">Rs. {money(row.value)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-4 pt-4 text-sm font-black">
        <span>{totalLabel}</span>
        <span>Rs. {money(total)}</span>
      </div>
    </div>
  );
}

function CyclePicker({ items, value, onChange, type }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-gray-500">
        {type === 'harvest' ? 'Harvest cycle' : 'Poultry batch'}
      </span>
      <select
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
      >
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {type === 'harvest'
              ? `${item.farm} · ${formatDate(item.startDate)} → ${formatDate(item.endDate)}`
              : `Batch #${item.id} · ${formatDate(item.startDate)} · ${titleCase(item.status)}`}
          </option>
        ))}
      </select>
    </label>
  );
}

function HarvestBreakdown({ cycle }) {
  const incomeRows = [
    { label: 'Coconut sales', value: cycle.income.coconut },
    { label: 'Other income', value: cycle.income.other },
  ];
  const expenseRows = Object.entries(cycle.expenses)
    .filter(([key]) => key !== 'total')
    .map(([key, value]) => ({ label: titleCase(key), value }));

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Cycle income" value={cycle.income.total} tone="green" icon={Wallet} />
        <SummaryCard label="Cycle expenses" value={cycle.expenses.total} tone="red" icon={ArrowDownRight} />
        <ProfitCard value={cycle.netProfit} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-black text-gray-900">Income</h2>
          <p className="mt-1 text-xs text-gray-500">Income recorded during this harvest window.</p>
          <AmountRows rows={incomeRows} totalLabel="Total income" />
        </section>
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-black text-gray-900">Expenses</h2>
          <p className="mt-1 text-xs text-gray-500">Costs recorded from this harvest up to the next harvest.</p>
          <AmountRows rows={expenseRows} totalLabel="Total expenses" />
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-black text-gray-900">Coconut yield</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wider text-gray-400">
                <th className="pb-3">Grade</th>
                <th className="pb-3 text-right">Paid quantity</th>
                <th className="pb-3 text-right">Free quantity</th>
                <th className="pb-3 text-right">Total quantity</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(cycle.volumes).map(([grade, values]) => (
                <tr key={grade} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 font-bold">{titleCase(grade)}</td>
                  <td className="py-3 text-right">{number(values.paid_qty)}</td>
                  <td className="py-3 text-right">{number(values.free_qty)}</td>
                  <td className="py-3 text-right font-black">{number(values.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function PoultryBreakdown({ batch }) {
  const incomeRows = batch.income.sales.map((sale) => ({
    label: `${titleCase(sale.category)} (${sale.records} records)`,
    value: sale.amount,
  }));
  const expenseRows = [
    { label: 'Bird purchase', value: batch.expenses.batchPurchase },
    { label: 'Feed', value: batch.expenses.feed },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Batch income" value={batch.income.total} tone="green" icon={Wallet} />
        <SummaryCard label="Batch expenses" value={batch.expenses.total} tone="red" icon={ArrowDownRight} />
        <ProfitCard value={batch.netProfit} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-black text-gray-900">Sales income</h2>
          <p className="mt-1 text-xs text-gray-500">Every sale linked to batch #{batch.id}.</p>
          <AmountRows rows={incomeRows} totalLabel="Total sales" />
        </section>
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-black text-gray-900">Batch expenses</h2>
          <p className="mt-1 text-xs text-gray-500">Initial bird purchase and all linked feed costs.</p>
          <AmountRows rows={expenseRows} totalLabel="Total expenses" />
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-black text-gray-900">Feed breakdown</h2>
            <p className="mt-1 text-xs text-gray-500">Cost, payment, and outstanding balance by feed type.</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>{number(batch.birds)} birds · Rs. {money(batch.pricePerBird)} each</p>
            {batch.supplier && <p className="mt-1">Supplier: {batch.supplier}</p>}
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wider text-gray-400">
                <th className="pb-3">Feed type</th>
                <th className="pb-3 text-right">Quantity</th>
                <th className="pb-3 text-right">Full cost</th>
                <th className="pb-3 text-right">Paid</th>
                <th className="pb-3 text-right">Payable</th>
              </tr>
            </thead>
            <tbody>
              {batch.expenses.feedBreakdown.length === 0 && (
                <tr><td colSpan="5" className="py-6 text-center text-gray-400">No feed records for this batch.</td></tr>
              )}
              {batch.expenses.feedBreakdown.map((feed) => (
                <tr key={feed.feedType} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 font-bold">{feed.feedType}</td>
                  <td className="py-3 text-right">{number(feed.quantity)}</td>
                  <td className="py-3 text-right">Rs. {money(feed.amount)}</td>
                  <td className="py-3 text-right">Rs. {money(feed.paidAmount)}</td>
                  <td className="py-3 text-right font-black text-amber-700">Rs. {money(feed.payableBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {Number(batch.profitDistributed) !== 0 && (
          <div className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
            Profit already distributed: <strong>Rs. {money(batch.profitDistributed)}</strong>
          </div>
        )}
      </section>
    </>
  );
}

export default function MonthlyBreakdown() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('harvest');
  const [farm, setFarm] = useState('all');
  const [selectedHarvestId, setSelectedHarvestId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_BASE_URL}/dashboard/cycle-breakdown`, {
      headers: getHeaders(),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error?.message || payload?.message || 'Unable to load cycle breakdown.');
        }
        return payload?.data || payload;
      })
      .then(setData)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  const harvests = useMemo(() => {
    const cycles = data?.harvestCycles || [];
    return farm === 'all' ? cycles : cycles.filter((cycle) => cycle.farm === farm);
  }, [data, farm]);

  const selectedHarvest =
    harvests.find((cycle) => cycle.id === selectedHarvestId) || harvests[0] || null;
  const batches = data?.poultryBatches || [];
  const selectedBatch =
    batches.find((batch) => String(batch.id) === String(selectedBatchId)) || batches[0] || null;

  const exportBreakdown = () => {
    const rows = [];
    const selection = tab === 'harvest' ? selectedHarvest : selectedBatch;
    if (!selection) return;

    if (tab === 'harvest') {
      rows.push(['Harvest Cycle Breakdown']);
      rows.push(['Farm', selection.farm]);
      rows.push(['Start', selection.startDate], ['End', selection.endDate || data.asOfDate]);
      rows.push([]);
      rows.push(['Income', 'Amount']);
      Object.entries(selection.income).forEach(([key, value]) => rows.push([titleCase(key), value]));
      rows.push([]);
      rows.push(['Expense', 'Amount']);
      Object.entries(selection.expenses).forEach(([key, value]) => rows.push([titleCase(key), value]));
      rows.push([], ['Net profit / loss', selection.netProfit]);
    } else {
      rows.push(['Poultry Batch Breakdown'], ['Batch', selection.id]);
      rows.push(['Start', selection.startDate], ['End', selection.endDate || data.asOfDate]);
      rows.push([], ['Income category', 'Records', 'Amount']);
      selection.income.sales.forEach((sale) => rows.push([titleCase(sale.category), sale.records, sale.amount]));
      rows.push(['Total income', '', selection.income.total], []);
      rows.push(['Expense', 'Amount'], ['Bird purchase', selection.expenses.batchPurchase], ['Feed', selection.expenses.feed]);
      rows.push(['Total expenses', selection.expenses.total], ['Net profit / loss', selection.netProfit]);
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Cycle Breakdown');
    XLSX.writeFile(workbook, `${tab}-cycle-breakdown.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center text-green-700">
        <Loader2 className="animate-spin" size={30} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center">
        <AlertCircle className="mx-auto text-rose-600" size={30} />
        <p className="mt-3 font-bold text-rose-800">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError('');
            setReloadKey((key) => key + 1);
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white"
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  const selection = tab === 'harvest' ? selectedHarvest : selectedBatch;

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-green-700">Financial performance</p>
          <h1 className="mt-1 text-2xl font-black text-gray-900 md:text-3xl">Cycle Breakdown</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Review income, expenses, and profit from one harvest to the next or for an entire poultry batch.
          </p>
        </div>
        <button
          onClick={exportBreakdown}
          disabled={!selection}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40"
        >
          <Download size={17} /> Export selected cycle
        </button>
      </div>

      <div className="mt-7 inline-flex rounded-2xl bg-gray-100 p-1.5">
        <button
          onClick={() => setTab('harvest')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${tab === 'harvest' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-500'}`}
        >
          <Leaf size={17} /> Harvest breakdown
        </button>
        <button
          onClick={() => setTab('poultry')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${tab === 'poultry' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-500'}`}
        >
          <Bird size={17} /> Batch breakdown
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <div className={`grid gap-4 ${tab === 'harvest' ? 'md:grid-cols-[180px_1fr]' : ''}`}>
          {tab === 'harvest' && (
            <label className="block">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-gray-500">Farm</span>
              <select value={farm} onChange={(event) => setFarm(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-green-600">
                <option value="all">All farms</option>
                <option value="MR1">MR1</option>
                <option value="MR2">MR2</option>
              </select>
            </label>
          )}
          <CyclePicker
            type={tab}
            items={tab === 'harvest' ? harvests : batches}
            value={tab === 'harvest' ? selectedHarvest?.id : selectedBatch?.id}
            onChange={tab === 'harvest' ? setSelectedHarvestId : setSelectedBatchId}
          />
        </div>
      </div>

      {!selection ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center text-gray-400">
          <CalendarDays className="mx-auto mb-3" size={32} />
          <p className="font-bold">No {tab === 'harvest' ? 'harvest cycles' : 'poultry batches'} found.</p>
        </div>
      ) : (
        <div className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#153f2e] px-5 py-4 text-white">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/60">
                {tab === 'harvest' ? `${selection.farm} harvest cycle` : `Poultry batch #${selection.id}`}
              </p>
              <p className="mt-1 font-black">
                {formatDate(selection.startDate)} → {formatDate(selection.endDate)}
              </p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wider">
              {titleCase(selection.status)}
            </span>
          </div>
          {tab === 'harvest'
            ? <HarvestBreakdown cycle={selection} />
            : <PoultryBreakdown batch={selection} />}
        </div>
      )}
    </div>
  );
}
