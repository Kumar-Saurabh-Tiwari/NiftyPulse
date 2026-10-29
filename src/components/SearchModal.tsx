import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Pin, Check, LoaderCircle } from 'lucide-react';
import type { IndexData, StockData } from '@/lib/types';
import { useFormatPrice } from '@/hooks/useMarketData';
import type { TradeIdea } from '@/components/TradeIdeas';
import { searchMutualFunds } from '@/services/marketDataService';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  indices: IndexData[];
  stocks: StockData[];
  onSelectIndex: (symbol: string) => void;
  onSelectStock: (symbol: string) => void;
  funds: TradeIdea[];
  onSelectFund: (fund: TradeIdea) => void;
  pinnedCodes: number[];
  onToggleFundPin: (fund: TradeIdea) => void;
}

type ResultItem = {
  symbol: string;
  name: string;
  type: 'index' | 'stock' | 'fund';
  price: number;
  changePercent: number;
  fund?: TradeIdea;
};

export function SearchModal({
  open,
  onClose,
  indices,
  stocks,
  onSelectIndex,
  onSelectStock,
  funds,
  onSelectFund,
  pinnedCodes,
  onToggleFundPin,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { formatPrice } = useFormatPrice();
  const [globalFunds, setGlobalFunds] = useState<TradeIdea[]>([]);
  const [fundSearchLoading, setFundSearchLoading] = useState(false);
  const [fundSearchError, setFundSearchError] = useState<string | null>(null);

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

  useEffect(() => {
    const search = query.trim();
    if (!open || search.length < 2) {
      setGlobalFunds([]);
      setFundSearchLoading(false);
      setFundSearchError(null);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setFundSearchLoading(true);
      searchMutualFunds(search, controller.signal)
        .then((results) => {
          setGlobalFunds(results.map((result) => ({
            name: result.schemeName,
            category: result.schemeName.toLowerCase().includes('debt') ? 'Hybrid' : 'Equity',
            style: result.schemeName.toLowerCase().includes('index') ? 'Index' : 'Mutual fund',
            schemeCode: result.schemeCode,
          })));
          setFundSearchError(null);
        })
        .catch((reason: unknown) => {
          if (!(reason instanceof Error && reason.name === 'AbortError')) {
            setFundSearchError('Fund search is temporarily unavailable');
          }
        })
        .finally(() => setFundSearchLoading(false));
    }, 280);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

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
    const localFundList = q
      ? funds.filter((fund) => fund.name.toLowerCase().includes(q) || fund.style.toLowerCase().includes(q))
      : funds;
    const fundList = [
      ...localFundList,
      ...globalFunds.filter((fund) => !localFundList.some((item) => item.schemeCode === fund.schemeCode)),
    ];

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
      ...fundList.map((fund) => ({
        symbol: `FUND-${fund.schemeCode}`,
        name: fund.name,
        type: 'fund' as const,
        price: 0,
        changePercent: 0,
        fund,
      })),
    ];
  }, [indices, stocks, funds, globalFunds, query]);

  const indexResults = flatResults.filter((r) => r.type === 'index');
  const stockResults = flatResults.filter((r) => r.type === 'stock');
  const fundResults = flatResults.filter((r) => r.type === 'fund');

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const handleSelect = useCallback(
    (symbol: string, type: 'index' | 'stock' | 'fund') => {
      if (type === 'index') onSelectIndex(symbol);
      else if (type === 'stock') onSelectStock(symbol);
      else {
        const fund = flatResults.find((item) => item.symbol === symbol)?.fund;
        if (fund) onSelectFund(fund);
      }
      onClose();
    },
    [flatResults, onClose, onSelectFund, onSelectIndex, onSelectStock]
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
              item.type === 'index' ? 'bg-emerald-500/10' : item.type === 'fund' ? 'bg-emerald-500/10' : 'bg-muted'
            }`}
          >
            <span
              className={`text-[10px] font-bold ${
                item.type === 'index' || item.type === 'fund' ? 'text-emerald-500' : ''
              }`}
            >
              {item.type === 'fund' ? 'MF' : item.symbol.slice(0, 2)}
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
            {item.type !== 'fund' && <p className="font-mono-tabular text-sm font-semibold">{formatPrice(item.price)}</p>}
            <p
              className={`font-mono-tabular text-[10px] font-bold ${
                isUp ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {item.type === 'fund' ? `${item.fund?.style ?? 'Mutual fund'} · Direct Growth` : `${isUp ? '+' : ''}${item.changePercent.toFixed(2)}%`}
            </p>
          </div>
          {item.type === 'fund' ? (
            <span
              role="button"
              tabIndex={0}
              aria-label={pinnedCodes.includes(item.fund!.schemeCode) ? `Unpin ${item.name}` : `Pin ${item.name}`}
              onClick={(event) => {
                event.stopPropagation();
                if (item.fund) onToggleFundPin(item.fund);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  if (item.fund) onToggleFundPin(item.fund);
                }
              }}
              className={`rounded-md p-1.5 transition ${pinnedCodes.includes(item.fund!.schemeCode) ? 'text-emerald-500' : 'text-muted-foreground/40 hover:text-emerald-500'}`}
            >
              {pinnedCodes.includes(item.fund!.schemeCode) ? <Check className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </span>
          ) : <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-foreground" />}
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
                  {fundSearchLoading && <LoaderCircle className="mx-auto mb-2 h-4 w-4 animate-spin text-emerald-500" />}
                  {fundSearchError && <p className="mb-2 text-[10px] text-rose-500">{fundSearchError}</p>}
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
                      {fundResults.length > 0 && (
                        <div className="p-2">
                          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mutual funds</p>
                          {fundResults.map((item) => renderRow(item, flatResults.findIndex((r) => r.symbol === item.symbol && r.type === item.type)))}
                        </div>
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
