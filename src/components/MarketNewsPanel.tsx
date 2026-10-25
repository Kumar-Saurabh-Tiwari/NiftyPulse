import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Newspaper, RefreshCw } from 'lucide-react';
import type { MarketNewsArticle } from '@/lib/types';
import { fetchMarketNews } from '@/services/newsService';

export function MarketNewsPanel() {
  const [articles, setArticles] = useState<MarketNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchMarketNews(controller.signal)
      .then(setArticles)
      .catch((reason: unknown) => {
        if (
          !controller.signal.aborted &&
          !(reason instanceof Error && reason.name === 'AbortError')
        ) {
          setError(
            reason instanceof Error ? reason.message : 'Could not load market news.'
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  return (
    <section
      className="glass-card flex h-full min-h-[380px] max-h-[620px] flex-col overflow-hidden rounded-2xl p-4 sm:p-5"
      aria-labelledby="market-news-title"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10">
              <Newspaper className="h-4 w-4 text-emerald-500" />
            </span>
            <h2
              id="market-news-title"
              className="font-display text-sm font-bold tracking-wide"
            >
              Market headlines
            </h2>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              India
            </span>
          </div>
          <p className="ml-10 mt-0.5 text-[11px] text-muted-foreground">
            Curated market stories · GNews
          </p>
        </div>
        <button
          type="button"
          onClick={retry}
          disabled={loading}
          aria-label="Refresh market news"
          className="rounded-lg border border-border/50 bg-background/50 p-2 text-muted-foreground transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-500 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl bg-muted/40 p-4" role="alert">
          <p className="text-sm font-medium">News is temporarily unavailable</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 rounded-md bg-foreground/10 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-foreground/15"
          >
            Try again
          </button>
        </div>
      ) : loading && !articles.length ? (
        <p className="mt-5 text-sm text-muted-foreground" role="status">
          Loading headlines…
        </p>
      ) : articles.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">
          No India market headlines were returned.
        </p>
      ) : (
        <ul className="mt-1 min-h-0 flex-1 divide-y divide-border/50 overflow-y-auto pr-1">
          {articles.map((article) => (
            <li
              key={`${article.url}-${article.publishedAt}`}
              className="py-3 first:pt-2"
            >
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-start justify-between gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold leading-snug group-hover:text-emerald-500">
                    {article.title}
                  </span>
                  {article.description && (
                    <span className="mt-1 block line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                      {article.description}
                    </span>
                  )}
                  <span className="mt-2 block text-[10px] font-medium text-muted-foreground">
                    {article.source} ·{' '}
                    {new Date(article.publishedAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </span>
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 border-t border-border/50 pt-3 text-[10px] leading-relaxed text-muted-foreground">
        Headlines are provided by GNews; freshness depends on your plan.
      </p>
    </section>
  );
}
