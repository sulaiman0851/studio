import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/whatsapp-session-store';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get('phoneNumber');

    if (!phoneNumber) {
        return NextResponse.json({ success: false, message: 'Phone number is required' }, { status: 400 });
    }

    const session = getSession(phoneNumber);

    if (session) {
        return NextResponse.json({ success: true, status: session.connection });
    } else {
        return NextResponse.json({ success: false, status: 'disconnected' });
    }
}
