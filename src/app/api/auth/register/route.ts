import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { CompanyModel } from '@/models/Schemas';
import { sendEmail } from '@/lib/mail';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password, supportedLanguages, address, originalPhoneNumber } = await req.json();
    await connectDB();

    const existing = await CompanyModel.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    let verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // FOR LOCAL TESTING: Force code to 123456 if in development


    const hashedPassword = await bcrypt.hash(password, 10);

    const company = await CompanyModel.create({
      name,
      email,
      password: hashedPassword, // SECURE: Hashed password

      verificationCode,
      supportedLanguages: supportedLanguages || ['English'],
      phoneNumber: `PENDING_${Date.now()}`,
      address,
      originalPhoneNumber,
      credits: 5,
      termsAccepted: true,
      termsAcceptedAt: new Date()
    });

    await sendEmail({
      to: email,
      subject: 'Welcome to butTel - Verify your account',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to butTel AI!</h2>
          <p>Thank you for registering. Please use the code below to verify your account:</p>
          <div style="font-size: 32px; font-weight: bold; color: #0ea5e9; padding: 10px; border: 1px dashed #0ea5e9; display: inline-block;">
            ${verificationCode}
          </div>
          <p>Your AI assistant is ready to help your business.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: 'Registration successful. Verification code sent.', id: company._id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
