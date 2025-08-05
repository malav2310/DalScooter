import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Bike } from "lucide-react";
import Chatbot from "@/components/Chatbot";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// You can update the metadata to better reflect your application
export const metadata: Metadata = {
  title: "Bike Rentals",
  description: "Discover Your Next Ride",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Your font variables are preserved here */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex flex-col min-h-screen">
          {/* Global Header */}
          <header className="px-4 lg:px-6 h-14 flex items-center border-b sticky top-0 bg-background z-30">
            <Link href="/" className="flex items-center justify-center gap-2">
              <Bike className="h-6 w-6" />
              <span className="text-lg font-semibold">Bike Rentals</span>
            </Link>
            <nav className="ml-auto flex gap-4 sm:gap-6">
              <Link href="/sign-in" className="text-sm font-medium hover:underline underline-offset-4">
                Sign In
              </Link>
              <Link href="/sign-up" className="text-sm font-medium hover:underline underline-offset-4">
                Sign Up
              </Link>
              <Link href="/feedback" className="text-sm font-medium hover:underline underline-offset-4">
                Feedback
              </Link>
            </nav>
          </header>

          {/* This will render the content of your individual pages */}
          <main className="flex-1">{children}</main>

          {/* Global Footer */}
          <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Bike Rentals. All rights reserved.
            </p>
            <nav className="sm:ml-auto flex gap-4 sm:gap-6">
              <Link href="#" className="text-xs hover:underline underline-offset-4">
                Terms of Service
              </Link>
              <Link href="#" className="text-xs hover:underline underline-offset-4">
                Privacy
              </Link>
            </nav>
          </footer>
        </div>

        {/* The Chatbot component is added here to float over the page content */}
        <Chatbot />
      </body>
    </html>
  );
}
