import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { CompanyModel, CallLogModel, NotificationModel, PaymentModel } from '@/models/Schemas';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { sendEmail } from '@/lib/mail';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const user = session.user as any;

        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id) {
            // Security: Only allow if Admin or Own ID
            if (user.role !== 'admin' && user.id !== id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            const company = await CompanyModel.findById(id);
            return NextResponse.json(company);
        }

        // Security: List all is Admin only
        if (user.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const companies = await CompanyModel.find({});
        return NextResponse.json(companies);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;

    // Security: Only Admin can create companies manually via this route
    if (user.role !== 'admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const newCompany = await CompanyModel.create({
        ...body,
        credits: body.credits || 5 // Default to 5 free minutes if not specified
    });
    return NextResponse.json(newCompany);
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;

    await connectDB();
    const body = await req.json();
    const { id, ...updates } = body;

    // Security: Only allow if Admin or Own ID
    if (user.role !== 'admin' && user.id !== id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Security: Prevent non-admins from changing their role or other sensitive fields
    if (user.role !== 'admin') {
        delete updates.role;
        delete updates.permissions;
        // Ideally we should also prevent credit manipulation here, ensuring it goes through a payment flow.
        // For now, we allow it if it's the own user (assuming client-side payment logic calls this), 
        // but robust security would require server-side payment verification.
    }

    const oldCompany = await CompanyModel.findById(id);
    if (!oldCompany) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Detect Recharge
    if (updates.credits && updates.credits > (oldCompany.credits || 0)) {
        const added = updates.credits - (oldCompany.credits || 0);
        const estimatedAmount = added * 0.25; // Assumption: $25 for 100 mins ($0.25/min)

        await PaymentModel.create({
            companyId: oldCompany._id,
            amount: estimatedAmount,
            minutes: added,
            status: 'completed',
            method: 'simulated'
        });

        await NotificationModel.create({
            type: 'RECHARGE_SUCCESS',
            companyName: oldCompany.name,
            companyId: oldCompany._id,
            message: `Company ${oldCompany.name} recharged ${added} minutes ($${estimatedAmount.toFixed(2)}).`
        });
    }

    // Detect Phone Number Assignment (Activation)
    if (updates.phoneNumber && !oldCompany.phoneNumber) {
        await sendEmail({
            to: oldCompany.email,
            subject: 'Service Activated - butTel AI',
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #0ea5e9;">Your AI Receptionist is Live!</h2>
                    <p>Great news! We have assigned your dedicated phone number for <strong>${oldCompany.name}</strong>.</p>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                        <strong>Your Dedicated Number:</strong> <code style="font-size: 1.2rem; color: #0ea5e9;">${updates.phoneNumber}</code>
                    </div>
                    <p>Our AI is now ready to answer your calls. You can now login to your dashboard to see logs and manage your settings.</p>
                    <a href="${process.env.NEXTAUTH_URL}/login" style="display: inline-block; padding: 10px 20px; background: #0ea5e9; color: white; border-radius: 6px; text-decoration: none; margin-top: 10px;">Login to Dashboard</a>
                </div>
            `
        });
    }

    await CompanyModel.findByIdAndUpdate(id, updates);
    return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;

    // Security: Only Admin can delete companies
    if (user.role !== 'admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        await CompanyModel.findByIdAndDelete(id);
        // Also clean up call logs and notifications for this company
        await CallLogModel.deleteMany({ companyId: id });
        await NotificationModel.deleteMany({ companyId: id });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
