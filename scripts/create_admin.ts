const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath).toString().split('\n');
    envConfig.forEach((line: string) => {
        if (line && line.indexOf('=') !== -1) {
            const [key, val] = line.split('=');
            process.env[key.trim()] = val.trim();
        }
    });
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buttel';

async function createAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Define schema inline to avoid import issues with aliases
        const CompanySchema = new mongoose.Schema({
            name: { type: String, required: true },
            phoneNumber: { type: String, unique: true, sparse: true },
            originalPhoneNumber: { type: String },
            email: { type: String, required: true, unique: true },
            password: { type: String },
            verified: { type: Boolean, default: false },
            verificationCode: { type: String },
            sector: { type: String, default: 'General Business' },
            supportedLanguages: [{ type: String, default: ['Arabic', 'German', 'English'] }],
            address: { type: String },
            websiteUrl: { type: String },
            services: [{ type: String }],
            assistantPrompt: { type: String },
            features: {
                bookingEnabled: { type: Boolean, default: false },
                transferEnabled: { type: Boolean, default: false },
                recordingEnabled: { type: Boolean, default: true },
            },
            credits: { type: Number, default: 0 },
            totalMinutesUsed: { type: Number, default: 0 },
            twilioSubaccountSid: { type: String },
            lowBalanceAlertSent: { type: Boolean, default: false },
            isActive: { type: Boolean, default: true },
            resetPasswordToken: { type: String },
            resetPasswordExpires: { type: Date },
            googleId: { type: String },
            role: { type: String, enum: ['company', 'admin'], default: 'company' },
        }, { timestamps: true });

        const CompanyModel = mongoose.models.Company || mongoose.model('Company', CompanySchema);

        const adminEmail = 'admin@buttel.com';
        const existingAdmin = await CompanyModel.findOne({ email: adminEmail });

        if (existingAdmin) {
            existingAdmin.role = 'admin';
            existingAdmin.verified = true;
            await existingAdmin.save();
            console.log('Admin user already exists. Updated role to admin.');
        } else {
            const newAdmin = await CompanyModel.create({
                name: 'Super Admin',
                email: adminEmail,
                password: 'password123',
                role: 'admin',
                verified: true,
                phoneNumber: 'ADMIN_PHONE',
                credits: 9999
            });
            console.log('Admin user created successfully.');
            console.log('Email:', newAdmin.email);
            console.log('Password: password123');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

createAdmin();
