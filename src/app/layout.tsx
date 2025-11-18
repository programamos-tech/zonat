import type { Metadata } from "next";
import { Geist, Geist_Mono, Fira_Code, Libre_Baskerville, Poppins, Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
// ThemeProvider removed
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/contexts/auth-context";
import { ClientsProvider } from "@/contexts/clients-context";
import { ProductsProvider } from "@/contexts/products-context";
import { CategoriesProvider } from "@/contexts/categories-context";
import { SalesProvider } from "@/contexts/sales-context";
import { WarrantyProvider } from "@/contexts/warranty-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ConditionalLayout } from "@/components/layout/conditional-layout";
import { GlobalLoading } from "@/components/ui/global-loading";
import { MobileNavWrapper } from "@/components/ui/mobile-nav-wrapper";
import { ToasterWrapper } from "@/components/ui/toaster-wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Oviler | Gestiona tu negocio",
  description: "Sistema integral de gestión de tu negocio. Control de inventario, ventas, créditos y más. Hecho en Sincelejo.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png' }
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg'
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Caprasimo&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=compost" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${firaCode.variable} ${libreBaskerville.variable} ${poppins.variable} ${plusJakartaSans.variable} ${inter.variable} antialiased pb-16 lg:pb-0`}
      >
        <AuthProvider>
          <ClientsProvider>
            <ProductsProvider>
              <CategoriesProvider>
                <SalesProvider>
                  <WarrantyProvider>
                    <GlobalLoading />
                    <ConditionalLayout>
                      {children}
                    </ConditionalLayout>
                    <MobileNavWrapper />
                    <ToasterWrapper />
                  </WarrantyProvider>
                </SalesProvider>
              </CategoriesProvider>
            </ProductsProvider>
          </ClientsProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
