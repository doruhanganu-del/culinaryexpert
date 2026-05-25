'use strict';

const supabase = require('../db/supabase');

async function pullChanges(req, res) {
  const { last_synced_at } = req.query;
  const since = last_synced_at ? new Date(last_synced_at) : new Date(0);

  const { data, error } = await supabase.rpc('pull_changes', {
    p_user_id:     req.userId,
    p_last_synced: since.toISOString(),
  });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function pushChanges(req, res) {
  const changes = req.body;

  const { data, error } = await supabase.rpc('push_changes', {
    p_user_id: req.userId,
    p_changes: changes,
  });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, result: data });
}

module.exports = { pullChanges, pushChanges };
