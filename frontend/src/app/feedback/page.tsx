"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Smile, Frown, Meh } from "lucide-react"
import Link from "next/link"
import { Bike } from "lucide-react"
import { useState, useEffect } from "react"

// Define TypeScript interface for feedback data
interface Feedback {
  bike_id: string
  feedback_id: number
  user_type: string
  feedback: string
  sentiment: "Positive" | "Negative" | "Neutral"
  timestamp: string
}

// Mock feedback data (used as fallback)
const mockFeedbackData: Feedback[] = [
  {
    bike_id: "EB001",
    feedback_id: 1,
    user_type: "Customer",
    feedback: "The eBikes were fantastic! Smooth ride and great battery life.",
    sentiment: "Positive",
    timestamp: "2025-08-01T10:30:00Z",
  },
  {
    bike_id: "GS002",
    feedback_id: 2,
    user_type: "Customer",
    feedback: "Gyroscooter was a bit tricky to get used to, but fun once I got the hang of it.",
    sentiment: "Neutral",
    timestamp: "2025-08-02T14:15:00Z",
  },
  {
    bike_id: "SG003",
    feedback_id: 3,
    user_type: "Customer",
    feedback: "Segway was out of stock, which was disappointing. Please update availability.",
    sentiment: "Negative",
    timestamp: "2025-08-03T09:00:00Z",
  },
  {
    bike_id: "EB004",
    feedback_id: 4,
    user_type: "Customer",
    feedback: "Excellent service and very friendly staff. Highly recommend!",
    sentiment: "Positive",
    timestamp: "2025-08-03T16:45:00Z",
  },
  {
    bike_id: "EB005",
    feedback_id: 5,
    user_type: "Customer",
    feedback: "The tariff for eBikes seems a bit high compared to other services.",
    sentiment: "Negative",
    timestamp: "2025-08-04T11:20:00Z",
  },
  {
    bike_id: "EB006",
    feedback_id: 6,
    user_type: "Customer",
    feedback: "Had a minor issue with the booking system, but it was resolved quickly.",
    sentiment: "Neutral",
    timestamp: "2025-08-04T13:10:00Z",
  },
]

export default function FeedbackPage() {
  const [feedbackData, setFeedbackData] = useState<Feedback[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Simulate API fetch (replace with actual API URL when available)
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        // Placeholder for actual API fetch
        // const response = await fetch('YOUR_API_GATEWAY_URL')
        // if (!response.ok) throw new Error('Failed to fetch feedback')
        // const data: Feedback[] = await response.json()
        // setFeedbackData(data)

        // Using mock data as fallback
        setFeedbackData(mockFeedbackData)
      } catch (err) {
        setError('Failed to load feedback. Showing sample data.')
        setFeedbackData(mockFeedbackData)
      } finally {
        setLoading(false)
      }
    }

    fetchFeedback()
  }, [])

  const getPolarityIcon = (sentiment: Feedback["sentiment"]) => {
    switch (sentiment) {
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

  const getPolarityColor = (sentiment: Feedback["sentiment"]) => {
    switch (sentiment) {
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

          {loading && <p className="text-center">Loading feedback...</p>}
          {error && <p className="text-center text-red-600">{error}</p>}

          {!loading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {feedbackData.map((feedback) => (
                <Card key={feedback.feedback_id} className="flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-semibold">
                      Feedback #{feedback.feedback_id} (Bike: {feedback.bike_id})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getPolarityIcon(feedback.sentiment)}
                      <span className={`text-sm font-medium ${getPolarityColor(feedback.sentiment)}`}>
                        {feedback.sentiment}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-gray-700 dark:text-gray-300">{feedback.feedback}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      By: {feedback.user_type} | {new Date(feedback.timestamp).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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