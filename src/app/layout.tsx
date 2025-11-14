import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FieldOps",
  description: "Aplikasi manajemen pekerjaan untuk teknisi lapangan.",
  openGraph: {
    title: 'FieldOps',
    description: 'Aplikasi manajemen pekerjaan untuk teknisi lapangan.',
    images: [
      {
        url: 'https://picsum.photos/seed/tech/1200/630',
        width: 1200,
        height: 630,
        alt: 'FieldOps Application',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
