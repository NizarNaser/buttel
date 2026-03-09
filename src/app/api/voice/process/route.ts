import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { openai } from '@/lib/openai';
import { RECEPTIONIST_SYSTEM_PROMPT } from '@/lib/assistant';
import connectDB from '@/lib/mongodb';
import { CompanyModel, CallLogModel, NotificationModel } from '@/models/Schemas';
import { sendEmail } from '@/lib/mail';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(req: Request) {
    const formData = await req.formData();
    const transcript = formData.get('SpeechResult') as string;
    const to = formData.get('To') as string;

    await connectDB();
    let company = await CompanyModel.findOne({ phoneNumber: to });
    if (!company) company = await CompanyModel.findOne({});

    const response = new VoiceResponse();

    if (!company) {
        response.say({ language: 'ar-AE' }, 'عذراً، لم يتم العثور على الشركة المطلوبة.');
        return new NextResponse(response.toString(), { headers: { 'Content-Type': 'text/xml' } });
    }

    if (company.isActive === false) {
        response.say({
            language: 'en-US',
            voice: 'Polly.Amy'
        }, `The services for ${company.name} are currently suspended.`);
        response.say({
            language: 'de-DE',
            voice: 'Polly.Vicki'
        }, `Die Dienste für ${company.name} sind derzeit eingestellt.`);
        response.hangup();
        return new NextResponse(response.toString(), { headers: { 'Content-Type': 'text/xml' } });
    }

    // Check balance
    if ((company.credits || 0) < 1) {
        response.say({ language: 'ar-AE' }, 'عذراً، لقد نفذ رصيد المكالمات لهذه الشركة. يرجى التواصل مع الإدارة لإعادة الشحن.');
        response.hangup();
        return new NextResponse(response.toString(), { headers: { 'Content-Type': 'text/xml' } });
    }

    if (!transcript) {
        response.say("I'm sorry, I didn't catch that. Could you please repeat?");
        response.redirect('/api/voice');
        return new NextResponse(response.toString(), { headers: { 'Content-Type': 'text/xml' } });
    }

    try {
        // Deduct 1 credit for the interaction
        await CompanyModel.findByIdAndUpdate(company._id, { $inc: { credits: -1 } });
        const features = company?.features || {};
        const systemPrompt = `
${RECEPTIONIST_SYSTEM_PROMPT}

--- SPECIFIC COMPANY CONTEXT ---
Company Name: ${company?.name}
Sector: ${company?.sector}
Website: ${company?.websiteUrl || 'Not provided'}
Supported Languages: ${company?.supportedLanguages?.join(', ')}
Services: ${company?.services?.join(', ')}
Address: ${company?.address}
Email: ${company?.email}
${company?.assistantPrompt || ''}

--- INTERACTION RULES ---
1. If the user asks for the website or more online info, provide: ${company?.websiteUrl || 'our official website'}.
2. If the user wants to "send an email" or "contact via email", tell them you will notify the team. In your [INTERNAL_SUMMARY], set "Recommended action: email_request".
3. Always be professional and helpful.

--- ACTIVE FEATURES ---
${features.bookingEnabled ? '- APPOINTMENT BOOKING: You can take appointment requests. Ask for preferred date and time.' : ''}
${features.transferEnabled ? '- CALL TRANSFER: If the user needs urgent human assistance, suggest transferring the call.' : ''}
${features.recordingEnabled ? '- RECORDING: This call is being recorded for quality assurance.' : ''}

--- SECTOR SPECIFIC GUIDELINES ---
${company?.sector === 'Medical / Clinic' ? 'Handle patients with care, prioritize urgent medical inquiries, and offer to book appointments if enabled.' : ''}
${company?.sector === 'Legal / Law Firm' ? 'Maintain professional confidentiality and prompt for case details without giving legal advice.' : ''}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: transcript }
            ],
        });

        const aiResponseRaw = completion.choices[0].message.content || "";
        const [fullPublicResponse, internalSummary] = aiResponseRaw.split('[INTERNAL_SUMMARY]');

        // Extract language tag if present
        let lang = 'en-US';
        let cleanPublicResponse = fullPublicResponse.trim();

        const langMatch = cleanPublicResponse.match(/\[LANG:([a-z]{2}-[A-Z]{2})\]/);
        if (langMatch) {
            lang = langMatch[1];
            cleanPublicResponse = cleanPublicResponse.replace(langMatch[0], '').trim();
        } else {
            // Fallback to basic detection if tag is missing
            if (/[أ-ي]/.test(cleanPublicResponse)) lang = 'ar-AE';
            else if (/[äöüßÄÖÜ]/.test(cleanPublicResponse) || /danke|bitte/i.test(cleanPublicResponse)) lang = 'de-DE';
        }

        const gather = response.gather({
            input: ['speech'],
            action: '/api/voice/process',
            speechTimeout: 'auto'
        });

        gather.say({
            language: lang as any,
            voice: lang === 'ar-AE' ? 'Polly.Zeina' : (lang === 'de-DE' ? 'Polly.Vicki' : 'Polly.Amy')
        }, cleanPublicResponse);

        if (internalSummary) {
            const lines = internalSummary.trim().split('\n');
            const getVal = (key: string) => lines.find(l => l.includes(key))?.split(':')[1]?.trim() || 'Unknown';

            await CallLogModel.create({
                companyId: company?._id,
                callerId: (formData.get('From') as string) || 'Unknown',
                language: getVal('Language'),
                intent: getVal('Intent'),
                urgency: (getVal('Urgency').toLowerCase() as any) || 'low',
                status: getVal('Recommended action')
            });

            // SaaS Email Notifications
            // 1. Appointment Notification
            if (internalSummary.toLowerCase().includes('intent: schedule') || internalSummary.toLowerCase().includes('action: schedule')) {
                await sendEmail({
                    to: company.email,
                    subject: `New Appointment Request - butTel`,
                    html: `
                  <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #0ea5e9;">New Appointment Intention!</h2>
                    <p>A caller just requested an appointment. Here are the details from the AI:</p>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
                      <strong>Caller:</strong> ${formData.get('From') || 'Unknown'}<br/>
                      <strong>Summary:</strong> ${getVal('Intent')}
                    </div>
                    <p>Please check your console for more details.</p>
                  </div>
                `
                });
            }

            // 2. Generic Contact Request (Email)
            if (internalSummary.toLowerCase().includes('action: email_request')) {
                await sendEmail({
                    to: company.email,
                    subject: `New Contact Request - butTel`,
                    html: `
                  <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #0ea5e9;">A Caller wants to connect!</h2>
                    <p>A caller just requested to send an email or receive contact from your company.</p>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
                      <strong>Caller Num:</strong> ${formData.get('From') || 'Unknown'}<br/>
                      <strong>Reason/Context:</strong> ${getVal('Intent')}
                    </div>
                  </div>
                `
                });
            }

            // 3. Low Balance Alert (Triggered when credits < 1 after deduction)
            if (company.credits <= 1) {
                // Notify Admin
                await NotificationModel.create({
                    type: 'LOW_BALANCE',
                    companyName: company.name,
                    companyId: company._id,
                    message: `CRITICAL: Company ${company.name} has run out of credits during a call.`
                });

                await sendEmail({
                    to: company.email,
                    subject: 'URGENT: Your butTel Credit is Empty',
                    html: `
                  <div style="font-family: sans-serif; padding: 20px; border: 2px solid #ef4444; border-radius: 12px;">
                    <h2 style="color: #ef4444;">Credits Exhausted</h2>
                    <p>Your AI assistant <strong>cannot answer more calls</strong> because your balance has reached zero or less.</p>
                    <a href="${process.env.NEXTAUTH_URL}/recharge/${company._id}" style="display: inline-block; padding: 10px 20px; background: #0ea5e9; color: white; border-radius: 6px; text-decoration: none;">Recharge Now</a>
                  </div>
                `
                });
            }

            if (internalSummary.includes('Recommended action: transfer')) {
                response.say("Connecting you to a specialist now.");
            }
        }

        return new NextResponse(response.toString(), {
            headers: { 'Content-Type': 'text/xml' },
        });

    } catch (error) {
        console.error('OpenAI Error:', error);
        response.say("I am experiencing some technical difficulties. Please call again later.");
        return new NextResponse(response.toString(), {
            headers: { 'Content-Type': 'text/xml' },
        });
    }
}
