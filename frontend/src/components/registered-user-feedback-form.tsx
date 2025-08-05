"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"

// Mock API Gateway URL for feedback
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "https://mockapi.example.com/customer"

export function RegisteredUserFeedbackForm() {
  const [form, setForm] = useState({
    vehicleType: "",
    comments: "",
    rating: 0,
  })
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === "rating" ? parseInt(value) : value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleStarClick = (ratingValue: number) => {
    setForm((prev) => ({ ...prev, rating: ratingValue }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vehicleType || !form.comments.trim()) {
      setMessage("Please select vehicle type and write comments.")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch(`${API_GATEWAY_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      console.log("Feedback submission response:", data)

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit feedback.")
      }

      setMessage("Thank you for your feedback!")
      setIsSubmitted(true)
      setForm({ vehicleType: "", comments: "", rating: 0 }) // Reset form
    } catch (error: any) {
      setMessage(error.message || "An error occurred while submitting feedback.")
      setIsSubmitted(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-12">
          Share Your Experience
        </h2>
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Provide Feedback</CardTitle>
            <CardDescription>Help us improve by sharing your thoughts.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Select
                  value={form.vehicleType}
                  onValueChange={(value) => handleSelectChange("vehicleType", value)}
                  required
                  disabled={isLoading}
                >
                  <SelectTrigger id="vehicleType">
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eBike">eBike</SelectItem>
                    <SelectItem value="Gyroscooter">Gyroscooter</SelectItem>
                    <SelectItem value="Segway">Segway</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  name="comments"
                  placeholder="Tell us about your experience..."
                  value={form.comments}
                  onChange={handleChange}
                  required
                  rows={5}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rating">Star Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 cursor-pointer transition ${
                        isLoading
                          ? "opacity-50 cursor-not-allowed"
                          : star <= form.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                      onClick={() => !isLoading && handleStarClick(star)}
                      aria-label={`${star} star${star === 1 ? "" : "s"}`}
                    />
                  ))}
                </div>
                <Input
                  id="rating"
                  name="rating"
                  type="hidden"
                  value={form.rating}
                  readOnly
                />
              </div>
              <Button type="submit" disabled={isLoading || isSubmitted}>
                {isLoading ? "Submitting..." : isSubmitted ? "Feedback Submitted!" : "Submit Feedback"}
              </Button>
              {message && (
                <p className={`text-sm ${message.includes("Thank you") ? "text-green-600" : "text-red-600"}`}>
                  {message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
