import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight } from 'lucide-react';
import type { IndexData, StockData } from '@/lib/types';
import { useFormatPrice } from '@/hooks/useMarketData';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  indices: IndexData[];
  stocks: StockData[];
  onSelectIndex: (symbol: string) => void;
  onSelectStock: (symbol: string) => void;
}

type ResultItem = {
  symbol: string;
  name: string;
  type: 'index' | 'stock';
  price: number;
  changePercent: number;
};

export function SearchModal({
  open,
  onClose,
  indices,
  stocks,
  onSelectIndex,
  onSelectStock,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { formatPrice } = useFormatPrice();

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIdx(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const flatResults: ResultItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const idxList = q
      ? indices.filter(
          (i) =>
            i.symbol.toLowerCase().includes(q) ||
            i.name.toLowerCase().includes(q)
        )
      : indices.slice(0, 5);
    const stkList = q
      ? stocks.filter(
          (s) =>
            s.symbol.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q)
        )
      : stocks.slice(0, 5);

    return [
      ...idxList.map((i) => ({
        symbol: i.symbol,
        name: i.name,
        type: 'index' as const,
        price: i.price,
        changePercent: i.changePercent,
      })),
      ...stkList.map((s) => ({
        symbol: s.symbol,
        name: s.name,
        type: 'stock' as const,
        price: s.price,
        changePercent: s.changePercent,
      })),
    ];
  }, [indices, stocks, query]);

  const indexResults = flatResults.filter((r) => r.type === 'index');
  const stockResults = flatResults.filter((r) => r.type === 'stock');

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const handleSelect = useCallback(
    (symbol: string, type: 'index' | 'stock') => {
      if (type === 'index') onSelectIndex(symbol);
      else onSelectStock(symbol);
      onClose();
    },
    [onClose, onSelectIndex, onSelectStock]
  );

  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (!flatResults.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % flatResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + flatResults.length) % flatResults.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = flatResults[activeIdx];
        if (item) handleSelect(item.symbol, item.type);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, flatResults, activeIdx, handleSelect]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-search-idx="${activeIdx}"]`
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  const renderRow = (item: ResultItem, rowIdx: number) => {
    const isUp = item.changePercent >= 0;
    const isActive = rowIdx === activeIdx;
    return (
      <button
        key={`${item.type}-${item.symbol}`}
        type="button"
        data-search-idx={rowIdx}
        role="option"
        aria-selected={isActive}
        onMouseEnter={() => setActiveIdx(rowIdx)}
        onClick={() => handleSelect(item.symbol, item.type)}
        className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
          isActive ? 'bg-muted' : 'hover:bg-muted/60'
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              item.type === 'index' ? 'bg-emerald-500/10' : 'bg-muted'
            }`}
          >
            <span
              className={`text-[10px] font-bold ${
                item.type === 'index' ? 'text-emerald-500' : ''
              }`}
            >
              {item.symbol.slice(0, 2)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{item.symbol}</p>
            <p className="truncate text-[10px] text-muted-foreground">
              {item.name}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="font-mono-tabular text-sm font-semibold">
              {formatPrice(item.price)}
            </p>
            <p
              className={`font-mono-tabular text-[10px] font-bold ${
                isUp ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {isUp ? '+' : ''}
              {item.changePercent.toFixed(2)}%
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-foreground" />
        </div>
      </button>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Search markets"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass-card relative w-full max-w-xl overflow-hidden rounded-2xl border border-border shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-border/60 p-4">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search indices, stocks..."
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                autoFocus
                aria-autocomplete="list"
                aria-controls="search-results"
              />
              <kbd className="rounded bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </div>

            <div
              id="search-results"
              ref={listRef}
              className="max-h-[60vh] overflow-y-auto scrollbar-hide"
              role="listbox"
            >
              {flatResults.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    {query.trim()
                      ? `No results for "${query}"`
                      : 'No market symbols available yet'}
                  </p>
                </div>
              ) : (
                <>
                  {indexResults.length > 0 && (
                    <div className="p-2">
                      <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Indices
                      </p>
                      {indexResults.map((item) =>
                        renderRow(
                          item,
                          flatResults.findIndex(
                            (r) =>
                              r.symbol === item.symbol && r.type === item.type
                          )
                        )
                      )}
                    </div>
                  )}
                  {stockResults.length > 0 && (
                    <div className="p-2">
                      <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Stocks
                      </p>
                      {stockResults.map((item) =>
                        renderRow(
                          item,
                          flatResults.findIndex(
                            (r) =>
                              r.symbol === item.symbol && r.type === item.type
                          )
                        )
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5">
              <p className="text-[10px] text-muted-foreground">
                <kbd className="rounded bg-muted px-1.5 py-0.5">↑↓</kbd> navigate{' '}
                <kbd className="ml-1 rounded bg-muted px-1.5 py-0.5">↵</kbd>{' '}
                select
              </p>
              <p className="text-[10px] text-muted-foreground">
                NiftyPulse Search
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
