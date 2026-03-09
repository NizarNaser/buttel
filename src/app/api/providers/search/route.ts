
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { TelephonyManager } from '@/lib/telephony/manager';

// GET /api/providers/search?country=US&type=local&provider=twilio
export async function GET(req: Request) {
    // 1. Authenticate Request
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') || 'US';
    const type = searchParams.get('type') || 'local';
    const areaCode = searchParams.get('areaCode') || undefined;
    const providerName = searchParams.get('provider') || 'twilio';

    try {
        const manager = TelephonyManager.getInstance();
        const adapter = manager.getProvider(providerName);

        const numbers = await adapter.searchNumbers(country, type, { areaCode });

        return NextResponse.json({
            success: true,
            provider: providerName,
            count: numbers.length,
            numbers
        });

    } catch (error: any) {
        console.error(`[Search Error - ${providerName}]`, error);
        return NextResponse.json({
            error: error.message || 'Failed to search numbers',
            provider: providerName
        }, { status: 500 });
    }
}
