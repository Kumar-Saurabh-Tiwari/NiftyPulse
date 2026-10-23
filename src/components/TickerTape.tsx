import { motion } from 'framer-motion';
import type { IndexData } from '@/lib/types';
import { useFormatPrice } from '@/hooks/useMarketData';

interface TickerTapeProps {
  indices: IndexData[];
  lastTick: Record<string, 'up' | 'down' | 'same'>;
}

export function TickerTape({ indices, lastTick }: TickerTapeProps) {
  const { formatPrice } = useFormatPrice();

  if (!indices.length) {
    return (
      <div className="border-y border-border/50 bg-muted/30 py-2 text-center text-xs text-muted-foreground">
        Waiting for market quotes…
      </div>
    );
  }

  // Duplicate for seamless marquee loop
  const tickerData = [...indices, ...indices];

  return (
    <div className="relative overflow-hidden border-y border-border/40 bg-white/45 py-2 backdrop-blur-md dark:bg-black/30">
      <div className="animate-ticker flex w-max items-center gap-0">
        {tickerData.map((idx, i) => {
          const tick = lastTick[idx.symbol];
          const isUp = idx.change >= 0;

          return (
            <div
              key={`${idx.symbol}-${i}`}
              className="flex items-center gap-3 whitespace-nowrap px-6"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {idx.symbol}
              </span>
              <motion.span
                key={`${idx.symbol}-price-${idx.price}-${i < indices.length ? 'a' : 'b'}`}
                initial={
                  tick === 'up'
                    ? { backgroundColor: 'rgba(16,185,129,0.35)' }
                    : tick === 'down'
                      ? { backgroundColor: 'rgba(239,68,68,0.35)' }
                      : undefined
                }
                animate={{ backgroundColor: 'rgba(0,0,0,0)' }}
                transition={{ duration: 0.7 }}
                className="rounded px-1 font-mono-tabular text-sm font-semibold text-foreground"
              >
                {formatPrice(idx.price)}
              </motion.span>
              <span
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 font-mono-tabular text-xs font-medium ${
                  isUp ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {isUp ? '▲' : '▼'} {Math.abs(idx.change).toFixed(2)} (
                {Math.abs(idx.changePercent).toFixed(2)}%)
              </span>
              <span className="text-border">|</span>
            </div>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent sm:w-16" />
    </div>
  );
}
