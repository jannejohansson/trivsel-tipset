'use strict';

const { app } = require('@azure/functions');
const crypto = require('crypto');
const { EmailClient } = require('@azure/communication-email');
const { getAccessRequestsContainer } = require('../shared/cosmosClient');

app.http('requestAccess', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/request-access',
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

    // If email is already in the static allowed list, tell them to just log in
    const allowedEmails = (process.env.ALLOWED_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    if (allowedEmails.includes(email)) {
      return { status: 400, jsonBody: { error: 'already_allowed' } };
    }

    const container = getAccessRequestsContainer();
    const reqId = `req_${email}`;

    // Check for existing request
    try {
      const { resource } = await container.item(reqId, email).read();
      if (resource) {
        if (resource.status === 'pending') {
          return { status: 409, jsonBody: { error: 'already_requested' } };
        }
        if (resource.status === 'approved') {
          return { status: 409, jsonBody: { error: 'already_approved' } };
        }
        // If denied, allow re-request by falling through
      }
    } catch {
      // Not found — proceed
    }

    // Generate admin token
    const adminToken = crypto.randomBytes(32).toString('hex');

    await container.items.upsert({
      id: reqId,
      email,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      adminToken,
    });

    // Notify admin
    const appUrl = process.env.APP_URL;
    const approveLink = `${appUrl}/api/auth/handle-request?token=${adminToken}&action=approve`;
    const denyLink = `${appUrl}/api/auth/handle-request?token=${adminToken}&action=deny`;

    const emailClient = new EmailClient(process.env.ACS_CONNECTION_STRING);

    await emailClient.beginSend({
      senderAddress: process.env.ACS_SENDER_EMAIL,
      recipients: { to: [{ address: process.env.ADMIN_EMAIL }] },
      content: {
        subject: `Trivseltipset – Åtkomstbegäran från ${email}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#131313;color:#e5e2e1;padding:32px;border-radius:8px;">
            <h1 style="font-size:24px;color:#88d982;margin:0 0 16px;">Trivseltipset</h1>
            <p><strong>${email}</strong> vill gå med i VM-tipset.</p>
            <table style="margin-top:24px;border-collapse:separate;border-spacing:12px 0;">
              <tr>
                <td>
                  <a href="${approveLink}"
                     style="display:inline-block;background:#065f18;color:#86d881;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;">
                    ✓ Godkänn
                  </a>
                </td>
                <td>
                  <a href="${denyLink}"
                     style="display:inline-block;background:#93000a;color:#ffdad6;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;">
                    ✗ Neka
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#e5e2e1;opacity:0.4;font-size:12px;margin-top:32px;">
              Klicka bara en gång — länkarna är engångslänkar.
            </p>
          </div>
        `,
      },
    });

    return { status: 200, jsonBody: { message: 'Request submitted' } };
  },
});
