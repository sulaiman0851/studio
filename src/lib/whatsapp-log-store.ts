const logs = new Map<string, string[]>();

export const addLog = (sessionId: string, message: string): void => {
    if (!logs.has(sessionId)) {
        logs.set(sessionId, []);
    }
    logs.get(sessionId)?.push(message);
};

export const getLogs = (sessionId: string): string[] | undefined => {
    return logs.get(sessionId);
};

export const clearLogs = (sessionId: string): void => {
    logs.delete(sessionId);
};
