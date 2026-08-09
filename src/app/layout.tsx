import type { Metadata } from "next";
import { Archivo, Space_Grotesk } from "next/font/google";
import { GsapProvider } from "@/components/GsapProvider";
import { SiteBackground } from "@/components/SiteBackground";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SITE } from "@/lib/constants";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
  // Enables font-stretch / wdth so hero mega type can go wider
  axes: ["wdth"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const themeInitScript = `
(function () {
  try {
    document.documentElement.classList.add("dark");
    var stored = localStorage.getItem("theme");
    document.documentElement.classList.toggle("sun", stored === "light");
  } catch (e) {}
})();
`;

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
      className={`${archivo.variable} ${spaceGrotesk.variable} dark h-full scroll-smooth`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full overflow-x-hidden bg-transparent font-sans text-foreground antialiased transition-colors duration-300">
        <ThemeProvider>
          <SiteBackground />
          <GsapProvider>{children}</GsapProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
