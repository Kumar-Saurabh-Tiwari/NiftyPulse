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
let schemeCatalog: Array<{ schemeCode: number; schemeName: string }> | null = null;

async function getSchemeCatalog(): Promise<Array<{ schemeCode: number; schemeName: string }>> {
  if (schemeCatalog) return schemeCatalog;
  const upstream = await fetch(MFAPI_BASE);
  if (!upstream.ok) throw new Error(`MFAPI catalog returned ${upstream.status}`);
  const body: unknown = await upstream.json();
  if (!Array.isArray(body)) throw new Error('MFAPI catalog response was invalid');
  schemeCatalog = body.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const record = item as Record<string, unknown>;
    const code = Number(record.schemeCode);
    const name = typeof record.schemeName === 'string' ? record.schemeName.trim() : '';
    return Number.isInteger(code) && name ? [{ schemeCode: code, schemeName: name }] : [];
  });
  return schemeCatalog;
}

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
  const rawSearch = request.query.search;
  const search = (Array.isArray(rawSearch) ? rawSearch[0] : rawSearch)?.trim() ?? '';
  if (search) {
    if (search.length < 2 || search.length > 80) {
      response.status(400).send('Search must be between 2 and 80 characters');
      return;
    }
    try {
      const results = (await getSchemeCatalog())
        .filter((scheme) => scheme.schemeName.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 30);
      response.status(200);
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.setHeader('Cache-Control', 'public, max-age=900');
      response.send(JSON.stringify(results));
    } catch (error) {
      console.error('[mutual fund proxy] catalog request failed', error);
      response.status(502).send('Mutual fund search is temporarily unavailable');
    }
    return;
  }
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
