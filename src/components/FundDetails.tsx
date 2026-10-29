import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Bookmark, LoaderCircle, X } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PricePoint } from '@/lib/types';
import { fetchMutualFundHistory } from '@/services/marketDataService';
import type { TradeIdea } from '@/components/TradeIdeas';

type FundTimeframe = '1D' | '1W' | '1M' | '6M' | '1Y' | '3Y' | '5Y';
const TIMEFRAMES: FundTimeframe[] = ['1D', '1W', '1M', '6M', '1Y', '3Y', '5Y'];
const timeframeDays: Record<FundTimeframe, number> = {
  '1D': 1,
  '1W': 7,
  '1M': 31,
  '6M': 183,
  '1Y': 366,
  '3Y': 1096,
  '5Y': 1826,
};

function filterHistory(history: PricePoint[], timeframe: FundTimeframe): PricePoint[] {
  if (timeframe === '1D') return history.slice(-2);
  const cutoff = Date.now() - timeframeDays[timeframe] * 24 * 60 * 60 * 1000;
  const filtered = history.filter((point) => new Date(point.time).getTime() >= cutoff);
  return filtered.length > 1 ? filtered : history.slice(-2);
}

export function FundDetails({
  fund,
  onBack,
}: {
  fund: TradeIdea;
  onBack: () => void;
}) {
  const [timeframe, setTimeframe] = useState<FundTimeframe>('1Y');
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchMutualFundHistory(fund.schemeCode, controller.signal)
      .then((result) => setHistory(result.history))
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : 'Could not load fund data.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [fund.schemeCode]);

  const selectedHistory = useMemo(
    () => filterHistory(history, timeframe),
    [history, timeframe]
  );
  const chartData = selectedHistory.map((point) => ({
    label: new Date(point.time).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    }),
    nav: point.price,
    time: point.time,
  }));
  const latest = selectedHistory[selectedHistory.length - 1]?.price;
  const first = selectedHistory[0]?.price;
  const change = first && latest ? ((latest - first) / first) * 100 : null;

  return createPortal(
    (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 px-3 py-3 backdrop-blur-md sm:px-6 sm:py-6">
      <main className="mx-auto max-w-[1200px]">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </button>
        <button type="button" onClick={onBack} aria-label="Close fund preview" className="rounded-full border border-border/70 bg-background/70 p-2 text-muted-foreground transition hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <section className="glass-card overflow-hidden rounded-2xl p-5 sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-4 text-2xl">📈</div>
            <h1 className="max-w-3xl font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {fund.name}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {[fund.category, fund.style, 'Direct Growth'].map((tag) => (
                <span key={tag} className="rounded-full border border-border/70 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <button type="button" aria-label="Bookmark fund" className="rounded-full border border-border/70 p-3 text-muted-foreground transition hover:text-emerald-500">
            <Bookmark className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 flex items-end gap-3">
          <span className="font-mono-tabular text-3xl font-bold">
            {latest == null ? '—' : `₹${latest.toFixed(2)}`}
          </span>
          <span className={`mb-1 text-sm font-bold ${change == null || change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {change == null ? 'Loading NAV…' : `${change >= 0 ? '+' : ''}${change.toFixed(2)}% ${timeframe}`}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 rounded-lg bg-muted/50 p-1">
            {TIMEFRAMES.map((item) => (
              <button key={item} type="button" onClick={() => setTimeframe(item)}
                className={`rounded-md px-3 py-1.5 text-[10px] font-semibold ${timeframe === item ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                {item}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">MFAPI · Scheme {fund.schemeCode}</span>
        </div>

        <div className="mt-4 h-[340px] w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center"><LoaderCircle className="h-6 w-6 animate-spin text-emerald-500" /></div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-sm text-rose-500">{error}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 16, right: 12, bottom: 0, left: -12 }}>
                <defs><linearGradient id="fund-detail-area" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.28} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="hsl(var(--border) / 0.45)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} minTickGap={28} />
                <YAxis dataKey="nav" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={48} domain={['auto', 'auto']} />
                <Tooltip
                  cursor={{ stroke: '#10B981', strokeDasharray: '4 4', strokeWidth: 1 }}
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: '11px' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  formatter={(value: number) => [`₹${value.toFixed(2)}`, 'NAV']}
                />
                <Area type="monotone" dataKey="nav" stroke="#10B981" fill="url(#fund-detail-area)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#10B981', stroke: 'hsl(var(--background))', strokeWidth: 2 }} name="NAV" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border/60 pt-5 sm:grid-cols-4">
          <FundMetric label="Latest NAV" value={latest == null ? '—' : `₹${latest.toFixed(2)}`} />
          <FundMetric label={`${timeframe} return`} value={change == null ? '—' : `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`} />
          <FundMetric label="Data points" value={String(selectedHistory.length)} />
          <FundMetric label="Data source" value="MFAPI" />
        </div>
      </section>
      </main>
    </div>
    ),
    document.body
  );
}

function FundMetric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-mono-tabular text-sm font-semibold">{value}</p></div>;
}
