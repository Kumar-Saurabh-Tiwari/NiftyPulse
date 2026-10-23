import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import type { StockData } from '@/lib/types';
import { useFormatPrice } from '@/hooks/useMarketData';

interface TopMoversProps {
  stocks: StockData[];
  lastTick: Record<string, 'up' | 'down' | 'same'>;
}

export function TopMovers({ stocks, lastTick }: TopMoversProps) {
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers');
  const { formatPrice } = useFormatPrice();

  const sorted = [...stocks].sort(
    (a, b) => b.changePercent - a.changePercent
  );
  const gainers = sorted.slice(0, 8);
  const losers = sorted.slice(-8).reverse();
  const display = tab === 'gainers' ? gainers : losers;

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider">
            Top Movers
          </h3>
          <p className="text-xs text-muted-foreground">Market leaders & laggards</p>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5">
          <MoverTab active={tab === 'gainers'} onClick={() => setTab('gainers')} color="text-emerald-500">
            Gainers
          </MoverTab>
          <MoverTab active={tab === 'losers'} onClick={() => setTab('losers')} color="text-rose-500">
            Losers
          </MoverTab>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        {!stocks.length ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            No stock movers available yet.
          </div>
        ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-1"
          >
            {display.map((stock) => {
              const isUp = stock.changePercent >= 0;
              const tick = lastTick[stock.symbol];
              return (
                <motion.div
                  key={stock.symbol}
                  whileHover={{ x: 2 }}
                  className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <span className="text-[10px] font-bold">
                        {stock.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold">{stock.symbol}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                        {stock.name}
                      </p>
                    </div>
                  </div>

                  {/* Sparkline */}
                  <div className="hidden h-8 w-20 sm:block">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stock.sparkline.map((v, i) => ({ i, v }))}>
                        <Line
                          type="monotone"
                          dataKey="v"
                          stroke={isUp ? '#10B981' : '#EF4444'}
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="text-right">
                    <motion.span
                      key={stock.price}
                      initial={
                        tick === 'up'
                          ? { color: '#10B981' }
                          : tick === 'down'
                            ? { color: '#EF4444' }
                            : {}
                      }
                      animate={{ color: 'hsl(var(--foreground))' }}
                      transition={{ duration: 0.5 }}
                      className="block font-mono-tabular text-xs font-semibold"
                    >
                      {formatPrice(stock.price)}
                    </motion.span>
                    <span
                      className={`font-mono-tabular text-[10px] font-bold ${
                        isUp ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {isUp ? '+' : ''}
                      {stock.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function MoverTab({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {active && (
        <motion.span
          layoutId="mover-tab"
          className={`absolute inset-0 rounded-md bg-foreground/10 ${active ? color : ''}`}
        />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}
