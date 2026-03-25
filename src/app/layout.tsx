import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL = "https://www.dizibulucu.com.tr";
const OG_IMAGE = `${SITE_URL}/og-image.svg`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Dizibulucu | Yapay Zeka Destekli Dizi Öneri Motoru",
    template: "%s | Dizibulucu",
  },
  description:
    "Kararsız kalmaya son! Ruh haline, sevdiğin türlere ve izlediğin platformlara göre sana en uygun diziyi yapay zeka algoritmasıyla saniyeler içinde bulalım. Netflix, HBO, Disney+ ve daha fazlası.",
  keywords: [
    "dizi önerileri",
    "ne izlesem",
    "en iyi diziler 2024",
    "netflix dizi önerisi",
    "dizi bulucu",
    "yapay zeka dizi",
    "amazon prime dizi",
    "hbo dizi",
    "disney plus dizi",
    "türk dizileri",
    "dizi tavsiye",
    "hangi diziyi izlesem",
    "dizi öneri motoru",
    "apple tv dizi",
  ],
  authors: [{ name: "Dizibulucu" }],
  creator: "Dizibulucu",
  publisher: "Dizibulucu",
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
      "Kararsız kalmaya son! Ruh haline göre en iyi diziyi saniyeler içinde bul. Netflix, HBO, Disney+ ve daha fazlası.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Dizibulucu – Yapay Zeka Destekli Dizi Öneri Platformu",
        type: "image/svg+xml",
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
    creator: "@dizibulucu",
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'tr-TR': SITE_URL,
    },
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
  category: "entertainment",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      "url": SITE_URL,
      "name": "Dizibulucu",
      "description": "Yapay zeka destekli dizi öneri motoru",
      "inLanguage": "tr-TR",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${SITE_URL}/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      "name": "Dizibulucu",
      "url": SITE_URL,
      "description": "Ruh haline ve zevkine göre yapay zeka ile dizi önerisi alan uygulama",
      "applicationCategory": "EntertainmentApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "TRY",
      },
      "inLanguage": "tr-TR",
      "image": OG_IMAGE,
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      "name": "Dizibulucu",
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": OG_IMAGE,
      },
      "sameAs": [],
    },
  ],
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
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <meta name="theme-color" content="#050505" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        {children}
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
