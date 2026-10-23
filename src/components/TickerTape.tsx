import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { IndexData } from '@/lib/types';
import { useFormatPrice } from '@/hooks/useMarketData';

interface TickerTapeProps {
  indices: IndexData[];
  lastTick: Record<string, 'up' | 'down' | 'same'>;
}

export function TickerTape({ indices, lastTick }: TickerTapeProps) {
  const { formatPrice } = useFormatPrice();
  const tickerData = [...indices, ...indices];
  const tickRef = useRef<Record<string, 'up' | 'down' | 'same'>>(lastTick);

  useEffect(() => {
    tickRef.current = lastTick;
  }, [lastTick]);

  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-black/20 py-2 dark:bg-black/30">
      <div className="animate-ticker flex w-max items-center gap-0">
        {tickerData.map((idx, i) => {
          const direction = idx.change >= 0 ? 'up' : 'down';
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
              <span className="font-mono-tabular text-sm font-semibold text-foreground">
                {formatPrice(idx.price)}
              </span>
              <motion.span
                key={`${idx.symbol}-${tick}`}
                initial={
                  tick === 'up'
                    ? { backgroundColor: 'rgba(16,185,129,0.3)' }
                    : tick === 'down'
                      ? { backgroundColor: 'rgba(239,68,68,0.3)' }
                      : {}
                }
                animate={{ backgroundColor: 'rgba(0,0,0,0)' }}
                transition={{ duration: 0.6 }}
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 font-mono-tabular text-xs font-medium ${
                  isUp ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {isUp ? '▲' : '▼'} {Math.abs(idx.change).toFixed(2)} ({Math.abs(idx.changePercent).toFixed(2)}%)
              </motion.span>
              <span className="text-muted-foreground/30">|</span>
            </div>
          );
        })}
      </div>
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
