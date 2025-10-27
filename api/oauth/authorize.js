export default async function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const scope = 'repo,user';
  if (!clientId) return res.status(500).send('Missing GITHUB_CLIENT_ID');

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  const redirectUri = `${proto}://${host}/api/oauth/callback`;

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', scope);
  if (req.query.state) url.searchParams.set('state', String(req.query.state));

  res.redirect(url.toString());
}
