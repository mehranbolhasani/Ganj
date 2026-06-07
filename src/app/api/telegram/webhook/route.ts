import { bot } from '@/lib/telegram/bot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const headerSecret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');

  if (!webhookSecret || headerSecret !== webhookSecret) {
    console.error('Telegram webhook: secret mismatch or missing');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    await bot.handleUpdate(body);
    return new Response('OK', { status: 200 });
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
