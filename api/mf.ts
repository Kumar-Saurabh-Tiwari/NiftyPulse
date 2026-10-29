interface VercelRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  setHeader(name: string, value: string): void;
  send(body: string): void;
}

const MFAPI_BASE = 'https://api.mfapi.in/mf';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
): Promise<void> {
  if (request.method !== 'GET') {
    response.status(405).send('Method not allowed');
    return;
  }
  const rawCode = request.query.schemeCode;
  const schemeCode = Array.isArray(rawCode) ? rawCode[0] : rawCode;
  if (!schemeCode || !/^\d{1,8}$/.test(schemeCode)) {
    response.status(400).send('A valid scheme code is required');
    return;
  }
  try {
    const upstream = await fetch(`${MFAPI_BASE}/${schemeCode}`);
    const body = await upstream.text();
    response.status(upstream.status);
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'public, max-age=900');
    response.send(body);
  } catch (error) {
    console.error('[mutual fund proxy] request failed', error);
    response.status(502).send('Mutual fund data is temporarily unavailable');
  }
}
