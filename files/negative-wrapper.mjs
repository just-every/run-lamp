const sizeNegativeControl = { ...worker_entry_default, async fetch(request, env, ctx) {
  if (new URL(request.url).pathname === '/api/app/size-negative-control') {
    const rows = await env.DB.prepare('SELECT id FROM subscribers').all();
    return Response.json({ count: rows.results.length });
  }
  return worker_entry_default.fetch(request, env, ctx);
} };
