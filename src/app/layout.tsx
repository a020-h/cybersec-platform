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
  preload: false,
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
  description:
    "منصة تعليمية عربية متخصصة في الأمن السيبراني — تعلم اختبار الاختراق، الشبكات، التشفير، والهندسة الاجتماعية عبر دروس تفاعلية وتحديات CTF.",
  keywords: [
    "أمن سيبراني",
    "اختبار اختراق",
    "cybersecurity arabic",
    "تعلم أمن المعلومات",
    "CTF عربي",
    "هكر أخلاقي",
    "ethical hacking",
    "شبكات",
    "تشفير",
    "CYBERArabi",
  ],
  authors: [{ name: "CYBERArabi Team" }],
  creator: "CYBERArabi",
  publisher: "CYBERArabi",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: "https://cybersec-platform.vercel.app",
    siteName: "CYBERArabi",
    title: "CYBERArabi | تعلم الأمن السيبراني بالعربي",
    description:
      "منصة تعليمية عربية متخصصة في الأمن السيبراني — دروس تفاعلية وتحديات CTF وشهادات إتمام.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CYBERArabi - تعلم الأمن السيبراني",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CYBERArabi | تعلم الأمن السيبراني بالعربي",
    description:
      "منصة تعليمية عربية متخصصة في الأمن السيبراني — دروس تفاعلية وتحديات CTF.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${spaceMono.variable}`}>
      <head>
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body style={{ fontFamily: "var(--font-cairo), sans-serif" }}>
        {children}
      </body>
    </html>
  );
}