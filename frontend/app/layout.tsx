import type { Metadata } from "next";
import { Lora, Inter, JetBrains_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { MockDataPill } from "@/components/mock-data-pill";
import { NO_FLASH_THEME_SCRIPT, ThemeProvider } from "@/lib/theme";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "StartupLens AI",
  description:
    "Validate a startup idea with 15 specialized agents across 5 parallel research teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lora.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <AppShell />
          {children}
          <footer className="mt-auto flex items-center justify-end px-6 py-3">
            <MockDataPill />
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
