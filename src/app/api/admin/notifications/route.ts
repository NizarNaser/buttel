import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { NotificationModel } from '@/models/Schemas';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await connectDB();
        const notifications = await NotificationModel.find({ read: false }).sort({ createdAt: -1 });
        return NextResponse.json(notifications);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id) {
            await NotificationModel.findByIdAndUpdate(id, { read: true });
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
