/** @type {import('./$types').RequestHandler} */
export async function GET({ url, fetch }) {
  const target = url.searchParams.get('url');

  if (!target) {
    return new Response(JSON.stringify({ error: 'Missing url param' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  // Allowlist (Sicherheit): nur UNHCR
  if (!target.startsWith('https://data2.unhcr.org/')) {
    return new Response(JSON.stringify({ error: 'Blocked host' }), {
      status: 403,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  let resp;
  try {
    resp = await fetch(target, {
      headers: { 'user-agent': 'sveltekit-vercel-proxy' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Upstream fetch failed' }), {
      status: 502,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  const body = await resp.text();

  return new Response(body, {
    status: resp.status,
    headers: {
      'content-type': resp.headers.get('content-type') ?? 'application/json; charset=utf-8',
      // Cache: Live genug, aber nicht dauernd UNHCR hammern
      'cache-control': 's-maxage=300, stale-while-revalidate=3600'
    }
  });
}
