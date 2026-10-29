/** App display symbols ↔ Yahoo Finance tickers (NSE / BSE). */

export interface SymbolMeta {
  yahoo: string;
  name: string;
  /** Sector for stocks; unused for indices */
  sector?: string;
  /** Seed market cap in ₹ Cr when Yahoo does not provide it */
  marketCapCr?: number;
}

export const INDEX_SYMBOLS: Record<string, SymbolMeta> = {
  'NIFTY 50': { yahoo: '^NSEI', name: 'Nifty 50' },
  'NIFTY BANK': { yahoo: '^NSEBANK', name: 'Nifty Bank' },
  'NIFTY IT': { yahoo: '^CNXIT', name: 'Nifty IT' },
  /** Gift Nifty is not on Yahoo; we mirror Nifty 50 live levels */
  'GIFT NIFTY': { yahoo: '^NSEI', name: 'Gift Nifty' },
  SENSEX: { yahoo: '^BSESN', name: 'Sensex' },
  'NIFTY MIDCAP': { yahoo: 'NIFTY_MIDCAP_100.NS', name: 'Nifty Midcap 100' },
  'NIFTY AUTO': { yahoo: '^CNXAUTO', name: 'Nifty Auto' },
  'NIFTY PHARMA': { yahoo: '^CNXPHARMA', name: 'Nifty Pharma' },
};

export const STOCK_SYMBOLS: Record<string, SymbolMeta> = {
  RELIANCE: { yahoo: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy', marketCapCr: 2018000 },
  TCS: { yahoo: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT', marketCapCr: 1502000 },
  HDFCBANK: { yahoo: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Banking', marketCapCr: 1280000 },
  INFY: { yahoo: 'INFY.NS', name: 'Infosys', sector: 'IT', marketCapCr: 767000 },
  ICICIBANK: { yahoo: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Banking', marketCapCr: 875000 },
  SBIN: { yahoo: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking', marketCapCr: 749000 },
  BHARTIARTL: { yahoo: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Telecom', marketCapCr: 965000 },
  ITC: { yahoo: 'ITC.NS', name: 'ITC Limited', sector: 'FMCG', marketCapCr: 598000 },
  LT: { yahoo: 'LT.NS', name: 'Larsen & Toubro', sector: 'Construction', marketCapCr: 498000 },
  MARUTI: { yahoo: 'MARUTI.NS', name: 'Maruti Suzuki', sector: 'Auto', marketCapCr: 392000 },
  HINDUNILVR: { yahoo: 'HINDUNILVR.NS', name: 'Hindustan Unilever', sector: 'FMCG', marketCapCr: 580000 },
  SUNPHARMA: { yahoo: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical', sector: 'Pharma', marketCapCr: 431000 },
  WIPRO: { yahoo: 'WIPRO.NS', name: 'Wipro Limited', sector: 'IT', marketCapCr: 311000 },
  AXISBANK: { yahoo: 'AXISBANK.NS', name: 'Axis Bank', sector: 'Banking', marketCapCr: 354000 },
  BAJFINANCE: { yahoo: 'BAJFINANCE.NS', name: 'Bajaj Finance', sector: 'Finance', marketCapCr: 452000 },
  ADANIENT: { yahoo: 'ADANIENT.NS', name: 'Adani Enterprises', sector: 'Conglomerate', marketCapCr: 327000 },
  POWERGRID: { yahoo: 'POWERGRID.NS', name: 'Power Grid Corporation', sector: 'Power', marketCapCr: 302000 },
  TATASTEEL: { yahoo: 'TATASTEEL.NS', name: 'Tata Steel', sector: 'Metal', marketCapCr: 191000 },
  NTPC: { yahoo: 'NTPC.NS', name: 'NTPC Limited', sector: 'Power', marketCapCr: 358000 },
};

/** Sector index Yahoo symbols used for the heatmap */
export const SECTOR_INDEX_SYMBOLS: Record<string, string> = {
  IT: '^CNXIT',
  Banking: '^NSEBANK',
  Auto: '^CNXAUTO',
  Pharma: '^CNXPHARMA',
  Energy: 'RELIANCE.NS',
  Metal: 'TATASTEEL.NS',
  Telecom: 'BHARTIARTL.NS',
  Power: 'NTPC.NS',
  Finance: 'BAJFINANCE.NS',
  FMCG: 'ITC.NS',
};

export type ChartRange =
  | '1d'
  | '5d'
  | '1mo'
  | '6mo'
  | '1y'
  | '5y';

export type ChartInterval =
  | '1m'
  | '5m'
  | '15m'
  | '30m'
  | '60m'
  | '1d'
  | '1wk';

export function timeframeToYahoo(timeframe: string): {
  range: ChartRange;
  interval: ChartInterval;
} {
  switch (timeframe) {
    case '1D':
      return { range: '1d', interval: '5m' };
    case '1W':
      return { range: '5d', interval: '15m' };
    case '1M':
      return { range: '1mo', interval: '1d' };
    case '6M':
      return { range: '6mo', interval: '1d' };
    case '1Y':
      return { range: '1y', interval: '1d' };
    case '5Y':
      return { range: '5y', interval: '1wk' };
    default:
      return { range: '1d', interval: '5m' };
  }
}
