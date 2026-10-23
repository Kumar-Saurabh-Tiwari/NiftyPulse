import { useState, useEffect, useRef, useCallback } from 'react';
import type { IndexData, StockData, MarketBreadth, SectorData } from '@/lib/types';
import {
  fetchMarketSnapshot,
  type DataSource,
} from '@/services/marketDataService';

export interface MarketState {
  indices: IndexData[];
  stocks: StockData[];
  sectors: SectorData[];
  breadth: MarketBreadth;
  lastTick: Record<string, 'up' | 'down' | 'same'>;
  source: DataSource;
  loading: boolean;
  error: string | null;
  updatedAt: number | null;
  refresh: () => void;
}

export function useMarketData(intervalMs: number = 30000): MarketState {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [breadth, setBreadth] = useState<MarketBreadth>({
    advances: 0,
    declines: 0,
    unchanged: 0,
    total: 0,
  });
  const [lastTick, setLastTick] = useState<
    Record<string, 'up' | 'down' | 'same'>
  >({});
  const [source, setSource] = useState<DataSource>('unavailable');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const prevPricesRef = useRef<Record<string, number>>({});
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const applySnapshot = async (isInitial: boolean) => {
      if (isInitial) setLoading(true);
      try {
        const snapshot = await fetchMarketSnapshot(controller.signal);
        if (cancelled) return;

        const tickData: Record<string, 'up' | 'down' | 'same'> = {};
        for (const item of [...snapshot.indices, ...snapshot.stocks]) {
          const prev = prevPricesRef.current[item.symbol];
          if (prev == null) tickData[item.symbol] = 'same';
          else if (item.price > prev) tickData[item.symbol] = 'up';
          else if (item.price < prev) tickData[item.symbol] = 'down';
          else tickData[item.symbol] = 'same';
          prevPricesRef.current[item.symbol] = item.price;
        }

        setIndices(snapshot.indices);
        setStocks(snapshot.stocks);
        setSectors(snapshot.sectors);
        setBreadth(snapshot.breadth);
        setLastTick(tickData);
        setSource(snapshot.source);
        setUpdatedAt(snapshot.updatedAt);
        setError(null);
      } catch (e) {
        if ((e as Error).name === 'AbortError' || cancelled) return;
        setError((e as Error).message || 'Failed to load market data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void applySnapshot(true);
    const id = setInterval(() => {
      void applySnapshot(false);
    }, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(id);
      controller.abort();
    };
  }, [intervalMs, refreshKey]);

  return {
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
  };
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
    (n: number) =>
      n.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  return { formatNumber, formatCompact, formatPrice };
}
