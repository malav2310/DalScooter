"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Smile, Frown, Meh } from 'lucide-react'
import { Bike } from "lucide-react"
import { useState, useEffect } from "react"
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda"
import { fromWebToken } from "@aws-sdk/credential-providers"
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
  const [feedbackData, setFeedbackData] = useState<Feedback[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Simulate API fetch (replace with actual API URL when available)
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const idToken = sessionStorage.getItem("idToken")

        const lambdaClient = new LambdaClient({
          region: process.env.NEXT_PUBLIC_REGION, credentials: fromCognitoIdentityPool({
            clientConfig: { region: process.env.NEXT_PUBLIC_REGION },
            identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_ID!!,
            logins: {
              [`cognito-idp.${process.env.NEXT_PUBLIC_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_USER_POOL_ID!!}`]: idToken!!
            }
          })
        })

        const getFeedbackCommand = new InvokeCommand({
          FunctionName: process.env.NEXT_PUBLIC_GET_FEEDBACK_LAMBDA_NAME,
        })

        const out = await lambdaClient.send(getFeedbackCommand)
        console.log(out)

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
        setError('Failed to load feedback. Showing sample data.')
        setFeedbackData(feedbackData)
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
  )
}