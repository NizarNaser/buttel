
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { CompanyModel, CallLogModel } from '@/models/Schemas';
import { openai } from '@/lib/openai';
import { RECEPTIONIST_SYSTEM_PROMPT } from '@/lib/assistant';
import { KaleyraAdapter } from '@/lib/telephony/kaleyra';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('[KALEYRA WHATSAPP WEBHOOK]', JSON.stringify(body, null, 2));

        // Kaleyra usually delivers the sender in "from" and receiver in "to"
        const sender = body.from;
        const receiver = body.to;
        const messageText = body.body?.text || body.text || "";

        if (!messageText || !receiver) {
            return NextResponse.json({ success: true, message: 'No content' });
        }

        await connectDB();

        // 1. Find the company associated with this WhatsApp number
        // Note: Receiver is the business's Kaleyra number
        const company = await CompanyModel.findOne({
            $or: [
                { phoneNumber: receiver },
                { phoneNumber: `+${receiver}` }
            ]
        });

        if (!company) {
            console.error(`[KALEYRA WHATSAPP] Company not found for number: ${receiver}`);
            return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
        }

        // 2. AI Processing
        const features = company?.features || {};
        const systemPrompt = `
${RECEPTIONIST_SYSTEM_PROMPT}

--- WHATSAPP SPECIFIC RULES ---
- You are responding via TEXT (WhatsApp), not voice.
- DO NOT use the [LANG:XX] tags in your final text. Just write the text.
- Be concise and use emojis if appropriate to keep the conversation friendly.
- If the user sends a message that is not a question, acknowledge it professionally.

--- SPECIFIC COMPANY CONTEXT ---
Company Name: ${company?.name}
Sector: ${company?.sector}
Website: ${company?.websiteUrl || 'Not provided'}
Supported Languages: ${company?.supportedLanguages?.join(', ')}
Services: ${company?.services?.join(', ')}
Address: ${company?.address}
Email: ${company?.email}
${company?.assistantPrompt || ''}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: messageText }
            ],
        });

        let aiResponse = completion.choices[0].message.content || "";

        // Clean up any accidental tags
        aiResponse = aiResponse.replace(/\[LANG:[a-z]{2}-[A-Z]{2}\]/g, '').trim();
        const [cleanResponse, internalSummary] = aiResponse.split('[INTERNAL_SUMMARY]');

        // 3. Send response via Kaleyra
        const kaleyra = new KaleyraAdapter();
        const sent = await kaleyra.sendWhatsApp(sender, receiver, cleanResponse.trim());

        // 4. Log the interaction
        if (internalSummary) {
            const lines = internalSummary.trim().split('\n');
            const getVal = (key: string) => lines.find(l => l.includes(key))?.split(':')[1]?.trim() || 'Unknown';

            await CallLogModel.create({
                companyId: company?._id,
                callerId: sender,
                language: getVal('Language'),
                intent: getVal('Intent'),
                urgency: (getVal('Urgency').toLowerCase() as any) || 'low',
                status: 'whatsapp_response',
                duration: 0 // It's a message
            });
        }

        return NextResponse.json({ success: sent });

    } catch (error: any) {
        console.error('[KALEYRA WHATSAPP ERROR]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
