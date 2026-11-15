import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { BRAND } from '@/lib/brand'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} · ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
   <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ClerkProvider>
          <Header />
          {children}
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  )
}