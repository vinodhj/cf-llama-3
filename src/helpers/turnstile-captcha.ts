/* eslint-disable @typescript-eslint/naming-convention */

export async function turnstileCaptcha(token: string, TURNSTILE_SECRET_KEY: string): Promise<{ status: boolean; error?: string }> {
  try {
    // console.log("TURNSTILE_SECRET_KEY", TURNSTILE_SECRET_KEY);
    // Validate the token by calling the "/siteverify" API.
    const formData = new FormData();
    formData.append('secret', TURNSTILE_SECRET_KEY);
    formData.append('response', token);

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: formData,
      method: 'POST',
    });

    if (!result.ok) {
      return { status: false, error: 'Failed to reach Turnstile verification API' };
    }
    const turnstile_response: { success: boolean } = await result.json();
    if (!turnstile_response.success) {
      console.log('The provided Turnstile token was not valid', JSON.stringify(turnstile_response));
      return { status: false, error: `The provided Turnstile token was not valid : ${JSON.stringify(turnstile_response)}` };
    }
    return { status: true };
  } catch (error) {
    console.log(error);
    return { status: false, error: `'Failed to reach Turnstile verification API' : ${error}` };
  }
}
