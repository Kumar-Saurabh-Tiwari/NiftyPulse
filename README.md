# NiftyPulse

NiftyPulse is a responsive dashboard for following Indian market indices and
stocks. It provides live Yahoo Finance quotes, interactive price charts, market
breadth, sector performance, top movers, search, and a locally saved watchlist.

## Features

- Live NSE/BSE index and stock quotes, refreshed every 30 seconds
- Interactive charts with multiple timeframes and chart styles
- Market breadth, sector heatmap, and top gainers/losers
- Search for indices and stocks, and pin/reorder watchlist items
- Light and dark themes
- Responsive desktop and mobile layouts
- Animated loading placeholders when live quotes are unavailable; sample prices
  are not presented as live data

## Requirements

- Node.js 18 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

The Vite development server routes Yahoo Finance requests through `/api/yahoo`
and provides local server-side handlers for `/api/market` and `/api/news`.
Provider API keys are read server-side from `.env`; they are not exposed to the
browser. Copy `.env.example` to `.env` and fill in the provider keys you use.
Open the URL printed by Vite (usually `http://localhost:5173`).

Run the provider normalization/policy tests with `npm test`.

## Production build

```bash
npm run build
npm run preview
```

`npm run build` runs the TypeScript project build and creates the production
assets in `dist/`.

## Deployment

The included `api/yahoo.ts` is a Vercel serverless function that forwards
validated quote requests to Yahoo Finance. Deploy the repository root as a
Vercel project so Vercel discovers the `api/` functions alongside the Vite
application. Add the following variables in the Vercel project's Environment
Variables settings (Preview and Production as needed):

- `TWELVE_DATA_API_KEY`
- `FINANCIAL_MODELING_PREP_API_KEY`
- `GNEWS_API_KEY`

Do not add a `VITE_` prefix to these credentials.

Check the deployed API directly:

```text
https://nifty-pulse-seven.vercel.app/api/yahoo?symbol=%5ENSEI&range=1d&interval=5m
```

A successful response contains Yahoo Finance chart JSON with a top-level
`chart.result` property. A 400 response means the query is invalid; a 502 means
the upstream finance service could not be reached.

## Additional data providers

- Yahoo Finance remains the default for all index/stock quotes and chart
  history. The provider control changes **historical chart data only**; quote
  cards, breadth, movers, and ticker values continue to use Yahoo, avoiding
  mixed-provider price calculations.
- Twelve Data and Financial Modeling Prep are offered for listed stock charts
  on daily timeframes (1M and longer). NIFTY/index symbols and intraday
  timeframes remain on Yahoo. The Twelve Data mapping uses NSE symbols and the
  provider's `NSE` exchange code (`XNSE` MIC).
  Twelve Data currently lists XNSE and XBOM as end-of-day exchanges with
  Grow/Venture as the minimum individual plans; actual access depends on the
  account's subscription. No automatic provider fallback is performed.
- Financial Modeling Prep supplies the optional stock company-profile card and
  daily historical series. Symbol coverage and endpoint access depend on the
  FMP subscription; unsupported symbols and denied access are shown in the UI.
- GNews supplies the separate India-market headlines panel. The free plan is
  documented as 100 requests/day, up to 10 articles/request, and a 12-hour
  delay; availability and freshness vary by plan. Headlines are cached briefly
  server-side to avoid repeated requests.

The app uses the provider's documented endpoints and returns normalized
historical points/profile fields. A successful deployment does not by itself
verify a provider account's subscription or symbol entitlements. If access is
missing, the relevant chart or card reports that error while Yahoo-powered
market data continues to work.

## Data and privacy

Market quotes are requested from Yahoo Finance by the serverless function.
Pinned feeds, watchlist items, theme, and preferences are stored in the
browser's local storage; this app does not require a database or user account.
Never put private API keys or server credentials in frontend environment
variables.

If live quotes cannot be loaded, the dashboard shows a retryable placeholder
instead of generated sample prices.

## Link preview

The application includes NiftyPulse Open Graph and Twitter metadata and a
branded preview image at `/niftypulse-preview.png`. Link-preview services may
cache older preview cards; after deploying, use the relevant platform's link
debugger or cache refresh to request the updated image.

## Coming Soon

Parag Parikh Flexi Cap Fund Direct Growth

UTI Nifty 50 Index Fund Direct Growth

Kotak Mid Cap Fund Direct Growth

ICICI Prudential Multi Asset Allocation Fund Direct Growth

Invesco India Mid Cap Fund Direct Growth

HDFC Small Cap Fund Direct Growth

Bandhan Small Cap Fund Direct Growth

Nippon India Large Cap Fund Direct Growth