import { botSupabase } from './supabase-bot-client';

type BotEventType = 'search' | 'faal';

/**
 * Fire-and-forget analytics event recorder.
 *
 * We intentionally do NOT await the Supabase insert so analytics never
 * delays a user reply. On Vercel serverless, in-flight promises may be
 * frozen/lost when the function returns — that is expected and accepted.
 * We prefer "fast and slightly lossy" over "complete but slower".
 *
 * Callers should invoke with `void` and no await:
 *   void recordEvent('search', query, poems.length);
 */
export async function recordEvent(
  eventType: BotEventType,
  query?: string,
  resultCount?: number
): Promise<void> {
  try {
    const payload: {
      event_type: string;
      query?: string;
      result_count?: number;
    } = { event_type: eventType };

    if (eventType === 'search') {
      payload.query = query;
      payload.result_count = resultCount;
    }

    await botSupabase.from('bot_analytics').insert(payload);
  } catch (err) {
    // Swallow all analytics errors so they can never affect a user reply.
    console.error('Analytics insert error:', err);
  }
}
