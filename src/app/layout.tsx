import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Link from 'next/link';
import TermsConsent from "@/components/TermsConsent";

export const metadata: Metadata = {
  title: "butTel | Professional AI Virtual Receptionist for Every Business",
  description: "Advanced AI-powered virtual receptionist that handles inquiries for your business in Arabic, German, and English. Perfect for startups, legal firms, accounting, and more.",
  keywords: ["AI Receptionist", "Virtual Assistant", "Multilingual Business Bot", "Customer Support AI", "butTel AI", "Business Automation"],
  authors: [{ name: "butTel Team" }],
  openGraph: {
    title: "butTel - The Universal AI Voice Receptionist",
    description: "Empower your company with an intelligent voice assistant that learns your services.",
    url: "https://buttel.ai",
    siteName: "butTel",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <TermsConsent />
          {children}
          <footer className="container" style={{ marginTop: '5rem', paddingBottom: '3rem', borderTop: '1px solid #1e293b', paddingTop: '3rem', color: '#64748b' }}>
            <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '3rem' }}>

              <div className="mobile-text-center" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: '1 1 250px' }}>
                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '1.25rem' }}>butTel AI</div>
                <div style={{ fontSize: '0.875rem' }}>© {new Date().getFullYear()} butTel Technologies. All rights reserved.</div>
                <div className="mobile-text-center" style={{ display: 'flex', gap: '1.25rem', marginTop: '0.5rem', justifyContent: 'inherit' }}>
                  <a href="https://twitter.com/buttel_ai" target="_blank" style={{ color: '#94a3b8', fontSize: '1.2rem', textDecoration: 'none' }} title="Twitter / X">𝕏</a>
                  <a href="https://linkedin.com/company/buttel" target="_blank" style={{ color: '#0077b5', fontSize: '1.2rem', textDecoration: 'none' }} title="LinkedIn">in</a>
                  <a href="https://instagram.com/buttel.ai" target="_blank" style={{ color: '#E1306C', fontSize: '1.2rem', textDecoration: 'none' }} title="Instagram">📸</a>
                </div>
              </div>

              <div className="mobile-stack" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-end', flex: '1 1 250px' }}>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
                  <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
                  <Link href="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</Link>
                </div>

                <a
                  href="https://wa.me/49123456789"
                  target="_blank"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1.25rem',
                    background: 'rgba(37, 211, 102, 0.1)',
                    color: '#25D366',
                    border: '1px solid rgba(37, 211, 102, 0.5)',
                    borderRadius: '50px',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>💬</span> Chat on WhatsApp
                </a>
              </div>

            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
