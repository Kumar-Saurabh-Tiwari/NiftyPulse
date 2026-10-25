interface EndpointResult {
  status: number;
  body: Record<string, unknown>;
  cacheControl: string;
}

interface EndpointEnvironment {
  TWELVE_DATA_API_KEY?: string;
  FINANCIAL_MODELING_PREP_API_KEY?: string;
}

interface PricePoint {
  time: string;
  price: number;
  volume: number;
}

const STOCK_SYMBOLS = new Set([
  'RELIANCE',
  'TCS',
  'HDFCBANK',
  'INFY',
  'ICICIBANK',
  'SBIN',
  'BHARTIARTL',
  'ITC',
  'LT',
  'MARUTI',
  'HINDUNILVR',
  'SUNPHARMA',
  'WIPRO',
  'AXISBANK',
  'TATAMOTORS',
  'BAJFINANCE',
  'ADANIENT',
  'POWERGRID',
  'TATASTEEL',
  'NTPC',
]);

const TIMEFRAMES = new Set(['1M', '6M', '1Y', '5Y']);
const cache = new Map<
  string,
  { expiresAt: number; result: EndpointResult }
>();
const inFlight = new Map<string, Promise<EndpointResult>>();

function jsonError(
  status: number,
  code: string,
  message: string
): EndpointResult {
  return {
    status,
    body: { error: code, message },
    cacheControl: 'private, no-store',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function finiteNumber(value: unknown): number | undefined {
  if (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && !value.trim())
  ) {
    return undefined;
  }
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function dateRange(timeframe: string, now = new Date()): string {
  const date = new Date(now);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  if (timeframe === '1M') date.setUTCMonth(date.getUTCMonth() - 1);
  else if (timeframe === '6M') date.setUTCMonth(date.getUTCMonth() - 6);
  else if (timeframe === '1Y') date.setUTCFullYear(date.getUTCFullYear() - 1);
  else date.setUTCFullYear(date.getUTCFullYear() - 5);
  const finalDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
  ).getUTCDate();
  date.setUTCDate(Math.min(day, finalDay));
  return date.toISOString().slice(0, 10);
}

function normalizeTime(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

async function fetchProviderJson(url: URL): Promise<{
  status: number;
  data?: unknown;
  failure?: EndpointResult;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
    } catch {
      const timedOut = controller.signal.aborted;
      return {
        status: timedOut ? 504 : 502,
        failure: jsonError(
          timedOut ? 504 : 502,
          timedOut ? 'provider_timeout' : 'provider_unavailable',
          timedOut
            ? 'The data provider took too long to respond. Try again shortly.'
            : 'The data provider could not be reached. Try again shortly.'
        ),
      };
    }

    if (response.status === 429) {
      return {
        status: 429,
        failure: jsonError(
          429,
          'provider_rate_limited',
          'The data provider rate limit was reached. Try again later.'
        ),
      };
    }
    if (response.status === 401 || response.status === 403) {
      return {
        status: 502,
        failure: jsonError(
          502,
          'provider_access_denied',
          'The provider rejected access. Check the API key, subscription, and exchange coverage.'
        ),
      };
    }
    if (response.status === 402) {
      return {
        status: 503,
        failure: jsonError(
          503,
          'provider_plan_required',
          'The provider plan does not include this dataset. Check subscription and exchange access.'
        ),
      };
    }
    if (response.status === 404) {
      return {
        status: 422,
        failure: jsonError(
          422,
          'unsupported_symbol',
          'This provider does not return data for the selected instrument.'
        ),
      };
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return {
        status: 502,
        failure: jsonError(
          502,
          'invalid_provider_response',
          'The data provider returned an invalid response.'
        ),
      };
    }

    if (!response.ok) {
      return {
        status: 502,
        failure: jsonError(
          502,
          'provider_unavailable',
          'The data provider is temporarily unavailable.'
        ),
      };
    }

    return { status: response.status, data };
  } finally {
    clearTimeout(timeout);
  }
}

function providerError(
  data: unknown,
  provider: 'twelvedata' | 'fmp'
): EndpointResult | undefined {
  if (!isRecord(data)) return undefined;
  const message = data.message ?? data['Error Message'];
  if (!message && data.status !== 'error') return undefined;

  const text = typeof message === 'string' ? message.toLowerCase() : '';
  if (
    text.includes('api key') ||
    text.includes('subscription') ||
    text.includes('credit') ||
    text.includes('plan') ||
    text.includes('permission')
  ) {
    return jsonError(
      502,
      'provider_access_denied',
      `${provider === 'twelvedata' ? 'Twelve Data' : 'Financial Modeling Prep'} access is unavailable for this request. Check the key, plan, and exchange coverage.`
    );
  }
  if (
    text.includes('symbol') ||
    text.includes('exchange') ||
    text.includes('instrument') ||
    text.includes('no data')
  ) {
    return jsonError(
      422,
      'unsupported_symbol',
      'This provider does not return data for the selected instrument.'
    );
  }
  return jsonError(
    502,
    'provider_unavailable',
    'The data provider could not complete this request.'
  );
}

function normalizeTwelveDataHistory(data: unknown): PricePoint[] {
  if (!isRecord(data) || !Array.isArray(data.values)) return [];
  return data.values
    .flatMap((value): PricePoint[] => {
      if (!isRecord(value)) return [];
      const time = normalizeTime(value.datetime);
      const price = finiteNumber(value.close);
      if (!time || price === undefined) return [];
      return [
        {
          time,
          price,
          volume: Math.max(0, finiteNumber(value.volume) ?? 0),
        },
      ];
    })
    .sort((a, b) => a.time.localeCompare(b.time));
}

function normalizeFmpHistory(data: unknown): PricePoint[] {
  if (!Array.isArray(data)) return [];
  return data
    .flatMap((value): PricePoint[] => {
      if (!isRecord(value)) return [];
      const time = normalizeTime(value.date);
      const price = finiteNumber(value.close);
      if (!time || price === undefined) return [];
      return [
        {
          time,
          price,
          volume: Math.max(0, finiteNumber(value.volume) ?? 0),
        },
      ];
    })
    .sort((a, b) => a.time.localeCompare(b.time));
}

function normalizeFmpProfile(data: unknown): Record<string, unknown> | undefined {
  if (!Array.isArray(data) || !isRecord(data[0])) return undefined;
  const profile = data[0];
  const stringField = (key: string): string | undefined => {
    const value = profile[key];
    return typeof value === 'string' ? value : undefined;
  };
  const numberField = (key: string): number | undefined =>
    finiteNumber(profile[key]);
  const website = stringField('website');

  return {
    symbol: stringField('symbol'),
    name: stringField('companyName'),
    exchange: stringField('exchangeShortName') ?? stringField('exchange'),
    currency: stringField('currency'),
    sector: stringField('sector'),
    industry: stringField('industry'),
    description: stringField('description'),
    website:
      website && /^https:\/\/[^/]+/i.test(website) ? website : undefined,
    marketCap: numberField('marketCap'),
    beta: numberField('beta'),
  };
}

function cacheResult(key: string, result: EndpointResult): EndpointResult {
  if (result.status >= 200 && result.status < 300) {
    cache.set(key, { expiresAt: Date.now() + 30_000, result });
  }
  return result;
}

async function loadProviderData(
  provider: 'twelvedata' | 'fmp',
  symbol: string,
  timeframe: string,
  dataset: 'history' | 'profile',
  env: EndpointEnvironment
): Promise<EndpointResult> {
  if (!STOCK_SYMBOLS.has(symbol)) {
    return jsonError(
      422,
      'unsupported_symbol',
      'Twelve Data and FMP are enabled here for listed stock symbols only; Indian index symbols are not supported.'
    );
  }

  if (dataset === 'history' && !TIMEFRAMES.has(timeframe)) {
    return jsonError(
      422,
      'unsupported_timeframe',
      'This provider supplies end-of-day chart history only. Choose 1M, 6M, 1Y, or 5Y.'
    );
  }

  if (dataset === 'profile' && provider !== 'fmp') {
    return jsonError(
      422,
      'unsupported_dataset',
      'Company profiles are available from Financial Modeling Prep only.'
    );
  }

  const apiKey =
    provider === 'twelvedata'
      ? env.TWELVE_DATA_API_KEY
      : env.FINANCIAL_MODELING_PREP_API_KEY;
  if (!apiKey) {
    const variable =
      provider === 'twelvedata'
        ? 'TWELVE_DATA_API_KEY'
        : 'FINANCIAL_MODELING_PREP_API_KEY';
    return jsonError(
      503,
      'provider_not_configured',
      `${provider === 'twelvedata' ? 'Twelve Data' : 'Financial Modeling Prep'} is not configured. Set ${variable} on the server.`
    );
  }

  const cacheKey = `${provider}:${dataset}:${symbol}:${timeframe}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const pending = inFlight.get(cacheKey);
  if (pending) return pending;

  const request = (async (): Promise<EndpointResult> => {
    const url =
      provider === 'twelvedata'
        ? new URL('https://api.twelvedata.com/time_series')
        : new URL(
            dataset === 'profile'
              ? 'https://financialmodelingprep.com/stable/profile'
              : 'https://financialmodelingprep.com/stable/historical-price-eod/full'
          );
    url.searchParams.set(
      'symbol',
      provider === 'twelvedata' ? symbol : `${symbol}.NS`
    );
    url.searchParams.set('apikey', apiKey);

    if (dataset === 'history') {
      if (provider === 'twelvedata') {
        const outputsize =
          timeframe === '1M'
            ? '35'
            : timeframe === '6M'
              ? '145'
              : timeframe === '1Y'
                ? '280'
                : '1350';
        url.searchParams.set('exchange', 'NSE');
        url.searchParams.set('interval', '1day');
        url.searchParams.set('outputsize', outputsize);
        url.searchParams.set('start_date', dateRange(timeframe));
        url.searchParams.set('end_date', new Date().toISOString().slice(0, 10));
      } else {
        url.searchParams.set('from', dateRange(timeframe));
        url.searchParams.set('to', new Date().toISOString().slice(0, 10));
      }
    }

    const upstream = await fetchProviderJson(url);
    if (upstream.failure) return upstream.failure;
    const providerFailure = providerError(upstream.data, provider);
    if (providerFailure) return providerFailure;

    if (dataset === 'profile') {
      const profile = normalizeFmpProfile(upstream.data);
      if (!profile) {
        return jsonError(
          422,
          'unsupported_symbol',
          'Financial Modeling Prep has no company profile for this stock.'
        );
      }
      return cacheResult(cacheKey, {
        status: 200,
        body: { provider, retrievedAt: Date.now(), profile },
        cacheControl: 'private, max-age=300',
      });
    }

    const history =
      provider === 'twelvedata'
        ? normalizeTwelveDataHistory(upstream.data)
        : normalizeFmpHistory(upstream.data);
    if (!history.length) {
      return jsonError(
        422,
        'unsupported_symbol',
        'This provider returned no historical data for the selected stock and timeframe.'
      );
    }
    return cacheResult(cacheKey, {
      status: 200,
      body: {
        provider,
        freshness: 'end-of-day',
        retrievedAt: Date.now(),
        history,
      },
      cacheControl: 'private, max-age=30',
    });
  })();

  inFlight.set(cacheKey, request);
  try {
    return await request;
  } finally {
    inFlight.delete(cacheKey);
  }
}

export async function handleMarketRequest(
  url: URL,
  method: string | undefined,
  env: EndpointEnvironment
): Promise<EndpointResult> {
  if (method !== 'GET') {
    return jsonError(405, 'method_not_allowed', 'Only GET is supported.');
  }

  const provider = url.searchParams.get('provider');
  if (provider !== 'twelvedata' && provider !== 'fmp') {
    return jsonError(400, 'invalid_provider', 'Choose a supported market provider.');
  }
  const symbol = url.searchParams.get('symbol')?.trim().toUpperCase() ?? '';
  if (!/^[A-Z0-9][A-Z0-9 ]{0,15}$/.test(symbol)) {
    return jsonError(400, 'invalid_symbol', 'A valid app symbol is required.');
  }
  const timeframe = url.searchParams.get('timeframe') ?? '';
  const dataset = url.searchParams.get('dataset') ?? 'history';
  if (dataset !== 'history' && dataset !== 'profile') {
    return jsonError(400, 'invalid_dataset', 'Choose a supported market dataset.');
  }
  if (dataset === 'profile' && provider !== 'fmp') {
    return jsonError(
      422,
      'unsupported_dataset',
      'Company profiles are available from Financial Modeling Prep only.'
    );
  }

  return loadProviderData(
    provider,
    symbol,
    timeframe,
    dataset,
    env
  );
}
