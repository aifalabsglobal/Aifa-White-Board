import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import GlobalCameraOverlay from "@/components/GlobalCameraOverlay";
import { ModalProvider } from "@/components/providers/ModalProvider";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Latakiran Board | AIFA Labs Global",
  description: "A modern, multitouch-enabled whiteboard application built with Next.js 14, featuring real-time drawing capabilities with support for multiple simultaneous touch inputs.",
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
        <link href="https://fonts.googleapis.com/css2?family=Bad+Script&family=Caveat:wght@400..700&family=Cedarville+Cursive&family=Cookie&family=Covered+By+Your+Grace&family=Damion&family=Dancing+Script:wght@400..700&family=Delius&family=Gloria+Hallelujah&family=Great+Vibes&family=Handlee&family=Homemade+Apple&family=Indie+Flower&family=Kalam:wght@300;400;700&family=La+Belle+Aurore&family=Marck+Script&family=Mr+Dafoe&family=Nothing+You+Could+Do&family=Pacifico&family=Parisienne&family=Patrick+Hand&family=Permanent+Marker&family=Reenie+Beanie&family=Rock+Salt&family=Sacramento&family=Shadows+Into+Light&family=Yellowtail&display=swap" rel="stylesheet" />
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
