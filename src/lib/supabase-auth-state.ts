import { proto, AuthenticationState } from '@whiskeysockets/baileys';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

const KEY_MAP: { [T in keyof AuthenticationState['creds']]: string } = {
    noiseKey: 'noise-key',
    signedIdentityKey: 'signed-identity-key',
    signedPreKey: 'signed-pre-key',
    registrationId: 'registration-id',
    advSecretKey: 'adv-secret-key',
    nextPreKeyId: 'next-pre-key-id',
    firstUnuploadedPreKeyId: 'first-unuploaded-pre-key-id',
    accountSyncCounter: 'account-sync-counter',
    accountSettings: 'account-settings',
    // appStateSyncKey: 'app-state-sync-key',
    processedHistoryMessages: 'processed-history-messages',
    myAppStateKeyId: 'my-app-state-key-id',
    lastAccountSyncTimestamp: 'last-account-sync-timestamp',
    platform: 'platform',
    signalIdentities: 'signal-identities',
    me: 'me',
    registered: 'registered',
    pairingEphemeralKeyPair: 'pairing-ephemeral-key-pair',
    pairingCode: 'pairing-code',
    lastPropHash: 'last-prop-hash',
    routingInfo: 'routing-info',
};


const writeData = async (phoneNumber: string, data: any) => {
    const replacer = (key: string, value: any) => {
        if (value && value.type === 'Buffer' && Array.isArray(value.data)) {
            return { type: 'Buffer', data: value.data };
        }
        return value;
    };
    const sessionData = JSON.stringify(data, replacer);
    const { error } = await supabase
        .from('whatsapp_sessions')
        .update({ session_data: sessionData })
        .eq('phone_number', phoneNumber);

    if (error) {
        // If the row doesn't exist, insert it
        if (error.code === 'PGRST116') {
            const { error: insertError } = await supabase
                .from('whatsapp_sessions')
                .insert({ phone_number: phoneNumber, session_data: sessionData });
            if (insertError) {
                console.error('Error inserting session data:', insertError);
            }
        } else {
            console.error('Error updating session data:', error);
        }
    }
};

const readData = async (phoneNumber: string) => {
    const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('session_data')
        .eq('phone_number', phoneNumber)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error reading session data:', error);
        return null;
    }

    if (data && data.session_data) {
        const reviver = (key: string, value: any) => {
            if (value && value.type === 'Buffer' && Array.isArray(value.data)) {
                return Buffer.from(value.data);
            }
            return value;
        };
        return JSON.parse(data.session_data, reviver);
    }
    return null;
};

const removeData = async (phoneNumber: string) => {
    const { error } = await supabase
        .from('whatsapp_sessions')
        .delete()
        .eq('phone_number', phoneNumber);

    if (error) {
        console.error('Error deleting session data:', error);
    }
};

export const useSupabaseAuthState = async (phoneNumber: string): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> => {
    let creds: AuthenticationState['creds'];
    let keys: any = {};

    const data = await readData(phoneNumber);

    if (data) {
        creds = data.creds;
        keys = data.keys;
    } else {
        creds = {
            noiseKey: { private: Buffer.alloc(32), public: Buffer.alloc(32) },
            signedIdentityKey: { private: Buffer.alloc(32), public: Buffer.alloc(32) },
            signedPreKey: { keyPair: { private: Buffer.alloc(32), public: Buffer.alloc(32) }, signature: Buffer.alloc(64), keyId: 0 },
            registrationId: 0,
            advSecretKey: '',
            nextPreKeyId: 0,
            firstUnuploadedPreKeyId: 0,
            accountSyncCounter: 0,
            accountSettings: {
                unarchiveChats: false
            },
            myAppStateKeyId: '',
            lastAccountSyncTimestamp: 0,
            platform: '',
            signalIdentities: [],
            me: { id: '', name: '' },
            processedHistoryMessages: [],
            registered: false,
            pairingEphemeralKeyPair: { private: Buffer.alloc(32), public: Buffer.alloc(32) },
            pairingCode: '',
            lastPropHash: '',
            routingInfo: Buffer.alloc(0),
        };
        keys = {};
    }


    const saveCreds = () => {
        return writeData(phoneNumber, { creds, keys });
    };

    return {
        state: {
            creds,
            keys: {
                get: (type: any, ids: string[]) => {
                    const key = type;
                    return ids.reduce(
                        (dict, id) => {
                            let value = keys[key]?.[id];
                            if(value) {
                                if(type === 'app-state-sync-key') {
                                    value = proto.Message.AppStateSyncKeyData.fromObject(value);
                                }
                                dict[id] = value;
                            }
                            return dict;
                        }, {} as Record<string, any>
                    );
                },
                set: (data: any) => {
                    for(const type in data) {
                        const key = type;
                        for(const id in data[type]) {
                            if(!keys[key]) {
                                keys[key] = {};
                            }
                            keys[key][id] = data[type][id];
                        }
                    }
                    saveCreds();
                }
            }
        },
        saveCreds
    };
};
