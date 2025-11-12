import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CheckoutChamp Funnel Tracker",
  description: "Track and manage your CheckoutChamp e-commerce funnels and pages",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
