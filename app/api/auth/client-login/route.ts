import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sandip26tripathi@gmail.com';
const LEADS_FILE = path.join(process.cwd(), 'data', 'client-leads.json');

interface ClientLead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  loginTime: string;
  adminRecipient: string;
  clientIp?: string;
  userAgent?: string;
  birthDetails?: any;
}

// Global in-memory cache for ultra-fast, non-blocking concurrent logins
declare global {
  var __GLOBAL_CLIENT_LEADS__: ClientLead[] | undefined;
}

if (!global.__GLOBAL_CLIENT_LEADS__) {
  global.__GLOBAL_CLIENT_LEADS__ = [];
}

// Helper to safely read existing leads (memory + filesystem fallback)
function readLeads(): ClientLead[] {
  const memoryLeads = global.__GLOBAL_CLIENT_LEADS__ || [];
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const data = fs.readFileSync(LEADS_FILE, 'utf-8');
      const fileLeads: ClientLead[] = JSON.parse(data || '[]');
      // Merge unique by id
      const ids = new Set(memoryLeads.map((l) => l.id));
      for (const fl of fileLeads) {
        if (!ids.has(fl.id)) {
          memoryLeads.push(fl);
          ids.add(fl.id);
        }
      }
    }
  } catch (err) {
    // Read-only serverless environment safe fallback
  }
  return memoryLeads;
}

// Helper to safely append new lead
function appendLead(lead: ClientLead): void {
  if (!global.__GLOBAL_CLIENT_LEADS__) {
    global.__GLOBAL_CLIENT_LEADS__ = [];
  }
  global.__GLOBAL_CLIENT_LEADS__.unshift(lead);

  try {
    const leads = global.__GLOBAL_CLIENT_LEADS__;
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  } catch (err) {
    // In serverless read-only mode, attempt /tmp fallback
    try {
      const tmpPath = path.join('/tmp', 'client-leads.json');
      fs.writeFileSync(tmpPath, JSON.stringify(global.__GLOBAL_CLIENT_LEADS__, null, 2), 'utf-8');
    } catch (tmpErr) {
      // Memory persistence active
    }
  }
}

// Dispatch Email to sandip26tripathi@gmail.com
async function dispatchEmailToAdmin(lead: ClientLead) {
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || ADMIN_EMAIL;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '';

  if (!smtpPass) {
    console.log(
      `[Lead Stored] Client: ${lead.name} (${lead.email}) stored for ${ADMIN_EMAIL}. (To enable live Gmail inbox delivery, add GMAIL_APP_PASSWORD in .env.local)`
    );
    return { sent: false, reason: 'GMAIL_APP_PASSWORD not configured yet in .env.local' };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 16px; border-radius: 8px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px;">🌟 New Client Login on Gemini Astro</h2>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.95;">A client has logged in with their Google account</p>
        </div>

        <div style="padding: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: bold; width: 35%;">Client Name:</td>
              <td style="padding: 10px 0; color: #0f172a; font-weight: bold;">${lead.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Client Gmail:</td>
              <td style="padding: 10px 0; color: #d97706; font-weight: bold; font-family: monospace;">${lead.email}</td>
            </tr>
            ${
              lead.phone
                ? `<tr style="border-bottom: 1px solid #f1f5f9;">
                     <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Phone / WhatsApp:</td>
                     <td style="padding: 10px 0; color: #0f172a;">${lead.phone}</td>
                   </tr>`
                : ''
            }
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Login Date & Time:</td>
              <td style="padding: 10px 0; color: #334155;">${new Date(lead.loginTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</td>
            </tr>
            ${
              lead.birthDetails?.dateOfBirth
                ? `<tr style="border-bottom: 1px solid #f1f5f9;">
                     <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Kundli DOB / Time:</td>
                     <td style="padding: 10px 0; color: #334155;">${lead.birthDetails.dateOfBirth} at ${lead.birthDetails.timeOfBirth || 'N/A'}</td>
                   </tr>
                   <tr style="border-bottom: 1px solid #f1f5f9;">
                     <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Birth Place:</td>
                     <td style="padding: 10px 0; color: #334155;">${lead.birthDetails.placeName || 'N/A'}</td>
                   </tr>`
                : ''
            }
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Client IP:</td>
              <td style="padding: 10px 0; color: #94a3b8; font-size: 12px; font-family: monospace;">${lead.clientIp || 'Localhost / Direct'}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #94a3b8;">
          Sent to Admin: <strong>${ADMIN_EMAIL}</strong> • Gemini Astro High-Precision Astrology Engine
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Gemini Astro Client Alerts" <${smtpUser}>`,
      to: ADMIN_EMAIL,
      subject: `🌟 New Client Login: ${lead.name} (${lead.email})`,
      html: htmlContent,
    });

    console.log(`Email successfully dispatched to ${ADMIN_EMAIL}:`, info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`Error sending email to ${ADMIN_EMAIL}:`, err.message || err);
    return { sent: false, error: err.message || String(err) };
  }
}

// POST: Register Client Login & Dispatch to sandip26tripathi@gmail.com
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, birthDetails } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid Gmail address is required.' },
        { status: 400 }
      );
    }

    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser Client';

    const cleanName = (name && String(name).trim()) || email.split('@')[0];
    const cleanEmail = email.trim().toLowerCase();

    const newLead: ClientLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      email: cleanEmail,
      phone: phone ? String(phone).trim() : undefined,
      loginTime: new Date().toISOString(),
      adminRecipient: ADMIN_EMAIL,
      clientIp,
      userAgent,
      birthDetails: birthDetails || null,
    };

    // 1. Append to local server storage in data/client-leads.json
    appendLead(newLead);

    // 2. Dispatch email to sandip26tripathi@gmail.com (asynchronous, non-blocking)
    const emailResult = await dispatchEmailToAdmin(newLead);

    return NextResponse.json({
      success: true,
      message: `Login registered successfully. Details saved for admin ${ADMIN_EMAIL}.`,
      user: {
        name: cleanName,
        email: cleanEmail,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=4285F4`,
        provider: 'google',
        isLoggedIn: true,
      },
      leadId: newLead.id,
      adminEmail: ADMIN_EMAIL,
      emailDispatch: emailResult,
    });
  } catch (error: any) {
    console.error('Client login API error:', error);
    return NextResponse.json(
      { error: 'Failed to process client login.', details: error.message },
      { status: 500 }
    );
  }
}

// GET: View all collected leads for admin
export async function GET() {
  try {
    const leads = readLeads();
    return NextResponse.json({
      admin: ADMIN_EMAIL,
      totalLeads: leads.length,
      leads,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve client leads.', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific lead by id or clear all
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required.' }, { status: 400 });
    }

    let leads = readLeads();
    if (id === 'all') {
      leads = [];
    } else {
      leads = leads.filter((l) => l.id !== id);
    }
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');

    return NextResponse.json({ success: true, remaining: leads.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

