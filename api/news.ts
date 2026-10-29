import { handleNewsRequest } from '../server/news.js';

interface VercelRequest {
  method?: string;
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
  const result = await handleNewsRequest(request.method, {
    GNEWS_API_KEY: process.env.GNEWS_API_KEY,
  });
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', result.cacheControl);
  response.status(result.status).send(JSON.stringify(result.body));
}
