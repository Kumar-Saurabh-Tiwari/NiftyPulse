interface VercelRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  setHeader(name: string, value: string): void;
  send(body: string | Uint8Array): void;
}

const YAHOO_FINANCE_BASE = 'https://query1.finance.yahoo.com';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
): Promise<void> {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.status(405).send('Method not allowed');
    return;
  }

  const path = request.query.path;
  const pathSegments = Array.isArray(path) ? path : path?.split('/');
  if (
    !pathSegments ||
    pathSegments.length !== 4 ||
    pathSegments[0] !== 'v8' ||
    pathSegments[1] !== 'finance' ||
    pathSegments[2] !== 'chart'
  ) {
    response.status(404).send('Not found');
    return;
  }

  const ticker = pathSegments[3];
  if (!ticker) {
    response.status(400).send('A ticker is required');
    return;
  }

  const upstreamUrl = new URL(
    `/v8/finance/chart/${encodeURIComponent(ticker)}`,
    YAHOO_FINANCE_BASE
  );
  for (const [key, value] of Object.entries(request.query)) {
    if (key === 'path' || value == null) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      upstreamUrl.searchParams.append(key, item);
    }
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const body = new Uint8Array(await upstream.arrayBuffer());

    response.status(upstream.status);
    response.setHeader(
      'Content-Type',
      upstream.headers.get('content-type') ?? 'application/json'
    );
    response.setHeader('Cache-Control', 'no-store');
    response.send(body);
  } catch (error) {
    console.error('[yahoo proxy] Finance request failed', error);
    response.status(502).send('Yahoo Finance is temporarily unavailable');
  }
}
