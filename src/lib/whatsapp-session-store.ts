
import makeWASocket, { WASocket } from '@whiskeysockets/baileys';

type Session = {
    sock: WASocket;
    connection: string;
};

const sessions = new Map<string, Session>();

export const getSession = (sessionId: string): Session | undefined => {
    return sessions.get(sessionId);
};

export const setSession = (sessionId: string, session: Session): void => {
    sessions.set(sessionId, session);
};

export const deleteSession = (sessionId: string): void => {
    sessions.delete(sessionId);
};
