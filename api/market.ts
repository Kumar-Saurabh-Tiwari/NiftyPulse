import { handleMarketRequest } from '../server/market';

interface VercelRequest {
  method?: string;
  url?: string;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  setHeader(name: string, value: string): void;
  send(body: string): void;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
): Promise<void> {
  const url = new URL(request.url ?? '/', 'https://niftypulse.invalid');
  const result = await handleMarketRequest(url, request.method, {
    TWELVE_DATA_API_KEY: process.env.TWELVE_DATA_API_KEY,
    FINANCIAL_MODELING_PREP_API_KEY:
      process.env.FINANCIAL_MODELING_PREP_API_KEY,
  });
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', result.cacheControl);
  response.status(result.status).send(JSON.stringify(result.body));
}
