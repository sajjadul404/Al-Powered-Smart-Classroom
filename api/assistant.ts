import { askAssistantServer } from '../server/handlers';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
  const { question, databaseSnapshot } = body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ answer: 'No data' });
  }
  const result = await askAssistantServer(question, databaseSnapshot);
  return res.status(200).json(result);
}
