const { Router } = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const supabase = require('../db/supabase');

const router = Router();

router.post('/register', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const { data, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (error) return res.status(400).json({ error: error.message });

  // Create user profile row
  await supabase.from('users').insert({ id: data.user.id, unit_system: 'metric' });

  res.status(201).json({ user_id: data.user.id });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { createClient } = require('@supabase/supabase-js');
  const anonClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { data, error } = await anonClient.auth.signInWithPassword({ email, password });

  if (error) return res.status(401).json({ error: 'Invalid credentials' });

  res.json({
    access_token:  data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at:    data.session.expires_at,
    user_id:       data.user.id,
  });
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;
  const { createClient } = require('@supabase/supabase-js');
  const anonClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { data, error } = await anonClient.auth.refreshSession({ refresh_token });
  if (error) return res.status(401).json({ error: error.message });
  res.json({ access_token: data.session.access_token, expires_at: data.session.expires_at });
}));

module.exports = router;
