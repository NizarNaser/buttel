import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { PaymentModel, CallLogModel, CompanyModel } from '@/models/Schemas';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('companyId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let query: any = {};
        if (companyId) query.companyId = companyId;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const payments = await PaymentModel.find(query).sort({ createdAt: -1 });
        const calls = await CallLogModel.find(query).sort({ createdAt: -1 });

        // If it's a specific company, we can calculate stats
        let stats = null;
        if (companyId) {
            const company = await CompanyModel.findById(companyId);
            const totalSpent = payments.reduce((acc, p) => acc + p.amount, 0);
            const totalDuration = calls.reduce((acc, c) => acc + (c.duration || 0), 0);
            const totalCost = calls.reduce((acc, c) => acc + (c.cost || 0), 0);

            stats = {
                companyName: company?.name,
                totalRechargedUSD: totalSpent,
                totalMinutesUsed: Math.ceil(totalDuration / 60),
                techCostUSD: totalCost,
                remainingCredits: company?.credits
            };
        }

        return NextResponse.json({ payments, calls, stats });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
