import './App.css';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Pin } from 'lucide-react';
import { Header } from '@/components/Header';
import { TickerTape } from '@/components/TickerTape';
import { MarketOverviewCard } from '@/components/MarketOverviewCard';
import { IndexChart } from '@/components/IndexChart';
import { MarketBreadthGauge } from '@/components/MarketBreadthGauge';
import { TopMovers } from '@/components/TopMovers';
import { SectoralHeatmap } from '@/components/SectoralHeatmap';
import { Watchlist, type WatchlistItem } from '@/components/Watchlist';
import { SearchModal } from '@/components/SearchModal';
import { useTheme } from '@/hooks/useTheme';
import { useMarketData, useFormatPrice } from '@/hooks/useMarketData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { IndexData } from '@/lib/types';

const DEFAULT_PINS: string[] = ['NIFTY 50', 'NIFTY BANK'];
const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: 'NIFTY 50', type: 'index' },
  { symbol: 'NIFTY BANK', type: 'index' },
  { symbol: 'RELIANCE', type: 'stock' },
  { symbol: 'TCS', type: 'stock' },
  { symbol: 'HDFCBANK', type: 'stock' },
];

function resolveHeroSymbols(pins: string[]): string[] {
  if (pins.length >= 2) return pins.slice(0, 2);
  if (pins.length === 1) {
    const fill = DEFAULT_PINS.find((s) => s !== pins[0]) ?? DEFAULT_PINS[0];
    return [pins[0], fill];
  }
  return DEFAULT_PINS;
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    indices,
    stocks,
    sectors,
    breadth,
    lastTick,
    source,
    loading,
    error,
    updatedAt,
    refresh,
  } = useMarketData(30_000);
  const [pins, setPins] = useLocalStorage<string[]>('niftypulse-pins', DEFAULT_PINS);
  const [watchlist, setWatchlist] = useLocalStorage<WatchlistItem[]>(
    'niftypulse-watchlist',
    DEFAULT_WATCHLIST
  );
  const [activeSymbol, setActiveSymbol] = useState<string>('NIFTY 50');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const togglePin = useCallback(
    (symbol: string) => {
      const wasPinned = pins.includes(symbol);
      setPins((prev) =>
        wasPinned ? prev.filter((s) => s !== symbol) : [...prev, symbol]
      );
      // When pinning, also ensure the symbol is on the watchlist
      if (!wasPinned) {
        setWatchlist((prev) => {
          if (prev.some((i) => i.symbol === symbol)) return prev;
          const isIndex = indices.some((i) => i.symbol === symbol);
          return [...prev, { symbol, type: isIndex ? 'index' : 'stock' }];
        });
      }
    },
    [pins, setPins, setWatchlist, indices]
  );

  const handleReorder = useCallback(
    (items: WatchlistItem[]) => setWatchlist(items),
    [setWatchlist]
  );

  const handleRemove = useCallback(
    (symbol: string) => {
      setWatchlist((prev) => prev.filter((i) => i.symbol !== symbol));
      setPins((prev) => prev.filter((s) => s !== symbol));
    },
    [setWatchlist, setPins]
  );

  const handleAdd = useCallback(
    (symbol: string, type: 'index' | 'stock') => {
      setWatchlist((prev) => {
        if (prev.some((i) => i.symbol === symbol)) return prev;
        return [...prev, { symbol, type }];
      });
      if (type === 'index') {
        setPins((prev) => (prev.includes(symbol) ? prev : [...prev, symbol]));
      }
    },
    [setWatchlist, setPins]
  );

  const handleSelectStock = useCallback(
    (symbol: string) => {
      handleAdd(symbol, 'stock');
      setSearchOpen(false);
    },
    [handleAdd]
  );

  const handleSelectIndex = useCallback((symbol: string) => {
    setActiveSymbol(symbol);
  }, []);

  const activeIndex: IndexData | undefined =
    indices.find((i) => i.symbol === activeSymbol) ?? indices[0];

  const heroSymbols = useMemo(() => resolveHeroSymbols(pins), [pins]);
  const heroCards = heroSymbols
    .map((s) => indices.find((i) => i.symbol === s))
    .filter((i): i is IndexData => i !== undefined);

  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute -right-40 top-40 h-96 w-96 rounded-full bg-rose-500/5 blur-3xl dark:bg-rose-500/10" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/5 blur-3xl dark:bg-blue-500/10" />
      </div>

      <div className="relative">
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <TickerTape indices={indices} lastTick={lastTick} />

        <main className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
            <span>
              {loading
                ? 'Syncing live market data…'
                : error
                  ? error
                  : source === 'live'
                    ? 'Live quotes · Yahoo Finance (NSE / BSE)'
                    : 'Using fallback data'}
            </span>
            <div className="flex items-center gap-3">
              {updatedLabel && <span>Updated {updatedLabel}</span>}
              <button
                type="button"
                onClick={refresh}
                className="rounded-md bg-foreground/10 px-2.5 py-1 font-semibold text-foreground transition hover:bg-foreground/15"
              >
                Refresh
              </button>
            </div>
          </div>

          <motion.div
            layout
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {heroCards.map((idx) => (
              <MarketOverviewCard
                key={idx.symbol}
                index={idx}
                tick={lastTick[idx.symbol]}
                pinned={pins.includes(idx.symbol)}
                onTogglePin={togglePin}
                onClick={setActiveSymbol}
                isActive={idx.symbol === activeSymbol}
              />
            ))}
          </motion.div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {activeIndex ? (
                <IndexChart
                  index={activeIndex}
                  tick={lastTick[activeIndex.symbol]}
                  dataSource={source}
                />
              ) : (
                <div className="glass-card flex h-[340px] items-center justify-center rounded-2xl text-sm text-muted-foreground">
                  Loading chart…
                </div>
              )}
            </div>
            <div className="space-y-4">
              <MarketBreadthGauge breadth={breadth} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TopMovers stocks={stocks} lastTick={lastTick} />
            </div>
            <div>
              <Watchlist
                items={watchlist}
                onReorder={handleReorder}
                onRemove={handleRemove}
                onAdd={handleAdd}
                indices={indices}
                stocks={stocks}
                lastTick={lastTick}
                onSelectIndex={setActiveSymbol}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </div>
          </div>

          <div className="mt-6">
            <SectoralHeatmap sectors={sectors} />
          </div>

          <div className="mt-6">
            <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
              All Indices
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {indices.map((idx) => (
                <CompactIndexCard
                  key={idx.symbol}
                  index={idx}
                  tick={lastTick[idx.symbol]}
                  pinned={pins.includes(idx.symbol)}
                  onTogglePin={togglePin}
                  onClick={setActiveSymbol}
                  isActive={idx.symbol === activeSymbol}
                />
              ))}
            </div>
          </div>

          <footer className="mt-10 border-t border-border/50 pt-6 pb-4 text-center">
            <p className="text-xs text-muted-foreground">
              NiftyPulse ·{' '}
              {source === 'live' ? 'Live data via Yahoo Finance' : 'Fallback data'}{' '}
              · Not financial advice
              {updatedLabel ? ` · Last sync ${updatedLabel}` : ''}
            </p>
          </footer>
        </main>
      </div>

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        indices={indices}
        stocks={stocks}
        onSelectIndex={handleSelectIndex}
        onSelectStock={handleSelectStock}
      />
    </div>
  );
}

function CompactIndexCard({
  index,
  tick,
  pinned,
  onTogglePin,
  onClick,
  isActive,
}: {
  index: IndexData;
  tick: 'up' | 'down' | 'same' | undefined;
  pinned: boolean;
  onTogglePin: (s: string) => void;
  onClick: (s: string) => void;
  isActive: boolean;
}) {
  const { formatPrice } = useFormatPrice();
  const isUp = index.change >= 0;

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      onClick={() => onClick(index.symbol)}
      className={`glass-card group cursor-pointer rounded-xl p-4 transition-all ${
        isActive ? 'ring-1 ring-emerald-500/30' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider">
          {index.symbol}
        </span>
        <button
          type="button"
          aria-label={pinned ? 'Unpin' : 'Pin'}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(index.symbol);
          }}
          className={`rounded p-1 transition-opacity ${
            pinned ? 'opacity-100' : 'opacity-60 sm:opacity-0 sm:group-hover:opacity-100'
          }`}
        >
          <Pin
            className={`h-3.5 w-3.5 ${
              pinned ? 'text-emerald-400' : 'text-muted-foreground'
            }`}
            fill={pinned ? 'currentColor' : 'none'}
          />
        </button>
      </div>
      <motion.span
        key={index.price}
        initial={
          tick === 'up'
            ? { color: '#10B981' }
            : tick === 'down'
              ? { color: '#EF4444' }
              : {}
        }
        animate={{ color: 'hsl(var(--foreground))' }}
        transition={{ duration: 0.5 }}
        className="mt-2 block font-mono-tabular text-xl font-bold"
      >
        {formatPrice(index.price)}
      </motion.span>
      <div className="mt-1 flex items-center gap-2">
        <span
          className={`font-mono-tabular text-xs font-bold ${
            isUp ? 'text-emerald-500' : 'text-rose-500'
          }`}
        >
          {isUp ? '+' : ''}
          {index.change.toFixed(2)} ({isUp ? '+' : ''}
          {index.changePercent.toFixed(2)}%)
        </span>
      </div>
    </motion.div>
  );
}

export default App;
