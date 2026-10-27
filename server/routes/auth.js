import express from 'express';
import { generateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import config from '../config.js';

const router = express.Router();

router.post('/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'Username and password required' });
  }
  if (username === config.adminUsername && password === config.adminPassword) {
    const token = generateToken({ id: 1, username: 'admin', role: 'admin' });
    return res.json({ ok: true, token, user: { username: 'admin', role: 'admin' } });
  }
  if (username === 'operator' && password === 'operator') {
    const token = generateToken({ id: 2, username: 'operator', role: 'operator' });
    return res.json({ ok: true, token, user: { username: 'operator', role: 'operator' } });
  }
  return res.status(401).json({ ok: false, error: 'Invalid credentials' });
});

router.get('/me', (req, res) => {
  res.json({ ok: true, user: req.user || null });
});

export default router;

