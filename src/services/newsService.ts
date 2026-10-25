import type { MarketNewsArticle } from '@/lib/types';

export async function fetchMarketNews(
  signal?: AbortSignal
): Promise<MarketNewsArticle[]> {
  const response = await fetch('/api/news', {
    signal,
    headers: { Accept: 'application/json' },
  });
  const data: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
        ? data.message
        : `News request failed (${response.status}).`;
    throw new Error(message);
  }
  if (
    typeof data !== 'object' ||
    data === null ||
    !('articles' in data) ||
    !Array.isArray(data.articles)
  ) {
    throw new Error('The news service returned an invalid response.');
  }
  return data.articles as MarketNewsArticle[];
}
