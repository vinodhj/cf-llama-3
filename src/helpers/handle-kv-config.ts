export async function handleKVConfig(request: Request, env: Env): Promise<Response> {
  const token = request.headers.get('Authorization');
  if (!token || token !== env.SYNC_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const data = (await request.json()) as { models: any[] };
    if (!data) {
      return new Response('Missing data', { status: 400 });
    }
    const cf_models = JSON.stringify(data.models);
    await env.CF_MODELS.put('CF_MODELS', cf_models);
    const value = await env.CF_MODELS.get('CF_MODELS');
    if (value === null) {
      return new Response('Value not found', { status: 404 });
    }
    return new Response('KV config updated', { status: 200 });
  } catch (error) {
    return new Response(`Failed to sync : ${error}`, { status: 500 });
  }
}
