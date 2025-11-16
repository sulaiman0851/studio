import { NextRequest, NextResponse } from 'next/server';
import { getLogs } from '@/lib/whatsapp-log-store';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get('phoneNumber');

    if (!phoneNumber) {
        return NextResponse.json({ success: false, message: 'Phone number is required' }, { status: 400 });
    }

    const logs = getLogs(phoneNumber);

    return NextResponse.json({ success: true, logs: logs || [] });
}
