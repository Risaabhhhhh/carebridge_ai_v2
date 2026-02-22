import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/layout/Navbar";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareBridge AI | Insurance Intelligence",
  description:
    "Structured financial intelligence for health insurance policies. Risk detection, compliance scoring, and broker transparency analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable}`}
    >
      <body className="bg-[#EFE9E1] text-[#1F2933] font-sans antialiased selection:bg-[#899481] selection:text-white">
        <Navbar />
        {children}
        
      </body>
    </html>
  );
}
