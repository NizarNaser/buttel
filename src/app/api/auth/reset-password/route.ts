import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { CompanyModel } from '@/models/Schemas';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { token, password } = await req.json();

        const company = await CompanyModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!company) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
        }

        company.password = password; // In a real app, hash this! but current system stores plain per user's existing setup
        company.resetPasswordToken = undefined;
        company.resetPasswordExpires = undefined;
        await company.save();

        return NextResponse.json({ success: true, message: 'Password reset successfully' });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
