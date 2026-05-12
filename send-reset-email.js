// netlify/functions/send-reset-email.js
// Sends a 6-digit password-reset code to the admin email.
// Uses Resend (https://resend.com) — free tier: 100 emails/day, 3000/month.
// Set RESEND_API_KEY in Netlify → Site Settings → Environment Variables.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { to, code } = body;
  if (!to || !code) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing to or code" }) };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "RESEND_API_KEY not configured" }) };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Secure Quiz <onboarding@resend.dev>",  // use your verified domain once set up
        to: [to],
        subject: "Your Admin Password Reset Code",
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:12px;">
            <h2 style="color:#534AB7;">🔑 Admin Password Reset</h2>
            <p style="color:#333;">Your one-time verification code is:</p>
            <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#534AB7;padding:16px 0;">${code}</div>
            <p style="color:#666;font-size:13px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
          </div>
        `,
      }),
    });

    if (res.ok) {
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    } else {
      const err = await res.json().catch(() => ({}));
      return { statusCode: 500, body: JSON.stringify({ error: err.message || "Resend API error" }) };
    }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
