'use strict';

const { app } = require('@azure/functions');
const crypto = require('crypto');
const { EmailClient } = require('@azure/communication-email');
const { getTokensContainer, getAccessRequestsContainer } = require('../shared/cosmosClient');

const LOCKOUT_TIMESTAMP = new Date('2026-06-11T18:00:00Z').getTime();

app.http('sendMagicLink', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/send-magic-link',
  handler: async (request, context) => {
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

    // Check allowed list (env var)
    const allowedEmails = (process.env.ALLOWED_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    let isAllowed = allowedEmails.includes(email);

    // If not in static list, check for approved access request in DB
    if (!isAllowed) {
      try {
        const container = getAccessRequestsContainer();
        const reqId = `req_${email}`;
        const { resource } = await container.item(reqId, email).read();
        if (resource && resource.status === 'approved') {
          isAllowed = true;
        }
      } catch {
        // Not found or DB error — not allowed
      }
    }

    if (!isAllowed) {
      return { status: 403, jsonBody: { error: 'not_allowed' } };
    }

    // Generate magic link token
    const token = crypto.randomBytes(32).toString('hex');
    const tokensContainer = getTokensContainer();

    await tokensContainer.items.upsert({
      id: token,
      token,
      email,
      ttl: 900, // 15 minutes
    });

    // Send email
    const magicLink = `${process.env.APP_URL}/login.html?token=${token}`;
    const emailClient = new EmailClient(process.env.ACS_CONNECTION_STRING);

    const isAfterLockout = Date.now() >= LOCKOUT_TIMESTAMP;
    const lockMessage = isAfterLockout
      ? '<p style="color:#e9c349;margin-top:16px;">Notera: Tipsen är låsta – VM har startat.</p>'
      : '<p style="margin-top:16px;">Länken är giltig i 15 minuter.</p>';

    await emailClient.beginSend({
      senderAddress: process.env.ACS_SENDER_EMAIL,
      recipients: { to: [{ address: email }] },
      content: {
        subject: 'Din inloggningslänk – Trivseltipset',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#131313;color:#e5e2e1;padding:32px;border-radius:8px;">
            <h1 style="font-size:24px;color:#88d982;margin:0 0 16px;">Trivseltipset</h1>
            <p>Klicka på knappen nedan för att logga in:</p>
            <a href="${magicLink}"
               style="display:inline-block;margin:24px 0;background:#065f18;color:#86d881;padding:14px 28px;border-radius:4px;text-decoration:none;font-weight:bold;font-size:16px;">
              Logga in nu
            </a>
            ${lockMessage}
            <p style="color:#e5e2e1;opacity:0.4;font-size:12px;margin-top:32px;">
              Om du inte begärde denna länk kan du ignorera detta mail.<br/>
              ${magicLink}
            </p>
          </div>
        `,
      },
    });

    return { status: 200, jsonBody: { message: 'Check your email' } };
  },
});
