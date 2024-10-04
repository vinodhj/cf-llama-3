import { handleKVConfig } from './helpers/handle-kv-config';
import { handleCFModels } from './helpers/handle-cf-models';
import { handleAIRequest } from './helpers/handle-ai-request';

export interface Env {
  // If you set another name in wrangler.toml as the value for 'binding',
  // replace "AI" with the variable name you defined.
  AI: Ai;
  SYNC_TOKEN: string;
  CF_MODELS: KVNamespace;
  TURNSTILE_DEV_SECRET_KEY: string;
  TURNSTILE_PROD_SECRET_KEY: string;
  IS_DEV: string;
}

export default {
  async fetch(request: Request, env: Env, ctx): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (url.pathname === '/kv-config' && request.method === 'POST') {
        return handleKVConfig(request, env);
      } else if (url.pathname === '/cf-models' && request.method === 'GET') {
        return handleCFModels(env);
      } else if (request.method === 'POST') {
        return handleAIRequest(request, env);
      }

      return new Response('Not found', { status: 404 });
    } catch (error) {
      return new Response(String(error), { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
