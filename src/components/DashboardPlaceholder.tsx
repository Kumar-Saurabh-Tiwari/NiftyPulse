import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Activity, RefreshCw } from 'lucide-react';

interface DashboardPlaceholderProps {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function DashboardPlaceholder({
  loading,
  error,
  onRetry,
}: DashboardPlaceholderProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      aria-label={loading ? 'Loading live market data' : 'Live market data unavailable'}
      aria-busy={loading}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-white/45 px-4 py-3 shadow-sm backdrop-blur-md dark:bg-muted/30">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <Activity className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold">
              {loading ? 'Connecting to live market feeds' : 'Live quotes are unavailable'}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {loading
                ? 'Fetching the latest prices. Your dashboard will appear as soon as data arrives.'
                : error || 'No sample prices are shown when the live feed cannot be reached.'}
            </p>
          </div>
        </div>
        {!loading && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-foreground/10 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/15"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <IndexCardSkeleton />
        <IndexCardSkeleton />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Shimmer className="h-5 w-36" />
              <Shimmer className="h-3 w-24" />
            </div>
            <Shimmer className="h-8 w-28" />
          </div>
          <div className="mt-6 flex h-[280px] items-end gap-2 overflow-hidden rounded-xl px-2 sm:h-[340px] md:h-[400px]">
            {[38, 55, 44, 68, 50, 78, 61, 86, 58, 72, 48, 65, 42, 74, 56, 82, 49, 67, 43, 76].map(
              (height, index) => (
                <Shimmer
                  key={index}
                  className="min-w-2 flex-1 rounded-t-sm"
                  style={{ height: `${height}%` }}
                />
              )
            )}
          </div>
        </div>
        <SectionSkeleton rows={4} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionSkeleton rows={5} className="lg:col-span-2" />
        <SectionSkeleton rows={4} />
      </div>

      <div className="glass-card mt-6 rounded-2xl p-5">
        <Shimmer className="mb-4 h-4 w-40" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: 10 }, (_, index) => (
            <Shimmer key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Shimmer className="mb-3 h-4 w-28" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <IndexCardSkeleton key={index} compact />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function IndexCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`glass-card rounded-2xl ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-center justify-between">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-7 w-7 rounded-lg" />
      </div>
      <Shimmer className={`mt-4 h-8 ${compact ? 'w-28' : 'w-40'}`} />
      {!compact && (
        <>
          <Shimmer className="mt-3 h-5 w-32" />
          <Shimmer className="mt-5 h-1.5 w-full rounded-full" />
          <div className="mt-4 flex gap-2">
            <Shimmer className="h-6 flex-1" />
            <Shimmer className="h-6 flex-1" />
            <Shimmer className="h-6 flex-1" />
          </div>
        </>
      )}
    </div>
  );
}

function SectionSkeleton({
  rows,
  className = '',
}: {
  rows: number;
  className?: string;
}) {
  return (
    <div className={`glass-card rounded-2xl p-5 ${className}`}>
      <Shimmer className="h-4 w-32" />
      <Shimmer className="mt-2 h-3 w-44" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <Shimmer className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Shimmer className="h-3 w-2/5" />
                <Shimmer className="h-2.5 w-3/5" />
              </div>
            </div>
            <Shimmer className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Shimmer({
  className = '',
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={`market-shimmer rounded-md ${className}`}
    />
  );
}
