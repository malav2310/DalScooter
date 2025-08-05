import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Smile, Frown, Meh } from 'lucide-react'
import Link from "next/link"
import { Bike } from 'lucide-react'

// Dummy feedback data
const feedbackData = [
  {
    id: 1,
    text: "The eBikes were fantastic! Smooth ride and great battery life.",
    polarity: "Positive",
  },
  {
    id: 2,
    text: "Gyroscooter was a bit tricky to get used to, but fun once I got the hang of it.",
    polarity: "Neutral",
  },
  {
    id: 3,
    text: "Segway was out of stock, which was disappointing. Please update availability.",
    polarity: "Negative",
  },
  {
    id: 4,
    text: "Excellent service and very friendly staff. Highly recommend!",
    polarity: "Positive",
  },
  {
    id: 5,
    text: "The tariff for eBikes seems a bit high compared to other services.",
    polarity: "Negative",
  },
  {
    id: 6,
    text: "Had a minor issue with the booking system, but it was resolved quickly.",
    polarity: "Neutral",
  },
]

export default function FeedbackPage() {
  const getPolarityIcon = (polarity: string) => {
    switch (polarity) {
      case "Positive":
        return <Smile className="h-5 w-5 text-green-500" />
      case "Negative":
        return <Frown className="h-5 w-5 text-red-500" />
      case "Neutral":
        return <Meh className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getPolarityColor = (polarity: string) => {
    switch (polarity) {
      case "Positive":
        return "text-green-600"
      case "Negative":
        return "text-red-600"
      case "Neutral":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
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
          <Link href="/operator-dashboard" className="text-sm font-medium hover:underline underline-offset-4">
            Operator Dashboard
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
            About
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
            Contact
          </Link>
        </nav>
      </header>

      <main className="flex-1 py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Customer Feedback</h1>
            <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300 mt-4">
              See what our customers are saying about their experience.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {feedbackData.map((feedback) => (
              <Card key={feedback.id} className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-semibold">Feedback #{feedback.id}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getPolarityIcon(feedback.polarity)}
                    <span className={`text-sm font-medium ${getPolarityColor(feedback.polarity)}`}>
                      {feedback.polarity}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-gray-700 dark:text-gray-300">{feedback.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
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
  )
}
