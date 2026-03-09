
import { IProviderAdapter } from './types';
import { TwilioAdapter } from './twilio';
import { CequensAdapter } from './cequens';
import { InfobipAdapter } from './infobip';
import { KaleyraAdapter } from './kaleyra';

export class TelephonyManager {
    private static instance: TelephonyManager;
    private adapters: Record<string, IProviderAdapter> = {};

    private constructor() {
        // Initialize adapters
        this.adapters['twilio'] = new TwilioAdapter();
        this.adapters['cequens'] = new CequensAdapter();
        this.adapters['infobip'] = new InfobipAdapter();
        this.adapters['kaleyra'] = new KaleyraAdapter();
    }

    public static getInstance(): TelephonyManager {
        if (!TelephonyManager.instance) {
            TelephonyManager.instance = new TelephonyManager();
        }
        return TelephonyManager.instance;
    }

    public getProvider(id: string): IProviderAdapter {
        const adapter = this.adapters[id];
        if (!adapter) {
            console.warn(`Provider ${id} not found, defaulting to Twilio.`);
            return this.adapters['twilio'];
        }
        return adapter;
    }
}
