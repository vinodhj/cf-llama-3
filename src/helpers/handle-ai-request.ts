import { addCORSHeaders } from './handle-cf-models';
import { turnstileCaptcha } from './turnstile-captcha';

export async function handleAIRequest(request: Request, env: Env): Promise<Response> {
  const body = await request.text();
  const json = JSON.parse(body);
  //console.log('json', json);
  if (!json) {
    return new Response('No prompt provided', { status: 400 });
  }

  if (!json.token) {
    return new Response('No token provided', { status: 400 });
  } else {
    //console.log("env.IS_DEV", env.IS_DEV);
    const validate_captcha = await turnstileCaptcha(json.token, env.IS_DEV === 'YES' ? env.TURNSTILE_DEV_SECRET_KEY : env.TURNSTILE_PROD_SECRET_KEY);
    if (!validate_captcha.status) {
      return new Response(`Captcha validation failed : ${validate_captcha.error}`, { status: 400 });
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

  return new Response(JSON.stringify(data[0].response), {
    headers: addCORSHeaders(),
  });
}
