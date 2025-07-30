"use client"

import { useState } from "react"

const quickActions = {
  guest: [
    { label: "Check bike availability", action: "availability" },
    { label: "Compare prices", action: "pricing" },
    { label: "Find nearest location", action: "location" },
    { label: "How to rent a bike", action: "how-to-rent" },
  ],
  registered: [
    { label: "My current bookings", action: "bookings" },
    { label: "Get access code", action: "access-code" },
    { label: "Report an issue", action: "report-issue" },
    { label: "Extend rental time", action: "extend-rental" },
  ],
  franchise: [
    { label: "Fleet status", action: "fleet-status" },
    { label: "Customer support tickets", action: "tickets" },
    { label: "Revenue summary", action: "revenue" },
    { label: "Add new bike", action: "add-bike" },
  ],
}

const mockResponses = {
  availability:
    "Currently, we have 12 Gyroscooters, 8 eBikes, and 5 Segways available across all locations. Downtown Station has the highest availability with 8 bikes total.",
  pricing:
    "Our current rates are: eBikes at $12/hour, Gyroscooters at $15/hour, and Segways at $20/hour. We also offer daily packages with up to 20% discount.",
  location:
    "The nearest location to you is Downtown Station at 123 Main St, just 0.2km away. It currently has 8 bikes available.",
  "how-to-rent":
    "To rent a bike: 1) Sign up for an account, 2) Select your preferred bike type and location, 3) Choose your rental duration, 4) Complete payment, 5) Receive your access code via SMS/email.",
  bookings:
    "You have 1 active booking: eBike at Downtown Station from 09:00-17:00 today. Access code: AB123. Your rental expires in 4 hours.",
  "access-code":
    "Your current access code is AB123 for the eBike at Downtown Station. The rental is valid until 17:00 today.",
  "report-issue":
    "I can help you report an issue. Please describe the problem you're experiencing, and I'll create a support ticket for you.",
  "extend-rental":
    "To extend your rental, I can help you add more time to your current booking. Current rate applies. Would you like to extend by 1, 2, or 4 hours?",
  "fleet-status":
    "Fleet overview: 18 bikes available, 4 currently rented, 2 under maintenance. Total revenue today: $1,234. Average rating: 4.5 stars.",
  tickets:
    "You have 2 open support tickets: T001 (high priority) - battery issue, T002 (medium priority) - unlock problem. Both require immediate attention.",
  revenue:
    "Today's revenue: $1,234 (+15% from yesterday). This week: $7,890. Top performing location: Downtown Station with $3,456.",
  "add-bike":
    "To add a new bike to your fleet, go to the 'Add/Update Bikes' tab. You'll need to specify: bike type, access code, location, hourly rate, and features.",
}

export default function VirtualAssistant({ onClose, userType = "guest", user }) {
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content: `Hello${user ? ` ${user.name}` : ""}! I'm your EcoRide virtual assistant. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      type: "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        type: "bot",
        content: getBotResponse(inputMessage),
        timestamp: new Date().toLocaleTimeString(),
      }
      setMessages((prev) => [...prev, botResponse])
    }, 1000)

    setInputMessage("")
  }

  const handleQuickAction = (action) => {
    const response = mockResponses[action] || "I'm here to help! Please let me know what specific information you need."

    const currentUserType = userType || "guest"
    const userMessage = {
      type: "user",
      content:
        (quickActions[currentUserType] || quickActions.guest).find((qa) => qa.action === action)?.label || action,
      timestamp: new Date().toLocaleTimeString(),
    }

    const botMessage = {
      type: "bot",
      content: response,
      timestamp: new Date().toLocaleTimeString(),
    }

    setMessages((prev) => [...prev, userMessage, botMessage])
  }

  const getBotResponse = (message) => {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("availability") || lowerMessage.includes("available")) {
      return mockResponses.availability
    } else if (lowerMessage.includes("price") || lowerMessage.includes("cost")) {
      return mockResponses.pricing
    } else if (lowerMessage.includes("location") || lowerMessage.includes("where")) {
      return mockResponses.location
    } else if (lowerMessage.includes("booking") || lowerMessage.includes("reservation")) {
      return userType === "guest" ? mockResponses["how-to-rent"] : mockResponses.bookings
    } else if (lowerMessage.includes("code") || lowerMessage.includes("access")) {
      return mockResponses["access-code"]
    } else {
      return "I understand you need help. Could you please be more specific about what you're looking for? I can assist with bike availability, pricing, locations, bookings, and more."
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        zIndex: 50,
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "42rem",
          height: "600px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-lg" style={{ padding: "0.5rem" }}>
                🤖
              </div>
              <div>
                <h3 className="font-bold">EcoRide Assistant</h3>
                <p className="text-sm text-gray-600">
                  {userType === "guest" && "Get help with bike rentals and navigation"}
                  {userType === "registered" && "Manage your bookings and get support"}
                  {userType === "franchise" && "Fleet management and operations support"}
                </p>
              </div>
            </div>
            <button className="ghost-button" onClick={onClose}>
              ❌
            </button>
          </div>
        </div>

        <div className="card-content" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Quick Actions */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Quick Actions:</p>
            <div className="flex flex-wrap gap-2">
              {(quickActions[userType] || quickActions.guest).map((action, index) => (
                <button key={index} className="outline-button text-xs" onClick={() => handleQuickAction(action.action)}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              padding: "1rem",
              overflowY: "auto",
            }}
          >
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    style={{
                      maxWidth: "80%",
                      borderRadius: "0.5rem",
                      padding: "0.75rem",
                      backgroundColor: message.type === "user" ? "#3b82f6" : "#f3f4f6",
                      color: message.type === "user" ? "white" : "#111827",
                    }}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === "bot" && <span style={{ marginTop: "0.125rem" }}>🤖</span>}
                      {message.type === "user" && <span style={{ marginTop: "0.125rem" }}>👤</span>}
                      <div style={{ flex: 1 }}>
                        <p className="text-sm">{message.content}</p>
                        <p
                          className="text-xs"
                          style={{
                            marginTop: "0.25rem",
                            color: message.type === "user" ? "rgba(255, 255, 255, 0.7)" : "#6b7280",
                          }}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="flex space-x-2">
            <input
              className="form-input flex-1"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button className="primary-button" onClick={handleSendMessage}>
              📤
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
