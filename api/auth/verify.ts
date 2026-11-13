import { verifyPasswordServer } from '../../server/handlers';

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
  const { password, passwordHash } = body;
  return res.status(200).json({ valid: verifyPasswordServer(password, passwordHash) });
}
