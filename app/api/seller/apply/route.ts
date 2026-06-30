import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, businessName, country } = body;
    if (!name || !email || !businessName || !country) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    return NextResponse.json({ success: true, message: 'Application received. We will review it within 48 hours.', applicationId: `app_${Date.now()}` });
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
