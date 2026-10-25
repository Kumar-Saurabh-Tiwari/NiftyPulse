import { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Search, X, GripVertical, Trash2 } from 'lucide-react';
import type { IndexData, StockData } from '@/lib/types';
import { useFormatPrice } from '@/hooks/useMarketData';

export interface WatchlistItem {
  symbol: string;
  type: 'index' | 'stock';
}

interface WatchlistProps {
  items: WatchlistItem[];
  onReorder: (items: WatchlistItem[]) => void;
  onRemove: (symbol: string) => void;
  onAdd: (symbol: string, type: 'index' | 'stock') => void;
  indices: IndexData[];
  stocks: StockData[];
  lastTick: Record<string, 'up' | 'down' | 'same'>;
  onSelectIndex: (symbol: string) => void;
  onSelectStock: (symbol: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function Watchlist({
  items,
  onReorder,
  onRemove,
  onAdd,
  indices,
  stocks,
  lastTick,
  onSelectIndex,
  onSelectStock,
  searchQuery,
  setSearchQuery,
}: WatchlistProps) {
  const { formatPrice } = useFormatPrice();
  const [showAdd, setShowAdd] = useState(false);

  const getItemData = (item: WatchlistItem) => {
    if (item.type === 'index') return indices.find((i) => i.symbol === item.symbol);
    return stocks.find((s) => s.symbol === item.symbol);
  };

  const getPrice = (item: WatchlistItem) => {
    const data = getItemData(item);
    if (!data) return { price: 0, changePercent: 0, missing: true as const };
    return {
      price: data.price,
      changePercent: data.changePercent,
      missing: false as const,
    };
  };

  const allAddable: { symbol: string; name: string; type: 'index' | 'stock' }[] = [
    ...indices.map((i) => ({
      symbol: i.symbol,
      name: i.name,
      type: 'index' as const,
    })),
    ...stocks.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      type: 'stock' as const,
    })),
  ];

  const filtered = searchQuery
    ? allAddable.filter(
        (a) =>
          a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allAddable;

  const isInWatchlist = (symbol: string) => items.some((i) => i.symbol === symbol);

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider">
            My Watchlist
          </h3>
          <p className="text-xs text-muted-foreground">
            {items.length} pinned · drag to reorder
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/80"
        >
          {showAdd ? 'Done' : 'Add'}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stocks or indices..."
                className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="mb-3 max-h-40 space-y-0.5 overflow-y-auto scrollbar-hide">
              {filtered.length === 0 ? (
                <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                  No matches for "{searchQuery}"
                </p>
              ) : (
                filtered.slice(0, 12).map((item) => {
                  const inList = isInWatchlist(item.symbol);
                  return (
                    <div
                      key={item.symbol}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50"
                    >
                      <div>
                        <span className="text-xs font-bold">{item.symbol}</span>
                        <span className="ml-2 text-[10px] text-muted-foreground">
                          {item.type === 'index' ? 'Index' : item.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (inList) onRemove(item.symbol);
                          else onAdd(item.symbol, item.type);
                        }}
                        className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                          inList
                            ? 'bg-rose-500/15 text-rose-500 hover:bg-rose-500/25'
                            : 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25'
                        }`}
                      >
                        {inList ? 'Remove' : '+ Pin'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            No pinned items yet. Click "Add" to pin stocks & indices.
          </p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={onReorder}
          className="space-y-1"
        >
          {items.map((item) => {
            const { price, changePercent, missing } = getPrice(item);
            const isUp = changePercent >= 0;
            const tick = lastTick[item.symbol];
            return (
              <Reorder.Item
                key={item.symbol}
                value={item}
                className="group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                whileDrag={{
                  scale: 1.02,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                }}
              >
                <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground/40 opacity-40 touch-none sm:opacity-0 sm:group-hover:opacity-100" />

                <button
                  type="button"
                  className="flex flex-1 items-center justify-between text-left"
                  onClick={() =>
                    item.type === 'index'
                      ? onSelectIndex(item.symbol)
                      : onSelectStock(item.symbol)
                  }
                >
                  <div>
                    <span className="text-xs font-bold">{item.symbol}</span>
                    <span className="ml-2 text-[9px] uppercase tracking-wider text-muted-foreground">
                      {item.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {missing ? (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    ) : (
                      <>
                        <motion.span
                          key={price}
                          initial={
                            tick === 'up'
                              ? { color: '#10B981' }
                              : tick === 'down'
                                ? { color: '#EF4444' }
                                : {}
                          }
                          animate={{ color: 'hsl(var(--foreground))' }}
                          transition={{ duration: 0.5 }}
                          className="font-mono-tabular text-xs font-semibold"
                        >
                          {formatPrice(price)}
                        </motion.span>
                        <span
                          className={`font-mono-tabular text-[10px] font-bold ${
                            isUp ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {isUp ? '+' : ''}
                          {changePercent.toFixed(2)}%
                        </span>
                      </>
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  aria-label={`Remove ${item.symbol}`}
                  onClick={() => onRemove(item.symbol)}
                  className="rounded p-1 text-muted-foreground/50 opacity-100 transition-all hover:text-rose-500 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      )}
    </div>
  );
}
