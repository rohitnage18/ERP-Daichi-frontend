import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Daichi International — AgriFlow ERP",
  description: "Enterprise Resource Planning for Agricultural Distribution",
  icons: {
    icon: "/branding/daichi-logo.png",
    apple: "/branding/daichi-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
  const apiOrigin =
    apiBase.startsWith("https://") || apiBase.startsWith("http://")
      ? apiBase.replace(/\/$/, "")
      : "";

  return (
    <html lang="en" className={plusJakarta.variable}>
      <head>
        {apiOrigin ? (
          <>
            <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={apiOrigin} />
          </>
        ) : null}
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
