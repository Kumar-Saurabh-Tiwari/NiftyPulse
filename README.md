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
and provides a local server-side handler for `/api/news`. Copy `.env.example`
to `.env` and fill in the GNews key if headlines are enabled.
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

- `GNEWS_API_KEY`

Do not add a `VITE_` prefix to these credentials.

Check the deployed API directly:

```text
https://nifty-pulse-seven.vercel.app/api/yahoo?symbol=%5ENSEI&range=1d&interval=5m
```

A successful response contains Yahoo Finance chart JSON with a top-level
`chart.result` property. A 400 response means the query is invalid; a 502 means
the upstream finance service could not be reached.

## Market data provider

- Yahoo Finance is the single provider for all index and stock quotes and chart
  history. It is accessed through the server-side `/api/yahoo` proxy, so the
  dashboard does not require paid market-data API keys or provider switching.
- GNews supplies the separate India-market headlines panel. The free plan is
  documented as 100 requests/day, up to 10 articles/request, and a 12-hour
  delay; availability and freshness vary by plan. Headlines are cached briefly
  server-side to avoid repeated requests. If GNews is temporarily unreachable,
  the server uses an India-focused Google News RSS feed as a read-only fallback.

The app returns normalized Yahoo Finance chart data. If Yahoo is unavailable,
the dashboard keeps its retryable unavailable state instead of showing invented
market values.

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