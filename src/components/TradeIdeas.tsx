import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BriefcaseBusiness, CheckCircle2, LoaderCircle } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PricePoint, Timeframe } from '@/lib/types';
import { fetchMutualFundHistory } from '@/services/marketDataService';

export interface TradeIdea {
  name: string;
  category: 'Equity' | 'Hybrid';
  style: string;
  schemeCode: number;
}

export const TRADE_IDEAS: TradeIdea[] = [
  { name: 'Parag Parikh Flexi Cap Fund Direct Growth', category: 'Equity', style: 'Flexi cap', schemeCode: 122639 },
  { name: 'UTI Nifty 50 Index Fund Direct Growth', category: 'Equity', style: 'Index', schemeCode: 120716 },
  { name: 'Kotak Mid Cap Fund Direct Growth', category: 'Equity', style: 'Mid cap', schemeCode: 119775 },
  { name: 'ICICI Prudential Multi Asset Allocation Fund Direct Growth', category: 'Hybrid', style: 'Multi-asset', schemeCode: 120334 },
  { name: 'Invesco India Mid Cap Fund Direct Growth', category: 'Equity', style: 'Mid cap', schemeCode: 120403 },
  { name: 'HDFC Small Cap Fund Direct Growth', category: 'Equity', style: 'Small cap', schemeCode: 130503 },
  { name: 'Bandhan Small Cap Fund Direct Growth', category: 'Equity', style: 'Small cap', schemeCode: 147946 },
  { name: 'Nippon India Large Cap Fund Direct Growth', category: 'Equity', style: 'Large cap', schemeCode: 118632 },
];

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '6M', '1Y', '5Y'];
const timeframeDays: Record<Timeframe, number> = {
  '1D': 1,
  '1W': 7,
  '1M': 31,
  '6M': 183,
  '1Y': 366,
  '5Y': 1826,
};

interface FundSeries {
  trade: TradeIdea;
  history: PricePoint[];
}

function filterHistory(history: PricePoint[], timeframe: Timeframe): PricePoint[] {
  if (timeframe === '1D') return history.slice(-2);
  const cutoff = Date.now() - timeframeDays[timeframe] * 24 * 60 * 60 * 1000;
  const filtered = history.filter((point) => new Date(point.time).getTime() >= cutoff);
  return filtered.length > 1 ? filtered : history.slice(-2);
}

export function TradeIdeas({ onSelectFund }: { onSelectFund: (fund: TradeIdea) => void }) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [view, setView] = useState<'area' | 'line'>('area');
  const [series, setSeries] = useState<FundSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all(
      TRADE_IDEAS.map(async (trade) => ({
        trade,
        history: (await fetchMutualFundHistory(trade.schemeCode, controller.signal)).history,
      }))
    )
      .then(setSeries)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : 'Could not load NAV history.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const chartData = useMemo(() => {
    const selected = series.map(({ trade, history }) => ({
      trade,
      history: filterHistory(history, timeframe),
    }));
    const points = selected
      .flatMap(({ history }) => history.map((point) => point.time))
      .filter((time, index, all) => all.indexOf(time) === index)
      .sort();
    return points.map((time) => {
      const point: Record<string, string | number> = {
        time,
        label: new Date(time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      };
      selected.forEach(({ trade, history }) => {
        const current = history.find((item) => item.time === time);
        const first = history[0]?.price;
        if (current && first) point[`fund-${trade.schemeCode}`] = Number(((current.price / first) * 100).toFixed(2));
      });
      return point;
    });
  }, [series, timeframe]);

  return (
    <section className="glass-card overflow-hidden rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-emerald-500">
            <BriefcaseBusiness className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Trade desk</span>
          </div>
          <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">Funds on your radar</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Live NAV history from MFAPI, normalized to 100 so each fund can be compared fairly.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5">
            {(['area', 'line'] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => setView(mode)}
                className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold capitalize ${view === mode ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground'}`}>
                {mode}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5">
            {TIMEFRAMES.map((item) => (
              <button key={item} type="button" onClick={() => setTimeframe(item)}
                className={`rounded-md px-2 py-1.5 text-[10px] font-semibold ${timeframe === item ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground'}`}>
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border/60 bg-background/30 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider">NAV performance</h3>
            <p className="mt-1 text-[10px] text-muted-foreground">Base 100 comparison · {timeframe} view</p>
          </div>
          {loading && <LoaderCircle className="h-4 w-4 animate-spin text-emerald-500" />}
          {!loading && !error && <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-500">Live NAV data</span>}
        </div>
        {error ? (
          <div className="flex h-52 items-center justify-center text-center text-xs text-rose-500">{error}</div>
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {view === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <defs><linearGradient id="trade-area" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.28} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="hsl(var(--border) / 0.45)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={34} domain={['auto', 'auto']} />
                  <Tooltip
                    cursor={{ stroke: '#10B981', strokeDasharray: '4 4', strokeWidth: 1 }}
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: '11px' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    formatter={(value: number) => [`${value.toFixed(2)}`, 'Base 100']}
                  />
                  <Area type="monotone" dataKey={`fund-${TRADE_IDEAS[0].schemeCode}`} stroke="#10B981" fill="url(#trade-area)" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: '#10B981', stroke: 'hsl(var(--background))', strokeWidth: 2 }} name={TRADE_IDEAS[0].name} />
                </AreaChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="hsl(var(--border) / 0.45)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={34} domain={['auto', 'auto']} />
                  <Tooltip
                    cursor={{ stroke: '#10B981', strokeDasharray: '4 4', strokeWidth: 1 }}
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: '11px' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  />
                  {TRADE_IDEAS.map((trade, index) => <Line key={trade.schemeCode} type="monotone" dataKey={`fund-${trade.schemeCode}`} stroke={['#10B981', '#38BDF8', '#F59E0B', '#F43F5E', '#8B5CF6', '#14B8A6', '#EC4899', '#84CC16'][index]} strokeWidth={1.8} dot={false} name={trade.name} connectNulls />)}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TRADE_IDEAS.map((trade, index) => {
          const fund = series.find((item) => item.trade.schemeCode === trade.schemeCode);
          const history = fund ? filterHistory(fund.history, timeframe) : [];
          const first = history[0]?.price;
          const latest = history[history.length - 1]?.price;
          const change = first && latest ? ((latest - first) / first) * 100 : null;
          return (
            <button type="button" key={trade.schemeCode} onClick={() => onSelectFund(trade)}
              className="group rounded-xl border border-border/60 bg-background/35 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-500/35">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 font-mono-tabular text-[10px] font-bold text-emerald-500">{String(index + 1).padStart(2, '0')}</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-emerald-500" />
              </div>
              <div className="mt-4"><h3 className="text-sm font-bold leading-snug">{trade.name}</h3>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">{trade.style}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500"><CheckCircle2 className="h-3 w-3" />{change == null ? 'Loading' : `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`}</span>
                </div>
                {latest != null && <p className="mt-3 font-mono-tabular text-xs text-muted-foreground">NAV ₹{latest.toFixed(2)}</p>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
