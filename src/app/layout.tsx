import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}