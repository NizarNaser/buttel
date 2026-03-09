
import { IProviderAdapter, PhoneNumber, BuyResult } from './types';
import { CompanyModel } from '@/models/Schemas';
import connectDB from '@/lib/mongodb';

export class CequensAdapter implements IProviderAdapter {
    id = 'cequens';
    private apiKey: string | undefined;

    constructor() {
        this.apiKey = process.env.CEQUENS_API_KEY;
    }

    async searchNumbers(country: string, type: string, options?: any): Promise<PhoneNumber[]> {
        const areaCode = options?.areaCode;
        // 1. Validation
        if (!this.apiKey || this.apiKey.includes('your_')) {
            console.warn("[CEQUENS] API Key missing or default. Usage: Mock Mode.");
            return this.getMockNumbers(country);
        }

        try {
            // 2. Real API Call
            const query = new URLSearchParams({ country, ...(areaCode && { prefix: areaCode }) });

            const res = await fetch(`https://api.cequens.com/v1/numbers/available?${query.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                }
            });

            if (!res.ok) throw new Error(`Cequens API Error: ${res.statusText}`);

            const data = await res.json();

            // Map real response to our interface
            return data.numbers.map((n: any) => ({
                phoneNumber: n.number,
                friendlyName: n.number,
                country: country,
                capabilities: { voice: true, sms: true }
            }));

        } catch (error) {
            console.error("[CEQUENS] Search Failed (falling back to mock):", error);
            return this.getMockNumbers(country);
        }
    }

    async buyNumber(companyId: string, number: string, legalEntity: any): Promise<BuyResult> {
        console.log(`[CEQUENS] Attempting to buy number ${number}...`);

        if (!this.apiKey || this.apiKey.includes('your_')) {
            throw new Error("Cannot buy number: Invalid CEQUENS API Key");
        }

        try {
            await connectDB();
            const company = await CompanyModel.findById(companyId);
            if (!company) throw new Error("Company not found");

            // 1. Real API Purchase Call
            const res = await fetch('https://api.cequens.com/v1/numbers/purchase', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    number: number,
                    // Cequens often requires linking to a "Project" or "App" ID
                    // appId: process.env.CEQUENS_APP_ID 
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || res.statusText);
            }

            // 2. Save to DB
            company.phoneNumber = number;
            company.address = `${legalEntity.street}, ${legalEntity.postalCode} ${legalEntity.city}`;
            company.provider = 'cequens';
            await company.save();

            return {
                success: true,
                phoneNumber: number,
                providerId: 'cequens',
                details: 'Purchased via CEQUENS API'
            };

        } catch (error: any) {
            console.error("[CEQUENS] Purchase Failed:", error);
            return {
                success: false,
                phoneNumber: number,
                providerId: 'cequens',
                error: error.message
            };
        }
    }

    private getMockNumbers(country: string): PhoneNumber[] {
        const prefix = country === 'EG' ? '+20' : country === 'SA' ? '+966' : '+971';
        return [
            {
                phoneNumber: `${prefix}10${Math.floor(10000000 + Math.random() * 90000000)}`,
                friendlyName: `${country} National (Mock)`,
                locality: 'Cairo',
                region: 'Cairo',
                country: country,
                capabilities: { voice: true, sms: true }
            },
            {
                phoneNumber: `${prefix}11${Math.floor(10000000 + Math.random() * 90000000)}`,
                friendlyName: `${country} Gold (Mock)`,
                locality: 'Giza',
                region: 'Giza',
                country: country,
                capabilities: { voice: true, sms: true }
            }
        ];
    }
}
