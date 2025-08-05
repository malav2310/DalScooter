"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface IssueTicket {
  id: string
  userId: string // Mock user ID
  customerMessage: string
  status: "Open" | "Resolved" | "Pending Response"
  operatorResponse?: string
  timestamp: string
}

// Mock data for issue tickets (reusing feedback data for messages)
const initialIssueTickets: IssueTicket[] = [
  {
    id: "ticket-001",
    userId: "user-abc",
    customerMessage: "The eBikes were fantastic! Smooth ride and great battery life.",
    status: "Open",
    timestamp: "2025-07-20T10:00:00Z",
  },
  {
    id: "ticket-002",
    userId: "user-xyz",
    customerMessage: "Gyroscooter was a bit tricky to get used to, but fun once I got the hang of it.",
    status: "Pending Response",
    operatorResponse: "Thanks for the feedback! We're working on better onboarding.",
    timestamp: "2025-07-19T14:30:00Z",
  },
  {
    id: "ticket-003",
    userId: "user-123",
    customerMessage: "Segway was out of stock, which was disappointing. Please update availability.",
    status: "Open",
    timestamp: "2025-07-18T09:15:00Z",
  },
  {
    id: "ticket-004",
    userId: "user-abc",
    customerMessage: "Had a minor issue with the booking system, but it was resolved quickly.",
    status: "Resolved",
    operatorResponse: "Glad we could help resolve your booking issue promptly!",
    timestamp: "2025-07-17T11:00:00Z",
  },
]

// Mock API Gateway URL for issue tickets
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "https://mockapi.example.com/operator"

export function IssueTicketManagement() {
  const [tickets, setTickets] = useState<IssueTicket[]>(initialIssueTickets)
  const [currentResponse, setCurrentResponse] = useState<{ [key: string]: string }>({})
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleResponseChange = (ticketId: string, value: string) => {
    setCurrentResponse((prev) => ({ ...prev, [ticketId]: value }))
  }

  const handleSendResponse = async (ticketId: string) => {
    const responseText = currentResponse[ticketId]?.trim()
    if (!responseText) {
      alert("Response cannot be empty.")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      // Simulate API Gateway call to respond to an issue ticket
      const response = await fetch(`${API_GATEWAY_URL}/issues/respond/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorResponse: responseText }),
      })
      const data = await response.json()
      console.log(`Respond to ticket ${ticketId} response:`, data)

      if (!response.ok) {
        throw new Error(data.message || "Failed to send response.")
      }

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, operatorResponse: responseText, status: "Pending Response" }
            : ticket,
        ),
      )
      setCurrentResponse((prev) => {
        const newState = { ...prev }
        delete newState[ticketId]
        return newState
      })
      setMessage("Response sent successfully!")
    } catch (error: any) {
      setMessage(error.message || "An error occurred while sending response.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsResolved = async (ticketId: string) => {
    setIsLoading(true)
    setMessage("")

    try {
      // Simulate API Gateway call to mark ticket as resolved
      const response = await fetch(`${API_GATEWAY_URL}/issues/resolve/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json()
      console.log(`Resolve ticket ${ticketId} response:`, data)

      if (!response.ok) {
        throw new Error(data.message || "Failed to mark ticket as resolved.")
      }

      setTickets((prev) =>
        prev.map((ticket) => (ticket.id === ticketId ? { ...ticket, status: "Resolved" } : ticket)),
      )
      setMessage("Ticket marked as resolved!")
    } catch (error: any) {
      setMessage(error.message || "An error occurred while resolving ticket.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-12">
          Customer Issue Tickets
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tickets.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center">No issue tickets at the moment.</p>
          ) : (
            tickets.map((ticket) => (
              <Card key={ticket.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Ticket #{ticket.id.split("-")[1].toUpperCase()}
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded-full ${
                        ticket.status === "Open"
                          ? "bg-red-100 text-red-800"
                          : ticket.status === "Pending Response"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    From User: {ticket.userId} | {new Date(ticket.timestamp).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1">Customer Message:</h4>
                    <p className="text-gray-700 dark:text-gray-300">{ticket.customerMessage}</p>
                  </div>
                  {ticket.operatorResponse && (
                    <div>
                      <h4 className="font-semibold mb-1">Your Last Response:</h4>
                      <p className="text-gray-600 dark:text-gray-400 italic">{ticket.operatorResponse}</p>
                    </div>
                  )}
                  {ticket.status !== "Resolved" && (
                    <div className="grid gap-2">
                      <Label htmlFor={`response-${ticket.id}`}>Your Response</Label>
                      <Textarea
                        id={`response-${ticket.id}`}
                        placeholder="Type your response here..."
                        value={currentResponse[ticket.id] || ""}
                        onChange={(e) => handleResponseChange(ticket.id, e.target.value)}
                        rows={3}
                        disabled={isLoading}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSendResponse(ticket.id)}
                          disabled={isLoading || !currentResponse[ticket.id]?.trim()}
                          className="flex-1"
                        >
                          Send Response
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleMarkAsResolved(ticket.id)}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          Mark as Resolved
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
        {message && (
          <p className={`text-center mt-4 text-sm ${message.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </div>
    </section>
  )
}
