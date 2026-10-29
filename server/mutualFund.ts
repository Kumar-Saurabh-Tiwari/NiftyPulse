const MFAPI_BASE = 'https://api.mfapi.in/mf';

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
