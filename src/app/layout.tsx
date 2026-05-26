import type { Metadata } from "next";
import { Archivo, Space_Grotesk } from "next/font/google";
import { GsapProvider } from "@/components/GsapProvider";
import { SiteBackground } from "@/components/SiteBackground";
import { SITE } from "@/lib/constants";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://portfolio.example.com",
  ),
  title: {
    default: `${SITE.name} | ${SITE.role}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "fullstack developer",
    "AI systems engineer",
    "Next.js",
    "premium web development",
    "portfolio",
  ],
  authors: [{ name: SITE.name }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE.name,
    title: SITE.tagline,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.tagline,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${spaceGrotesk.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full overflow-x-hidden bg-transparent font-sans text-foreground antialiased">
        <GsapProvider>
          <SiteBackground />
          <div className="relative z-[1]">{children}</div>
        </GsapProvider>
      </body>
    </html>
  );
}
