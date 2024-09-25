export async function handleCFModels(env: Env): Promise<Response> {
  try {
    const cf_models = await env.CF_MODELS.get('CF_MODELS');
    const res = cf_models ? JSON.parse(cf_models) : null;
    const response = res.map((model: any) => {
      return {
        id: model.id,
        name: model.name,
        description: model.description,
      };
    });
    return new Response(JSON.stringify({ models: response }), {
      headers: addCORSHeaders(),
    });
  } catch (error) {
    console.error(error);
    return new Response(String(error), { status: 500 });
  }
}

export function addCORSHeaders(): { [key: string]: string } {
  return {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };
}
