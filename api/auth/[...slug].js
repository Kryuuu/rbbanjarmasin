const crypto = require('node:crypto');

const STATE_COOKIE = 'decap_oauth_state';
const COOKIE_MAX_AGE = 10 * 60; // 10 minutes

function getCookieValue(header, name) {
    if (!header) return undefined;
    const cookies = header.split(';').map((part) => part.trim());
    for (const cookie of cookies) {
        const [key, ...rest] = cookie.split('=');
        if (key === name) {
            return rest.join('=');
        }
    }
    return undefined;
}

function setStateCookie(res, value, options) {
    const attrs = [
        `${STATE_COOKIE}=${value}`,
        'Path=/',
        `Max-Age=${options.maxAge ?? COOKIE_MAX_AGE}`,
        'HttpOnly',
        options.sameSite ?? 'SameSite=Lax'
    ];

    if (options.secure) {
        attrs.push('Secure');
    }

    res.setHeader('Set-Cookie', attrs.join('; '));
}

function clearStateCookie(res) {
    res.setHeader('Set-Cookie', `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
}

function getProtocol(req) {
    const proto = req.headers['x-forwarded-proto'] || '';
    if (proto) {
        return proto.split(',')[0];
    }
    return req.connection && req.connection.encrypted ? 'https' : 'http';
}

function getHost(req) {
    return req.headers['x-forwarded-host'] || req.headers.host;
}

function buildRedirectUri(req) {
    const protocol = getProtocol(req);
    const host = getHost(req);
    return `${protocol}://${host}/api/auth/oauth/callback`;
}

function htmlResponse(body) {
    return `<!DOCTYPE html><html><body><script>${body}</script></body></html>`;
}

function sendOAuthResult(res, status, payload) {
    const safePayload = JSON.stringify(payload).replace(/</g, '\\u003c');
    const script = `
        (function() {
            function sendMessage(message) {
                if (window.opener) {
                    window.opener.postMessage(message, '*');
                }
                window.close();
            }
            sendMessage('authorization:github:${status}:${safePayload}');
        })();
    `;
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(htmlResponse(script));
}

function handleOptions(req, res) {
    res.statusCode = 204;
    res.setHeader('Allow', 'GET,POST,OPTIONS');
    res.end();
}

async function handleAuthorize(req, res) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
        res.statusCode = 500;
        res.end('GITHUB_CLIENT_ID is not configured');
        return;
    }

    const state = crypto.randomBytes(24).toString('hex');
    const redirectUri = buildRedirectUri(req);
    const authUrl = new URL('https://github.com/login/oauth/authorize');

    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', process.env.GITHUB_OAUTH_SCOPE || 'repo');
    authUrl.searchParams.set('allow_signup', 'true');

    setStateCookie(res, state, {
        secure: getProtocol(req) === 'https'
    });

    res.statusCode = 302;
    res.setHeader('Location', authUrl.toString());
    res.end();
}

async function handleCallback(req, res, url) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        res.statusCode = 500;
        res.end('GITHUB OAuth environment variables are not configured');
        return;
    }

    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const savedState = getCookieValue(req.headers.cookie, STATE_COOKIE);

    if (!code || !state || !savedState || savedState !== state) {
        clearStateCookie(res);
        sendOAuthResult(res, 'error', { error: 'invalid_state' });
        return;
    }

    try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: buildRedirectUri(req),
                state
            })
        });

        const json = await tokenResponse.json();
        clearStateCookie(res);

        if (!tokenResponse.ok || json.error || !json.access_token) {
            sendOAuthResult(res, 'error', {
                error: json.error || 'token_exchange_failed',
                description: json.error_description || 'Unable to exchange token with GitHub'
            });
            return;
        }

        sendOAuthResult(res, 'success', { token: json.access_token, provider: 'github' });
    } catch (error) {
        clearStateCookie(res);
        sendOAuthResult(res, 'error', {
            error: 'exception',
            description: error.message || 'Unexpected error'
        });
    }
}

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
        handleOptions(req, res);
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const segments = url.pathname.split('/').filter(Boolean);
    const slug = segments.slice(2); // remove ['api', 'auth']
    const action = slug.join('/');

    if (req.method === 'GET' && (action === '' || action === '')) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    if (req.method === 'GET' && action === 'oauth/authorize') {
        await handleAuthorize(req, res);
        return;
    }

    if (req.method === 'GET' && action === 'oauth/callback') {
        await handleCallback(req, res, url);
        return;
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'not_found' }));
};
