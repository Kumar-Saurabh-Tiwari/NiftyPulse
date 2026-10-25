import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const originalFetch = globalThis.fetch;
const server = await createServer({
  configFile: false,
  appType: 'custom',
  server: { middlewareMode: true },
});

const marketModule = await server.ssrLoadModule('/server/market.ts');
const newsModule = await server.ssrLoadModule('/server/news.ts');
const capabilitiesModule = await server.ssrLoadModule(
  '/src/lib/marketCapabilities.ts'
);

after(async () => {
  globalThis.fetch = originalFetch;
  await server.close();
});

test('provider policy keeps indexes and intraday charts on Yahoo', () => {
  const { supportsChartHistory } = capabilitiesModule;
  assert.equal(supportsChartHistory('yahoo', 'index', '1D'), true);
  assert.equal(supportsChartHistory('twelvedata', 'index', '1M'), false);
  assert.equal(supportsChartHistory('twelvedata', 'stock', '1W'), false);
  assert.equal(supportsChartHistory('twelvedata', 'stock', '1M'), true);
  assert.equal(supportsChartHistory('fmp', 'stock', '5Y'), true);
});

test('Twelve Data history is normalized and uses an NSE end-of-day mapping', async () => {
  let requestUrl;
  globalThis.fetch = async (input) => {
    requestUrl = new URL(input);
    return new Response(
      JSON.stringify({
        values: [
          { datetime: '2025-02-03', close: '150', volume: '20' },
          { datetime: '2025-02-01', close: '140', volume: '10' },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const result = await marketModule.handleMarketRequest(
    new URL(
      'http://localhost/api/market?provider=twelvedata&dataset=history&symbol=INFY&timeframe=1M'
    ),
    'GET',
    { TWELVE_DATA_API_KEY: 'test-key-not-for-output' }
  );

  assert.equal(result.status, 200);
  assert.equal(requestUrl.hostname, 'api.twelvedata.com');
  assert.equal(requestUrl.searchParams.get('exchange'), 'NSE');
  assert.equal(requestUrl.searchParams.get('interval'), '1day');
  assert.equal(requestUrl.searchParams.get('symbol'), 'INFY');
  assert.ok(requestUrl.searchParams.get('start_date'));
  assert.ok(requestUrl.searchParams.get('end_date'));
  assert.equal(requestUrl.searchParams.get('apikey'), 'test-key-not-for-output');
  assert.equal(result.body.freshness, 'end-of-day');
  assert.deepEqual(
    result.body.history.map(({ price }) => price),
    [140, 150]
  );
  assert.equal(
    JSON.stringify(result.body).includes('test-key-not-for-output'),
    false
  );
});

test('unsupported index symbols, intraday periods, and missing keys fail clearly', async () => {
  const index = await marketModule.handleMarketRequest(
    new URL(
      'http://localhost/api/market?provider=twelvedata&symbol=NIFTY%2050&timeframe=1M'
    ),
    'GET',
    { TWELVE_DATA_API_KEY: 'configured' }
  );
  const timeframe = await marketModule.handleMarketRequest(
    new URL(
      'http://localhost/api/market?provider=fmp&symbol=INFY&timeframe=1D'
    ),
    'GET',
    { FINANCIAL_MODELING_PREP_API_KEY: 'configured' }
  );
  const missingKey = await marketModule.handleMarketRequest(
    new URL(
      'http://localhost/api/market?provider=fmp&symbol=INFY&timeframe=1M'
    ),
    'GET',
    {}
  );

  assert.equal(index.status, 422);
  assert.equal(index.body.error, 'unsupported_symbol');
  assert.equal(timeframe.status, 422);
  assert.equal(timeframe.body.error, 'unsupported_timeframe');
  assert.equal(missingKey.status, 503);
  assert.equal(missingKey.body.error, 'provider_not_configured');
});

test('upstream rate limits, plan denials, invalid JSON, and timeouts are surfaced safely', async () => {
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    if (url.hostname === 'financialmodelingprep.com') {
      return new Response('not json', { status: 402 });
    }
    if (url.searchParams.get('symbol') === 'TCS') {
      return new Response('rate limited', { status: 429 });
    }
    return new Response('not json', { status: 200 });
  };

  const planDenied = await marketModule.handleMarketRequest(
    new URL(
      'http://localhost/api/market?provider=fmp&symbol=SBIN&timeframe=1M'
    ),
    'GET',
    { FINANCIAL_MODELING_PREP_API_KEY: 'configured' }
  );
  const rateLimited = await marketModule.handleMarketRequest(
    new URL(
      'http://localhost/api/market?provider=twelvedata&symbol=TCS&timeframe=1M'
    ),
    'GET',
    { TWELVE_DATA_API_KEY: 'configured' }
  );
  const invalidResponse = await marketModule.handleMarketRequest(
    new URL(
      'http://localhost/api/market?provider=twelvedata&symbol=ITC&timeframe=1M'
    ),
    'GET',
    { TWELVE_DATA_API_KEY: 'configured' }
  );

  assert.equal(planDenied.body.error, 'provider_plan_required');
  assert.equal(rateLimited.status, 429);
  assert.equal(rateLimited.body.error, 'provider_rate_limited');
  assert.equal(invalidResponse.body.error, 'invalid_provider_response');

  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  globalThis.setTimeout = (callback) => {
    callback();
    return 0;
  };
  globalThis.clearTimeout = () => {};
  globalThis.fetch = async (_input, options) => {
    assert.equal(options.signal.aborted, true);
    throw new DOMException('aborted', 'AbortError');
  };
  try {
    const timeout = await marketModule.handleMarketRequest(
      new URL(
        'http://localhost/api/market?provider=twelvedata&symbol=ITC&timeframe=6M'
      ),
      'GET',
      { TWELVE_DATA_API_KEY: 'configured' }
    );
    assert.equal(timeout.status, 504);
    assert.equal(timeout.body.error, 'provider_timeout');
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
});

test('FMP company profiles are normalized to the shared profile shape', async () => {
  let requestUrl;
  globalThis.fetch = async (input) => {
    requestUrl = new URL(input);
    return new Response(
      JSON.stringify([
        {
          symbol: 'TCS.NS',
          companyName: 'Tata Consultancy Services',
          exchangeShortName: 'NSE',
          currency: 'INR',
          sector: 'Technology',
          industry: 'IT Services',
          marketCap: 1000,
          beta: 0.8,
          website: 'https://example.com',
        },
      ]),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const result = await marketModule.handleMarketRequest(
    new URL(
      'http://localhost/api/market?provider=fmp&dataset=profile&symbol=TCS'
    ),
    'GET',
    { FINANCIAL_MODELING_PREP_API_KEY: 'test-fmp-key' }
  );

  assert.equal(result.status, 200);
  assert.equal(requestUrl.hostname, 'financialmodelingprep.com');
  assert.equal(requestUrl.pathname, '/stable/profile');
  assert.equal(requestUrl.searchParams.get('symbol'), 'TCS.NS');
  assert.equal(result.body.profile.name, 'Tata Consultancy Services');
  assert.equal(result.body.profile.marketCap, 1000);
  assert.equal(JSON.stringify(result.body).includes('test-fmp-key'), false);
});

test('GNews normalizes valid headlines and filters unsafe links', async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        articles: [
          {
            title: 'Market report',
            description: 'Headline summary',
            url: 'https://news.example/article',
            image: 'http://news.example/image.jpg',
            publishedAt: '2025-02-01T10:00:00Z',
            source: { name: 'Example News' },
          },
          {
            title: 'Unsafe link',
            url: 'javascript:alert(1)',
            publishedAt: '2025-02-01T10:00:00Z',
            source: { name: 'Example News' },
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  const result = await newsModule.handleNewsRequest('GET', {
    GNEWS_API_KEY: 'test-news-key',
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.articles.length, 1);
  assert.equal(result.body.articles[0].url, 'https://news.example/article');
  assert.equal(result.body.articles[0].image, undefined);
  assert.equal(JSON.stringify(result.body).includes('test-news-key'), false);
});
