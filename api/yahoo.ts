interface VercelRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  setHeader(name: string, value: string): void;
  send(body: string | Uint8Array): void;
}

const YAHOO_FINANCE_BASE = 'https://query1.finance.yahoo.com';
const ALLOWED_RANGES = new Set(['1d', '5d', '1mo', '6mo', '1y', '5y']);
const ALLOWED_INTERVALS = new Set([
  '1m',
  '5m',
  '15m',
  '30m',
  '60m',
  '1d',
  '1wk',
]);

function firstQueryValue(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
): Promise<void> {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.status(405).send('Method not allowed');
    return;
  }

  const symbol = firstQueryValue(request.query.symbol);
  const range = firstQueryValue(request.query.range) ?? '1d';
  const interval = firstQueryValue(request.query.interval) ?? '5m';

  if (!symbol || !/^[A-Za-z0-9.^=_-]{1,32}$/.test(symbol)) {
    response.status(400).send('A valid ticker symbol is required');
    return;
  }
  if (!ALLOWED_RANGES.has(range) || !ALLOWED_INTERVALS.has(interval)) {
    response.status(400).send('Unsupported chart range or interval');
    return;
  }

  const upstreamUrl = new URL(
    `/v8/finance/chart/${encodeURIComponent(symbol)}`,
    YAHOO_FINANCE_BASE
  );
  upstreamUrl.searchParams.set('range', range);
  upstreamUrl.searchParams.set('interval', interval);

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const body = new Uint8Array(await upstream.arrayBuffer());

    response.status(upstream.status);
    response.setHeader(
      'Content-Type',
      upstream.headers.get('content-type') ?? 'application/json'
    );
    response.setHeader('Cache-Control', 'no-store');
    response.send(body);
  } catch (error) {
    console.error('[yahoo proxy] Finance request failed', error);
    response.status(502).send('Yahoo Finance is temporarily unavailable');
  }
}
