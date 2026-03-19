import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Passworld - Password Security Suite",
  description: "Professional password security tools including generation, breach checking, and strength testing",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased`}>
        <div className="crypto-bg">
          <div className="crypto-grid" />
          <div
            className="crypto-orb"
            style={{
              top: "10%",
              left: "20%",
              width: "300px",
              height: "300px",
              background: "radial-gradient(circle, oklch(0.6 0.25 290 / 0.3), transparent)",
            }}
          />
          <div
            className="crypto-orb"
            style={{
              top: "60%",
              right: "15%",
              width: "400px",
              height: "400px",
              background: "radial-gradient(circle, oklch(0.65 0.2 200 / 0.25), transparent)",
              animationDelay: "2s",
            }}
          />
          <div
            className="crypto-orb"
            style={{
              bottom: "10%",
              left: "50%",
              width: "250px",
              height: "250px",
              background: "radial-gradient(circle, oklch(0.55 0.22 265 / 0.2), transparent)",
              animationDelay: "4s",
            }}
          />
        </div>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
