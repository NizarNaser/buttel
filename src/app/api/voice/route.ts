import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { isOfficeHours } from '@/lib/assistant';
import connectDB from '@/lib/mongodb';
import { CompanyModel } from '@/models/Schemas';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(req: Request) {
    const formData = await req.formData();
    const to = formData.get('To') as string;

    await connectDB();
    const company = await CompanyModel.findOne({ phoneNumber: to });

    const response = new VoiceResponse();

    if (!company) {
        response.say({
            language: 'en-US',
            voice: 'Polly.Amy'
        }, 'Sorry, this number is not assigned to any business in our system.');
        response.say({
            language: 'ar-AE',
            voice: 'Polly.Zeina'
        }, 'عذراً، هذا الرقم غير مرتبط بأي شركة في نظامنا.');
        response.hangup();
        return new NextResponse(response.toString(), { headers: { 'Content-Type': 'text/xml' } });
    }

    if (company.isActive === false) {
        response.say({
            language: 'en-US',
            voice: 'Polly.Amy'
        }, `The services for ${company.name} are currently suspended. Please try again later.`);
        response.say({
            language: 'de-DE',
            voice: 'Polly.Vicki'
        }, `Die Dienste für ${company.name} sind derzeit eingestellt. Bitte versuchen Sie es später noch einmal.`);
        response.hangup();
        return new NextResponse(response.toString(), { headers: { 'Content-Type': 'text/xml' } });
    }

    const open = isOfficeHours();

    if (!open) {
        response.say({
            language: 'en-US',
            voice: 'Polly.Amy'
        }, `Thank you for calling ${company?.name || 'our company'}. Our office is currently closed. We are open Monday to Friday, 9 AM to 5 PM Germany time.`);

        response.say({
            language: 'de-DE',
            voice: 'Polly.Vicki'
        }, `Vielen Dank für Ihren Anruf bei ${company?.name || 'unserer Firma'}. Unser Büro ist derzeit geschlossen.`);

        response.record({
            action: '/api/voice/recording',
            maxLength: 60,
            playBeep: true
        });
    } else {
        const gather = response.gather({
            input: ['speech'],
            action: '/api/voice/process',
            language: 'en-US',
            enhanced: true,
            speechTimeout: 'auto'
        });

        gather.say({
            voice: 'Polly.Amy'
        }, `Welcome to ${company?.name || 'our company'}. How may I help you today?`);

        gather.say({
            language: 'de-DE',
            voice: 'Polly.Vicki'
        }, `Willkommen bei ${company?.name || 'unserer Firma'}. Wie kann ich Ihnen heute helfen?`);

        response.redirect('/api/voice');
    }

    return new NextResponse(response.toString(), {
        headers: {
            'Content-Type': 'text/xml',
            'X-Twilio-Status-Callback': '/api/voice/status' // This is a hint, but we should also set it in the response object if possible
        },
    });
}
