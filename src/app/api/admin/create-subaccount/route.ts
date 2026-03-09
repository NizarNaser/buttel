import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from '@/lib/mongodb';
import { CompanyModel } from '@/models/Schemas';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { companyId } = await req.json();
        await connectDB();

        const company = await CompanyModel.findById(companyId);
        if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
        if (company.twilioSubaccountSid) return NextResponse.json({ error: "Subaccount already exists" }, { status: 400 });

        const masterSid = process.env.TWILIO_ACCOUNT_SID;
        const masterToken = process.env.TWILIO_AUTH_TOKEN;

        if (!masterSid || !masterToken) {
            return NextResponse.json({ error: "Twilio credentials missing" }, { status: 500 });
        }

        const client = twilio(masterSid, masterToken);

        // Create the subaccount
        const subaccount = await client.api.accounts.create({
            friendlyName: `butTel - ${company.name}`
        });

        // Save the SID to the company
        company.twilioSubaccountSid = subaccount.sid;
        await company.save();

        return NextResponse.json({
            success: true,
            subaccountSid: subaccount.sid,
            message: `Subaccount created for ${company.name}`
        });

    } catch (error: any) {
        console.error('Twilio Subaccount Creation Error:', error);
        return NextResponse.json({ error: error.message || "Failed to create subaccount" }, { status: 500 });
    }
}
