export interface IndexData {
  symbol: string;
  name: string;
  price: number;
  prevClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  yearHigh: number;
  yearLow: number;
  change: number;
  changePercent: number;
  volume: number;
  history: PricePoint[];
  pinned?: boolean;
}

export interface PricePoint {
  time: string;
  price: number;
  volume: number;
}

export type MarketProvider = 'yahoo' | 'twelvedata' | 'fmp';

export interface CompanyProfile {
  symbol?: string;
  name?: string;
  exchange?: string;
  currency?: string;
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  marketCap?: number;
  beta?: number;
}

export interface MarketNewsArticle {
  title: string;
  description?: string;
  url: string;
  image?: string;
  publishedAt: string;
  source: string;
}

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
  sparkline: number[];
  history?: PricePoint[];
}

export interface SectorData {
  name: string;
  changePercent: number;
  topStock: string;
  volume: number;
}

export interface MarketBreadth {
  advances: number;
  declines: number;
  unchanged: number;
  total: number;
}

export type Timeframe = '1D' | '1W' | '1M' | '6M' | '1Y' | '5Y';
export type ChartView = 'area' | 'line' | 'candle';
export type Theme = 'dark' | 'light';
