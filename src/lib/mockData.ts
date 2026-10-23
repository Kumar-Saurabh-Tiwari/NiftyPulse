import type {
  IndexData,
  StockData,
  SectorData,
  MarketBreadth,
  PricePoint,
} from './types';

function generateHistory(
  base: number,
  points: number,
  volatility: number,
  trend: number
): PricePoint[] {
  const history: PricePoint[] = [];
  let price = base;
  const now = Date.now();
  for (let i = points; i >= 0; i--) {
    const drift = (Math.random() - 0.48 + trend) * volatility * base * 0.001;
    price = Math.max(price + drift, base * 0.85);
    const time = new Date(now - i * 300000).toISOString();
    history.push({
      time,
      price: Number(price.toFixed(2)),
      volume: Math.floor(Math.random() * 50000000 + 10000000),
    });
  }
  return history;
}

function generateSparkline(base: number, points: number): number[] {
  const spark: number[] = [];
  let price = base;
  for (let i = 0; i < points; i++) {
    const drift = (Math.random() - 0.5) * base * 0.008;
    price = Math.max(price + drift, base * 0.9);
    spark.push(Number(price.toFixed(2)));
  }
  return spark;
}

export const INDICES_SEED: Omit<
  IndexData,
  'change' | 'changePercent' | 'history'
>[] = [
  {
    symbol: 'NIFTY 50',
    name: 'Nifty 50',
    price: 24750.45,
    prevClose: 24618.2,
    open: 24620.0,
    dayHigh: 24789.6,
    dayLow: 24601.3,
    yearHigh: 26277.35,
    yearLow: 21046.65,
    volume: 412500000,
  },
  {
    symbol: 'NIFTY BANK',
    name: 'Nifty Bank',
    price: 53240.8,
    prevClose: 53012.5,
    open: 53015.0,
    dayHigh: 53410.2,
    dayLow: 52980.45,
    yearHigh: 54110.35,
    yearLow: 44938.6,
    volume: 324800000,
  },
  {
    symbol: 'NIFTY IT',
    name: 'Nifty IT',
    price: 42180.55,
    prevClose: 41980.3,
    open: 41985.0,
    dayHigh: 42310.4,
    dayLow: 41920.1,
    yearHigh: 45892.0,
    yearLow: 34280.7,
    volume: 185600000,
  },
  {
    symbol: 'GIFT NIFTY',
    name: 'Gift Nifty',
    price: 24820.15,
    prevClose: 24750.0,
    open: 24755.0,
    dayHigh: 24845.6,
    dayLow: 24740.2,
    yearHigh: 26300.0,
    yearLow: 21050.0,
    volume: 95000000,
  },
  {
    symbol: 'SENSEX',
    name: 'Sensex',
    price: 81250.9,
    prevClose: 80981.2,
    open: 80985.0,
    dayHigh: 81380.5,
    dayLow: 80920.3,
    yearHigh: 85978.25,
    yearLow: 69214.2,
    volume: 510200000,
  },
  {
    symbol: 'NIFTY MIDCAP',
    name: 'Nifty Midcap 100',
    price: 56720.3,
    prevClose: 56380.5,
    open: 56385.0,
    dayHigh: 56890.4,
    dayLow: 56350.1,
    yearHigh: 60900.0,
    yearLow: 47850.6,
    volume: 298000000,
  },
  {
    symbol: 'NIFTY AUTO',
    name: 'Nifty Auto',
    price: 25180.65,
    prevClose: 25020.4,
    open: 25025.0,
    dayHigh: 25240.3,
    dayLow: 24990.8,
    yearHigh: 28190.0,
    yearLow: 20180.5,
    volume: 162000000,
  },
  {
    symbol: 'NIFTY PHARMA',
    name: 'Nifty Pharma',
    price: 21840.5,
    prevClose: 21720.3,
    open: 21725.0,
    dayHigh: 21910.2,
    dayLow: 21700.45,
    yearHigh: 23700.0,
    yearLow: 16920.8,
    volume: 134000000,
  },
];

export const STOCKS_SEED: Omit<StockData, 'change' | 'changePercent' | 'sparkline'>[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2980.55, prevClose: 2945.2, volume: 8500000, marketCap: 2018000, sector: 'Energy' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', price: 4125.3, prevClose: 4098.5, volume: 3200000, marketCap: 1502000, sector: 'IT' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1680.75, prevClose: 1672.4, volume: 12500000, marketCap: 1280000, sector: 'Banking' },
  { symbol: 'INFY', name: 'Infosys', price: 1845.6, prevClose: 1860.2, volume: 7800000, marketCap: 767000, sector: 'IT' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1248.9, prevClose: 1238.5, volume: 14200000, marketCap: 875000, sector: 'Banking' },
  { symbol: 'SBIN', name: 'State Bank of India', price: 842.3, prevClose: 835.6, volume: 18900000, marketCap: 749000, sector: 'Banking' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', price: 1612.45, prevClose: 1602.8, volume: 5600000, marketCap: 965000, sector: 'Telecom' },
  { symbol: 'ITC', name: 'ITC Limited', price: 478.6, prevClose: 482.3, volume: 22000000, marketCap: 598000, sector: 'FMCG' },
  { symbol: 'LT', name: 'Larsen & Toubro', price: 3625.8, prevClose: 3588.4, volume: 2800000, marketCap: 498000, sector: 'Construction' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', price: 12480.5, prevClose: 12390.2, volume: 1100000, marketCap: 392000, sector: 'Auto' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', price: 2465.75, prevClose: 2480.3, volume: 3400000, marketCap: 580000, sector: 'FMCG' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', price: 1798.4, prevClose: 1782.5, volume: 4200000, marketCap: 431000, sector: 'Pharma' },
  { symbol: 'WIPRO', name: 'Wipro Limited', price: 298.75, prevClose: 295.4, volume: 9500000, marketCap: 311000, sector: 'IT' },
  { symbol: 'AXISBANK', name: 'Axis Bank', price: 1148.2, prevClose: 1138.6, volume: 8800000, marketCap: 354000, sector: 'Banking' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', price: 985.4, prevClose: 970.8, volume: 21500000, marketCap: 363000, sector: 'Auto' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', price: 7320.5, prevClose: 7280.3, volume: 1500000, marketCap: 452000, sector: 'Finance' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', price: 2845.6, prevClose: 2810.2, volume: 6200000, marketCap: 327000, sector: 'Conglomerate' },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation', price: 325.8, prevClose: 322.4, volume: 8900000, marketCap: 302000, sector: 'Power' },
  { symbol: 'TATASTEEL', name: 'Tata Steel', price: 152.3, prevClose: 149.8, volume: 45000000, marketCap: 191000, sector: 'Metal' },
  { symbol: 'NTPC', name: 'NTPC Limited', price: 368.45, prevClose: 365.2, volume: 12300000, marketCap: 358000, sector: 'Power' },
];

export const SECTORS_SEED: SectorData[] = [
  { name: 'IT', changePercent: 1.84, topStock: 'TCS', volume: 185600000 },
  { name: 'Banking', changePercent: 0.96, topStock: 'HDFCBANK', volume: 324800000 },
  { name: 'Auto', changePercent: 0.68, topStock: 'MARUTI', volume: 162000000 },
  { name: 'Pharma', changePercent: 0.55, topStock: 'SUNPHARMA', volume: 134000000 },
  { name: 'FMCG', changePercent: -0.45, topStock: 'ITC', volume: 22000000 },
  { name: 'Energy', changePercent: 1.19, topStock: 'RELIANCE', volume: 8500000 },
  { name: 'Metal', changePercent: 1.67, topStock: 'TATASTEEL', volume: 45000000 },
  { name: 'Telecom', changePercent: 0.6, topStock: 'BHARTIARTL', volume: 5600000 },
  { name: 'Power', changePercent: 1.05, topStock: 'NTPC', volume: 12300000 },
  { name: 'Finance', changePercent: 0.55, topStock: 'BAJFINANCE', volume: 1500000 },
];

export function buildIndices(): IndexData[] {
  return INDICES_SEED.map((seed) => {
    const change = Number((seed.price - seed.prevClose).toFixed(2));
    const changePercent = Number(
      ((change / seed.prevClose) * 100).toFixed(2)
    );
    const trend = change >= 0 ? 0.02 : -0.02;
    const history = generateHistory(seed.price, 80, 1.2, trend);
    return { ...seed, change, changePercent, history };
  });
}

export function buildStocks(): StockData[] {
  return STOCKS_SEED.map((seed) => {
    const change = Number((seed.price - seed.prevClose).toFixed(2));
    const changePercent = Number(
      ((change / seed.prevClose) * 100).toFixed(2)
    );
    const sparkline = generateSparkline(seed.price, 30);
    return { ...seed, change, changePercent, sparkline };
  });
}

export function buildBreadth(): MarketBreadth {
  const advances = Math.floor(Math.random() * 600 + 900);
  const declines = Math.floor(Math.random() * 500 + 500);
  const unchanged = Math.floor(Math.random() * 80 + 40);
  return { advances, declines, unchanged, total: advances + declines + unchanged };
}

export function tickIndex(index: IndexData): IndexData {
  const volatility = index.price * 0.0006;
  const drift = (Math.random() - 0.5) * volatility * 2;
  const newPrice = Math.max(Number((index.price + drift).toFixed(2)), 0.01);
  const newHigh = Math.max(newPrice, index.dayHigh);
  const newLow = Math.min(newPrice, index.dayLow);
  const change = Number((newPrice - index.prevClose).toFixed(2));
  const changePercent = Number(
    ((change / index.prevClose) * 100).toFixed(2)
  );
  const now = new Date().toISOString();
  const history = [
    ...index.history.slice(-79),
    { time: now, price: newPrice, volume: Math.floor(Math.random() * 50000000 + 10000000) },
  ];
  return {
    ...index,
    price: newPrice,
    dayHigh: newHigh,
    dayLow: newLow,
    change,
    changePercent,
    history,
  };
}

export function tickStock(stock: StockData): StockData {
  const volatility = stock.price * 0.001;
  const drift = (Math.random() - 0.5) * volatility * 2;
  const newPrice = Math.max(Number((stock.price + drift).toFixed(2)), 0.01);
  const change = Number((newPrice - stock.prevClose).toFixed(2));
  const changePercent = Number(
    ((change / stock.prevClose) * 100).toFixed(2)
  );
  const sparkline = [...stock.sparkline.slice(-29), newPrice];
  return {
    ...stock,
    price: newPrice,
    change,
    changePercent,
    volume: stock.volume + Math.floor(Math.random() * 100000),
    sparkline,
  };
}
