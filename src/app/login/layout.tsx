import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZONA T - Iniciar Sesión",
  description: "Sistema de gestión de inventario y ventas para ZONA T",
  icons: {
    icon: '/zonat-logo.webp',
    shortcut: '/zonat-logo.webp',
    apple: '/zonat-logo.webp'
  },
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
