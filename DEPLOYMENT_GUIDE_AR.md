# دليل التشغيل الكامل لتطبيق butTel

إليك الخطوات التفصيلية لجعل التطبيق يعمل بكامل كفاءته في بيئة الإنتاج أو التطوير.

## 1. إعداد المتغيرات البيئية (.env)
تأكد من وجود ملف `.env` في المجلد الرئيسي يحتوي على المفاتيح التالية (تم إعداد بعضها مسبقاً، لكن يجب التأكد من القيم الحقيقية):

```env
# قاعدة البيانات
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/buttel_db

# المصادقة (NextAuth)
NEXTAUTH_URL=http://localhost:3000  # أو رابط موقعك الحقيقي عند الرفع
NEXTAUTH_SECRET=any_random_string_here_for_security

# الذكاء الاصطناعي (OpenAI)
OPENAI_API_KEY=sk-proj-...

# مزود خدمة الاتصال الأساسي (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# مزودو الخدمات الإضافية (اختياري)
# Kaleyra (للواتس أب وأوروبا)
KALEYRA_API_KEY=...
KALEYRA_SID=...

# Cequens (للشرق الأوسط)
CEQUENS_API_KEY=...

# Infobip (عالمي)
INFOBIP_API_KEY=...
INFOBIP_BASE_URL=...
```

---

## 2. إعداد الاتصالات (Twilio Configuration)
لكي يعمل نظام الرد الآلي الصوتي، يجب ربط أرقام Twilio بروابط موقعك (Webhooks).

1.  اذهب إلى [Twilio Console](https://console.twilio.com/).
2.  اذهب إلى **Phone Numbers** > **Manage** > **Active Numbers**.
3.  اختر الرقم الذي اشتريته.
4.  انزل إلى قسم **Voice & Fax**:
    *   **A CALL COMES IN**: اختر `Webhook` وضع الرابط: `https://your-domain.com/api/voice`
    *   غير الطريقة إلى `POST`.
5.  في قسم **Messaging** (اختياري للرسائل):
    *   **A MESSAGE COMES IN**: ضع الرابط: `https://your-domain.com/api/sms` (إذا تم تفعيلها).

> **ملاحظة:** إذا كنت تعمل محلياً (Localhost)، يجب استخدام **ngrok** لتحويل الرابط المحلي إلى رابط عام لكي يراه Twilio. مثال: `https://your-ngrok-url.ngrok-free.app/api/voice`.

---

## 3. إعداد الامتثال القانوني لألمانيا (German Compliance)
لتفعيل الشراء الآلي للأرقام الألمانية:
1.  في Twilio Console، اذهب إلى [Regulatory Compliance](https://console.twilio.com/us1/develop/phone-numbers/regulatory-compliance/bundles).
2.  اضبط رابط الحالة (**Status Callback URL**) إلى: `https://your-domain.com/api/webhooks/twilio-compliance`.
3.  الآن سيعمل نظام `Regulatory Bundle` الآلي الذي بنيناه في التطبيق لتحديث حالة الشركات تلقائياً عند قبول مستنداتهم.

---

## 4. إعداد الواتس أب (Kaleyra WhatsApp)
لتفعيل مساعد الواتس أب الذكي:
1.  في لوحة تحكم **Kaleyra**، اذهب لإعدادات القنوات (Channels) > WhatsApp.
2.  ضع رابط الويب هوك (Webhook) الخاص بموقعك:
    `https://your-domain.com/api/webhooks/kaleyra/whatsapp`
3.  تأكد من أن الرقم في Kaleyra مفعل لاستقبال الرسائل (Two-Way Messaging).

---

## 5. تشغيل التطبيق
بعد إعداد المفاتيح والروابط أعلاه:

1.  **تثبيت الحزم:**
    ```bash
    npm install
    ```

2.  **تشغيل نسخة التطوير:**
    ```bash
    npm run dev
    ```
    الآن افتح `http://localhost:3000`.

3.  **بناء نسخة الإنتاج (للرفع على السيرفر):**
    ```bash
    npm run build
    npm start
    ```

## 6. حساب الأدمن (Admin Account)
أول مستخدم يسجل في النظام، يمكنك تحويله إلى **Admin** يدوياً عبر قاعدة البيانات (MongoDB Compass) بتغيير الحقل `role` من `company` إلى `admin`.
أو يمكنك استخدام صفحة التسجيل وتعديل الكود مؤقتاً ليمنحك صلاحية الأدمن.

---
**مبروك!** التطبيق الآن جاهز للعمل كمركز اتصال ذكي متكامل (صوت، واتس أب، إدارة عملاء، ودفع).
