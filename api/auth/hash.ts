import { hashPasswordServer } from '../../server/handlers';

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
  const { password } = body;
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Invalid password' });
  }
  return res.status(200).json({ passwordHash: hashPasswordServer(password) });
}
