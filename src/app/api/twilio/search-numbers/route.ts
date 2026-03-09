
import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') || 'DE';
    const areaCode = searchParams.get('areaCode');
    const type = searchParams.get('type') || 'local'; // local, mobile, tollFree

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
        return NextResponse.json({ error: "Twilio credentials missing" }, { status: 500 });
    }

    const client = twilio(accountSid, authToken);

    try {
        const numbers = await client.availablePhoneNumbers(country)
            .fetch();

        let available;
        const opts: any = { limit: 10 };
        if (areaCode) opts.areaCode = parseInt(areaCode);

        // Twilio types: local, mobile, tollFree
        if (type === 'mobile') {
            available = await client.availablePhoneNumbers(country).mobile.list(opts);
        } else if (type === 'tollFree') {
            available = await client.availablePhoneNumbers(country).tollFree.list(opts);
        } else {
            // Default to local
            available = await client.availablePhoneNumbers(country).local.list(opts);
        }

        return NextResponse.json({ numbers: available });

    } catch (error: any) {
        console.error("Twilio Search Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
