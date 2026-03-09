
import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from '@/lib/mongodb';
import { CompanyModel } from '@/models/Schemas';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { companyId, phoneNumber, friendlyName, address, legalName } = await req.json();

        if (!companyId || !phoneNumber || !address || !legalName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectDB();
        const company = await CompanyModel.findById(companyId);
        if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

        const masterSid = process.env.TWILIO_ACCOUNT_SID;
        const masterToken = process.env.TWILIO_AUTH_TOKEN;

        if (!masterSid || !masterToken) {
            return NextResponse.json({ error: "Server misconfiguration: Twilio credentials missing" }, { status: 500 });
        }

        const masterClient = twilio(masterSid, masterToken);
        let subaccountSid = company.twilioSubaccountSid;

        // 1. Ensure Subaccount Exists
        if (!subaccountSid) {
            console.log(`Creating subaccount for ${company.name}...`);
            const subaccount = await masterClient.api.accounts.create({
                friendlyName: `butTel - ${company.name}`
            });
            subaccountSid = subaccount.sid;

            // Save immediately
            company.twilioSubaccountSid = subaccountSid;
            await company.save();
        }

        // 2. Initialize Client as the Subaccount
        // Using the master credentials but targeting the subaccount SID
        const subClient = twilio(masterSid, masterToken, { accountSid: subaccountSid });

        // 3. Create Address (Required for German numbers)
        // Data must be accurate for German compliance
        console.log(`Creating address for ${legalName}...`);
        const twilioAddress = await subClient.addresses.create({
            customerName: legalName,
            street: address.street,
            city: address.city,
            region: address.region || '', // Optional for some countries, but good to have
            postalCode: address.postalCode,
            isoCountry: address.isoCountry || 'DE',
            friendlyName: `${legalName} - Primary Address`
        });

        // 4. Purchase the Phone Number
        console.log(`Purchasing ${phoneNumber}...`);

        // We configure the Voice URL immediately to our platform
        // This makes us the "Software" facilitator
        const baseUrl = process.env.NEXTAUTH_URL || 'https://buttel.vercel.app'; // Fallback needs to be real

        const purchasedNumber = await subClient.incomingPhoneNumbers.create({
            phoneNumber: phoneNumber,
            addressSid: twilioAddress.sid,
            voiceUrl: `${baseUrl}/api/voice`, // Our technical platform
            voiceMethod: 'POST',
            statusCallback: `${baseUrl}/api/voice/status`,
            statusCallbackMethod: 'POST',
            friendlyName: friendlyName || camelCaseName(legalName)
        });

        // 5. Update Company Record
        company.phoneNumber = purchasedNumber.phoneNumber;
        company.address = `${address.street}, ${address.postalCode} ${address.city}, ${address.isoCountry}`;

        // Save structured data if schema allows, or just updated string
        await company.save();

        return NextResponse.json({
            success: true,
            message: "Number purchased successfully",
            phoneNumber: purchasedNumber.phoneNumber,
            subaccountSid: subaccountSid,
            addressSid: twilioAddress.sid
        });

    } catch (error: any) {
        console.error("Twilio Purchase Error:", error);
        return NextResponse.json({
            error: error.message || "Failed to purchase number",
            details: error.code ? `Twilio Error Code: ${error.code}` : undefined
        }, { status: 500 });
    }
}

function camelCaseName(name: string) {
    return name.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
}
