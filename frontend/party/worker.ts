import { routePartykitRequest } from 'partyserver';
import { CategoryCrashRoom, type Env } from './index';

// Durable Object classes must be exported from the Worker entry point.
export { CategoryCrashRoom };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handles WebSocket upgrades at /parties/category-crash-room/:roomId and
    // answers CORS preflights.
    return (
      (await routePartykitRequest(request, env as unknown as Record<string, unknown>, {
        cors: true,
      })) ?? new Response('Not found', { status: 404 })
    );
  },
};
