import type { Metadata } from "next";
import { Anton, Roboto_Flex } from "next/font/google";
import { PortfolioChat } from "@/components/chat/PortfolioChat";
import { GsapProvider } from "@/components/GsapProvider";
import { ScrollUnlock } from "@/components/ScrollUnlock";
import { SiteBackground } from "@/components/SiteBackground";
import { SiteIntro } from "@/components/SiteIntro";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SITE } from "@/lib/constants";
import "./globals.css";
import "lenis/dist/lenis.css";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const robotoFlex = Roboto_Flex({
  variable: "--font-roboto-flex",
  subsets: ["latin"],
  display: "swap",
});

const themeInitScript = `
(function () {
  try {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("sun");
    document.documentElement.dataset.theme = "dark";
    localStorage.setItem("theme", "dark");
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
      className={`${anton.variable} ${robotoFlex.variable} dark min-h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full overflow-x-hidden bg-transparent font-sans text-foreground antialiased transition-colors duration-300">
        <ThemeProvider>
          <SiteBackground />
          <GsapProvider>
            <ScrollUnlock />
            {children}
            <PortfolioChat />
            <SiteIntro />
          </GsapProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
