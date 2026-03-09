import mongoose, { Schema, model, models } from 'mongoose';

const CompanySchema = new Schema({
    name: { type: String, required: true },
    phoneNumber: { type: String, unique: true, sparse: true }, // The Twilio Number assigned by Admin
    originalPhoneNumber: { type: String }, // The company's real phone for forwarding
    email: { type: String, required: true, unique: true },
    password: { type: String },
    verified: { type: Boolean, default: false },
    verificationCode: { type: String },
    sector: { type: String, default: 'General Business' },
    supportedLanguages: [{ type: String, default: ['Arabic', 'German', 'English'] }],
    address: { type: String },
    websiteUrl: { type: String }, // New field for the bot to refer to
    services: [{ type: String }],
    assistantPrompt: { type: String },
    features: {
        bookingEnabled: { type: Boolean, default: false },
        transferEnabled: { type: Boolean, default: false },
        recordingEnabled: { type: Boolean, default: true },
    },
    credits: { type: Number, default: 0 },
    totalMinutesUsed: { type: Number, default: 0 },
    twilioSubaccountSid: { type: String }, // For individual Twilio balance tracking
    twilioBundleSid: { type: String }, // For German regulatory compliance
    twilioComplianceStatus: { type: String, default: 'none' }, // 'none', 'pending', 'approved', 'rejected'
    lowBalanceAlertSent: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    googleId: { type: String },
    provider: { type: String, default: 'twilio' }, // 'twilio', 'cequens', 'infobip', 'kaleyra'
    role: { type: String, enum: ['company', 'admin', 'user'], default: 'company' },
    permissions: [{ type: String }],
}, { timestamps: true });

const CallLogSchema = new Schema({
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    timestamp: { type: Date, default: Date.now },
    callerId: { type: String },
    duration: { type: Number, default: 0 }, // Duration in seconds
    cost: { type: Number, default: 0 }, // Tech cost (approx $0.05/min)
    language: { type: String },
    intent: { type: String },
    urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    status: { type: String },
}, { timestamps: true });

const PaymentSchema = new Schema({
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    amount: { type: Number, required: true }, // Amount in USD
    minutes: { type: Number, required: true }, // Minutes purchased
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    method: { type: String, default: 'stripe' },
}, { timestamps: true });

const AdminNotificationSchema = new Schema({
    type: { type: String, enum: ['NEW_REGISTRATION', 'LOW_BALANCE', 'RECHARGE_SUCCESS'] },
    companyName: { type: String },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
    message: { type: String },
    read: { type: Boolean, default: false },
}, { timestamps: true });

export const CompanyModel = models.Company || model('Company', CompanySchema);
export const CallLogModel = models.CallLog || model('CallLog', CallLogSchema);
export const NotificationModel = models.AdminNotification || model('AdminNotification', AdminNotificationSchema);
export const PaymentModel = models.Payment || model('Payment', PaymentSchema);
