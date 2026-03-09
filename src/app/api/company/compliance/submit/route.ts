
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { TwilioAdapter } from '@/lib/telephony/twilio';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const formData = await req.formData();
        const companyId = formData.get('companyId') as string;
        const legalName = formData.get('legalName') as string;
        const email = formData.get('email') as string;
        const registrationNumber = formData.get('registrationNumber') as string;
        const file = formData.get('document') as File;

        if (!companyId || !file || !legalName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const twilio = new TwilioAdapter();
        const result = await twilio.submitRegulatoryBundle(companyId, {
            legalName,
            email,
            registrationNumber,
            address: {
                street: formData.get('street') as string,
                city: formData.get('city') as string,
                postalCode: formData.get('postalCode') as string
            },
            documentBuffer: buffer,
            documentName: file.name
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[Regulatory Submit API Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
