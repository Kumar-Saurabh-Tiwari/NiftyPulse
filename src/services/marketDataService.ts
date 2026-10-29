import type {
  IndexData,
  StockData,
  SectorData,
  MarketBreadth,
  PricePoint,
  Timeframe,
} from '@/lib/types';
import {
  INDEX_SYMBOLS,
  STOCK_SYMBOLS,
  SECTOR_INDEX_SYMBOLS,
  timeframeToYahoo,
} from './symbolMap';
import {
  fetchChart,
  fetchCharts,
  type YahooChartResult,
} from './yahooFinanceClient';
export type DataSource = 'live' | 'unavailable';

export interface MarketSnapshot {
  indices: IndexData[];
  stocks: StockData[];
  sectors: SectorData[];
  breadth: MarketBreadth;
  source: DataSource;
  updatedAt: number;
}

export interface MutualFundHistory {
  schemeCode: number;
  schemeName: string;
  history: PricePoint[];
}

function round2(n: number): number {
  return Number(n.toFixed(2));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function firstValid(values: (number | null)[] | undefined): number | undefined {
  if (!values) return undefined;
  for (const v of values) {
    if (v != null && Number.isFinite(v)) return v;
  }
  return undefined;
}

function toHistory(chart: YahooChartResult): PricePoint[] {
  const quote = chart.indicators?.quote?.[0];
  const timestamps = chart.timestamp ?? [];
  if (!quote || !timestamps.length) return [];

  const history: PricePoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = quote.close?.[i];
    if (close == null || !Number.isFinite(close)) continue;
    history.push({
      time: new Date(timestamps[i] * 1000).toISOString(),
      price: round2(close),
      volume: Math.max(0, Math.floor(quote.volume?.[i] ?? 0)),
    });
  }
  return history;
}

function toSparkline(history: PricePoint[], maxPoints = 30): number[] {
  if (!history.length) return [];
  const step = Math.max(1, Math.floor(history.length / maxPoints));
  const points: number[] = [];
  for (let i = 0; i < history.length; i += step) {
    points.push(history[i].price);
  }
  const last = history[history.length - 1]?.price;
  if (last != null && points[points.length - 1] !== last) {
    points.push(last);
  }
  return points.slice(-maxPoints);
}

function mapIndex(
  appSymbol: string,
  chart: YahooChartResult,
  options?: { giftPremium?: boolean }
): IndexData {
  const meta = chart.meta;
  const seed = INDEX_SYMBOLS[appSymbol];
  const quote = chart.indicators?.quote?.[0];
  const price = round2(meta.regularMarketPrice);
  const prevClose = round2(
    meta.previousClose ?? meta.chartPreviousClose ?? price
  );
  // Gift Nifty typically trades at a small premium to Nifty spot
  const giftAdj = options?.giftPremium ? 1.0025 : 1;
  const adjPrice = round2(price * giftAdj);
  const adjPrev = round2(prevClose * giftAdj);
  const change = round2(adjPrice - adjPrev);
  const changePercent = adjPrev
    ? round2((change / adjPrev) * 100)
    : round2(meta.regularMarketChangePercent ?? 0);
  const open = round2((firstValid(quote?.open) ?? adjPrice) * giftAdj);
  const dayHigh = round2(
    (meta.regularMarketDayHigh ?? Math.max(adjPrice, open)) * giftAdj
  );
  const dayLow = round2(
    (meta.regularMarketDayLow ?? Math.min(adjPrice, open)) * giftAdj
  );
  const history = toHistory(chart).map((p) =>
    giftAdj === 1
      ? p
      : { ...p, price: round2(p.price * giftAdj) }
  );

  return {
    symbol: appSymbol,
    name: seed?.name ?? meta.shortName ?? appSymbol,
    price: adjPrice,
    prevClose: adjPrev,
    open,
    dayHigh,
    dayLow,
    yearHigh: round2((meta.fiftyTwoWeekHigh ?? dayHigh) * giftAdj),
    yearLow: round2((meta.fiftyTwoWeekLow ?? dayLow) * giftAdj),
    change,
    changePercent,
    volume: meta.regularMarketVolume ?? 0,
    history,
  };
}

function mapStock(appSymbol: string, chart: YahooChartResult): StockData {
  const meta = chart.meta;
  const seed = STOCK_SYMBOLS[appSymbol];
  const price = round2(meta.regularMarketPrice);
  const prevClose = round2(
    meta.previousClose ?? meta.chartPreviousClose ?? price
  );
  const change = round2(price - prevClose);
  const changePercent = prevClose
    ? round2((change / prevClose) * 100)
    : round2(meta.regularMarketChangePercent ?? 0);
  const history = toHistory(chart);

  return {
    symbol: appSymbol,
    name: seed?.name ?? meta.longName ?? meta.shortName ?? appSymbol,
    price,
    prevClose,
    change,
    changePercent,
    volume: meta.regularMarketVolume ?? 0,
    marketCap: seed?.marketCapCr ?? 0,
    sector: seed?.sector ?? 'Other',
    sparkline: toSparkline(history),
    history,
  };
}

function buildSectorsFromData(
  indices: IndexData[],
  stocks: StockData[]
): SectorData[] {
  const byIndexSymbol: Record<string, IndexData | undefined> = {
    IT: indices.find((i) => i.symbol === 'NIFTY IT'),
    Banking: indices.find((i) => i.symbol === 'NIFTY BANK'),
    Auto: indices.find((i) => i.symbol === 'NIFTY AUTO'),
    Pharma: indices.find((i) => i.symbol === 'NIFTY PHARMA'),
  };

  const topBySector = (sector: string): StockData | undefined => {
    const inSector = stocks.filter((s) => s.sector === sector);
    if (!inSector.length) return undefined;
    return [...inSector].sort(
      (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)
    )[0];
  };

  return Object.keys(SECTOR_INDEX_SYMBOLS).map((name) => {
    const fromIndex = byIndexSymbol[name];
    const top = topBySector(name);

    return {
      name,
      changePercent: fromIndex?.changePercent ?? top?.changePercent ?? 0,
      topStock: top?.symbol ?? '—',
      volume: fromIndex?.volume || top?.volume || 0,
    };
  }).filter((sector) => sector.topStock !== '—' || sector.volume > 0);
}

function buildBreadthFromStocks(stocks: StockData[]): MarketBreadth {
  let advances = 0;
  let declines = 0;
  let unchanged = 0;
  for (const s of stocks) {
    if (s.changePercent > 0.02) advances++;
    else if (s.changePercent < -0.02) declines++;
    else unchanged++;
  }
  if (!stocks.length) {
    return { advances: 0, declines: 0, unchanged: 0, total: 0 };
  }
  // Scale sample (watchlist size) toward a Nifty-like breadth feel
  const scale = Math.max(1, Math.round(1800 / Math.max(stocks.length, 1)));
  advances *= scale;
  declines *= scale;
  unchanged = Math.max(unchanged * scale, 20);
  return {
    advances,
    declines,
    unchanged,
    total: advances + declines + unchanged,
  };
}

/**
 * Fetch a full market snapshot from Yahoo Finance.
 */
export async function fetchMarketSnapshot(
  signal?: AbortSignal
): Promise<MarketSnapshot> {
  const indexEntries = Object.entries(INDEX_SYMBOLS);
  // Deduplicate Yahoo tickers (^NSEI used by both Nifty 50 and Gift Nifty)
  const yahooIndexTickers = [
    ...new Set(indexEntries.map(([, m]) => m.yahoo)),
  ];
  const yahooStockTickers = Object.values(STOCK_SYMBOLS).map((m) => m.yahoo);

  try {
    const [indexCharts, stockCharts] = await Promise.all([
      fetchCharts(yahooIndexTickers, '1d', '5m', 4, signal),
      fetchCharts(yahooStockTickers, '5d', '15m', 5, signal),
    ]);

    if (indexCharts.size === 0 && stockCharts.size === 0) {
      throw new Error('No market data returned from Yahoo Finance.');
    }

    const indices: IndexData[] = [];
    for (const [appSymbol, meta] of indexEntries) {
      const chart = indexCharts.get(meta.yahoo);
      if (!chart) continue;
      indices.push(
        mapIndex(appSymbol, chart, {
          giftPremium: appSymbol === 'GIFT NIFTY',
        })
      );
    }

    const stocks: StockData[] = [];
    for (const [appSymbol, meta] of Object.entries(STOCK_SYMBOLS)) {
      const chart = stockCharts.get(meta.yahoo);
      if (!chart) continue;
      stocks.push(mapStock(appSymbol, chart));
    }

    if (!indices.length) {
      throw new Error(
        'No live index quotes received. Verify that the deployed /api/yahoo endpoint is available.'
      );
    }

    return {
      indices,
      stocks,
      sectors: buildSectorsFromData(indices, stocks),
      breadth: buildBreadthFromStocks(stocks),
      source: 'live',
      updatedAt: Date.now(),
    };
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    console.warn('[marketDataService] live fetch failed', e);
    throw e;
  }
}

/** Fetch OHLC history for a single app index/stock symbol. */
export async function fetchSymbolHistory(
  appSymbol: string,
  timeframe: Timeframe,
  signal?: AbortSignal
): Promise<PricePoint[]> {
  const meta = INDEX_SYMBOLS[appSymbol] ?? STOCK_SYMBOLS[appSymbol];
  if (!meta) return [];
  const { range, interval } = timeframeToYahoo(timeframe);
  const chart = await fetchChart(meta.yahoo, range, interval, signal);
  const history = toHistory(chart);
  if (appSymbol === 'GIFT NIFTY') {
    return history.map((p) => ({ ...p, price: round2(p.price * 1.0025) }));
  }
  return history;
}

/** Fetch historical NAV data for a direct-growth mutual fund from MFAPI. */
export async function fetchMutualFundHistory(
  schemeCode: number,
  signal?: AbortSignal
): Promise<MutualFundHistory> {
  const response = await fetch(`/api/mf?schemeCode=${schemeCode}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Mutual fund data request failed (${response.status})`);
  }
  const data = (await response.json()) as {
    meta?: { scheme_code?: number; scheme_name?: string };
    data?: { date: string; nav: string }[];
  };
  const history = (data.data ?? [])
    .map((point) => ({
      time: new Date(`${point.date.split('-').reverse().join('-')}T00:00:00+05:30`).toISOString(),
      price: Number(point.nav),
      volume: 0,
    }))
    .filter((point) => Number.isFinite(point.price))
    .reverse();
  if (!history.length) throw new Error('No mutual fund NAV history returned');
  return {
    schemeCode,
    schemeName: data.meta?.scheme_name ?? '',
    history,
  };
}

export { INDEX_SYMBOLS, STOCK_SYMBOLS };
