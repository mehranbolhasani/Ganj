import { bot } from '@/lib/telegram/bot';
import { webhookCallback } from 'grammy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const handleUpdate = webhookCallback(bot, 'std/http');

export async function POST(request: Request) {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const headerSecret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');

  if (!webhookSecret || headerSecret !== webhookSecret) {
    console.error('Telegram webhook: secret mismatch or missing');
    return new Response('Unauthorized', { status: 401 });
  }

  return handleUpdate(request);
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
