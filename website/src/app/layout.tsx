import type { Metadata } from "next";
import localFont from "next/font/local";
import { Source_Sans_3, Fira_Code } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { siteConfig } from "@/config/site";

const satoshi = localFont({
  src: "../fonts/satoshi-variable.woff2",
  variable: "--font-satoshi",
  display: "swap",
  weight: "300 900",
});

const sourceSans3 = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "InferBench — Measure Inference. Understand Performance.",
    template: "%s | InferBench",
  },
  description: siteConfig.description,
  keywords: [
    "LLM benchmark",
    "inference latency",
    "TTFT",
    "TPOT",
    "token throughput",
    "vLLM",
    "Ollama",
    "OpenAI",
    "Gemini",
    "Claude",
    "serving benchmark",
    "GPU telemetry",
  ],
  authors: [{ name: siteConfig.author, url: siteConfig.github.profileUrl }],
  creator: siteConfig.author,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: "InferBench — Measure Inference. Understand Performance.",
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "InferBench — Measure Inference. Understand Performance.",
    description: siteConfig.description,
  },
  icons: {
    icon: "/favicon.ico",
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
      className={`${satoshi.variable} ${sourceSans3.variable} ${firaCode.variable} h-full antialiased dark`}
    >
      <body className={`${sourceSans3.className} min-h-full flex flex-col bg-[#0d0e11] text-[#f0f2f5] font-sans selection:bg-[#00f0ff]/20 selection:text-[#00f0ff]`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
