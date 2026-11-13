import { getWeatherResponse } from '../server/handlers';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const simulateFailure = req.query?.simulateFailure === 'true';
  const forceRefresh = req.query?.refresh === 'true';
  const result = await getWeatherResponse(simulateFailure, forceRefresh);
  return res.status(200).json(result);
}
