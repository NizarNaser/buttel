import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { CompanyModel } from '@/models/Schemas';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: Request) {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        const users = await CompanyModel.find({}, '-password'); // Exclude password
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        const body = await req.json();

        const existing = await CompanyModel.findOne({ email: body.email });
        if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 400 });

        const newUser = await CompanyModel.create({
            ...body,
            verified: true, // Admin created users are verified
            credits: body.role === 'admin' ? 9999 : (body.credits || 5)
        });

        return NextResponse.json(newUser);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session: any = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await connectDB();
        const body = await req.json();
        const { id, password, ...updates } = body;

        // Security check: Only admins can change roles/permissions
        if (updates.role || updates.permissions) {
            if (session.user.role !== 'admin') {
                return NextResponse.json({ error: "Only admins can change roles/permissions" }, { status: 403 });
            }
        }

        // Allow users to update their own profile, or admins to update anyone
        if (session.user.id !== id && session.user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (password && password.length > 0) {
            updates.password = password; // In a real app, hash this
        }

        const updatedUser = await CompanyModel.findByIdAndUpdate(id, updates, { new: true }).select('-password');
        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        // Prevent deleting self
        if (id === session.user.id) {
            return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
        }

        await CompanyModel.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
