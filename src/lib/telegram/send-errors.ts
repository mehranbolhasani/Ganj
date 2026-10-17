import { GrammyError } from 'grammy';
import { createHash } from 'node:crypto';

/**
 * Permanent Telegram delivery errors.
 *
 * When Telegram rejects a message with one of these errors, retrying the same
 * update can never succeed: the bot is blocked by the user, the user account
 * is deactivated, or the chat no longer exists. In that case the webhook must
 * answer 200 so Telegram drops the update instead of retrying it all day.
 *
 * Every other failure (429 rate limit, 5xx, network errors, unexpected 400s)
 * stays fatal so Telegram can retry it.
 */

type PermanentReason = 'bot_blocked' | 'user_deactivated' | 'chat_not_found';

const PERMANENT_ERRORS: Array<{ code: number; match: string; reason: PermanentReason }> = [
  { code: 403, match: 'bot was blocked by the user', reason: 'bot_blocked' },
  { code: 403, match: 'user is deactivated', reason: 'user_deactivated' },
  { code: 400, match: 'chat not found', reason: 'chat_not_found' },
];

export function isPermanentSendError(err: unknown): err is GrammyError {
  return classifyPermanentSendError(err) !== null;
}

function classifyPermanentSendError(err: unknown): PermanentReason | null {
  if (!(err instanceof GrammyError)) return null;

  const description = err.description.toLowerCase();
  for (const rule of PERMANENT_ERRORS) {
    if (err.error_code === rule.code && description.includes(rule.match)) {
      return rule.reason;
    }
  }
  return null;
}

/**
 * Hash a chat id so logs stay useful for counting incidents without storing
 * personal data. The codebase never logged raw chat ids before, so we log a
 * short hash only.
 */
function shortChatHash(chatId: string): string {
  return createHash('sha256').update(chatId).digest('hex').slice(0, 8);
}

/**
 * One concise line per permanent send failure. Error code and method name
 * only; never the message text, user names, or a raw chat id.
 */
export function logPermanentSendError(err: GrammyError): void {
  const reason = classifyPermanentSendError(err);
  const chatId = (err.payload as { chat_id?: unknown } | undefined)?.chat_id;
  const chat =
    typeof chatId === 'number' || typeof chatId === 'string'
      ? ` chat=${shortChatHash(String(chatId))}`
      : '';
  console.error(
    `telegram permanent send failure: code=${err.error_code} method=${err.method} reason=${reason}${chat}`
  );
}
