import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TranslationProvider } from "@/src/contexts/TranslationContext";
import LanguageNotification from "@/src/components/LanguageNotification";

export const metadata: Metadata = {
  title: "JOY MED - Hlášení výsledků IVD testů",
  description: "Hlášení výsledků IVD testů pro osobní i statistické účely",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body>
        <TranslationProvider>
          <LanguageNotification />
          {children}
        </TranslationProvider>
      </body>
    </html>
  );
}

