
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { CompanyModel, NotificationModel } from '@/models/Schemas';
import twilio from 'twilio';

/**
 * Webhook handler for Twilio Regulatory Compliance status changes.
 * Configure this URL in Twilio Console / Regulatory Compliance / Status Callback
 */
export async function POST(req: Request) {
    try {
        const body = await req.formData();
        const bundleSid = body.get('RegulatoryComplianceBundleSid') as string;
        const status = body.get('RegulatoryComplianceBundleStatus') as string;

        if (!bundleSid || !status) {
            return NextResponse.json({ error: 'Missing bundle data' }, { status: 400 });
        }

        await connectDB();

        // 1. Find the company associated with this Bundle SID
        const company = await CompanyModel.findOne({ twilioBundleSid: bundleSid });
        if (!company) {
            return NextResponse.json({ error: 'Company for this bundle not found' }, { status: 404 });
        }

        // 2. Map Twilio status to our internal status
        // Twilio statuses: valid, expired, provisioning, etc.
        let internalStatus: string = 'pending';
        if (status === 'valid' || status === 'approved') internalStatus = 'approved';
        if (status === 'twilio-rejected' || status === 'rejected') internalStatus = 'rejected';

        // 3. Update company status
        company.twilioComplianceStatus = internalStatus;
        await company.save();

        // 4. Create Admin Notification
        let message = `Regulatory bundle for ${company.name} is now ${internalStatus}.`;
        if (internalStatus === 'approved') {
            message = `✅ Compliance Approved: ${company.name} can now purchase German phone numbers.`;
        } else if (internalStatus === 'rejected') {
            message = `❌ Compliance Rejected: ${company.name} documents were not accepted by Twilio.`;
        }

        await NotificationModel.create({
            type: internalStatus === 'approved' ? 'RECHARGE_SUCCESS' : 'NEW_REGISTRATION', // Using existing categories for simplicity
            companyName: company.name,
            companyId: company._id,
            message: message,
            read: false
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Regulatory Webhook Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
