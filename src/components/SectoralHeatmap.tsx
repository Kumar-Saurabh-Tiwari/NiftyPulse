import { motion } from 'framer-motion';
import type { SectorData } from '@/lib/types';

interface SectoralHeatmapProps {
  sectors: SectorData[];
}

function heatColor(change: number): string {
  const intensity = Math.min(Math.abs(change) / 2.5, 1);
  if (change >= 0) {
    return `rgba(16, 185, 129, ${0.08 + intensity * 0.4})`;
  }
  return `rgba(239, 68, 68, ${0.08 + intensity * 0.4})`;
}

function borderColor(change: number): string {
  return change >= 0
    ? 'rgba(16, 185, 129, 0.25)'
    : 'rgba(239, 68, 68, 0.25)';
}

export function SectoralHeatmap({ sectors }: SectoralHeatmapProps) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider">
          Sectoral Heatmap
        </h3>
        <p className="text-xs text-muted-foreground">Performance by sector</p>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
        {sectors.map((sector, i) => {
          const isUp = sector.changePercent >= 0;
          return (
            <motion.div
              key={sector.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="relative overflow-hidden rounded-xl p-3"
              style={{
                backgroundColor: heatColor(sector.changePercent),
                border: `1px solid ${borderColor(sector.changePercent)}`,
              }}
            >
              <div className="relative">
                <p className="text-xs font-bold uppercase tracking-wider">{sector.name}</p>
                <p className="mt-1 font-mono-tabular text-lg font-bold">
                  {isUp ? '+' : ''}
                  {sector.changePercent.toFixed(2)}%
                </p>
                <p className="mt-0.5 text-[9px] text-muted-foreground">
                  Top: {sector.topStock}
                </p>
              </div>
              {/* Glow */}
              <div
                className={`pointer-events-none absolute -bottom-8 -right-8 h-20 w-20 rounded-full opacity-30 blur-2xl ${
                  isUp ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
