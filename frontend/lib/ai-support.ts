import { NextResponse } from 'next/server';

/**
 * Structured AI-usage logging.
 *
 * This used to `appendFileSync` into `<cwd>/logs`. That works on a laptop and
 * silently writes nothing on Vercel, where the serverless filesystem is
 * read-only outside /tmp — every call threw into a swallowing catch. One JSON
 * line per event on stdout is picked up by every host's log drain, and is still
 * greppable locally (`npm run dev | grep ai-usage`).
 */
export function logAIUsage(event: string, data: Record<string, unknown>): void {
  console.log(JSON.stringify({ log: 'ai-usage', event, at: new Date().toISOString(), ...data }));
}

/**
 * Origins allowed to call the AI routes from a browser.
 *
 * `Access-Control-Allow-Origin: *` cannot be combined with
 * `Access-Control-Allow-Credentials: true` — browsers reject that pairing — so
 * we echo a specific allowed origin instead of using a wildcard.
 */
function allowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
}

export function corsHeaders(requestOrigin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-internal-key',
    Vary: 'Origin',
  };

  const allowed = allowedOrigins();
  if (requestOrigin && allowed.includes(requestOrigin)) {
    headers['Access-Control-Allow-Origin'] = requestOrigin;
  } else if (allowed.length === 0 && process.env.NODE_ENV !== 'production') {
    // Local development with nothing configured.
    headers['Access-Control-Allow-Origin'] = requestOrigin ?? '*';
  }

  return headers;
}

/**
 * These routes spend Groq tokens on every call, so they are not public.
 * Only the PartyKit server should reach them, and it presents a shared secret.
 *
 * Fails closed in production: with no `INTERNAL_API_SECRET` configured the
 * routes refuse to serve rather than sit open to the internet. In development an
 * unset secret is allowed so `npm run dev` works out of the box.
 */
export function checkInternalAuth(req: Request): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';
  const cors = corsHeaders(req.headers.get('origin'));

  if (!secret) {
    if (isProduction) {
      console.error('[AUTH] INTERNAL_API_SECRET is not set — refusing to serve the AI routes.');
      return NextResponse.json({ error: 'Service not configured' }, { status: 503, headers: cors });
    }
    return null; // dev convenience
  }

  if (req.headers.get('x-internal-key') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
  }

  return null;
}

/** Shared Groq call configuration. */
export const GROQ_MODEL = 'openai/gpt-oss-120b';
export const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
