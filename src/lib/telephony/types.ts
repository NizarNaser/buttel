
export interface PhoneNumber {
    phoneNumber: string;
    friendlyName?: string;
    locality?: string;
    region?: string;
    country: string;
    costMonthly?: number;
    capabilities?: {
        voice: boolean;
        sms: boolean;
        whatsapp?: boolean;
    };
}

export interface BuyResult {
    success: boolean;
    phoneNumber: string;
    providerId: string;
    subaccountSid?: string;
    error?: string;
    details?: any;
}

export interface IProviderAdapter {
    id: string;
    searchNumbers(country: string, type: string, options?: any): Promise<PhoneNumber[]>;
    buyNumber(companyId: string, number: string, legalEntity: any): Promise<BuyResult>;
}
