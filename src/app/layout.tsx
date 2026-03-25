import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL = "https://www.dizibulucu.com.tr";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Dizibulucu | Yapay Zeka Destekli Dizi Öneri Motoru",
    template: "%s | Dizibulucu",
  },
  description:
    "Kararsız kalmaya son! Ruh haline, sevdiğin türlere ve izlediğin platformlara göre sana en uygun diziyi yapay zeka algoritmasıyla saniyeler içinde bulalım.",
  keywords: [
    "dizi önerileri",
    "ne izlesem",
    "en iyi diziler",
    "netflix dizi önerisi",
    "dizi bulucu",
    "yapay zeka dizi",
    "amazon prime dizi",
    "blutv dizi",
    "disney plus dizi",
  ],
  verification: {
    google: "googled4c02345c024c4e1",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: SITE_URL,
    siteName: "Dizibulucu",
    title: "Dizibulucu | Yapay Zeka Destekli Dizi Öneri Motoru",
    description:
      "Kararsız kalmaya son! Ruh haline göre en iyi diziyi saniyeler içinde bul.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Dizibulucu – Yapay Zeka Destekli Dizi Öneri Platformu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dizibulucu | Yapay Zeka Destekli Dizi Öneri Motoru",
    description:
      "Ruh haline göre en iyi diziyi saniyeler içinde bul.",
    images: [OG_IMAGE],
    site: "@dizibulucu",
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
