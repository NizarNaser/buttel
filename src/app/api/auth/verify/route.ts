import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { CompanyModel, NotificationModel } from '@/models/Schemas';

export async function POST(req: Request) {
    try {
        const { email, code } = await req.json();
        await connectDB();

        const company = await CompanyModel.findOne({ email, verificationCode: code });
        if (!company) {
            return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
        }

        company.verified = true;
        company.verificationCode = undefined;
        await company.save();

        // Notify Admin
        await NotificationModel.create({
            type: 'NEW_REGISTRATION',
            companyName: company.name,
            companyId: company._id,
            message: `New company registered: ${company.name}. Needs a phone number assignment.`
        });

        return NextResponse.json({ message: 'Account verified successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
