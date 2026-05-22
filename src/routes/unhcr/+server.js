export async function GET({ url, fetch }) {
  const rawUrl = url.searchParams.get('url');

  if (!rawUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  let target;
  try {
    target = new URL(rawUrl);
  } catch (err) {
    return new Response('Invalid url parameter', { status: 400 });
  }

  // Sicherheitscheck: nur UNHCR erlauben
 if (target.hostname === 'data2.unhcr.org') {
    target.hostname = 'data.unhcr.org';
  }

  if (target.hostname !== 'data.unhcr.org') {
    return new Response('Host not allowed', { status: 403 });
  }

  try {
    const response = await fetch(target.toString(), {
      method: 'GET',
      headers: {
        accept: 'application/json'
      }
    });

    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
        'cache-control': 'public, max-age=300'
      }
    });
  } catch (err) {
    return new Response(`Proxy fetch failed: ${err.message}`, { status: 502 });
  }
}
