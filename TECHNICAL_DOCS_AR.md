# دليل التوثيق التقني لمشروع butTel CPaaS
(ButTel Multi-Provider Technical Documentation)

## 1. الرؤية المعمارية (Architectural Vision)
مشروع **butTel** لم يعد مجرد تطبيق يعتمد على Twilio فقط، بل تحول إلى منصة **CPaaS ذكية (Intelligent Communication Platform as a Service)**.
الهدف هو تمكين الشركات من استخدام الاتصالات (Voice, SMS, WhatsApp) عبر **المزود الأنسب** لكل دولة وسياق، مع الحفاظ على واجهة برمجية موحدة (Unified API) ومعايير قانونية صارمة.

نحن نعمل كـ **محول ذكي (Smart Switch)**:
*   إذا كانت الشركة في **أوروبا** -> نستخدم Twilio أو Vonage.
*   إذا كانت الشركة في **الخليج/مصر** -> نستخدم CEQUENS أو Unifonic لضمان الوصول والموثوقية.
*   إذا كانت التكلفة هي المعيار -> يختار النظام الأرخص تلقائياً.

---

## 2. هيكلة النظام (System Architecture)

### طبقة التجريد الموحدة (Unified Provider Abstraction Layer)
بدلاً من كتابة كود خاص بكل مزود داخل النظام، قمنا ببناء "محولات" (Adapters) موحدة:

```typescript
interface ITelephonyProvider {
    buyNumber(country: string, legalEntity: any): Promise<PhoneNumber>;
    makeCall(to: string, from: string): Promise<CallSession>;
    sendSMS(to: string, content: string): Promise<MessageStatus>;
    handleWebhook(req: Request): UnifiedEvent;
}
```

### المزودون المدعومون (Supported Providers)
1.  **Twilio:** (الأساسي عالمياً) - ممتاز لأمريكا وأوروبا.
2.  **CEQUENS:** (قفيّد التنفيذ) - الأفضل في الشرق الأوسط وشمال أفريقيا (MENA).
3.  **Infobip:** (مخطط له) - تغطية عالمية قوية للرسائل.
4.  **Vonage (Nexmo):** (مخطط له) - بديل قوي للصوت.
5.  **e& enterprise:** (مخطط له) - لدول الخليج والمملكة السعودية.

---

## 3. التوجيه الذكي (Smart Routing Logic)

يختار النظام المزود بناءً على مصفوفة أولويات (Matrix):

| المنطقة (Region) | الصوت (Voice) | الرسائل (SMS/WA) | الأولوية |
| :--- | :--- | :--- | :--- |
| **أوروبا (EU)** | Twilio | Twilio | جودة وموثوقية |
| **الشرق الأوسط (MENA)** | CEQUENS | CEQUENS/Unifonic | وصول محلي، Sender ID |
| **أمريكا (US/CA)** | Twilio | Twilio | تكلفة منخفضة |
| **عالمي (Global)** | Infobip | Vonage | توفر الخدمة |

---

## 4. الامتثال القانوني (Regulatory Compliance)

نحن نلتزم بمبدأ **"المنصة ليست شركة اتصالات" (Platform != Carrier)**.

1.  **الملكية المباشرة:**
    *   عندما تشتري الشركة رقماً، يتم شراؤه عبر **Subaccount** أو حساب مستقل لدى المزود (Provider).
    *   الشركة هي المالك القانوني للرقم أمام الهيئات التنظيمية.

2.  **الشفافية:**
    *   يتم تمرير هوية الشركة (KYC/Business Verification) مباشرة للمزود.
    *   لا نقوم "بإخفاء" هوية المرسل الحقيقي (No Gray Routing).

3.  **البيانات:**
    *   سجلات المكالمات تخزن مشفرة.
    *   الامتثال لقوانين GDPR في أوروبا وقوانين حماية البيانات في الخليج.

---

## 5. مكدس التقنيات (Tech Stack)

*   **Core:** Next.js 16 (App Router) + TypeScript.
*   **Database:** MongoDB (بيانات الشركات)، Redis (لإدارة جلسات المكالمات الحية).
*   **AI Engine:** OpenAI (GPT-4o) Realtime / Whisper.
*   **Providers SDKs:**
    *   `twilio` (Node.js SDK)
    *   `axios` (للربط مع CEQUENS/Infobip REST APIs)

---

## 6. خارطة الطريق (Implementation Roadmap)

1.  **Phase 1 (Done):** بناء النواة باستخدام Twilio والامتثال القانوني (Subaccounts).
2.  **Phase 2 (Current):** بناء طبقة التجريد (Abstraction Layer) لفصل كود Twilio عن المنطق الأساسي.
3.  **Phase 3:** دمج CEQUENS كمزود ثانٍ (للمكالمات العربية).
4.  **Phase 4:** تفعيل المحول الذكي (Smart Router) للتبديل التلقائي.

---

## ✅ دليل الأمان والتشغيل (Operational Safety)

*   **API Keys:** تخزن في متغيرات البيئة (`.env`) أو مخزن سري (Vault). لكل مزود مفاتيحه الخاصة.
*   **Webhooks:** لدينا نقطة دخول موحدة `/api/webhooks/{provider}` تقوم بترجمة ردود المزودين إلى تنسيق موحد يفهمه النظام.
*   **Failover:** إذا فشل Twilio في إجراء مكالمة، يمكن للنظام المحاولة عبر Nexmo تلقائياً (في النسخ المستقبلية).

---

**(تم التحديث: يناير 2026 - ليعكس استراتيجية المزودين المتعددين)**

##تم ربط منصات CEQUENS و Infobip بنجاح مع الموقع.

ما تم إنجازه:

إعداد المتغيرات البيئية: تمت إضافة مفاتيح API الخاصة بكل من CEQUENS و Infobip في ملف 
.env
 (مع قيم افتراضية). يرجى التوجه للملف وتعديل:
CEQUENS_API_KEY
INFOBIP_API_KEY و INFOBIP_BASE_URL بالمفاتيح الحقيقية الخاصة بك لتفعيل الاتصال الفعلي.
تحديث قاعدة البيانات: تمت إضافة حقل provider في إعدادات الشركة لتحديد مزود الخدمة (Twilio أو CEQUENS أو Infobip).
تحديث لوحة تحكم الأدمن: تمت إضافة قائمة منسدلة جديدة في نموذج "Add/Edit Company" تتيح لك اختيار "Telephony Provider" عند إعداد رقم الهاتف للشركة. يمكنك الآن تحديد ما إذا كان الرقم المخصص يتبع لـ Twilio أو CEQUENS أو Infobip.
تجهيز المحولات (Adapters): تم تحديث الملفات البرمجية (
cequens.ts
, 
infobip.ts
) لتقرأ المفاتيح من ملف 
.env
 وتتحقق من وجودها قبل تنفيذ العمليات، مما يمهد الطريق لاستبدال الكود التجريبي (Mock) باستدعاءات API الحقيقية فور توفر المفاتيح.


##كيف أحصل على CEQUENS_API_KEY=your_cequens_api_key
CEQUENS_SENDER_ID=butTel

تمام، خلّيني أشرحها خطوة بخطوة وبشكل عملي 👇
كيف تحصل على:

CEQUENS_API_KEY
CEQUENS_SENDER_ID

أولًا: الحصول على CEQUENS_API_KEY 🔑
1️⃣ إنشاء حساب CEQUENS

ادخل على موقع CEQUENS

اختر Sign Up / Get Started

سجّل كشركة (Business account)

⚠️ CEQUENS لا تفعّل API للأفراد — يجب:

شركة مسجّلة

موقع أو وصف واضح لحالة الاستخدام (Use Case)

2️⃣ التواصل مع فريق CEQUENS (إجباري غالبًا)

بعد التسجيل:

سيتم التواصل معك من Sales / Account Manager

سيطلبون:

اسم الشركة القانوني

الدولة

نوع الاستخدام (SMS / WhatsApp / OTP / Bot)

الدول المستهدفة

حجم الرسائل المتوقع

📌 قل لهم بوضوح:

نريد API لإرسال واستقبال الرسائل وبناء بوت رد آلي للشركات عبر منصتنا

3️⃣ تفعيل الحساب والدخول إلى Dashboard

بعد الموافقة:

ستحصل على:

حساب مفعل

Dashboard

Access إلى API

4️⃣ استخراج API Key

من لوحة التحكم (Dashboard):

عادة المسار يكون:

Settings → API → Credentials


أو:

Developers → API Keys


ستجد:

API Key
API Secret (أحيانًا)


📌 هذا هو:

CEQUENS_API_KEY=xxxxxxxxxxxxxxxx


❗ احتفظ به سرّيًا (مثل Twilio)

ثانيًا: الحصول على CEQUENS_SENDER_ID 🆔
ما هو Sender ID؟

هو الاسم الذي يظهر للعميل بدل رقم الهاتف

مثال:

butTel


⚠️ في الخليج والدول العربية:

Sender ID يجب توثيقه والموافقة عليه

لا يعمل فورًا بدون Approval

1️⃣ طلب Sender ID من Dashboard

من لوحة التحكم:

Messaging → Sender IDs → Request New Sender ID


أدخل:

Sender ID: butTel

نوع الاستخدام: Transactional / OTP / Support

الدولة أو الدول المستهدفة

2️⃣ مستندات مطلوبة (غالبًا)

قد يطلبون:

سجل تجاري

موقع الشركة

Proof of Brand

نص الرسالة النموذجي (Template)

مثال نص:

مرحبًا، هذه رسالة دعم من butTel.

3️⃣ انتظار الموافقة

المدة:

الخليج: 1–5 أيام عمل

بعض الدول: حتى 10 أيام

بعد الموافقة:

يصبح Sender ID نشطًا

يمكن استخدامه في API

📌 عندها تضع:

CEQUENS_SENDER_ID=butTel

🧪 مثال استخدام في كود (SMS)
{
  "to": "+9665XXXXXXXX",
  "sender": "butTel",
  "message": "مرحبًا! تم استلام طلبك بنجاح."
}

⚠️ ملاحظات مهمة جدًا

❌ لا يمكن استخدام Sender ID بدون موافقة

❌ لا يمكن تغيير نص الرسائل التسويقية بدون إعادة توثيق

✔ الرسائل الخدمية (Support / OTP) أسهل قبولًا

✔ كل دولة لها قواعد مختلفة

✅ الخلاصة
العنصر	كيف تحصل عليه
CEQUENS_API_KEY	من Dashboard بعد تفعيل الحساب
CEQUENS_SENDER_ID	طلب + موافقة رسمية
مدة التفعيل	1–10 أيام
يتطلب شركة	نعم

إذا تحب، أقدر:

أكتب لك Checklist جاهزة ترسلها لـ CEQUENS

أو Template رسالة Approval لتسريع القبول

أو أساعدك تبني Provider Adapter مثل Twilio

قولي كيف حاب نكمل 👌

INFOBIP_BASE_URL=https://your_base_url.api.infobip.com
INFOBIP_API_KEY=your_infobip_api_key وهذه أيضا

تمام 👌
خلّيك معي خطوة-بخطوة — Infobip قريب جدًا من CEQUENS في الفكرة، لكن فيه تفصيلة مهمّة اسمها Base URL.

أنت تحتاج شيئين:

INFOBIP_BASE_URL
INFOBIP_API_KEY

أولًا: إنشاء حساب Infobip 🟦
1️⃣ التسجيل

ادخل موقع Infobip

اختر Sign up / Get started

سجّل كـ Business account

❗ Infobip أيضًا:

لا يفعّل API للأفراد

يتطلب شركة + Use Case واضح

ثانيًا: تفعيل الحساب

بعد التسجيل:

سيتواصل معك فريق Infobip (Sales / Onboarding)

سيطلبون:

اسم الشركة القانوني

الدولة

نوع الاستخدام (SMS / WhatsApp / OTP / Bot)

الدول المستهدفة

حجم الرسائل المتوقع

📌 قل لهم صراحة:

نطوّر منصة SaaS لربط الشركات بقنوات تواصل (SMS / WhatsApp / Voice) عبر API

بعدها يتم:

تفعيل الحساب

فتح Dashboard

إعطاؤك صلاحيات API

ثالثًا: الحصول على INFOBIP_API_KEY 🔑
من لوحة التحكم:

المسار غالبًا:

Settings → API Keys


أو:

Developers → API Security

الخطوات:

Create New API Key

اختر الصلاحيات:

SMS

WhatsApp (إن وجدت)

Voice (اختياري)

احفظ المفتاح

📌 الناتج:

INFOBIP_API_KEY=xxxxxxxxxxxxxxxx


⚠️ لا تشاركه علنًا

رابعًا: الحصول على INFOBIP_BASE_URL 🌍 (مهم جدًا)

Infobip لا يستخدم URL واحد عالمي مثل Twilio
كل حساب له Base URL خاص حسب الـ Data Center.

أين تجده؟

من Dashboard:

Settings → API → Base URL


أو ستجده في الوثائق الخاصة بحسابك

📌 شكله يكون مثل:

https://abcd12.api.infobip.com


إذن:

INFOBIP_BASE_URL=https://abcd12.api.infobip.com


❗ لا تغيّر هذا الرابط
❗ لا تضف /sms أو /whatsapp هنا (تُضاف في الطلب نفسه)

🧪 مثال إعداد Environment Variables
INFOBIP_BASE_URL=https://abcd12.api.infobip.com
INFOBIP_API_KEY=your_real_api_key_here

🧪 مثال طلب SMS (curl)
curl -X POST "$INFOBIP_BASE_URL/sms/2/text/advanced" \
  -H "Authorization: App $INFOBIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages":[
      {
        "from":"butTel",
        "destinations":[{"to":"+9665XXXXXXXX"}],
        "text":"مرحبًا! تم استلام طلبك."
      }
    ]
  }'


📌 from = Sender ID (يحتاج توثيق مثل CEQUENS)

⚠️ ملاحظات مهمة

Sender ID في Infobip:

يحتاج Approval

يختلف حسب الدولة

WhatsApp Business API:

يحتاج موافقة Meta + Infobip

بعض الدول الخليجية:

تمنع Sender ID غير مسجل رسميًا

✅ الخلاصة السريعة
المتغير	من أين
INFOBIP_API_KEY	Dashboard → API Keys
INFOBIP_BASE_URL	Dashboard → API Settings
Sender ID	Request + Approval
حساب شركة	إلزامي
🔥 نصيحة معمارية (احترافية)

في منصتك:

خزّن BASE_URL لكل شركة

لأن Infobip قد يعطي:

Data Center مختلف لكل حساب

لا تفترض Base URL واحد للجميع