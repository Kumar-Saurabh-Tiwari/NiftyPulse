import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { IndexData, Timeframe, ChartView } from '@/lib/types';
import { useFormatPrice } from '@/hooks/useMarketData';

interface IndexChartProps {
  index: IndexData;
  tick: 'up' | 'down' | 'same' | undefined;
}

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '6M', '1Y', '5Y'];
const VIEW_MODES: { key: ChartView; label: string }[] = [
  { key: 'area', label: 'Area' },
  { key: 'line', label: 'Line' },
  { key: 'candle', label: 'Bars' },
];

export function IndexChart({ index, tick }: IndexChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [view, setView] = useState<ChartView>('area');
  const { formatPrice, formatCompact } = useFormatPrice();
  const isUp = index.change >= 0;
  const color = isUp ? '#10B981' : '#EF4444';

  const chartData = useMemo(() => {
    const pointsMap: Record<Timeframe, number> = {
      '1D': 30,
      '1W': 50,
      '1M': 70,
      '6M': 100,
      '1Y': 120,
      '5Y': 150,
    };
    const count = pointsMap[timeframe];
    const slice = index.history.slice(-count);
    return slice.map((p) => ({
      time: new Date(p.time).toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      }),
      price: p.price,
      volume: p.volume,
    }));
  }, [index.history, timeframe]);

  const gradientId = `gradient-${index.symbol.replace(/\s/g, '')}`;
  const volumeGradientId = `vol-${index.symbol.replace(/\s/g, '')}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      className="glass-card relative overflow-hidden rounded-2xl p-5"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold">{index.name}</h2>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {index.symbol}
            </span>
            <motion.span
              key={index.price}
              initial={
                tick === 'up'
                  ? { backgroundColor: 'rgba(16,185,129,0.2)' }
                  : tick === 'down'
                    ? { backgroundColor: 'rgba(239,68,68,0.2)' }
                    : {}
              }
              animate={{ backgroundColor: 'rgba(0,0,0,0)' }}
              transition={{ duration: 0.5 }}
              className="rounded-md px-1.5 py-0.5"
            >
              <span className="font-mono-tabular text-xl font-bold">{formatPrice(index.price)}</span>
            </motion.span>
            <span
              className={`flex items-center gap-1 text-sm font-semibold ${
                isUp ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {isUp ? '▲' : '▼'} {Math.abs(index.change).toFixed(2)} ({Math.abs(index.changePercent).toFixed(2)}%)
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Live simulated feed · Volume {formatCompact(index.volume)}
          </p>
        </div>

        {/* Timeframe toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`relative rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors md:px-3 ${
                  timeframe === tf
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {timeframe === tf && (
                  <motion.span
                    layoutId={`tf-bg-${index.symbol}`}
                    className="absolute inset-0 rounded-md bg-foreground/10"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
                {tf}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5">
            {VIEW_MODES.map((vm) => (
              <button
                key={vm.key}
                onClick={() => setView(vm.key)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  view === vm.key
                    ? 'bg-foreground/10 text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {vm.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-6 h-[340px] w-full md:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {view === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
                <linearGradient id={volumeGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 50', 'dataMax + 50']}
                tickFormatter={(v: number) => formatPrice(v)}
                width={70}
              />
              <Tooltip content={<ChartTooltip formatPrice={formatPrice} formatCompact={formatCompact} />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            </AreaChart>
          ) : view === 'line' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 50', 'dataMax + 50']}
                tickFormatter={(v: number) => formatPrice(v)}
                width={70}
              />
              <Tooltip content={<ChartTooltip formatPrice={formatPrice} formatCompact={formatCompact} />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke={color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            </LineChart>
          ) : (
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={volumeGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 50', 'dataMax + 50']}
                tickFormatter={(v: number) => formatPrice(v)}
                width={70}
              />
              <Tooltip content={<ChartTooltip formatPrice={formatPrice} formatCompact={formatCompact} />} />
              <Bar
                dataKey="volume"
                fill={`url(#${volumeGradientId})`}
                radius={[2, 2, 0, 0]}
                yAxisId={undefined}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
  formatPrice: (n: number) => string;
  formatCompact: (n: number) => string;
}

function ChartTooltip({ active, payload, label, formatPrice, formatCompact }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const price = payload.find((p) => p.name === 'price')?.value;
  const volume = payload.find((p) => p.name === 'volume')?.value;

  return (
    <div className="glass-card rounded-lg border p-3 shadow-xl">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      {price !== undefined && (
        <p className="mt-1 font-mono-tabular text-sm font-bold">
          ₹{formatPrice(price)}
        </p>
      )}
      {volume !== undefined && (
        <p className="mt-0.5 font-mono-tabular text-xs text-muted-foreground">
          Vol: {formatCompact(volume)}
        </p>
      )}
    </div>
  );
}
