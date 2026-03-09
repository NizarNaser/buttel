import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { CompanyModel } from '@/models/Schemas';
import connectDB from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "butTel Login",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                // 1. Check if it's the global Admin
                if (credentials?.email === 'admin' && credentials?.password === process.env.ADMIN_PASSWORD) {
                    return { id: "admin", name: "Admin", role: "admin" } as any;
                }

                // 2. Check Database for Company
                await connectDB();
                const company = await CompanyModel.findOne({ email: credentials?.email });

                if (company) {
                    // SECURE: Check password
                    const isMatch = await bcrypt.compare(credentials?.password || '', company.password);

                    // FALLBACK: Legacy plaintext check (Lazy Migration)
                    if (!isMatch && company.password === credentials?.password) {
                        // It matched as plaintext, so let's hash it for next time
                        company.password = await bcrypt.hash(credentials?.password || '', 10);
                        await company.save();
                        // Proceed as valid
                    } else if (!isMatch) {
                        // Invalid password
                        return null;
                    }

                    if (!company.verified) throw new Error("Please verify your email first.");
                    return {
                        id: company._id.toString(),
                        name: company.name,
                        email: company.email,
                        role: company.role || "company"
                    } as any;
                }

                return null;
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        })
    ],
    callbacks: {
        async signIn({ user, account, profile }: any) {
            if (account.provider === "google") {
                await connectDB();
                const existingCompany = await CompanyModel.findOne({ email: user.email });

                if (!existingCompany) {
                    // Create new company if they sign up via Google
                    await CompanyModel.create({
                        name: user.name,
                        email: user.email,
                        verified: true,
                        googleId: user.id,
                        credits: 5 // Free trial
                    });
                } else if (!existingCompany.googleId) {
                    // Link googleId to existing company if not linked
                    existingCompany.googleId = user.id;
                    existingCompany.verified = true;
                    await existingCompany.save();
                }
            }
            return true;
        },
        async jwt({ token, user, account }: any) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
