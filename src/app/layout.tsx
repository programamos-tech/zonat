import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { ClientsProvider } from "@/contexts/clients-context";
import { ProductsProvider } from "@/contexts/products-context";
import { CategoriesProvider } from "@/contexts/categories-context";
import { SalesProvider } from "@/contexts/sales-context";
import { WarrantyProvider } from "@/contexts/warranty-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ConditionalLayout } from "@/components/layout/conditional-layout";
import { GlobalLoading } from "@/components/ui/global-loading";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZONA T - Panel de Control",
  description: "Sistema de gestión de inventario y ventas para ZONA T",
  icons: {
    icon: '/zonat-logo.webp',
    shortcut: '/zonat-logo.webp',
    apple: '/zonat-logo.webp'
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
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
                      <Toaster />
                    </WarrantyProvider>
                  </SalesProvider>
                </CategoriesProvider>
              </ProductsProvider>
            </ClientsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
