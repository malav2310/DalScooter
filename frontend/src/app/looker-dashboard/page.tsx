import Link from "next/link";
import { Bike } from "lucide-react";

export default function LookerDashboardPage() {
  // Updated Looker Studio embed URL
  const lookerStudioEmbedUrl = "https://lookerstudio.google.com/embed/reporting/ae39d6bc-ee6e-49bd-b409-9f8133005adf/page/IuiTF";

  return (
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
  );
}