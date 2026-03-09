import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mail';

export async function POST(req: Request) {
    try {
        const { name, email, subject, message } = await req.json();

        if (!name || !email || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Send email to admin (using the SMTP user as the receiving admin address for now)
        const adminEmail = process.env.SMTP_USER || 'admin@buttel.com';

        await sendEmail({
            to: adminEmail,
            subject: `Contact Form: ${subject || 'New Message'} from ${name}`,
            html: `
                <div style="font-family: sans-serif; color: #333;">
                    <h2 style="color: #0ea5e9;">New Contact Message</h2>
                    <p>You have received a new message from the <strong>butTel</strong> contact form.</p>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <hr style="border-top: 1px solid #cbd5e1; margin: 10px 0;">
                        <p><strong>Message:</strong></p>
                        <p style="white-space: pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
                    </div>
                </div>
            `
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Contact API Error:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
