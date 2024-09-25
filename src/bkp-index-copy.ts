import { turnstileCaptcha } from './helpers/turnstile-captcha';

export interface Env {
  // If you set another name in wrangler.toml as the value for 'binding',
  // replace "AI" with the variable name you defined.
  AI: Ai;
  SYNC_TOKEN: string;
  CF_MODELS: KVNamespace;
  TURNSTILE_DEV_SECRET_KEY: string;
  TURNSTILE_PROD_SECRET_KEY: string;
  IS_DEV: boolean;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (url.pathname === '/kv-config' && request.method === 'POST') {
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

      if (url.pathname === '/cf-models' && request.method === 'GET') {
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
            headers: {
              'Access-Control-Allow-Origin': '*', // Allow all origins
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error(error);
          return new Response(String(error), { status: 500 });
        }
      }
      if (request.method !== 'POST') {
        return new Response('Only POST requests are supported', { status: 405 });
      }

      const body = await request.text();
      const json = JSON.parse(body);
      console.log('json', json);
      if (!json) {
        return new Response('No prompt provided', { status: 400 });
      }

      if (!json.token) {
        return new Response('No token provided', { status: 400 });
      } else {
        const validate_captcha = await turnstileCaptcha(
          json.token,
          env.IS_DEV ? env.TURNSTILE_DEV_SECRET_KEY : env.TURNSTILE_PROD_SECRET_KEY,
        );
        if (!validate_captcha) {
          return new Response('Captcha validation failed', { status: 400 });
        }
      }

      const tasks = [
        {
          inputs: { prompt: json.prompt },
          response: await env.AI.run(json.model ? json.model : '@cf/meta/llama-3-8b-instruct', { prompt: json.prompt }),
        },
      ];

      const data: {
        inputs: {
          prompt: string;
        };
        response: any;
      }[] = tasks.map((task) => {
        return {
          ...task,
        };
      });

      // Add CORS headers to the response
      return new Response(JSON.stringify(data[0].response), {
        headers: {
          'Access-Control-Allow-Origin': '*', // Allow all origins
          'Content-Type': 'application/json',
        },
      });

      //return tasks;
    } catch (error) {
      return new Response(String(error), { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
