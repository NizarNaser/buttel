# butTel - AI Virtual Receptionist

butTel is a professional AI-powered virtual receptionist designed for accounting, tax, and contract consulting firms in Germany. It automatically detects and responds in **Arabic, German, and English**, manages office hours, and provides intelligent call summaries.

## ✨ Features
- **Multilingual Support:** Seamless detection of Arabic, German, and English.
- **Office Hours Logic:** Gracefully handles calls outside of 09:00 - 17:00 Germany Time.
- **Intelligent Routing:** Offers to schedule appointments, transfer calls, or record messages.
- **Premium Dashboard:** Real-time monitoring of call logs and AI intent analysis.
- **Secure & Professional:** Follows strict guidelines to avoid providing unauthorized legal/tax advice.

## 🛠 Tech Stack
- **Next.js 15+** (App Router)
- **OpenAI GPT-4o** (Language Detection & Conversation)
- **Twilio Voice API** (Telephony Gateway)
- **Luxon** (Timezone management)
- **Vanilla CSS** (Premium glassmorphism UI)

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- Twilio Account
- OpenAI API Key

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env.local` and fill in your credentials:
```bash
cp .env.example .env.local
```

### 4. Running Locally
```bash
npm run dev
```

### 5. Twilio Configuration
Point your Twilio Phone Number webhook to:
`https://your-domain.com/api/voice`

## 📁 Project Structure
- `/src/app/api/voice`: Primary webhook for incoming calls.
- `/src/lib/assistant.ts`: Core AI personality and business logic.
- `/src/components/CallLogs.tsx`: Real-time dashboard log viewer.
- `/public`: Static assets including the premium logo.

## ⚖️ Disclaimer
This AI assistant is designed to handle general inquiries. It is programmed to NEVER provide specific legal, tax, or financial advice.
