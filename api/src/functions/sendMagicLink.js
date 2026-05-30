'use strict';

const { app } = require('@azure/functions');
const crypto = require('crypto');
const { EmailClient } = require('@azure/communication-email');
const { getTokensTable } = require('../shared/tableClient');

const LOCKOUT_TIMESTAMP = new Date('2026-06-11T18:00:00Z').getTime();

app.http('sendMagicLink', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/send-magic-link',
  handler: async (request) => {
    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: 'Invalid JSON body' } };
    }

    const email = (body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return { status: 400, jsonBody: { error: 'Valid email required' } };
    }

    const allowedEmails = (process.env.ALLOWED_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    if (!allowedEmails.includes(email)) {
      return { status: 403, jsonBody: { error: 'not_allowed' } };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    try {
      const tokensTable = getTokensTable();
      await tokensTable.upsertEntity(
        { partitionKey: 'token', rowKey: token, email, expiresAt },
        'Replace'
      );
    } catch (err) {
      return { status: 500, jsonBody: { error: 'Token storage failed', detail: err.message } };
    }

    // Magic link hits the API directly so it can set the cookie and redirect
    const magicLink = `${process.env.APP_URL}/api/auth/verify-token?token=${token}`;
    const emailClient = new EmailClient(process.env.ACS_CONNECTION_STRING);

    const isAfterLockout = Date.now() >= LOCKOUT_TIMESTAMP;
    const lockMessage = isAfterLockout
      ? '<p style="margin:0 0 8px;color:#b8860b;font-weight:600;">Notera: VM har startat. Varje match låses vid avspark, så redan spelade matcher går inte längre att tippa.</p>'
      : '';
    const validityMessage = '<p style="margin:0 0 8px;color:#5a6877;font-size:14px;">Länken är giltig i 15 minuter och kan bara användas en gång.</p>';

    try {
      const poller = await emailClient.beginSend({
        senderAddress: process.env.ACS_SENDER_EMAIL,
        recipients: { to: [{ address: email }] },
        content: {
          subject: 'Din inloggningslänk – Trivseltipset',
          html: `
            <div style="font-family:system-ui,'Segoe UI',sans-serif;background:#f6f8fb;padding:32px 16px;">
              <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #dde3ea;border-radius:10px;padding:32px;color:#0d1b2a;line-height:1.6;">
                <h1 style="font-size:22px;color:#15a34a;margin:0 0 20px;">Trivseltipset</h1>
                <p style="margin:0 0 12px;">Hej och välkommen till Trivseltipset!</p>
                <p style="margin:0 0 12px;">Här är din personliga inloggningslänk. Tippa gruppspel och slutspel i fotbolls-VM 2026.</p>
                <p style="margin:0 0 24px;">Klicka på knappen nedan för att logga in:</p>
                <a href="${magicLink}"
                   style="display:inline-block;background:#15a34a;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
                  Logga in nu
                </a>
                <div style="margin-top:28px;padding-top:20px;border-top:1px solid #dde3ea;">
                  ${lockMessage}
                  ${validityMessage}
                  <p style="margin:0 0 12px;color:#5a6877;font-size:13px;">Om du inte begärde denna länk kan du lugnt ignorera detta mail.</p>
                  <p style="margin:0;color:#5a6877;font-size:12px;word-break:break-all;">
                    Fungerar inte knappen? Kopiera länken:<br/>
                    <a href="${magicLink}" style="color:#2563eb;">${magicLink}</a>
                  </p>
                </div>
              </div>
            </div>
          `,
        },
      });
      await poller.pollUntilDone();
    } catch (err) {
      return { status: 500, jsonBody: { error: 'Email sending failed', detail: err.message } };
    }

    return { status: 200, jsonBody: { message: 'Check your email' } };
  },
});
