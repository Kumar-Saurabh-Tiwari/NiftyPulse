import { useState, useEffect, useRef, useCallback } from 'react';
import type { IndexData, StockData, MarketBreadth } from '@/lib/types';
import {
  buildIndices,
  buildStocks,
  buildBreadth,
  tickIndex,
  tickStock,
} from '@/lib/mockData';

export interface MarketState {
  indices: IndexData[];
  stocks: StockData[];
  breadth: MarketBreadth;
  lastTick: Record<string, 'up' | 'down' | 'same'>;
}

export function useMarketData(intervalMs: number = 2000): MarketState {
  const [indices, setIndices] = useState<IndexData[]>(() => buildIndices());
  const [stocks, setStocks] = useState<StockData[]>(() => buildStocks());
  const [breadth, setBreadth] = useState<MarketBreadth>(() => buildBreadth());
  const [lastTick, setLastTick] = useState<
    Record<string, 'up' | 'down' | 'same'>
  >({});
  const prevPricesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const id = setInterval(() => {
      setIndices((prev) => {
        const tickData: Record<string, 'up' | 'down' | 'same'> = {};
        const next = prev.map((idx) => {
          const updated = tickIndex(idx);
          const prevPrice = prevPricesRef.current[idx.symbol] ?? idx.price;
          if (updated.price > prevPrice) tickData[idx.symbol] = 'up';
          else if (updated.price < prevPrice) tickData[idx.symbol] = 'down';
          else tickData[idx.symbol] = 'same';
          prevPricesRef.current[idx.symbol] = updated.price;
          return updated;
        });
        setLastTick(tickData);
        return next;
      });

      setStocks((prev) => {
        const tickData: Record<string, 'up' | 'down' | 'same'> = {};
        const next = prev.map((stk) => {
          const updated = tickStock(stk);
          const prevPrice = prevPricesRef.current[stk.symbol] ?? stk.price;
          if (updated.price > prevPrice) tickData[stk.symbol] = 'up';
          else if (updated.price < prevPrice) tickData[stk.symbol] = 'down';
          else tickData[stk.symbol] = 'same';
          prevPricesRef.current[stk.symbol] = updated.price;
          return updated;
        });
        setLastTick((prev) => ({ ...prev, ...tickData }));
        return next;
      });

      setBreadth(buildBreadth());
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs]);

  return { indices, stocks, breadth, lastTick };
}

export function useFormatPrice(): {
  formatNumber: (n: number, digits?: number) => string;
  formatCompact: (n: number) => string;
  formatPrice: (n: number) => string;
} {
  const formatNumber = useCallback((n: number, digits = 2) => {
    return n.toLocaleString('en-IN', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }, []);

  const formatCompact = useCallback((n: number) => {
    if (n >= 10000000) return (n / 10000000).toFixed(2) + 'Cr';
    if (n >= 100000) return (n / 100000).toFixed(2) + 'L';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }, []);

  const formatPrice = useCallback(
    (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    []
  );

  return { formatNumber, formatCompact, formatPrice };
}
