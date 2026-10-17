import { describe, it, before, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { GrammyError, HttpError } from 'grammy';
import type { RawApi, Transformer, Bot as BotType } from 'grammy';
import { WELCOME } from '@/lib/telegram/messages';

// Environment must be set before the route module is imported, because
// src/lib/telegram/bot.ts validates env vars at load time. The Upstash vars
// stay unset on purpose so the rate limiter is disabled in tests.
process.env.TELEGRAM_BOT_TOKEN = '123456:test-token';
process.env.TELEGRAM_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

type ApiCall = { method: string; payload: Record<string, unknown> };

const calls: ApiCall[] = [];
let sendBehavior: ((method: string, payload: Record<string, unknown>) => unknown) | null = null;
// Assigned in before(): the modules read env vars at import time
let POST: (request: Request) => Promise<Response>;
let bot: BotType;

// Intercept all Bot API calls so no network happens. getMe fakes a bot info;
// every other call is routed to the per-test behavior. The transformer casts
// away the precise per-method result type, which is fine for fakes.
async function installTransformer(botInstance: BotType): Promise<void> {
  await botInstance.api.config.use(
    (async (_prev: unknown, method: string, payload: Record<string, unknown>) => {
      calls.push({ method, payload });
      if (method === 'getMe') {
        return {
          ok: true,
          result: {
            id: 42,
            is_bot: true,
            first_name: 'TestBot',
            username: 'test_bot',
            can_join_groups: false,
            can_read_all_group_messages: false,
            supports_inline_queries: false,
          },
        };
      }
      if (sendBehavior) return sendBehavior(method, payload);
      throw new Error(`unexpected Bot API call in test: ${method}`);
    }) as unknown as Transformer<RawApi>
  );
}

function blockedByUserError(payload: Record<string, unknown>): never {
  throw new GrammyError(
    `Call to 'sendMessage' failed!`,
    { ok: false, error_code: 403, description: 'Forbidden: bot was blocked by the user' },
    'sendMessage',
    payload
  );
}

const CHAT_ID = 987654321;

function startUpdate() {
  return {
    update_id: 1,
    message: {
      message_id: 1,
      from: { id: CHAT_ID, is_bot: false, first_name: 'Test', language_code: 'fa' },
      chat: { id: CHAT_ID, type: 'private', first_name: 'Test' },
      date: Math.floor(Date.now() / 1000),
      text: '/start',
      entities: [{ offset: 0, length: 6, type: 'bot_command' }],
    },
  };
}

function webhookRequest(update: unknown): Request {
  return new Request('http://localhost/api/telegram/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-Telegram-Bot-Api-Secret-Token': 'test-webhook-secret',
    },
    body: JSON.stringify(update),
  });
}

describe('POST /api/telegram/webhook', () => {
  let errorLines: string[];
  let originalConsoleError: typeof console.error;

  before(async () => {
    ({ POST } = await import('@/app/api/telegram/webhook/route'));
    ({ bot } = await import('@/lib/telegram/bot'));
    await installTransformer(bot);
  });

  beforeEach(() => {
    calls.length = 0;
    sendBehavior = null;
    originalConsoleError = console.error;
    errorLines = [];
    console.error = (...args: unknown[]) => {
      errorLines.push(args.map(String).join(' '));
    };
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('returns 200 and does not throw when the user has blocked the bot', async () => {
    sendBehavior = (method, payload) => {
      if (method === 'sendMessage') blockedByUserError(payload);
      throw new Error(`unexpected call: ${method}`);
    };

    const response = await POST(webhookRequest(startUpdate()));

    assert.equal(response.status, 200);
    // One concise line, no message text, no raw chat id
    assert.equal(errorLines.length, 1);
    assert.match(errorLines[0], /code=403/);
    assert.match(errorLines[0], /method=sendMessage/);
    assert.match(errorLines[0], /chat=[0-9a-f]{8}/);
    assert.equal(errorLines[0].includes(WELCOME), false);
    assert.equal(errorLines[0].includes(String(CHAT_ID)), false);
  });

  it('still throws for transient errors so Telegram can retry', async () => {
    sendBehavior = () => {
      throw new HttpError("Network request for 'sendMessage' failed!", new Error('ECONNRESET'));
    };

    await assert.rejects(POST(webhookRequest(startUpdate())));
  });

  it('keeps normal behavior: welcome message is sent, no error logged', async () => {
    sendBehavior = (method) => {
      if (method === 'sendMessage') return { ok: true, result: { message_id: 2 } };
      throw new Error(`unexpected call: ${method}`);
    };

    const response = await POST(webhookRequest(startUpdate()));

    assert.equal(response.status, 200);
    assert.equal(errorLines.length, 0);
    const send = calls.find((c) => c.method === 'sendMessage');
    assert.ok(send, 'sendMessage should have been called');
    assert.equal(send.payload.text, WELCOME);
  });
});
