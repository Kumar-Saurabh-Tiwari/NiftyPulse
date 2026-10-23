import type { ChartInterval, ChartRange } from './symbolMap';

/**
 * Yahoo Finance chart client.
 * Requests go through the same-origin API route (`/api/yahoo`) to avoid CORS.
 * Override with VITE_YAHOO_API_BASE to use a path-based external proxy.
 */
const API_BASE =
  import.meta.env.VITE_YAHOO_API_BASE?.replace(/\/$/, '') || '/api/yahoo';

export interface YahooChartMeta {
  currency?: string;
  symbol: string;
  exchangeName?: string;
  instrumentType?: string;
  regularMarketPrice: number;
  regularMarketTime?: number;
  regularMarketVolume?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketChangePercent?: number;
  previousClose?: number;
  chartPreviousClose?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  shortName?: string;
  longName?: string;
}

export interface YahooQuoteSeries {
  open: (number | null)[];
  high: (number | null)[];
  low: (number | null)[];
  close: (number | null)[];
  volume: (number | null)[];
}

export interface YahooChartResult {
  meta: YahooChartMeta;
  timestamp: number[];
  indicators: {
    quote: YahooQuoteSeries[];
  };
}

interface YahooChartResponse {
  chart: {
    result: YahooChartResult[] | null;
    error: { code: string; description: string } | null;
  };
}

export class YahooFinanceError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'YahooFinanceError';
  }
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new YahooFinanceError(
      `Yahoo Finance request failed (${res.status})`,
      res.status
    );
  }
  return res.json() as Promise<T>;
}

export async function fetchChart(
  yahooSymbol: string,
  range: ChartRange = '1d',
  interval: ChartInterval = '5m',
  signal?: AbortSignal
): Promise<YahooChartResult> {
  const query = new URLSearchParams({ symbol: yahooSymbol, range, interval });
  const url =
    API_BASE === '/api/yahoo'
      ? `${API_BASE}?${query.toString()}`
      : `${API_BASE}/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${range}&interval=${interval}`;
  const data = await fetchJson<YahooChartResponse>(url, signal);
  const err = data.chart?.error;
  if (err) {
    throw new YahooFinanceError(`${err.code}: ${err.description}`);
  }
  const result = data.chart?.result?.[0];
  if (!result?.meta) {
    throw new YahooFinanceError(`No chart data for ${yahooSymbol}`);
  }
  return result;
}

/** Fetch many symbols with limited concurrency. */
export async function fetchCharts(
  yahooSymbols: string[],
  range: ChartRange = '1d',
  interval: ChartInterval = '5m',
  concurrency = 4,
  signal?: AbortSignal
): Promise<Map<string, YahooChartResult>> {
  const out = new Map<string, YahooChartResult>();
  const queue = [...yahooSymbols];

  async function worker() {
    while (queue.length) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const symbol = queue.shift();
      if (!symbol) break;
      try {
        const chart = await fetchChart(symbol, range, interval, signal);
        out.set(symbol, chart);
      } catch (e) {
        if ((e as Error).name === 'AbortError') throw e;
        console.warn(`[yahoo] failed for ${symbol}`, e);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, yahooSymbols.length) }, () =>
      worker()
    )
  );
  return out;
}
