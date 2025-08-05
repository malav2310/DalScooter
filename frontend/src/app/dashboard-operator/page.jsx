import Link from "next/link"
import { Bike } from 'lucide-react'
import { BikeList } from "@/components/bike-list"
import { BikeManagement } from "@/components/bike-management"
import { IssueTicketManagement } from "@/components/issue-ticket-management"

export default function OperatorDashboardPage() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Bike className="h-6 w-6" />
          <span className="text-lg font-semibold">Bike Rentals</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/feedback" className="text-sm font-medium hover:underline underline-offset-4">
            Feedback
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
            About
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
            Contact
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-800 dark:to-purple-900 text-center">
          <div className="container px-4 md:px-6">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-purple-900 dark:text-purple-100">
              Admin Dashboard
            </h1>
            <p className="mx-auto max-w-[700px] text-purple-700 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-purple-300 mt-4">
              Manage bikes, communicate with customers, and oversee operations.
            </p>
          </div>
        </section>

        <BikeManagement />
        <IssueTicketManagement />

        {/* Guest Features for Operators */}
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mt-12 mb-8">
          General Information
        </h2>
        <BikeList />
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
  )
}
