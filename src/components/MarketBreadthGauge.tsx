import { motion } from 'framer-motion';
import type { MarketBreadth } from '@/lib/types';

interface MarketBreadthGaugeProps {
  breadth: MarketBreadth;
}

export function MarketBreadthGauge({ breadth }: MarketBreadthGaugeProps) {
  const { advances, declines, unchanged, total } = breadth;
  const advPercent = total > 0 ? (advances / total) * 100 : 0;
  const decPercent = total > 0 ? (declines / total) * 100 : 0;
  const uncPercent = total > 0 ? (unchanged / total) * 100 : 0;

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider">
          Market Breadth
        </h3>
        <p className="text-xs text-muted-foreground">Advances vs Declines</p>
      </div>

      {/* Bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${advPercent}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="h-full bg-emerald-500"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${uncPercent}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="h-full bg-muted-foreground/40"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${decPercent}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="h-full bg-rose-500"
        />
      </div>

      {/* Stats */}
      <div className="mt-4 space-y-2.5">
        <BreadthRow
          label="Advances"
          value={advances}
          percent={advPercent}
          color="text-emerald-500"
          dotColor="bg-emerald-500"
        />
        <BreadthRow
          label="Unchanged"
          value={unchanged}
          percent={uncPercent}
          color="text-muted-foreground"
          dotColor="bg-muted-foreground/40"
        />
        <BreadthRow
          label="Declines"
          value={declines}
          percent={decPercent}
          color="text-rose-500"
          dotColor="bg-rose-500"
        />
      </div>

      <div className="mt-4 rounded-lg bg-muted/50 p-3 text-center">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Market Sentiment
        </p>
        <p
          className={`mt-1 font-display text-sm font-bold ${
            advPercent > decPercent ? 'text-emerald-500' : 'text-rose-500'
          }`}
        >
          {advPercent > decPercent
            ? advPercent > decPercent + 15
              ? 'Strongly Bullish'
              : 'Bullish'
            : decPercent > advPercent + 15
              ? 'Strongly Bearish'
              : 'Bearish'}
        </p>
      </div>
    </div>
  );
}

function BreadthRow({
  label,
  value,
  percent,
  color,
  dotColor,
}: {
  label: string;
  value: number;
  percent: number;
  color: string;
  dotColor: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono-tabular text-xs font-semibold text-muted-foreground">
          {value.toLocaleString('en-IN')}
        </span>
        <span className={`font-mono-tabular text-xs font-bold ${color}`}>
          {percent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
