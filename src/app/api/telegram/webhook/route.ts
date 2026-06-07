import { webhookCallback } from 'grammy/web';
import { bot } from '@/lib/telegram/bot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const handleUpdate = webhookCallback(bot, 'std/http');

export async function POST(request: Request) {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const headerSecret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');

  if (!webhookSecret || headerSecret !== webhookSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    return await handleUpdate(request);
  } catch (err) {
    console.error('Telegram webhook error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function GET() {
  return new Response('Method Not Allowed', { status: 405 });
}

export async function PUT() {
  return new Response('Method Not Allowed', { status: 405 });
}

export async function DELETE() {
  return new Response('Method Not Allowed', { status: 405 });
}

export async function PATCH() {
  return new Response('Method Not Allowed', { status: 405 });
}
