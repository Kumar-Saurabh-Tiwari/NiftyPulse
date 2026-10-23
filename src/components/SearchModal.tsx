import { useState, useEffect, useRef } from 'react';
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

export function SearchModal({
  open,
  onClose,
  indices,
  stocks,
  onSelectIndex,
  onSelectStock,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { formatPrice } = useFormatPrice();

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const q = query.toLowerCase();
  const matchedIndices = q
    ? indices.filter(
        (i) => i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
      )
    : indices.slice(0, 5);
  const matchedStocks = q
    ? stocks.filter(
        (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      )
    : stocks.slice(0, 5);

  const handleSelect = (symbol: string, type: 'index' | 'stock') => {
    if (type === 'index') onSelectIndex(symbol);
    else onSelectStock(symbol);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]"
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
            className="glass-card relative w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 border-b border-white/5 p-4">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search indices, stocks..."
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                autoFocus
              />
              <kbd className="rounded bg-white/5 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto scrollbar-hide">
              {matchedIndices.length === 0 && matchedStocks.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">No results for "{query}"</p>
                </div>
              )}

              {matchedIndices.length > 0 && (
                <div className="p-2">
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Indices
                  </p>
                  {matchedIndices.map((idx) => {
                    const isUp = idx.change >= 0;
                    return (
                      <button
                        key={idx.symbol}
                        onClick={() => handleSelect(idx.symbol, 'index')}
                        className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                            <span className="text-[10px] font-bold text-emerald-500">
                              {idx.symbol.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{idx.symbol}</p>
                            <p className="text-[10px] text-muted-foreground">{idx.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-mono-tabular text-sm font-semibold">
                              {formatPrice(idx.price)}
                            </p>
                            <p
                              className={`font-mono-tabular text-[10px] font-bold ${
                                isUp ? 'text-emerald-500' : 'text-rose-500'
                              }`}
                            >
                              {isUp ? '+' : ''}
                              {idx.changePercent.toFixed(2)}%
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-foreground" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {matchedStocks.length > 0 && (
                <div className="p-2">
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Stocks
                  </p>
                  {matchedStocks.map((stk) => {
                    const isUp = stk.changePercent >= 0;
                    return (
                      <button
                        key={stk.symbol}
                        onClick={() => handleSelect(stk.symbol, 'stock')}
                        className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                            <span className="text-[10px] font-bold">
                              {stk.symbol.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{stk.symbol}</p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                              {stk.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-mono-tabular text-sm font-semibold">
                              {formatPrice(stk.price)}
                            </p>
                            <p
                              className={`font-mono-tabular text-[10px] font-bold ${
                                isUp ? 'text-emerald-500' : 'text-rose-500'
                              }`}
                            >
                              {isUp ? '+' : ''}
                              {stk.changePercent.toFixed(2)}%
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-foreground" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/5 px-4 py-2.5">
              <p className="text-[10px] text-muted-foreground">
                Press <kbd className="rounded bg-white/5 px-1.5 py-0.5">↵</kbd> to select
              </p>
              <p className="text-[10px] text-muted-foreground">NiftyPulse Search</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
