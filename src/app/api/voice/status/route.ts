import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { CompanyModel, CallLogModel, NotificationModel } from '@/models/Schemas';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const callSid = formData.get('CallSid') as string;
        const duration = parseInt(formData.get('CallDuration') as string || '0');
        const to = formData.get('To') as string;

        await connectDB();
        const company = await CompanyModel.findOne({ phoneNumber: to });

        if (company) {
            // Update company total usage
            const minutes = Math.ceil(duration / 60);
            await CompanyModel.findByIdAndUpdate(company._id, {
                $inc: { totalMinutesUsed: minutes }
            });

            // Update the last call log with duration
            // Note: We might need to store CallSid in CallLog if we want perfect matching, 
            // but for now we'll update the most recent log for this company.
            const latestLog = await CallLogModel.findOne({ companyId: company._id }).sort({ createdAt: -1 });
            if (latestLog) {
                latestLog.duration = duration;
                latestLog.cost = (duration / 60) * 0.05; // Tech cost rate
                await latestLog.save();
            }

            // Low Balance Check for Admin Notification
            if (company.credits < 2 && !company.lowBalanceAlertSent) {
                await NotificationModel.create({
                    type: 'LOW_BALANCE',
                    companyName: company.name,
                    companyId: company._id,
                    message: `CRITICAL: Company ${company.name} has only ${company.credits} minutes left.`
                });
                await CompanyModel.findByIdAndUpdate(company._id, { lowBalanceAlertSent: true });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Status Callback Error:', error);
        return NextResponse.json({ error: 'Failed to process status' }, { status: 500 });
    }
}
