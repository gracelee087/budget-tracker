import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Budget Tracker - AI Expense Management",
  description: "AI-powered expense tracking and budget management app. Record expenses with natural language, track spending, and manage your budget effectively.",
  keywords: ["budget", "expense", "tracking", "AI", "finance", "money", "management"],
  authors: [{ name: "Budget Tracker Team" }],
  creator: "Budget Tracker",
  publisher: "Budget Tracker",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://budget-tracker.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Budget Tracker - AI Expense Management",
    description: "AI-powered expense tracking and budget management app",
    url: 'https://budget-tracker.app',
    siteName: 'Budget Tracker',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Budget Tracker App',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Budget Tracker - AI Expense Management",
    description: "AI-powered expense tracking and budget management app",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Budget Tracker',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
