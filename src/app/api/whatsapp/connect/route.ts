import { NextRequest, NextResponse } from 'next/server';
import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { useSupabaseAuthState } from '@/lib/supabase-auth-state';
import { getSession, setSession, deleteSession } from '@/lib/whatsapp-session-store';
import { addLog, clearLogs } from '@/lib/whatsapp-log-store';

// In-memory store for active sockets
const activeSockets = new Map<string, any>();

async function connectToWhatsApp(phoneNumber: string) {
    if (activeSockets.has(phoneNumber)) {
        addLog(phoneNumber, 'A connection process is already in progress for this number.');
        return { success: false, message: 'A connection process is already in progress for this number.' };
    }
    
    clearLogs(phoneNumber);
    addLog(phoneNumber, 'Initiating connection...');

    const { state, saveCreds } = await useSupabaseAuthState(phoneNumber);
    
    const logger = pino({ level: 'trace' }, pino.destination(
        {
            write: (msg: string) => {
                addLog(phoneNumber, msg.trim());
            }
        }
    ));

    const sock = makeWASocket({
        logger,
        printQRInTerminal: false,
        auth: state,
        browser: ['FieldOps', 'Chrome', '1.0.0'],
    });

    activeSockets.set(phoneNumber, sock);
    setSession(phoneNumber, { sock, connection: 'connecting' });
    addLog(phoneNumber, 'Socket created. Waiting for connection update.');

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        const session = getSession(phoneNumber);
        addLog(phoneNumber, `Connection update: ${JSON.stringify(update)}`);

        if(qr) {
            addLog(phoneNumber, `QRCODE:${qr}`);
        }

        if (connection === 'close') {
            activeSockets.delete(phoneNumber);
            deleteSession(phoneNumber);
            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            addLog(phoneNumber, `Connection closed. Status code: ${statusCode}.`);
            if (statusCode !== DisconnectReason.loggedOut) {
                addLog(phoneNumber, 'Client can reconnect.');
            } else {
                addLog(phoneNumber, 'Logged out.');
            }
        } else if (connection === 'open') {
            if(session) {
                session.connection = 'open';
            }
            addLog(phoneNumber, 'Connection opened.');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    addLog(phoneNumber, 'Waiting for QR code or connection to open...');
    return { success: true, pairingCode: null };
}

export async function POST(req: NextRequest) {
    try {
        const { phoneNumber } = await req.json();
        if (!phoneNumber) {
            return NextResponse.json({ success: false, message: 'Phone number is required' }, { status: 400 });
        }

        const result = await connectToWhatsApp(phoneNumber);

        if (result.success) {
            return NextResponse.json({ success: true, pairingCode: result.pairingCode });
        } else {
            return NextResponse.json({ success: false, message: result.message }, { status: 400 });
        }
    } catch (error) {
        console.error('Failed to connect to WhatsApp:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
