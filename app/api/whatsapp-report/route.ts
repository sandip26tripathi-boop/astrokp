import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { whatsappNumber, clientName, reportText, uid } = body;

    if (!whatsappNumber) {
      return NextResponse.json(
        { error: 'WhatsApp number is required' },
        { status: 400 }
      );
    }

    // Clean phone number: remove all non-digit characters
    let cleanPhone = String(whatsappNumber).replace(/\D/g, '');

    // Default to Indian country code +91 if 10 digits provided without country code
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const whatsappToken = process.env.WHATSAPP_TOKEN;
    const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID;

    // Check if official Meta WhatsApp Cloud API is configured
    if (whatsappToken && whatsappPhoneId) {
      try {
        const response = await fetch(
          `https://graph.facebook.com/v20.0/${whatsappPhoneId}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${whatsappToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: cleanPhone,
              type: 'text',
              text: {
                preview_url: false,
                body: reportText,
              },
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.warn('Meta WhatsApp Cloud API error:', data);
          return NextResponse.json({
            success: false,
            mode: 'fallback',
            error: data?.error?.message || 'Cloud API send error',
            cleanPhone,
            encodedText: encodeURIComponent(reportText),
          });
        }

        // Log successful report delivery to Firestore if user ID is present
        if (uid) {
          try {
            const db = getFirebaseDb();
            if (db) {
              const reportRef = doc(db, 'users', uid, 'reports', `rep_${Date.now()}`);
              await setDoc(reportRef, {
                recipient: cleanPhone,
                clientName: clientName || 'Client',
                channel: 'whatsapp_cloud_api',
                status: 'delivered',
                messageId: data?.messages?.[0]?.id || null,
                timestamp: serverTimestamp(),
              });
            }
          } catch (dbErr) {
            console.warn('Firestore report logging notice:', dbErr);
          }
        }

        return NextResponse.json({
          success: true,
          mode: 'cloud_api',
          messageId: data?.messages?.[0]?.id,
          recipient: cleanPhone,
        });
      } catch (cloudErr: any) {
        console.warn('WhatsApp Cloud API call failed:', cloudErr);
        return NextResponse.json({
          success: false,
          mode: 'fallback',
          error: cloudErr.message,
          cleanPhone,
          encodedText: encodeURIComponent(reportText),
        });
      }
    }

    // Mode B: Graceful Instant Fallback when credentials are not configured in environment
    return NextResponse.json({
      success: true,
      mode: 'fallback',
      message: 'Meta WhatsApp Cloud API credentials not configured in environment. Using instant direct link.',
      cleanPhone,
      encodedText: encodeURIComponent(reportText),
    });
  } catch (error: any) {
    console.error('WhatsApp API route handler error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
