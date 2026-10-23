import { motion } from 'framer-motion';
import { Pin, PinOff, TrendingUp, TrendingDown } from 'lucide-react';
import type { IndexData } from '@/lib/types';
import { useFormatPrice } from '@/hooks/useMarketData';

interface MarketOverviewCardProps {
  index: IndexData;
  tick: 'up' | 'down' | 'same' | undefined;
  pinned: boolean;
  onTogglePin: (symbol: string) => void;
  onClick: (symbol: string) => void;
  isActive: boolean;
}

export function MarketOverviewCard({
  index,
  tick,
  pinned,
  onTogglePin,
  onClick,
  isActive,
}: MarketOverviewCardProps) {
  const { formatPrice } = useFormatPrice();
  const isUp = index.change >= 0;

  const range = index.dayHigh - index.dayLow;
  const dayRangePercent =
    range > 0
      ? Math.min(100, Math.max(0, ((index.price - index.dayLow) / range) * 100))
      : 50;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      whileHover={{ y: -4 }}
      onClick={() => onClick(index.symbol)}
      className={`glass-card group relative cursor-pointer overflow-hidden rounded-2xl p-5 transition-all hover:shadow-2xl ${
        isActive ? (isUp ? 'glow-bull' : 'glow-bear') : ''
      }`}
    >
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-40 ${
          isUp ? 'bg-emerald-500' : 'bg-rose-500'
        }`}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                {index.symbol}
              </h3>
              {isActive && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{index.name}</p>
          </div>
          <button
            type="button"
            aria-label={pinned ? 'Unpin' : 'Pin'}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(index.symbol);
            }}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <motion.div
              animate={{ rotate: pinned ? 0 : -45, scale: pinned ? 1 : 0.9 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {pinned ? (
                <Pin className="h-4 w-4 text-emerald-400" fill="currentColor" />
              ) : (
                <PinOff className="h-4 w-4" />
              )}
            </motion.div>
          </button>
        </div>

        <motion.div
          key={index.price}
          initial={
            tick === 'up'
              ? { backgroundColor: 'rgba(16,185,129,0.15)' }
              : tick === 'down'
                ? { backgroundColor: 'rgba(239,68,68,0.15)' }
                : {}
          }
          animate={{ backgroundColor: 'rgba(0,0,0,0)' }}
          transition={{ duration: 0.5 }}
          className="mt-4 inline-block rounded-lg px-1"
        >
          <span className="font-mono-tabular text-3xl font-bold tracking-tight md:text-4xl">
            {formatPrice(index.price)}
          </span>
        </motion.div>

        <div className="mt-2 flex items-center gap-2">
          <span
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
              isUp
                ? 'bg-emerald-500/15 text-emerald-500'
                : 'bg-rose-500/15 text-rose-500'
            }`}
          >
            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isUp ? '+' : ''}
            {index.change.toFixed(2)}
          </span>
          <span
            className={`rounded-md px-2 py-1 text-xs font-semibold ${
              isUp
                ? 'bg-emerald-500/15 text-emerald-500'
                : 'bg-rose-500/15 text-rose-500'
            }`}
          >
            {isUp ? '+' : ''}
            {index.changePercent.toFixed(2)}%
          </span>
        </div>

        {/* Day Range progress bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>L: {formatPrice(index.dayLow)}</span>
            <span>Day Range</span>
            <span>H: {formatPrice(index.dayHigh)}</span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-full ${
                isUp ? 'bg-emerald-500/70' : 'bg-rose-500/70'
              }`}
              initial={false}
              animate={{ width: `${dayRangePercent}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
            <div
              className="absolute top-1/2 z-10 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-background bg-foreground shadow-md transition-all duration-500"
              style={{ left: `calc(${dayRangePercent}% - 6px)` }}
              title={formatPrice(index.price)}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <StatPill label="OPEN" value={formatPrice(index.open)} />
          <StatPill label="PREV" value={formatPrice(index.prevClose)} />
          <StatPill label="52W H" value={formatPrice(index.yearHigh)} />
          <StatPill label="52W L" value={formatPrice(index.yearLow)} />
        </div>
      </div>
    </motion.div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-1">
      <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="font-mono-tabular text-[10px] font-semibold">{value}</span>
    </div>
  );
}
