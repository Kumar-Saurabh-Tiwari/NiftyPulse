const MFAPI_BASE = 'https://api.mfapi.in/mf';
let schemeCatalog: Array<{ schemeCode: number; schemeName: string }> | null = null;
let schemeCatalogPromise: Promise<Array<{ schemeCode: number; schemeName: string }>> | null = null;

async function getSchemeCatalog(): Promise<Array<{ schemeCode: number; schemeName: string }>> {
  if (schemeCatalog) return schemeCatalog;
  if (!schemeCatalogPromise) {
    schemeCatalogPromise = fetch(MFAPI_BASE)
      .then(async (response) => {
        if (!response.ok) throw new Error(`MFAPI catalog returned ${response.status}`);
        const body: unknown = await response.json();
        if (!Array.isArray(body)) throw new Error('MFAPI catalog response was invalid');
        return body.flatMap((item) => {
          if (!isRecord(item)) return [];
          const code = Number(item.schemeCode);
          const name = typeof item.schemeName === 'string' ? item.schemeName.trim() : '';
          return Number.isInteger(code) && name ? [{ schemeCode: code, schemeName: name }] : [];
        });
      })
      .then((catalog) => {
        schemeCatalog = catalog;
        return catalog;
      })
      .finally(() => {
        schemeCatalogPromise = null;
      });
  }
  return schemeCatalogPromise;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function handleMutualFundRequest(
  method: string | undefined,
  params: URLSearchParams
): Promise<{
  status: number;
  cacheControl: string;
  body: unknown;
}> {
  if (method !== 'GET') {
    return { status: 405, cacheControl: 'no-store', body: 'Method not allowed' };
  }
  const schemeCode = params.get('schemeCode');
  const search = params.get('search')?.trim() ?? '';
  if (search) {
    if (search.length < 2 || search.length > 80) {
      return { status: 400, cacheControl: 'no-store', body: 'Search must be between 2 and 80 characters' };
    }
    try {
      const normalized = search.toLowerCase();
      const catalog = await getSchemeCatalog();
      const results = catalog
        .filter((scheme) => scheme.schemeName.toLowerCase().includes(normalized))
        .slice(0, 30);
      return { status: 200, cacheControl: 'public, max-age=900', body: results };
    } catch (error) {
      console.error('[mutual fund proxy] catalog request failed', error);
      return { status: 502, cacheControl: 'no-store', body: 'Mutual fund search is temporarily unavailable' };
    }
  }
  if (!schemeCode || !/^\d{1,8}$/.test(schemeCode)) {
    return { status: 400, cacheControl: 'no-store', body: 'A valid scheme code is required' };
  }
  try {
    const upstream = await fetch(`${MFAPI_BASE}/${schemeCode}`);
    const body = await upstream.json();
    return {
      status: upstream.status,
      cacheControl: 'public, max-age=900',
      body,
    };
  } catch (error) {
    console.error('[mutual fund proxy] request failed', error);
    return {
      status: 502,
      cacheControl: 'no-store',
      body: 'Mutual fund data is temporarily unavailable',
    };
  }
}
