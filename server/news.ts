interface NewsEndpointResult {
  status: number;
  body: Record<string, unknown>;
  cacheControl: string;
}

interface NewsEnvironment {
  GNEWS_API_KEY?: string;
}

interface NewsArticle {
  title: string;
  description?: string;
  url: string;
  image?: string;
  publishedAt: string;
  source: string;
}

const NEWS_QUERY =
  'Nifty OR NSE OR Sensex OR Indian stock market';
const GNEWS_TIMEOUT_MS = 4_000;
const RSS_TIMEOUT_MS = 4_000;
const cache = new Map<
  string,
  { expiresAt: number; result: NewsEndpointResult }
>();
let pending: Promise<NewsEndpointResult> | undefined;

function errorResult(
  status: number,
  code: string,
  message: string
): NewsEndpointResult {
  return {
    status,
    body: { error: code, message },
    cacheControl: 'private, no-store',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function validHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function normalizeArticles(data: unknown): NewsArticle[] {
  if (!isRecord(data) || !Array.isArray(data.articles)) return [];
  return data.articles.flatMap((article): NewsArticle[] => {
    if (!isRecord(article)) return [];
    const url = validHttpsUrl(article.url);
    const title =
      typeof article.title === 'string' ? article.title.trim() : '';
    const publishedAt =
      typeof article.publishedAt === 'string' &&
      !Number.isNaN(Date.parse(article.publishedAt))
        ? new Date(article.publishedAt).toISOString()
        : undefined;
    const source = isRecord(article.source) ? article.source.name : undefined;
    if (!url || !title || !publishedAt || typeof source !== 'string') return [];

    const image = validHttpsUrl(article.image);
    return [
      {
        title,
        description:
          typeof article.description === 'string'
            ? article.description
            : undefined,
        url,
        image,
        publishedAt,
        source,
      },
    ];
  });
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function rssTag(item: string, tag: string): string | undefined {
  const match = item.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i')
  );
  return match ? decodeXml(match[1].trim()) : undefined;
}

function normalizeRssArticles(xml: string): NewsArticle[] {
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)]
    .flatMap((match): NewsArticle[] => {
      const item = match[1];
      const title = rssTag(item, 'title')?.trim();
      const url = validHttpsUrl(rssTag(item, 'link'));
      const publishedAtValue = rssTag(item, 'pubDate');
      const publishedAt =
        publishedAtValue && !Number.isNaN(Date.parse(publishedAtValue))
          ? new Date(publishedAtValue).toISOString()
          : undefined;
      const source = rssTag(item, 'source')?.trim();
      if (!title || !url || !publishedAt || !source) return [];
      return [{ title, url, publishedAt, source }];
    })
    .slice(0, 10);
}

async function fetchRssFallback(): Promise<NewsEndpointResult> {
  const url = new URL('https://news.google.com/rss/search');
  url.searchParams.set('q', NEWS_QUERY);
  url.searchParams.set('hl', 'en-IN');
  url.searchParams.set('gl', 'IN');
  url.searchParams.set('ceid', 'IN:en');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RSS_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/rss+xml, application/xml' },
    });
    if (!response.ok) {
      return errorResult(
        502,
        'provider_unavailable',
        'The news providers are temporarily unavailable.'
      );
    }
    const articles = normalizeRssArticles(await response.text());
    return {
      status: 200,
      body: { retrievedAt: Date.now(), articles },
      cacheControl: 'private, max-age=300',
    };
  } catch {
    return errorResult(
      504,
      'provider_timeout',
      'The news providers took too long to respond. Try again shortly.'
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function handleNewsRequest(
  method: string | undefined,
  env: NewsEnvironment
): Promise<NewsEndpointResult> {
  if (method !== 'GET') {
    return errorResult(405, 'method_not_allowed', 'Only GET is supported.');
  }
  if (!env.GNEWS_API_KEY) {
    return errorResult(
      503,
      'provider_not_configured',
      'GNews is not configured. Set GNEWS_API_KEY on the server.'
    );
  }

  const cacheKey = 'india-market-news';
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.result;
  if (pending) return pending;

  pending = (async (): Promise<NewsEndpointResult> => {
    const url = new URL('https://gnews.io/api/v4/search');
    url.searchParams.set('q', NEWS_QUERY);
    url.searchParams.set('lang', 'en');
    url.searchParams.set('country', 'in');
    url.searchParams.set('max', '10');
    url.searchParams.set('sortby', 'publishedAt');
    url.searchParams.set('apikey', env.GNEWS_API_KEY as string);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GNEWS_TIMEOUT_MS);
    try {
      let response: Response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
      } catch {
        const timedOut = controller.signal.aborted;
        const fallback = await fetchRssFallback();
        if (fallback.status === 200) {
          cache.set(cacheKey, {
            expiresAt: Date.now() + 5 * 60_000,
            result: fallback,
          });
          return fallback;
        }
        return errorResult(
          timedOut ? fallback.status : 502,
          timedOut ? fallback.body.error as string : 'provider_unavailable',
          timedOut
            ? fallback.body.message as string
            : 'GNews could not be reached. Try again shortly.'
        );
      }

      if (response.status === 429) {
        return errorResult(
          429,
          'provider_rate_limited',
          'GNews rate limit reached. Try again later.'
        );
      }
      if (response.status === 401 || response.status === 403) {
        return errorResult(
          502,
          'provider_access_denied',
          'GNews rejected the configured key or plan.'
        );
      }
      if (response.status === 402) {
        return errorResult(
          503,
          'provider_plan_required',
          'The current GNews plan does not allow this request.'
        );
      }
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        return errorResult(
          502,
          'invalid_provider_response',
          'GNews returned an invalid response.'
        );
      }
      if (!response.ok) {
        return errorResult(
          502,
          'provider_unavailable',
          'GNews is temporarily unavailable.'
        );
      }
      if (!isRecord(data) || !Array.isArray(data.articles)) {
        return errorResult(
          502,
          'invalid_provider_response',
          'GNews returned an invalid response.'
        );
      }

      const articles = normalizeArticles(data);
      const result: NewsEndpointResult = {
        status: 200,
        body: { retrievedAt: Date.now(), articles },
        cacheControl: 'private, max-age=300',
      };
      cache.set(cacheKey, {
        expiresAt: Date.now() + 5 * 60_000,
        result,
      });
      return result;
    } finally {
      clearTimeout(timeout);
    }
  })();

  try {
    return await pending;
  } finally {
    pending = undefined;
  }
}
