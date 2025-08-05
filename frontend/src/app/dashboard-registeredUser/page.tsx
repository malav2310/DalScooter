"use client"

import { cn } from "@/lib/utils"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Bike } from "lucide-react"
import { BikeList } from "@/components/bike-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { v4 as uuidv4 } from "uuid" // For unique booking reference

export default function DashboardPage() {
  // Booking System State
  const [bookingForm, setBookingForm] = useState({
    bikeType: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  })
  const [bookingConfirmation, setBookingConfirmation] = useState<{
    reference: string
    accessCode: string
    duration: number
  } | null>(null)

  // Support Messaging State
  const [supportMessage, setSupportMessage] = useState("")
  const [supportMessageSent, setSupportMessageSent] = useState(false)

  // Feedback Form State
  const [feedbackForm, setFeedbackForm] = useState({
    vehicleType: "",
    comments: "",
    rating: 0,
  })
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  const handleBookingChange = (name: string, value: any) => {
    setBookingForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingForm.bikeType || !bookingForm.startDate || !bookingForm.endDate) {
      alert("Please fill all booking fields.")
      return
    }

    const duration = differenceInDays(bookingForm.endDate, bookingForm.startDate)
    if (duration <= 0) {
      alert("End date must be after start date.")
      return
    }

    const reference = uuidv4().substring(0, 8).toUpperCase()
    const accessCode = Math.floor(1000 + Math.random() * 9000).toString() // 4-digit code

    setBookingConfirmation({ reference, accessCode, duration })
    alert(`Booking confirmed! Reference: ${reference}, Access Code: ${accessCode}`)
    // In a real app, send this to a backend
  }

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supportMessage.trim()) {
      alert("Message cannot be empty.")
      return
    }
    console.log("Support message sent:", supportMessage)
    setSupportMessageSent(true)
    setSupportMessage("")
    alert("Your support request has been sent!")
    // In a real app, send this to a backend
  }

  const handleFeedbackChange = (name: string, value: any) => {
    setFeedbackForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackForm.vehicleType || !feedbackForm.comments.trim()) {
      alert("Please select vehicle type and write comments.")
      return
    }

    

    console.log("Feedback submitted:", feedbackForm)
    setFeedbackSubmitted(true)
    setFeedbackForm({ vehicleType: "", comments: "", rating: 0 })
    alert("Thank you for your feedback!")
    // In a real app, send this to a backend
  }

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link href="/dashboard-registeredUser" className="flex items-center justify-center gap-2">
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
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-800 dark:to-blue-900 text-center">
          <div className="container px-4 md:px-6">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-blue-900 dark:text-blue-100">
              Welcome User!
            </h1>
            <p className="mx-auto max-w-[700px] text-blue-700 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-blue-300 mt-4">
              Access your personalized features and manage your rentals.
            </p>
          </div>
        </section>

        {/* Booking System */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-12">
              Book Your Ride
            </h2>
            <div className="grid gap-8 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>New Reservation</CardTitle>
                  <CardDescription>Select your bike type and dates to book.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBookingSubmit} className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bikeType">Vehicle Type</Label>
                      <Select
                        value={bookingForm.bikeType}
                        onValueChange={(value) => handleBookingChange("bikeType", value)}
                        required
                      >
                        <SelectTrigger id="bikeType">
                          <SelectValue placeholder="Select a vehicle type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eBike">eBike</SelectItem>
                          <SelectItem value="Gyroscooter">Gyroscooter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !bookingForm.startDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {bookingForm.startDate ? format(bookingForm.startDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={bookingForm.startDate}
                            onSelect={(date) => handleBookingChange("startDate", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !bookingForm.endDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {bookingForm.endDate ? format(bookingForm.endDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={bookingForm.endDate}
                            onSelect={(date) => handleBookingChange("endDate", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Button type="submit">Confirm Booking</Button>
                  </form>
                </CardContent>
              </Card>

              {bookingConfirmation && (
                <Card>
                  <CardHeader>
                    <CardTitle>Booking Confirmed!</CardTitle>
                    <CardDescription>Your reservation details:</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <p>
                      <strong>Reference:</strong> {bookingConfirmation.reference}
                    </p>
                    <p>
                      <strong>Access Code:</strong> {bookingConfirmation.accessCode}
                    </p>
                    <p>
                      <strong>Duration:</strong> {bookingConfirmation.duration} day(s)
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please keep your access code safe. It will be required to unlock your bike.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Support Messaging */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-12">
              Support & Help
            </h2>
            <Card className="mx-auto max-w-2xl">
              <CardHeader>
                <CardTitle>Send a Support Request</CardTitle>
                <CardDescription>Our team will get back to you as soon as possible.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSupportSubmit} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="supportMessage">Your Message</Label>
                    <Textarea
                      id="supportMessage"
                      placeholder="Describe your issue or request..."
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      required
                      rows={5}
                    />
                  </div>
                  <Button type="submit" disabled={supportMessageSent}>
                    {supportMessageSent ? "Message Sent!" : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feedback Form */}
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
                <form onSubmit={handleFeedbackSubmit} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="feedbackVehicleType">Vehicle Type</Label>
                    <Select
                      value={feedbackForm.vehicleType}
                      onValueChange={(value) => handleFeedbackChange("vehicleType", value)}
                      required
                    >
                      <SelectTrigger id="feedbackVehicleType">
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
                      placeholder="Tell us about your experience..."
                      value={feedbackForm.comments}
                      onChange={(e) => handleFeedbackChange("comments", e.target.value)}
                      required
                      rows={5}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="rating">Star Rating (1-5)</Label>
                    <Input
                      id="rating"
                      name="rating"
                      type="number"
                      min="0"
                      max="5"
                      value={feedbackForm.rating}
                      onChange={(e) => handleFeedbackChange("rating", Number.parseInt(e.target.value))}
                    />
                  </div>
                  <Button type="submit" disabled={feedbackSubmitted}>
                    {feedbackSubmitted ? "Feedback Submitted!" : "Submit Feedback"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Guest Features for Registered Users */}
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
