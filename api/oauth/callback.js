function detectProtocol(req) {
  if (req.headers['x-forwarded-proto']) {
    return String(req.headers['x-forwarded-proto']).split(',')[0];
  }
  return req.connection && req.connection.encrypted ? 'https' : 'http';
}

export default async function handler(req, res) {
  const code = req.query.code;
  const state = req.query.state || '';
  if (!code) return res.status(400).send('Missing code');

  const proto = detectProtocol(req);
  const host = req.headers['x-forwarded-host'] || req.headers.host;

  const tokenRes = await fetch(`${proto}://${host}/api/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code })
  });

  const data = await tokenRes.json();
  if (!tokenRes.ok) return res.status(400).json(data);

  const adminUrl = new URL(`${proto}://${host}/admin/`);
  adminUrl.hash = `#access_token=${data.access_token}&token_type=${data.token_type || 'bearer'}&state=${encodeURIComponent(state)}`;
  res.redirect(adminUrl.toString());
}
