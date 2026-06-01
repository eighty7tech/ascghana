import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { CartProvider } from "@/context/CartContext";
import ThemeSync from "@/components/ThemeSync";
import IconStyleSync from "@/components/IconStyleSync";
import ButtonStyleSync from "@/components/ButtonStyleSync";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: { default: "Arsenal Supporters Club Ghana | Official", template: "%s | ASC Ghana" },
  description: "Official Arsenal Supporters Club Ghana — The Ghana Gooners. Founded 2003, officially approved by Arsenal FC in 2008.",
  keywords: ["Arsenal","Ghana","Supporters Club","Gunners","Ghana Gooners","AFC","Official","ASC Ghana"],
  authors: [{ name: "Arsenal Supporters Club Ghana" }],
  creator: "Arsenal Supporters Club Ghana",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://arsenalghana.com"),
  openGraph: {
    title: "Arsenal Supporters Club Ghana",
    description: "Official Arsenal Supporters Club Ghana — Ghana Gooners since 2003",
    type: "website",
    locale: "en_GH",
    images: [{ url: "/images/logo/og-image.png", width: 1200, height: 630, alt: "ASC Ghana" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arsenal Supporters Club Ghana",
    description: "Official Arsenal Supporters Club Ghana — Ghana Gooners since 2003",
    images: ["/images/logo/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/images/logo/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/logo/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/images/logo/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "ASC Ghana" },
  formatDetection: { telephone: false },
  category: "sports",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("scroll-smooth", "font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#EF0107" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />

        {/* ── Font Awesome ─────────────────────────────────────────────── */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />

        {/* ── Local Arsenal fonts — preload for instant rendering ───────── */}
        <link rel="preload" href="/fonts/Northbank-N7.woff2"       as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Northbank-N5.woff2"       as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Northbank-Forward.woff2"  as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Chapman-Bold.woff2"       as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Chapman-Regular.woff2"    as="font" type="font/woff2" crossOrigin="anonymous" />

        {/* ── Google Fonts — Oswald & Barlow (system fallbacks) ────────── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Barlow+Condensed:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Barlow:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* ── Inline critical font fallback — prevents FOUT ────────────── */}
        <style dangerouslySetInnerHTML={{ __html: `
          /* Immediately apply font stack so layout doesn't shift */
          :root {
            --font-display: 'Northbank', 'Oswald', 'Arial Narrow', Impact, sans-serif;
            --font-heading: 'Chapman', 'Barlow Condensed', 'Arial Narrow', sans-serif;
            --font-body:    'Barlow', system-ui, -apple-system, sans-serif;
            --font-mono:    'JetBrains Mono', 'Courier New', monospace;
          }
          /* Force theme before JS hydration to prevent flash */
          html { background: #F6F4F0; }
          [data-theme="dark"] { background: #0C0B12; }
        `}} />
      </head>

      <body className="antialiased">
        <ThemeProvider>
          <AppProvider>
            <AuthProvider>
              <CartProvider>
                <ThemeSync />
                <IconStyleSync />
                <ButtonStyleSync />
                <MaintenanceGuard>{children}</MaintenanceGuard>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    style: {
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-color)",
                      fontFamily: "var(--font-body)",
                      borderRadius: "6px",
                      fontSize: "14px",
                    },
                    success: { iconTheme: { primary: "#10B981", secondary: "#fff" } },
                    error:   { iconTheme: { primary: "#EF0107", secondary: "#fff" } },
                  }}
                />
              </CartProvider>
            </AuthProvider>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
