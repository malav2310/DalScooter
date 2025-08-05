"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Smile, Frown, Meh } from 'lucide-react'
import { useState, useEffect } from "react"
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda"
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers"

// Define TypeScript interface for feedback data
interface Feedback {
  bike_id: string
  id: number
  user_type: string
  text: string
  polarity: "Positive" | "Negative" | "Neutral"
  timestamp: string
}

// Hardcoded feedback data with all required fields
const hardcodedFeedbackData: Feedback[] = [
  {
    id: 1,
    bike_id: "EBIKE001",
    user_type: "customer",
    text: "The eBikes were fantastic! Smooth ride and great battery life.",
    polarity: "Positive",
    timestamp: "2025-08-01T10:00:00Z",
  },
  {
    id: 2,
    bike_id: "GYRO002",
    user_type: "customer",
    text: "Gyroscooter was a bit tricky to get used to, but fun once I got the hang of it.",
    polarity: "Neutral",
    timestamp: "2025-08-02T12:00:00Z",
  },
  {
    id: 3,
    bike_id: "SEGWAY003",
    user_type: "customer",
    text: "Segway was out of stock, which was disappointing. Please update availability.",
    polarity: "Negative",
    timestamp: "2025-08-03T14:00:00Z",
  },
  {
    id: 4,
    bike_id: "EBIKE004",
    user_type: "customer",
    text: "Excellent service and very friendly staff. Highly recommend!",
    polarity: "Positive",
    timestamp: "2025-08-04T09:00:00Z",
  },
  {
    id: 5,
    bike_id: "EBIKE005",
    user_type: "customer",
    text: "The tariff for eBikes seems a bit high compared to other services.",
    polarity: "Negative",
    timestamp: "2025-08-04T15:00:00Z",
  },
  {
    id: 6,
    bike_id: "EBIKE006",
    user_type: "customer",
    text: "Had a minor issue with the booking system, but it was resolved quickly.",
    polarity: "Neutral",
    timestamp: "2025-08-05T11:00:00Z",
  },
]

export default function FeedbackPage() {
  const [feedbackData, setFeedbackData] = useState<Feedback[]>(hardcodedFeedbackData)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Simulate API fetch (replace with actual API URL when available)
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const idToken = sessionStorage.getItem("idToken")

        const lambdaClient = new LambdaClient({
          region: process.env.NEXT_PUBLIC_REGION,
          credentials: fromCognitoIdentityPool({
            clientConfig: { region: process.env.NEXT_PUBLIC_REGION },
            identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_ID!,
            logins: {
              [`cognito-idp.${process.env.NEXT_PUBLIC_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_USER_POOL_ID!}`]: idToken!
            }
          })
        })

        const getFeedbackCommand = new InvokeCommand({
          FunctionName: process.env.NEXT_PUBLIC_GET_FEEDBACK_LAMBDA_NAME,
        })

        const out = await lambdaClient.send(getFeedbackCommand)
        console.log("Lambda response:", out)

        if (out.Payload) {
          const jsonString = Buffer.from(out.Payload).toString('utf8')
          const parsedData = JSON.parse(jsonString)
          console.log(parsedData)
          setFeedbackData(parsedData)
        } else {
        // Using mock data as fallback
          setFeedbackData(feedbackData)
        }

        // Using mock data as fallback
        // setFeedbackData(feedbackData)
      } catch (err) {
        setFeedbackData(hardcodedFeedbackData)
      } finally {
        setLoading(false)
      }
    }

    fetchFeedback()
  }, [])

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
    <main className="flex-1 py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Customer Feedback</h1>
          <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300 mt-4">
            See what our customers are saying about their experience.
          </p>
        </div>

        {loading && <p>Loading feedback...</p>}
        {error && <p className="text-red-500">{error}</p>}

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
                <p className="text-sm text-gray-500 mt-2">Bike ID: {feedback.bike_id}</p>
                <p className="text-sm text-gray-500">User Type: {feedback.user_type}</p>
                <p className="text-sm text-gray-500">Date: {new Date(feedback.timestamp).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}