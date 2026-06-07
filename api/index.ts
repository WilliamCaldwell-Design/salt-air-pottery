import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config();

import express from 'express';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

const app = express();

// Middleware to parse incoming JSON payloads
app.use(express.json());

// Global server-side settings cache with automatic /tmp file integration
let globalSettings = {
  curtainsClosed: false,
  thoughtsHidden: false,
};

let globalInvitations: any[] = [];

const SETTINGS_FILE_PATH = path.join('/tmp', 'pottery_public_settings.json');
const INVITATIONS_FILE_PATH = path.join('/tmp', 'pottery_guest_invitations.json');

// Proactively synchronize server memory with file cache if available
try {
  if (fs.existsSync(SETTINGS_FILE_PATH)) {
    const cachedData = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
    const parsed = JSON.parse(cachedData);
    globalSettings.curtainsClosed = !!parsed.curtainsClosed;
    globalSettings.thoughtsHidden = !!parsed.thoughtsHidden;
    console.log('[System Cache] Restored settings from temporary storage:', globalSettings);
  }
} catch (error) {
  console.warn('[System Cache] No active settings disk backup found. Utilizing pure virtual memory.', error);
}

try {
  if (fs.existsSync(INVITATIONS_FILE_PATH)) {
    const cachedData = fs.readFileSync(INVITATIONS_FILE_PATH, 'utf8');
    globalInvitations = JSON.parse(cachedData);
    console.log('[System Cache] Restored guest invitations from temporary storage (count):', globalInvitations.length);
  }
} catch (error) {
  console.warn('[System Cache] No active invitations disk backup found. Utilizing pure virtual memory.', error);
}

// Serve the current global settings state to all visitors
app.get('/api/public-settings', (req, res) => {
  res.json(globalSettings);
});

// Update the global settings state (restricted operation)
app.post('/api/public-settings', (req, res) => {
  try {
    const { curtainsClosed, thoughtsHidden } = req.body;
    if (typeof curtainsClosed === 'boolean') {
      globalSettings.curtainsClosed = curtainsClosed;
    }
    if (typeof thoughtsHidden === 'boolean') {
      globalSettings.thoughtsHidden = thoughtsHidden;
    }

    try {
      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(globalSettings), 'utf8');
    } catch (saveErr) {
      console.warn('[System Cache] Disk sync failed (non-blocking):', saveErr);
    }

    res.json({ success: true, settings: globalSettings });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error occurred while updating global settings.' });
  }
});

// Serve the current active list of guest invitations
app.get('/api/guest-invitations', (req, res) => {
  res.json(globalInvitations);
});

// Update the active list of guest invitations (replaces the list)
app.post('/api/guest-invitations', (req, res) => {
  try {
    const { invitations } = req.body;
    if (Array.isArray(invitations)) {
      globalInvitations = invitations;
      
      try {
        fs.writeFileSync(INVITATIONS_FILE_PATH, JSON.stringify(globalInvitations), 'utf8');
      } catch (saveErr) {
        console.warn('[System Cache] Invitations disk sync failed (non-blocking):', saveErr);
      }
    }
    res.json({ success: true, invitations: globalInvitations });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error occurred while updating guest invitations.' });
  }
});

// API endpoint to proxy the recovery email dispatch safely
app.post('/api/send-recovery-email', async (req, res) => {
  try {
    const { email, passcode } = req.body;

    if (!email || !passcode) {
      return res.status(400).json({ error: 'Email and passcode are required.' });
    }

    const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
    if (!resendApiKey) {
      return res.status(500).json({
        error: 'RESEND_API_KEY is not defined on the server. Please add it to your Environment Variables via the Settings menu.',
      });
    }

    // Output diagnostics helpful to identify incorrect key or mismatch
    const maskedKey = resendApiKey.length > 10 
      ? `${resendApiKey.substring(0, 7)}...${resendApiKey.substring(resendApiKey.length - 4)}` 
      : 'Invalid/Short Key';
    console.log('[Resend Diagnostics] Loaded Key:', maskedKey);

    // Lazy initialization of the Resend client
    const resendClient = new Resend(resendApiKey);

    let fromAddress = 'noreply@saltairpottery.com';

    console.log('[Resend Diagnostics] Raw Recipient target:', email);
    console.log('[Resend Diagnostics] Raw Environment From-address:', fromAddress);

    // Sanitization: Public domains (gmail, yahoo, etc.) can never be verified domain senders in Resend accounts.
    const isPublicDomain = /@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|aol\.com|icloud\.com|mail\.com|protonmail\.com)$/i.test(fromAddress);
    if (isPublicDomain || !fromAddress.includes('@')) {
      const errorMsg = `LOUD SYSTEM ERROR: Configured 'from' email "${fromAddress}" uses an unverifiable public domain or is invalid. Public domains cannot be used as verified custom senders. Refusing to send.`;
      console.error(`[Resend Diagnostics] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Format the final From address correctly, guaranteeing it uses the correct domain
    const finalFrom = `Salt Air Pottery <${fromAddress}>`;

    console.log('[Resend Diagnostics] Calculated Verified From Address:', finalFrom);

    const mailBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 30px auto; padding: 32px 24px; border: 1px solid #EAE4D9; border-radius: 12px; background-color: #FAF8F5; box-shadow: 0 4px 12px rgba(92, 83, 70, 0.04);">
        <div style="text-align: center; margin-bottom: 24px;">
          <p style="font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.15em; color: #8E8070; margin: 0 0 6px 0;">Studio Credentials Dispatch</p>
          <h2 style="font-family: serif; color: #2C2A29; font-weight: normal; margin: 0; font-size: 24px;">Salt Air Pottery</h2>
        </div>
        
        <div style="background-color: #F2EDEA; border: 1px solid #DECEBE; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 10px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.1em; color: #7E776F; display: block; margin-bottom: 8px;">Your Studio Passcode</span>
          <strong style="font-family: monospace; font-size: 22px; letter-spacing: 0.08em; color: #5C5346; word-break: break-all;">${passcode}</strong>
        </div>

        <p style="font-size: 13px; color: #4A433A; line-height: 1.6; margin: 0 0 16px 0;">
          Hello from Salt Air Pottery Studio! Above is your requested passcode to access the diary entries and guest administration features.
        </p>

        <p style="font-size: 12px; color: #7E776F; line-height: 1.5; margin: 24px 0 0 0; padding-top: 16px; border-top: 1px dashed #DECEBE;">
          This security code has structural authorization to alter administrative settings. Please store it securely. If you did not trigger this dispatch, you can update your passcode and recovery settings anytime under the Artist Settings Portal.
        </p>
      </div>
    `;

    console.log('[Resend Diagnostics] Invoking emails.send()...');
    const response = await resendClient.emails.send({
      from: finalFrom,
      to: email,
      subject: 'Salt Air Pottery - Passcode Recovery',
      html: mailBody,
    });

    console.log('[Resend Diagnostics] Raw Response from SDK:', JSON.stringify(response));

    if (response.error) {
      console.error('[Resend Diagnostics] Error Response identified:', response.error);
      return res.status(400).json({ error: response.error.message || 'Failed to dispatch email.' });
    }

    return res.json({ 
      success: true, 
      message: 'Recovery email dispatched successfully via Resend!', 
      data: response.data,
      diagnostics: {
        keyPrefix: maskedKey,
        fromUsed: finalFrom,
        recipient: email
      }
    });
  } catch (err: any) {
    console.error('[Resend Diagnostics] Server Exception caught:', err);
    return res.status(500).json({ error: err.message || 'An unexpected server error occurred.' });
  }
});

export default app;
