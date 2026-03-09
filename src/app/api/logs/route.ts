import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { CallLogModel } from '@/models/Schemas';

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('companyId');

        const query = companyId ? { companyId } : {};
        const logs = await CallLogModel.find(query).sort({ timestamp: -1 }).limit(50);

        return NextResponse.json(logs);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
