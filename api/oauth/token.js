export default async function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Missing GitHub OAuth env vars' });
  }

  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: 'Missing code' });

    const gh = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
    });

    const data = await gh.json();
    if (data.error) return res.status(400).json(data);

    res.json({ access_token: data.access_token, token_type: data.token_type || 'bearer' });
  } catch (e) {
    res.status(500).json({ error: 'token_exchange_failed', detail: String(e) });
  }
}
