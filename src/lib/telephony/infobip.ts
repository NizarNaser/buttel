
import { IProviderAdapter, PhoneNumber, BuyResult } from './types';
import { CompanyModel } from '@/models/Schemas';
import connectDB from '@/lib/mongodb';

export class InfobipAdapter implements IProviderAdapter {
    id = 'infobip';
    private apiKey: string | undefined;
    private baseUrl: string | undefined;

    constructor() {
        this.apiKey = process.env.INFOBIP_API_KEY;
        this.baseUrl = process.env.INFOBIP_BASE_URL;
    }

    async searchNumbers(country: string, type: string, options?: any): Promise<PhoneNumber[]> {
        const areaCode = options?.areaCode;
        // 1. Validation
        if (!this.apiKey || !this.baseUrl || this.apiKey.includes('your_')) {
            console.warn("[INFOBIP] API Key/URL missing. Usage: Mock Mode.");
            return this.getMockNumbers(country);
        }

        try {
            // 2. Real API Call
            const query = new URLSearchParams({ country: country, limit: '10' });
            if (areaCode) query.append('prefix', areaCode);

            const res = await fetch(`${this.baseUrl}/numbers/1/numbers/available?${query.toString()}`, {
                headers: {
                    'Authorization': `App ${this.apiKey}`,
                    'Accept': 'application/json'
                }
            });

            if (!res.ok) throw new Error(`Infobip API Error: ${res.statusText}`);

            const data = await res.json();

            return (data.numbers || []).map((n: any) => ({
                phoneNumber: n.number,
                friendlyName: n.number,
                country: country,
                region: n.region || '',
                capabilities: { voice: true, sms: true }
            }));

        } catch (error) {
            console.error("[INFOBIP] Search Failed (falling back to mock):", error);
            return this.getMockNumbers(country);
        }
    }

    async buyNumber(companyId: string, number: string, legalEntity: any): Promise<BuyResult> {
        console.log(`[INFOBIP] Buying number ${number}...`);

        if (!this.apiKey || !this.baseUrl || this.apiKey.includes('your_')) {
            throw new Error("Cannot buy number: Invalid Infobip Configuration");
        }

        try {
            await connectDB();
            const company = await CompanyModel.findById(companyId);
            if (!company) throw new Error("Company not found");

            // 1. Real API Purchase Call
            const res = await fetch(`${this.baseUrl}/numbers/1/numbers/order`, {
                method: 'POST',
                headers: {
                    'Authorization': `App ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    number: number,
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.requestError?.serviceException?.text || res.statusText);
            }

            // 2. Save to DB
            company.phoneNumber = number;
            company.provider = 'infobip';
            await company.save();

            return {
                success: true,
                phoneNumber: number,
                providerId: 'infobip',
                details: 'Purchased via Infobip API'
            };

        } catch (error: any) {
            console.error("[INFOBIP] Purchase Failed:", error);
            return {
                success: false,
                phoneNumber: number,
                providerId: 'infobip',
                error: error.message
            };
        }
    }

    private getMockNumbers(country: string): PhoneNumber[] {
        const isoToPrefix: Record<string, string> = { 'TR': '+90', 'UA': '+380', 'DE': '+49' };
        const prefix = isoToPrefix[country] || '+44';

        return [
            {
                phoneNumber: `${prefix}7${Math.floor(100000000 + Math.random() * 900000000)}`,
                friendlyName: `Infobip Virtual (Mock)`,
                country: country,
                capabilities: { voice: true, sms: true }
            }
        ];
    }
}
