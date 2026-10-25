import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import type { CompanyProfile, MarketProvider } from '@/lib/types';
import {
  fetchCompanyProfile,
  MarketDataError,
} from '@/services/marketDataService';

interface CompanyProfileCardProps {
  symbol: string;
  onProviderUnavailable: (provider: MarketProvider) => void;
}

export function CompanyProfileCard({
  symbol,
  onProviderUnavailable,
}: CompanyProfileCardProps) {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setProfile(null);

    fetchCompanyProfile(symbol, controller.signal)
      .then(setProfile)
      .catch((reason: unknown) => {
        if (
          !controller.signal.aborted &&
          !(reason instanceof Error && reason.name === 'AbortError')
        ) {
          if (
            reason instanceof MarketDataError &&
            (reason.code === 'provider_plan_required' ||
              reason.code === 'provider_access_denied')
          ) {
            onProviderUnavailable('fmp');
          }
          setError(
            reason instanceof Error
              ? reason.message
              : 'Could not load the company profile.'
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [onProviderUnavailable, reloadKey, symbol]);

  return (
    <section className="glass-card rounded-2xl p-5" aria-labelledby="company-profile-title">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-sky-500" />
        <h2
          id="company-profile-title"
          className="font-display text-sm font-bold uppercase tracking-wider"
        >
          Company Profile
        </h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {symbol} · Financial Modeling Prep
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground" role="status">
          Loading company profile…
        </p>
      ) : error ? (
        <div className="mt-4" role="alert">
          <p className="text-sm font-medium">Profile unavailable</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-3 rounded-md bg-foreground/10 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-foreground/15"
          >
            Try again
          </button>
        </div>
      ) : !profile ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No company profile is available for this stock.
        </p>
      ) : (
        <div className="mt-4">
          <p className="text-sm font-semibold">{profile.name ?? symbol}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {[profile.sector, profile.industry].filter(Boolean).join(' · ') ||
              profile.exchange ||
              'Company details'}
          </p>
          {profile.marketCap !== undefined && (
            <p className="mt-3 text-xs">
              Market cap:{' '}
              <span className="font-mono-tabular font-semibold">
                {profile.marketCap.toLocaleString('en-IN')}
                {profile.currency ? ` ${profile.currency}` : ''}
              </span>
            </p>
          )}
          {profile.description && (
            <p className="mt-3 line-clamp-4 text-xs leading-relaxed text-muted-foreground">
              {profile.description}
            </p>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-xs font-semibold text-emerald-500 hover:underline"
            >
              Company website
            </a>
          )}
        </div>
      )}
      <p className="mt-3 border-t border-border/50 pt-3 text-[10px] text-muted-foreground">
        Profile coverage depends on your FMP plan and symbol availability.
      </p>
    </section>
  );
}
