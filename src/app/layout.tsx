import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import GlobalCameraOverlay from "@/components/GlobalCameraOverlay";
import { ModalProvider } from "@/components/providers/ModalProvider";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = "https://www.aifa.cloud";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "AIFA Board - Free Online Interactive Whiteboard for Teaching & Collaboration",
    template: "%s | AIFA Board - Online Whiteboard",
  },
  description:
    "AIFA Board is a free online interactive whiteboard for teachers, students, and teams. Create digital lessons, collaborate in real-time with multitouch support, draw, annotate, and share your ideas. The best teaching tool for virtual classrooms and remote learning.",
  keywords: [
    "online whiteboard",
    "digital whiteboard",
    "interactive whiteboard",
    "teaching tools",
    "free whiteboard",
    "collaborative whiteboard",
    "virtual classroom",
    "online teaching platform",
    "education technology",
    "digital classroom",
    "real-time collaboration",
    "multitouch whiteboard",
    "drawing app",
    "annotation tool",
    "remote learning",
    "e-learning tools",
    "classroom technology",
    "teacher tools",
    "student whiteboard",
    "online drawing board",
  ],
  authors: [{ name: "AIFA Labs Global", url: BASE_URL }],
  creator: "AIFA Labs Global",
  publisher: "AIFA Labs Global",
  applicationName: "AIFA Board",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
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
  icons: {
    icon: "/logo.png",
    shortcut: "/favicon.ico",
    apple: "/aifa-logo.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "AIFA Board",
    title: "AIFA Board - Free Online Interactive Whiteboard for Teaching & Collaboration",
    description:
      "The best free online whiteboard for teachers, students, and teams. Create digital lessons, collaborate in real-time, and transform your virtual classroom experience.",
    images: [
      {
        url: `${BASE_URL}/aifaboard-logo.png`,
        width: 1200,
        height: 630,
        alt: "AIFA Board - Online Interactive Whiteboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIFA Board - Free Online Interactive Whiteboard",
    description:
      "Transform teaching with the best free online whiteboard. Real-time collaboration, multitouch support, perfect for virtual classrooms.",
    images: [`${BASE_URL}/aifaboard-logo.png`],
    creator: "@aifalabs",
    site: "@aifalabs",
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "en-US": BASE_URL,
    },
  },
  category: "Education",
  verification: {
    // Add your verification codes here after registering with these services
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "AIFA Labs Global",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/aifaboard-logo.png`,
      },
      sameAs: [
        "https://twitter.com/aifalabs",
        "https://github.com/aifalabs",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "AIFA Board",
      description: "Free online interactive whiteboard for teaching and collaboration",
      publisher: { "@id": `${BASE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${BASE_URL}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "AIFA Board",
      operatingSystem: "Web Browser",
      applicationCategory: "EducationalApplication",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "150",
      },
      description:
        "Free online interactive whiteboard for teachers, students, and teams. Real-time collaboration with multitouch support.",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bad+Script&family=Caveat:wght@400..700&family=Cedarville+Cursive&family=Cookie&family=Covered+By+Your+Grace&family=Damion&family=Dancing+Script:wght@400..700&family=Delius&family=Gloria+Hallelujah&family=Great+Vibes&family=Handlee&family=Homemade+Apple&family=Indie+Flower&family=Kalam:wght@300;400;700&family=La+Belle+Aurore&family=Marck+Script&family=Mr+Dafoe&family=Nothing+You+Could+Do&family=Pacifico&family=Parisienne&family=Patrick+Hand&family=Permanent+Marker&family=Reenie+Beanie&family=Rock+Salt&family=Sacramento&family=Shadows+Into+Light&family=Yellowtail&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <ClerkProvider>
          <ModalProvider>
            {children}
            <GlobalCameraOverlay />
          </ModalProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

