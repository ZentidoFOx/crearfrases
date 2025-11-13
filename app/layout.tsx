import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { WebsiteProvider } from "@/contexts/website-context"
import { Toaster } from "sonner"
import "./globals.css"

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "SEO Dashboard",
  description: "Dashboard",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${poppins.variable} font-sans antialiased`}>
        <AuthProvider>
          <WebsiteProvider>
            <Suspense fallback={null}>{children}</Suspense>
            <Toaster position="top-right" richColors />
          </WebsiteProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
