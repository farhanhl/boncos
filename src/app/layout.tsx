import type { Metadata } from "next";
import { Bagel_Fat_One, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const bagelFatOne = Bagel_Fat_One({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ["500", "600", "700", "800"],
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Boncos — Catat Pengeluaran Tanpa Ribet",
  description: "Aplikasi pencatatan keuangan dengan ekstraksi struk instan tanpa AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${bagelFatOne.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
