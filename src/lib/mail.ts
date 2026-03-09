import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
    if (!process.env.SMTP_HOST) {
        console.log('Skipping email send - SMTP_HOST not configured');
        console.log(`Email to: ${to}, Subject: ${subject}`);
        return;
    }

    try {
        await transporter.sendMail({
            from: `"butTel AI" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });
    } catch (error) {
        console.error('Error sending email:', error);
    }
}
