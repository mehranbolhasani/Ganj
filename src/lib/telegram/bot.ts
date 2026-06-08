import { Bot, InlineKeyboard } from 'grammy';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { botSupabase } from './supabase-bot-client';
import { searchPoems, getPoemById } from './search';
import { getRandomHafezGhazal } from '@/lib/faal-core';
import { Poem } from '@/lib/types';
import * as messages from './messages';

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!token || !webhookSecret || !supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing required environment variables for Telegram bot: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
  );
}

export const bot = new Bot(token);

// Rate limiter: 20 messages per minute per Telegram user
const telegramRatelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(20, '1 m'),
        analytics: false,
        prefix: 'ganj:telegram',
      })
    : null;

async function checkRateLimit(userId: number): Promise<boolean> {
  if (!telegramRatelimit) return true;
  try {
    const { success } = await telegramRatelimit.limit(userId.toString());
    return success;
  } catch (err) {
    console.error('Telegram rate limiter error:', err);
    // Fail open: do not block legitimate users if rate limiter is down
    return true;
  }
}

function formatPoem(poem: Poem, prefix?: string): string {
  const contentLines: string[] = [];
  if (prefix) {
    contentLines.push(prefix);
    contentLines.push('');
  }
  contentLines.push(poem.title);
  contentLines.push('');
  if (poem.poetName) {
    contentLines.push(poem.poetName);
    contentLines.push('');
  }
  // Group verses into beyts (pairs of mesra'), with a blank line between beyts
  for (let i = 0; i < poem.verses.length; i += 2) {
    contentLines.push(poem.verses[i]);
    if (i + 1 < poem.verses.length) {
      contentLines.push(poem.verses[i + 1]);
    }
    // Blank line between beyts, but not after the final beyt
    if (i + 2 < poem.verses.length) {
      contentLines.push('');
    }
  }
  contentLines.push(''); // blank line before footer

  const footerLines = [
    'مطالعهٔ کامل شعر در وب‌سایت:',
    `https://ganj.directory/poem/${poem.id}`,
  ];

  const content = contentLines.join('\n');
  const footer = footerLines.join('\n');

  const maxContentLength = 4096 - footer.length - 1; // -1 for the ellipsis
  if (content.length > maxContentLength) {
    return content.slice(0, maxContentLength) + '…' + footer;
  }

  return content + footer;
}

// /start
bot.command('start', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const allowed = await checkRateLimit(userId);
  if (!allowed) {
    await ctx.reply(messages.RATE_LIMITED);
    return;
  }

  await ctx.reply(messages.WELCOME);
});

// /faal
bot.command('faal', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const allowed = await checkRateLimit(userId);
  if (!allowed) {
    await ctx.reply(messages.RATE_LIMITED);
    return;
  }

  try {
    const poem = await getRandomHafezGhazal(botSupabase);
    if (!poem) {
      await ctx.reply(messages.FAAL_ERROR);
      return;
    }
    const text = formatPoem(poem, messages.FAAL_PREFIX);
    await ctx.reply(text);
  } catch (err) {
    console.error('Faal command error:', err);
    await ctx.reply(messages.FAAL_ERROR);
  }
});

// Plain text search (any non-command text message)
bot.on('message:text', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const text = ctx.message.text.trim();
  // Skip commands so they are handled only by bot.command(...) handlers
  if (text.startsWith('/')) return;

  const allowed = await checkRateLimit(userId);
  if (!allowed) {
    await ctx.reply(messages.RATE_LIMITED);
    return;
  }

  const query = text;
  if (query.length < 2) {
    await ctx.reply(messages.QUERY_TOO_SHORT);
    return;
  }

  const poems = await searchPoems(query);

  if (poems.length === 0) {
    await ctx.reply(messages.NO_RESULTS);
    return;
  }

  const keyboard = new InlineKeyboard();
  for (const poem of poems) {
    const label = `${poem.title} — ${poem.poetName}`.slice(0, 64);
    keyboard.text(label, `poem:${poem.id}`);
    keyboard.row();
  }

  await ctx.reply(messages.SEARCH_RESULTS_INTRO, {
    reply_markup: keyboard,
  });
});

// Callback queries (poem selection from inline keyboard)
bot.on('callback_query:data', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const allowed = await checkRateLimit(userId);
  if (!allowed) {
    await ctx.answerCallbackQuery({ text: messages.RATE_LIMITED });
    return;
  }

  const data = ctx.callbackQuery.data;
  if (!data.startsWith('poem:')) {
    await ctx.answerCallbackQuery();
    return;
  }

  const poemId = parseInt(data.replace('poem:', ''), 10);
  if (Number.isNaN(poemId)) {
    await ctx.answerCallbackQuery();
    return;
  }

  try {
    const poem = await getPoemById(poemId);
    if (!poem) {
      await ctx.answerCallbackQuery({ text: messages.POEM_NOT_FOUND });
      return;
    }

    const text = formatPoem(poem);
    await ctx.reply(text);
    await ctx.answerCallbackQuery();
  } catch (err) {
    console.error('Callback query error:', err);
    await ctx.answerCallbackQuery({ text: messages.GENERAL_ERROR });
  }
});
