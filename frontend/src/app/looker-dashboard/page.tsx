import Link from "next/link";
import { Bike } from "lucide-react";

export default function LookerDashboardPage() {
  // Updated Looker Studio embed URL
  const lookerStudioEmbedUrl = "https://lookerstudio.google.com/embed/reporting/016a4930-4122-43b9-9507-9298a3bf2e46/page/NicTF";

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link href="/operator-dashboard" className="flex items-center justify-center gap-2">
          <Bike className="h-6 w-6" />
          <span className="text-lg font-semibold">Bike Rentals</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
         
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="w-full py-8 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-800 dark:to-blue-900 text-center">
          <div className="container px-4 md:px-6">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-blue-900 dark:text-blue-100">
              Analytics Dashboard
            </h1>
            <p className="mx-auto max-w-[700px] text-blue-700 md:text-lg/relaxed lg:text-base/relaxed xl:text-lg/relaxed dark:text-blue-300 mt-2">
              Insights powered by Looker Studio.
            </p>
          </div>
        </section>

        <div className="flex-1 w-full p-4 md:p-6">
          <iframe
            width="100%"
            height="100%"
            src={lookerStudioEmbedUrl}
            frameBorder="0"
            style={{ border: 0, minHeight: "700px" }}
            allowFullScreen
            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            title="Looker Studio Dashboard"
            className="rounded-lg shadow-lg"
          ></iframe>
        </div>
      </main>

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
  );
}
