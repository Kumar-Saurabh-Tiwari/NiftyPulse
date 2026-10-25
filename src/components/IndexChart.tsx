import { useState, useMemo, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Area,
  Line,
  ComposedChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { IndexData, Timeframe, ChartView, PricePoint } from '@/lib/types';
import { useFormatPrice } from '@/hooks/useMarketData';
import { fetchSymbolHistory } from '@/services/marketDataService';

interface IndexChartProps {
  index: IndexData;
  tick: 'up' | 'down' | 'same' | undefined;
  dataSource?: 'live' | 'unavailable';
}

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '6M', '1Y', '5Y'];
const VIEW_MODES: { key: ChartView; label: string }[] = [
  { key: 'area', label: 'Area' },
  { key: 'line', label: 'Line' },
  { key: 'candle', label: 'Bars' },
];

interface ChartDataPoint {
  time: string;
  price: number;
  priceOffset: number;
  volume: number;
  previousPrice: number;
  movingAverage: number;
  movingAverageOffset: number;
}

export function IndexChart({
  index,
  tick,
  dataSource = 'live',
}: IndexChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [view, setView] = useState<ChartView>('area');
  const [showVolume, setShowVolume] = useState(false);
  const [showMovingAverage, setShowMovingAverage] = useState(false);
  const [history, setHistory] = useState<PricePoint[]>(index.history);
  const [historyLoading, setHistoryLoading] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { formatPrice, formatCompact } = useFormatPrice();
  const isUp = index.change >= 0;
  const color = isUp ? '#10B981' : '#EF4444';

  useEffect(() => {
    if (timeframe === '1D') {
      setHistory(index.history);
    }
  }, [index.history, timeframe, index.symbol]);

  useEffect(() => {
    if (timeframe === '1D') return;

    const controller = new AbortController();
    setHistoryLoading(true);
    fetchSymbolHistory(index.symbol, timeframe, controller.signal)
      .then((points) => {
        if (points.length) setHistory(points);
      })
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') {
          console.warn('[IndexChart] history fetch failed', e);
        }
      })
      .finally(() => setHistoryLoading(false));

    return () => controller.abort();
  }, [index.symbol, timeframe]);

  const priceBounds = useMemo(() => {
    if (!history.length) return { low: 0, pad: 50 };
    const prices = history.map((point) => point.price);
    const low = Math.min(...prices);
    const high = Math.max(...prices);

    return {
      low,
      pad: Math.max((high - low) * 0.05, high * 0.001, 1),
    };
  }, [history]);

  const chartData = useMemo(() => {
    const barBase = priceBounds.low - priceBounds.pad;
    return history.map((point, index) => {
      const previousPrice = history[index - 1]?.price ?? point.price;
      const movingAverageStart = Math.max(0, index - 9);
      const movingAveragePoints = history.slice(movingAverageStart, index + 1);
      const movingAverage =
        movingAveragePoints.reduce((total, item) => total + item.price, 0) /
        movingAveragePoints.length;

      return {
        time: new Date(point.time).toLocaleString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: 'short',
        }),
        price: point.price,
        priceOffset: point.price - barBase,
        volume: point.volume,
        previousPrice,
        movingAverage,
        movingAverageOffset: movingAverage - barBase,
      };
    });
  }, [history, priceBounds]);

  const { pricePad, periodHigh, periodLow, periodChange } = useMemo(() => {
    if (!chartData.length) {
      return {
        pricePad: 50,
        periodHigh: 0,
        periodLow: 0,
        periodChange: 0,
      };
    }
    const prices = chartData.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;

    return {
      pricePad: Math.max((max - min) * 0.05, max * 0.001, 1),
      periodHigh: max,
      periodLow: min,
      periodChange:
        firstPrice === 0 ? 0 : ((lastPrice - firstPrice) / firstPrice) * 100,
    };
  }, [chartData]);

  const gradientId = `gradient-${index.symbol.replace(/\s/g, '')}`;
  const volumeGradientId = `vol-${index.symbol.replace(/\s/g, '')}`;
  const priceDomain: [number | string, number | string] =
    view === 'candle'
      ? [0, periodHigh - periodLow + pricePad * 2]
      : [`dataMin - ${pricePad}`, `dataMax + ${pricePad}`];
  const formatAxisPrice = (value: number) =>
    formatPrice(
      view === 'candle' ? value + periodLow - pricePad : value
    );
  const animationActive = !prefersReducedMotion;

  const axisProps = {
    tick: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
    tickLine: false as const,
    axisLine: false as const,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      className="glass-card relative overflow-hidden rounded-2xl p-4 sm:p-5"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold">{index.name}</h2>
              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
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
                <span className="font-mono-tabular text-xl font-bold">
                  {formatPrice(index.price)}
                </span>
              </motion.span>
              <span
                className={`flex items-center gap-1 text-sm font-semibold ${
                  isUp ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {isUp ? '▲' : '▼'} {Math.abs(index.change).toFixed(2)} (
                {Math.abs(index.changePercent).toFixed(2)}%)
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {dataSource === 'live' ? 'Live Yahoo Finance' : 'Waiting for live data'} feed
              {historyLoading ? ' · loading chart…' : ''} · Volume{' '}
              {formatCompact(index.volume)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="scrollbar-hide flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-muted/50 p-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                aria-pressed={timeframe === tf}
                className={`relative shrink-0 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
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
                <span className="relative">{tf}</span>
              </button>
            ))}
          </div>

          <div className="flex w-fit items-center gap-0.5 rounded-lg bg-muted/50 p-0.5">
            {VIEW_MODES.map((vm) => (
              <button
                key={vm.key}
                type="button"
                onClick={() => setView(vm.key)}
                aria-pressed={view === vm.key}
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

          <div className="flex w-fit items-center gap-1">
            <button
              type="button"
              aria-pressed={showVolume}
              onClick={() => setShowVolume((visible) => !visible)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                showVolume
                  ? 'bg-foreground/10 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Volume
            </button>
            <button
              type="button"
              aria-pressed={showMovingAverage}
              onClick={() => setShowMovingAverage((visible) => !visible)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                showMovingAverage
                  ? 'bg-foreground/10 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              10-point average
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/30 px-3 py-2.5 sm:max-w-md">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Period high
          </p>
          <p className="mt-0.5 font-mono-tabular text-xs font-semibold">
            {periodHigh ? formatPrice(periodHigh) : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Period low
          </p>
          <p className="mt-0.5 font-mono-tabular text-xs font-semibold">
            {periodLow ? formatPrice(periodLow) : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Period change
          </p>
          <p
            className={`mt-0.5 font-mono-tabular text-xs font-semibold ${
              periodChange >= 0 ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {periodChange > 0 ? '+' : ''}
            {periodChange.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="mt-6 h-[280px] w-full sm:h-[340px] md:h-[400px]">
        {!chartData.length ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {historyLoading ? 'Loading chart data…' : 'No chart data available'}
            </p>
            <p className="text-xs text-muted-foreground/80">
              Try another timeframe or refresh the feed.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              key={`${index.symbol}-${view}`}
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.12} />
                </linearGradient>
                <linearGradient
                  id={volumeGradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="time"
                {...axisProps}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis
                yAxisId="price"
                {...axisProps}
                domain={priceDomain}
                tickFormatter={formatAxisPrice}
                width={70}
              />
              <YAxis
                yAxisId="volume"
                orientation="right"
                hide
                domain={[0, (max: number) => max * 4]}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    formatPrice={formatPrice}
                    formatCompact={formatCompact}
                  />
                }
              />
              {showVolume && (
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  fill={`url(#${volumeGradientId})`}
                  maxBarSize={12}
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={animationActive}
                  animationDuration={650}
                  animationEasing="ease-out"
                />
              )}
              {view === 'area' ? (
                <Area
                  key="area-price"
                  yAxisId="price"
                  type="monotone"
                  dataKey="price"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                  isAnimationActive={animationActive}
                  animationDuration={650}
                  animationEasing="ease-out"
                />
              ) : view === 'line' ? (
                <Line
                  key="line-price"
                  yAxisId="price"
                  type="linear"
                  dataKey="price"
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="7 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                  isAnimationActive={animationActive}
                  animationDuration={650}
                  animationEasing="ease-out"
                />
              ) : (
                <Bar
                  key="bar-price"
                  yAxisId="price"
                  dataKey="priceOffset"
                  name="price"
                  maxBarSize={12}
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={animationActive}
                  animationDuration={650}
                  animationEasing="ease-out"
                >
                  {chartData.map((point, pointIndex) => (
                    <Cell
                      key={`price-bar-${pointIndex}`}
                      fill={
                        point.price >= point.previousPrice
                          ? '#10B981'
                          : '#EF4444'
                      }
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              )}
              {showMovingAverage && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey={
                    view === 'candle' ? 'movingAverageOffset' : 'movingAverage'
                  }
                  name="10-point average"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={{ r: 3 }}
                  isAnimationActive={animationActive}
                  animationDuration={650}
                  animationEasing="ease-out"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey?: string;
    payload?: ChartDataPoint;
  }>;
  label?: string;
  formatPrice: (n: number) => string;
  formatCompact: (n: number) => string;
}

function ChartTooltip({
  active,
  payload,
  label,
  formatPrice,
  formatCompact,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const pricePoint = payload.find(
    (p) => p.dataKey === 'price' || p.name === 'price'
  );
  const price = pricePoint?.payload?.price ?? pricePoint?.value;
  const volume = payload.find(
    (p) => p.dataKey === 'volume' || p.name === 'volume'
  )?.value;
  const chartPoint = pricePoint?.payload;
  const change = chartPoint
    ? chartPoint.price - chartPoint.previousPrice
    : undefined;

  return (
    <div className="glass-card rounded-lg border border-border p-3 shadow-xl">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {price !== undefined && (
        <p className="mt-1 font-mono-tabular text-sm font-bold">
          ₹{formatPrice(price)}
        </p>
      )}
      {change !== undefined && (
        <p
          className={`mt-0.5 font-mono-tabular text-xs ${
            change >= 0 ? 'text-emerald-500' : 'text-rose-500'
          }`}
        >
          {change >= 0 ? '+' : ''}
          {formatPrice(change)} since previous point
        </p>
      )}
      {volume !== undefined && (
        <p className="mt-0.5 font-mono-tabular text-xs text-muted-foreground">
          Vol: {formatCompact(volume)}
        </p>
      )}
      {chartPoint &&
        payload.some(
          (point) =>
            point.dataKey === 'movingAverage' ||
            point.dataKey === 'movingAverageOffset'
        ) && (
          <p className="mt-0.5 font-mono-tabular text-xs text-muted-foreground">
            10-point average: {formatPrice(chartPoint.movingAverage)}
          </p>
        )}
    </div>
  );
}
