import { NextRequest, NextResponse } from 'next/server';
import { getSession, deleteSession } from '@/lib/whatsapp-session-store';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export async function POST(req: NextRequest) {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
        return NextResponse.json({ success: false, message: 'Phone number is required' }, { status: 400 });
    }

    const session = getSession(phoneNumber);

    if (session) {
        try {
            await session.sock.logout();
        } catch (error) {
            console.error('Error logging out socket:', error);
        }
    }
    
    deleteSession(phoneNumber);

    // Delete from Supabase
    const { error } = await supabase
        .from('whatsapp_sessions')
        .delete()
        .eq('phone_number', phoneNumber);

    if (error) {
        console.error('Error deleting session from Supabase:', error);
        // Don't block, just log
    }

    return NextResponse.json({ success: true, message: 'Session disconnected' });
}
