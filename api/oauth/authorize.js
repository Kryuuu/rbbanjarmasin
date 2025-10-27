const FALLBACK_CLIENT_ID = 'Ov23liS8nyAOfYlEuFnZ';

function detectProtocol(req) {
  if (req.headers['x-forwarded-proto']) {
    return String(req.headers['x-forwarded-proto']).split(',')[0];
  }
  return req.connection && req.connection.encrypted ? 'https' : 'http';
}

export default async function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID || FALLBACK_CLIENT_ID;
  const scope = process.env.GITHUB_OAUTH_SCOPE || 'repo,user';
  if (!clientId) {
    return res.status(500).send('Missing GitHub OAuth client id');
  }

  const proto = detectProtocol(req);
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const redirectUri = `${proto}://${host}/api/oauth/callback`;

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', scope);
  if (req.query.state) url.searchParams.set('state', String(req.query.state));

  res.redirect(url.toString());
}
