function envStatus(req, res) {
  const keys = [
    'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_API_KEY',
    'JUDGE0_URL', 'JUDGE0_KEY', 'SUPABASE_URL', 'SUPABASE_KEY'
  ];
  const status = {};
  keys.forEach(k => status[k] = !!process.env[k]);
  return res.json({ ok: true, status });
}

module.exports = { envStatus };