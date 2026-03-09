
import { IProviderAdapter, PhoneNumber, BuyResult } from './types';
import { CompanyModel } from '@/models/Schemas';
import connectDB from '@/lib/mongodb';

export class KaleyraAdapter implements IProviderAdapter {
    id = 'kaleyra';
    private apiKey: string | undefined;
    private sid: string | undefined;

    constructor() {
        this.apiKey = process.env.KALEYRA_API_KEY;
        this.sid = process.env.KALEYRA_SID;
    }

    async searchNumbers(country: string, type: string, options?: any): Promise<PhoneNumber[]> {
        const areaCode = options?.areaCode;
        if (!this.apiKey || !this.sid || this.apiKey.includes('your_')) {
            console.warn("[KALEYRA] API Key/SID missing. Usage: Mock Mode.");
            return this.getMockNumbers(country);
        }

        try {
            const query = new URLSearchParams({ country: country });
            if (areaCode) query.append('prefix', areaCode);

            const res = await fetch(`https://api.kaleyra.com/v1/numbers/available?${query.toString()}`, {
                headers: {
                    'api-key': this.apiKey,
                    'sid': this.sid,
                    'Accept': 'application/json'
                }
            });

            if (!res.ok) throw new Error(`Kaleyra API Error: ${res.statusText}`);

            const data = await res.json();

            return (data.data || []).map((n: any) => ({
                phoneNumber: n.number,
                friendlyName: n.number,
                country: country,
                capabilities: {
                    voice: true,
                    sms: true,
                    whatsapp: true
                }
            }));

        } catch (error) {
            console.error("[KALEYRA] Search Failed:", error);
            return this.getMockNumbers(country);
        }
    }

    async buyNumber(companyId: string, number: string, legalEntity: any): Promise<BuyResult> {
        if (!this.apiKey || !this.sid) {
            throw new Error("Cannot buy number: Invalid Kaleyra Configuration");
        }

        try {
            await connectDB();
            const company = await CompanyModel.findById(companyId);
            if (!company) throw new Error("Company not found");

            const res = await fetch(`https://api.kaleyra.com/v1/numbers/purchase`, {
                method: 'POST',
                headers: {
                    'api-key': this.apiKey,
                    'sid': this.sid,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    number: number,
                    country: legalEntity.isoCountry
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || res.statusText);
            }

            company.phoneNumber = number;
            company.provider = 'kaleyra';
            await company.save();

            return {
                success: true,
                phoneNumber: number,
                providerId: 'kaleyra',
                details: 'Purchased via Kaleyra API'
            };

        } catch (error: any) {
            console.error("[KALEYRA] Purchase Failed:", error);
            return {
                success: false,
                phoneNumber: number,
                providerId: 'kaleyra',
                error: error.message
            };
        }
    }

    async sendWhatsApp(to: string, from: string, body: string): Promise<boolean> {
        if (!this.apiKey || !this.sid) {
            console.warn("[KALEYRA] Mock Send WhatsApp to", to, ":", body);
            return true;
        }

        try {
            const res = await fetch(`https://api.kaleyra.com/v1/messages`, {
                method: 'POST',
                headers: {
                    'api-key': this.apiKey,
                    'sid': this.sid,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: to,
                    from: from,
                    channel: 'whatsapp',
                    type: 'text',
                    body: body
                })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.error("[KALEYRA] WhatsApp Send Error:", err.message || res.statusText);
                return false;
            }

            return true;
        } catch (error) {
            console.error("[KALEYRA] WhatsApp Send Exception:", error);
            return false;
        }
    }

    private getMockNumbers(country: string): PhoneNumber[] {
        const isoToPrefix: Record<string, string> = { 'IN': '+91', 'IT': '+39', 'US': '+1' };
        const prefix = isoToPrefix[country] || '+1';

        return [
            {
                phoneNumber: `${prefix}9${Math.floor(100000000 + Math.random() * 900000000)}`,
                friendlyName: `Kaleyra Verified WhatsApp Number`,
                country: country,
                capabilities: {
                    voice: true,
                    sms: true,
                    whatsapp: true
                }
            }
        ];
    }
}
