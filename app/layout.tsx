import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Inter, Syne } from "next/font/google"
import { AppProviders } from "@/components/providers/app-providers"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
})

export const metadata: Metadata = {
  title: "Wear or Dare — Spin the challenge. Try the look.",
  description:
    "The AI fashion game where you spin a style challenge, generate a virtual try-on, and decide: Wear It or Dare Again.",
  keywords: ["fashion", "AI", "virtual try-on", "style", "outfit challenge"],
  openGraph: {
    title: "Wear or Dare",
    description: "Spin the challenge. Try the look. Dare to wear it.",
    type: "website",
  },
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable} bg-background`}>
      <body className="antialiased font-sans">
        <AppProviders>{children}</AppProviders>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
