import type { Metadata, Viewport } from "next";
import { Cairo, Space_Mono } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "900"],
  display: "swap",
  preload: true,
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050a0f",
};

export const metadata: Metadata = {
  title: {
    default: "CYBERArabi | تعلم الأمن السيبراني بالعربي",
    template: "%s | CYBERArabi",
  },
  description: "منصة تعليمية عربية متخصصة في الأمن السيبراني — تعلم اختبار الاختراق، الشبكات، التشفير، والهندسة الاجتماعية عبر دروس تفاعلية وتحديات CTF.",
  keywords: ["أمن سيبراني", "اختبار اختراق", "cybersecurity arabic", "CTF عربي", "ethical hacking", "CYBERArabi"],
  authors: [{ name: "CYBERArabi Team" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: "https://cybersec-platform.vercel.app",
    siteName: "CYBERArabi",
    title: "CYBERArabi | تعلم الأمن السيبراني بالعربي",
    description: "منصة تعليمية عربية — دروس تفاعلية وتحديات CTF.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico", apple: "/apple-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${spaceMono.variable}`}>
      <head>
        <meta name="format-detection" content="telephone=no" />
        {/* Preload critical fonts to fix LCP font delay */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/_next/static/media/cairo-arabic-400.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/_next/static/media/cairo-arabic-900.woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body style={{ fontFamily: "var(--font-cairo), sans-serif", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}