// أضف هذا في src/app/layout.tsx داخل <head>
// مثال على الشكل الصحيح:

import type { Metadata } from 'next'
import { Cairo, Space_Mono } from 'next/font/google'

// ✅ استخدام next/font بدل @import في CSS — يحمّل الخط بشكل optimized تلقائياً
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['700', '900'],        // ✅ فقط الأوزان المستخدمة — يقلل woff2 files
  variable: '--font-cairo',
  display: 'swap',
  preload: true,
  adjustFontFallback: false,    // ✅ يمنع CLS إضافي
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
  preload: false,       // ✅ Space Mono ليس critical
})

export const metadata: Metadata = {
  title: 'CYBERعربي — تعلّم الأمن السيبراني بالعربي',
  description: 'منصة تعليمية متكاملة للخبير — من المبتدئ للخبير. مع تحديات CTF يومية ونظام نقاط تنافسي ومجاني 100٪',
  keywords: 'أمن سيبراني, تعلم, عربي, CTF, اختبار اختراق, هكر أخلاقي',
  openGraph: {
    title: 'CYBERعربي',
    description: 'تعلّم الأمن السيبراني بالعربي مجاناً',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${spaceMono.variable}`}>
      <head>
        {/* ✅ Preconnect لـ Supabase — يقلل TTFB */}
        <link rel="preconnect" href="https://gezzwkjitzfpqqyghddy.supabase.co" />
        <link rel="dns-prefetch" href="https://gezzwkjitzfpqqyghddy.supabase.co" />
      </head>
      <body style={{ margin: 0, background: '#050a0f' }}>
        {children}
      </body>
    </html>
  )
}