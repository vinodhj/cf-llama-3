import { addCORSHeaders } from './handle-cf-models';
import { nanoid } from 'nanoid/non-secure';

export async function handleContact(request: Request, env: Env): Promise<Response> {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  const body = (await request.json()) as { email: string; message: string; name: string };

  if (!body.email || !body.message || !body.name) {
    return new Response('Missing data', { status: 400 });
  }

  const data = {
    email: body.email,
    message: body.message,
    name: body.name,
    timestamp: new Date().toISOString(),
  };

  const id = nanoid();
  await env.ENQUIRY_JEEVA_RUBBER.put(id, JSON.stringify(data));
  const value = await env.ENQUIRY_JEEVA_RUBBER.get(id);

  if (value === null) {
    return new Response('Value not found', { status: 404 });
  }
  const res = JSON.parse(value);
  return new Response(JSON.stringify(res), {
    headers: addCORSHeaders(),
  });
}
