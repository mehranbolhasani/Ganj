import { NextRequest, NextResponse } from 'next/server';

type ContactPayload = {
  name: string;
  email: string;
  message: string;
};

function isValidEmail(email: string): boolean {
  return /.+@.+\..+/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ContactPayload>;
    const name = (body.name || '').toString().trim();
    const email = (body.email || '').toString().trim();
    const message = (body.message || '').toString().trim();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'تمام فیلدها الزامی هستند.' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'ایمیل نامعتبر است.' }, { status: 400 });
    }

    // Basic abuse guard (length limits)
    if (name.length > 120 || email.length > 200 || message.length > 5000) {
      return NextResponse.json({ error: 'طول ورودی بیش از حد مجاز است.' }, { status: 400 });
    }

    // Store in Supabase via REST (no SDK dependency)
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const SUPABASE_TABLE = process.env.SUPABASE_CONTACT_TABLE || 'contact_messages';

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Supabase env vars missing, skipping storage');
    } else {
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ name, email, message }),
        cache: 'no-store',
      });
      if (!insertRes.ok) {
        const errText = await insertRes.text();
        console.error('Supabase insert failed:', insertRes.status, errText);
      }
    }

    // Send notification email via Resend REST API (no SDK dependency)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RESEND_FROM = process.env.RESEND_FROM || 'contact@ganj.directory';
    const RESEND_TO = process.env.RESEND_TO || 'hi@mehranbolhasani.com';

    let emailError: string | null = null;
    
    if (RESEND_API_KEY) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: RESEND_FROM,
            to: [RESEND_TO],
            subject: `پیام جدید از فرم تماس: ${name}`,
            html: `<p><strong>نام:</strong> ${name}</p><p><strong>ایمیل:</strong> ${email}</p><p><strong>پیام:</strong></p><p>${message.replace(/\n/g, '<br/>')}</p>`
          }),
        });
        
        const emailData = await emailRes.json();
        
        if (!emailRes.ok) {
          emailError = `Resend failed: ${emailRes.status} - ${JSON.stringify(emailData)}`;
          console.error('Resend email failed:', emailRes.status, emailData);
        } else {
          console.log('Resend email sent successfully:', emailData);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        emailError = `Resend error: ${errorMessage}`;
        console.error('Resend email error:', err);
      }
    } else {
      console.warn('RESEND_API_KEY not set, skipping email');
    }
    
    // Return success even if email failed (data is saved)
    // Log email error for debugging but don't fail the request
    if (emailError) {
      console.error('Email sending failed (but data saved):', emailError);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Contact API error', err);
    return NextResponse.json({ error: 'خطایی رخ داد. لطفاً دوباره تلاش کنید.' }, { status: 500 });
  }
}


