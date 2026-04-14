import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 1. Import your newly created AuthProvider
import { AuthProvider } from "@/components/AuthProvider"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinTrust AI",
  description: "Enterprise Biometric Security",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Keep the suppressHydrationWarning to stop those pesky browser extension errors!
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${inter.className} bg-[#020617] text-slate-200 antialiased`} 
        suppressHydrationWarning
      >
        {/* 2. Wrap the entire app (children) inside the AuthProvider */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}