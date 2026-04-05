'use strict';

const { app } = require('@azure/functions');
const crypto = require('crypto');
const { EmailClient } = require('@azure/communication-email');
const { getAccessRequestsContainer, getUsersContainer, getTokensContainer } = require('../shared/cosmosClient');

const HTML = (title, body, color = '#88d982') => `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title} – Trivseltipset</title>
  <style>
    body{font-family:sans-serif;background:#131313;color:#e5e2e1;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
    .card{background:#1c1b1b;border:1px solid #41493e;border-radius:8px;padding:40px;max-width:420px;text-align:center;}
    h1{color:${color};font-size:22px;margin:0 0 16px;}
    p{color:#e5e2e1;opacity:0.7;line-height:1.6;}
    a{color:#88d982;text-decoration:none;}
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    ${body}
  </div>
</body>
</html>`;

app.http('handleRequest', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/handle-request',
  handler: async (request, context) => {
    const url = new URL(request.url);
    const adminToken = url.searchParams.get('token');
    const action = url.searchParams.get('action');

    if (!adminToken || !['approve', 'deny'].includes(action)) {
      return {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
        body: HTML('Ogiltig länk', '<p>Den här länken är ogiltig.</p>', '#ffb4ab'),
      };
    }

    const container = getAccessRequestsContainer();

    // Find access request by adminToken (cross-partition query — small collection, fine)
    let requestDoc;
    try {
      const { resources } = await container.items.query(
        {
          query: 'SELECT * FROM c WHERE c.adminToken = @token',
          parameters: [{ name: '@token', value: adminToken }],
        },
        { enableCrossPartitionQuery: true }
      ).fetchAll();
      requestDoc = resources[0] || null;
    } catch (err) {
      context.log('DB error in handleRequest:', err);
      return {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
        body: HTML('Fel', '<p>Ett fel uppstod. Försök igen senare.</p>', '#ffb4ab'),
      };
    }

    if (!requestDoc) {
      return {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
        body: HTML('Länk hittades inte', '<p>Den här länken är ogiltig eller har redan använts.</p>', '#ffb4ab'),
      };
    }

    if (requestDoc.status !== 'pending') {
      const statusText = requestDoc.status === 'approved' ? 'godkänd' : 'nekad';
      return {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
        body: HTML('Redan hanterad', `<p>Den här förfrågan har redan blivit <strong>${statusText}</strong>.</p>`),
      };
    }

    const { email } = requestDoc;

    if (action === 'deny') {
      await container.item(requestDoc.id, email).patch([
        { op: 'set', path: '/status', value: 'denied' },
        { op: 'set', path: '/handledAt', value: new Date().toISOString() },
      ]);

      return {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
        body: HTML('Nekad', `<p><strong>${email}</strong> har nekats åtkomst.</p>`, '#ffb4ab'),
      };
    }

    // Approve: update request, create user, send magic link
    await container.item(requestDoc.id, email).patch([
      { op: 'set', path: '/status', value: 'approved' },
      { op: 'set', path: '/handledAt', value: new Date().toISOString() },
    ]);

    // Upsert user
    const usersContainer = getUsersContainer();
    const userId = `user_${crypto.createHash('sha256').update(email).digest('hex').slice(0, 16)}`;
    const now = new Date().toISOString();

    try {
      await usersContainer.item(userId, email).read();
    } catch {
      const displayName = email.split('@')[0];
      await usersContainer.items.create({ id: userId, email, displayName, createdAt: now, lastLoginAt: now });
    }

    // Generate and store magic link token
    const magicToken = crypto.randomBytes(32).toString('hex');
    await getTokensContainer().items.upsert({
      id: magicToken,
      token: magicToken,
      email,
      ttl: 900,
    });

    // Send magic link to user
    const magicLink = `${process.env.APP_URL}/login.html?token=${magicToken}`;
    const emailClient = new EmailClient(process.env.ACS_CONNECTION_STRING);

    await emailClient.beginSend({
      senderAddress: process.env.ACS_SENDER_EMAIL,
      recipients: { to: [{ address: email }] },
      content: {
        subject: 'Välkommen till Trivseltipset! Din inloggningslänk',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#131313;color:#e5e2e1;padding:32px;border-radius:8px;">
            <h1 style="font-size:24px;color:#88d982;margin:0 0 16px;">Trivseltipset</h1>
            <p>Din åtkomstbegäran har godkänts! Klicka nedan för att logga in:</p>
            <a href="${magicLink}"
               style="display:inline-block;margin:24px 0;background:#065f18;color:#86d881;padding:14px 28px;border-radius:4px;text-decoration:none;font-weight:bold;font-size:16px;">
              Logga in nu
            </a>
            <p style="color:#e5e2e1;opacity:0.4;font-size:12px;margin-top:32px;">
              Länken är giltig i 15 minuter.<br/>
              ${magicLink}
            </p>
          </div>
        `,
      },
    });

    return {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
      body: HTML('Godkänd!', `<p><strong>${email}</strong> har godkänts och fått en inloggningslänk via mail.</p>`),
    };
  },
});
