
import twilio from 'twilio';
import { IProviderAdapter, PhoneNumber, BuyResult } from './types';
import { CompanyModel } from '@/models/Schemas';
import connectDB from '@/lib/mongodb';

export class TwilioAdapter implements IProviderAdapter {
    id = 'twilio';
    private client: any;

    constructor() {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.TWILIO_AUTH_TOKEN;
        if (sid && token) {
            this.client = twilio(sid, token);
        }
    }

    async searchNumbers(country: string, type: string, options?: any): Promise<PhoneNumber[]> {
        const areaCode = options?.areaCode;
        if (!this.client) throw new Error("Twilio credentials missing");

        try {
            // Fix: Cast 'type' to specific Twilio accepted strings or default to 'local'
            const searchType = (type === 'mobile' || type === 'tollFree') ? type : 'local';

            const opts: any = { limit: 10 };
            if (areaCode) opts.areaCode = parseInt(areaCode);

            const results = await (this.client.availablePhoneNumbers(country) as any)[searchType].list(opts);

            return results.map((r: any) => ({
                phoneNumber: r.phoneNumber,
                friendlyName: r.friendlyName,
                locality: r.locality,
                region: r.region,
                country: r.isoCountry,
                capabilities: r.capabilities
            }));
        } catch (error: any) {
            console.error("Twilio Search Error:", error);
            // Fallback strategy if specific type fails, try mobile if we were looking for local, or vice versa if needed
            // But for now, let's keep it simple: if fail, return empty. 
            // The previous code had a hardcoded fallback to mobile. We can keep that if looking for local.

            if (error.code === 20404) return []; // Not found

            try {
                if (type !== 'mobile') {
                    const results = await this.client.availablePhoneNumbers(country).mobile.list({ limit: 10 });
                    return results.map((r: any) => ({
                        phoneNumber: r.phoneNumber,
                        friendlyName: r.friendlyName,
                        country: r.isoCountry,
                        capabilities: r.capabilities
                    }));
                }
            } catch (e) {
                return [];
            }
            return [];
        }
    }

    async buyNumber(companyId: string, number: string, legalEntity: any): Promise<BuyResult> {
        if (!this.client) throw new Error("Twilio credentials missing");

        await connectDB();
        const company = await CompanyModel.findById(companyId);
        if (!company) throw new Error("Company not found");

        let subaccountSid = company.twilioSubaccountSid;

        // 1. Create Subaccount if needed
        if (!subaccountSid) {
            const sub = await this.client.api.accounts.create({
                friendlyName: `butTel - ${company.name}`
            });
            subaccountSid = sub.sid;
            company.twilioSubaccountSid = subaccountSid;
            await company.save();
        }

        const subClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!, { accountSid: subaccountSid });

        // 2. Regulatory Compliance for Germany (+49)
        let bundleSid = company.twilioBundleSid;
        const isGermany = number.startsWith('+49');

        if (isGermany) {
            if (!bundleSid) {
                // In a real flow, we would create the bundle and upload documents here or elsewhere.
                // For now, we notify that a bundle is required.
                return {
                    success: false,
                    phoneNumber: number,
                    providerId: 'twilio',
                    error: "Regulatory Compliance Required for Germany. Please submit business registration and local address proof.",
                    details: { requiresBundle: true, country: 'DE' }
                };
            }

            // Check bundle status if we have one
            try {
                const bundle = await subClient.numbers.v2.regulatoryCompliance.bundles(bundleSid).fetch();
                const status = bundle.status as string;
                if (status !== 'valid' && status !== 'twilio-approved' && status !== 'approved') {
                    return {
                        success: false,
                        phoneNumber: number,
                        providerId: 'twilio',
                        error: `Regulatory bundle status: ${status}. It must be 'approved' to purchase a German number.`,
                        details: { bundleStatus: status, bundleSid }
                    };
                }
            } catch (err: any) {
                console.error("Bundle Fetch Error:", err);
            }
        }

        // 3. Create Address
        const addressData = legalEntity.address || legalEntity;
        const addr = await subClient.addresses.create({
            customerName: legalEntity.legalName || company.name,
            street: addressData.street,
            city: addressData.city,
            region: addressData.region || addressData.city,
            postalCode: addressData.postalCode,
            isoCountry: addressData.isoCountry || (isGermany ? 'DE' : 'US'),
            friendlyName: `${legalEntity.legalName || company.name} - Primary`
        });

        // 4. Buy Number
        try {
            const baseUrl = process.env.NEXTAUTH_URL || 'https://buttel.vercel.app';
            const purchaseParams: any = {
                phoneNumber: number,
                addressSid: addr.sid,
                voiceUrl: `${baseUrl}/api/voice`,
                voiceMethod: 'POST',
                statusCallback: `${baseUrl}/api/voice/status`,
                statusCallbackMethod: 'POST'
            };

            // Critical for Germany: Attach the Regulatory Bundle
            if (isGermany && bundleSid) {
                purchaseParams.bundleSid = bundleSid;
            }

            const purchased = await subClient.incomingPhoneNumbers.create(purchaseParams);

            // Update company
            company.phoneNumber = purchased.phoneNumber;
            company.address = `${addressData.street}, ${addressData.postalCode} ${addressData.city}, ${addressData.isoCountry || 'DE'}`;
            await company.save();

            return {
                success: true,
                phoneNumber: purchased.phoneNumber,
                providerId: 'twilio',
                subaccountSid: subaccountSid
            };
        } catch (error: any) {
            return {
                success: false,
                phoneNumber: number,
                providerId: 'twilio',
                error: error.message,
                details: error.code
            };
        }
    }

    /**
     * Helper to upload a document to Twilio's special upload endpoint
     */
    private async uploadTwilioDocument(subClient: any, friendlyName: string, type: string, fileData: Buffer, fileName: string): Promise<string> {
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');

        // Twilio requires a specific format for file uploads to the regulatory API
        const formData = new FormData();
        formData.append('FriendlyName', friendlyName);
        formData.append('Type', type);

        const blob = new Blob([fileData as any], { type: 'application/pdf' }); // Assuming PDF for business docs
        formData.append('Content', blob, fileName);

        const response = await fetch(`https://numbers-upload.twilio.com/v2/RegulatoryCompliance/SupportingDocuments`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`
            },
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Twilio Upload Error: ${err.message || response.statusText}`);
        }

        const result: any = await response.json();
        return result.sid;
    }

    /**
     * Fully automates the submission of regulatory documents for German businesses.
     */
    async submitRegulatoryBundle(companyId: string, data: {
        legalName: string,
        registrationNumber: string,
        email: string,
        address: { street: string, city: string, postalCode: string },
        documentBuffer: Buffer,
        documentName: string
    }): Promise<any> {
        if (!this.client) throw new Error("Twilio credentials missing");

        await connectDB();
        const company = await CompanyModel.findById(companyId);
        if (!company) throw new Error("Company not found");

        let subaccountSid = company.twilioSubaccountSid;
        if (!subaccountSid) {
            const sub = await this.client.api.accounts.create({ friendlyName: `butTel - ${company.name}` });
            subaccountSid = sub.sid;
            company.twilioSubaccountSid = subaccountSid;
        }

        const subClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!, { accountSid: subaccountSid });

        try {
            // 1. Create End User (Business)
            const endUser = await subClient.numbers.v2.regulatoryCompliance.endUsers.create({
                friendlyName: data.legalName,
                type: 'business'
            });

            // 2. Upload Supporting Document (Gewerbeanmeldung)
            const documentSid = await this.uploadTwilioDocument(
                subClient,
                `${data.legalName} Reg Doc`,
                'germany_registration_document', // Standard Twilio code for DE
                data.documentBuffer,
                data.documentName
            );

            // 3. Create Bundle
            // Note: In production, you'd fetch the Regulation SID for "German Local Business"
            // For now we create a generic 'customer-profile' bundle
            const bundle = await subClient.numbers.v2.regulatoryCompliance.bundles.create({
                friendlyName: `${data.legalName} DE Compliance`,
                email: data.email,
                isoCountry: 'DE',
                numberType: 'local',
                endUserType: 'business'
            });

            // 4. Link everything
            await subClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid).itemAssignments.create({ objectSid: endUser.sid });
            await subClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid).itemAssignments.create({ objectSid: documentSid });

            // 5. Submit for Review
            const submittedBundle = await subClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid).update({ status: 'pending-review' });

            company.twilioBundleSid = bundle.sid;
            company.twilioComplianceStatus = 'pending';
            await company.save();

            return {
                success: true,
                bundleSid: bundle.sid,
                status: submittedBundle.status,
                message: "Regulatory bundle submitted for review. Approval usually takes 24-72 hours."
            };

        } catch (error: any) {
            console.error("Regulatory Submission Failure:", error);
            throw new Error(`Compliance Submission Failed: ${error.message}`);
        }
    }
}
