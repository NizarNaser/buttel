
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { TelephonyManager } from '@/lib/telephony/manager';
import { CompanyModel } from '@/models/Schemas';
import dbConnect from '@/lib/mongodb';

// POST /api/providers/buy
export async function POST(req: Request) {
    // 1. Authenticate Request
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { companyId, phoneNumber, provider = 'twilio', ...purchaseParams } = body;

        if (!companyId || !phoneNumber) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();
        const manager = TelephonyManager.getInstance();
        const adapter = manager.getProvider(provider);

        // 2. Execute Purchase
        const result = await adapter.buyNumber(companyId, phoneNumber, purchaseParams);

        if (!result.success) {
            throw new Error(result.error || 'Failed to purchase number from provider');
        }

        // 3. Update Company Record
        const company = await CompanyModel.findById(companyId);
        if (company) {
            company.phoneNumber = result.phoneNumber;
            company.provider = provider;
            company.twilioSubaccountSid = result.subaccountSid || company.twilioSubaccountSid; // Store SID if applicable
            // Add provider-specific metadata if needed, maybe in a mixed field
            await company.save();
        }

        return NextResponse.json({ success: true, result });

    } catch (error: any) {
        console.error('[Buy Number Error]', error);
        return NextResponse.json({ error: error.message || 'Purchase failed' }, { status: 500 });
    }
}
