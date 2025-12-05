import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/SessionProvider";
import GlobalCameraOverlay from "@/components/GlobalCameraOverlay";
import { ModalProvider } from "@/components/providers/ModalProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Latakiran Board | AIFA Labs Global",
  description: "A modern, multitouch-enabled whiteboard application built with Next.js 16, featuring real-time drawing capabilities with support for multiple simultaneous touch inputs.",
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Pacifico&family=Satisfy&family=Shadows+Into+Light&family=Indie+Flower&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Allura&family=Alex+Brush&family=Tangerine:wght@400;700&family=Kaushan+Script&family=Courgette&family=Permanent+Marker&family=Patrick+Hand&family=Cookie&family=Kalam:wght@300;400;700&family=Handlee&family=Sacramento&family=Parisienne&family=Yellowtail&family=Mr+Dafoe&family=Delius&family=Rock+Salt&family=Gloria+Hallelujah&family=Covered+By+Your+Grace&family=Reenie+Beanie&family=Nothing+You+Could+Do&family=Bad+Script&family=Marck+Script&family=Damion&family=Homemade+Apple&family=Cedarville+Cursive&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthSessionProvider>
          <ModalProvider>
            {children}
            <GlobalCameraOverlay />
          </ModalProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
