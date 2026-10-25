import type { MarketProvider, Timeframe } from '@/lib/types';

export function supportsChartHistory(
  provider: MarketProvider,
  instrumentType: 'index' | 'stock',
  timeframe: Timeframe
): boolean {
  if (provider === 'yahoo') return true;
  return (
    instrumentType === 'stock' &&
    timeframe !== '1D' &&
    timeframe !== '1W'
  );
}
