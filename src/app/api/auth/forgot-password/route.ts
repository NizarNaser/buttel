import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { CompanyModel } from '@/models/Schemas';
import { sendEmail } from '@/lib/mail';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { email } = await req.json();

        const company = await CompanyModel.findOne({ email });
        if (!company) {
            // Return 200 even if not found to prevent enumeration
            return NextResponse.json({ success: true, message: 'If that email exists, we sent a link.' });
        }

        // Generate Token
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); // 1 hour

        company.resetPasswordToken = token;
        company.resetPasswordExpires = expiry;
        await company.save();

        const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

        await sendEmail({
            to: email,
            subject: 'Reset Your Password - butTel',
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #0ea5e9;">Password Reset Request</h2>
                    <p>You requested to reset your password. Click the link below to set a new one:</p>
                    <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background: #0ea5e9; color: white; border-radius: 6px; text-decoration: none; margin: 20px 0;">Reset Password</a>
                    <p style="color: #64748b; font-size: 0.9rem;">This link is valid for 1 hour.</p>
                </div>
            `
        });

        return NextResponse.json({ success: true, message: 'Check your email for the reset link.' });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
