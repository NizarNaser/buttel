import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const targetSid = searchParams.get('sid') || process.env.TWILIO_ACCOUNT_SID;
    const masterSid = process.env.TWILIO_ACCOUNT_SID;
    const masterToken = process.env.TWILIO_AUTH_TOKEN;

    if (!masterSid || !masterToken || !targetSid) {
        return NextResponse.json({ error: "Twilio credentials missing" }, { status: 500 });
    }

    try {
        const client = twilio(masterSid, masterToken);
        // Fetch balance for the specific subaccount (targetSid)
        const balanceInfo: any = await client.api.v2010.accounts(targetSid).balance.fetch();

        return NextResponse.json({
            balance: balanceInfo.balance,
            currency: balanceInfo.currency,
            sid: targetSid
        });
    } catch (error: any) {
        console.error('Twilio Balance Fetch Error:', error);
        return NextResponse.json({ error: "Could not fetch balance. Make sure you have an upgraded account or correct permissions." }, { status: 500 });
    }
}
