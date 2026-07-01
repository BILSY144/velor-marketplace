import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { name, email, businessName, country } = body;
    if (!name || !email || !businessName || !country) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    return NextResponse.json({ success: true, message: 'Application received. We will review it within 48 hours.', applicationId: `app_${Date.now()}` });
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
