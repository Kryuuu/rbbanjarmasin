// /api/oauth/callback.js
export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;

  // Tukar code -> access_token via function internal kita
  const tokenRes = await fetch(`${proto}://${host}/api/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const data = await tokenRes.json();

  // Helper untuk merender HTML yang mengirim postMessage ke window opener
  const render = (status, content) => `<!doctype html>
<html><body><script>
(function() {
  function receiveMessage(event) {
    try {
      // Kirim ke origin yang sama dengan pengirim untuk keamanan
      window.opener.postMessage(
        'authorization:github:${status}:' + JSON.stringify(${JSON.stringify(content)}),
        event.origin
      );
      window.removeEventListener('message', receiveMessage, false);
      window.close();
    } catch (e) {
      document.body.innerText = 'Auth messaging failed';
    }
  }
  window.addEventListener('message', receiveMessage, false);
  // Trigger handshake agar CMS mengirim balik origin-nya
  window.opener.postMessage('authorizing:github', '*');
})();
</script></body></html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!tokenRes.ok || !data.access_token) {
    // Kirim pesan gagal ke CMS (akan menampilkan error di UI)
    return res.status(200).send(render('error', data));
  }

  // Sukses: kirim token ke CMS
  const payload = { token: data.access_token, provider: 'github' };
  return res.status(200).send(render('success', payload));
}
