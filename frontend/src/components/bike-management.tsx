"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Bike {
  id: string
  type: "eBike" | "Gyroscooter" | "Segway"
  accessCode: string
  features: string // Comma-separated string for simplicity
  hourlyRate: number
  discountCode?: string
}

// Mock data for existing bikes
const initialBikes: Bike[] = [
  {
    id: "bike-001",
    type: "eBike",
    accessCode: "EBK123",
    features: "Higher battery life, GPS tracking",
    hourlyRate: 50,
  },
  {
    id: "gyro-001",
    type: "Gyroscooter",
    accessCode: "GYR456",
    features: "Height adjustment",
    hourlyRate: 25,
    discountCode: "SUMMER20",
  },
  {
    id: "seg-001",
    type: "Segway",
    accessCode: "SEG789",
    features: "Self-balancing, LED lights",
    hourlyRate: 35,
  },
]

export function BikeManagement() {
  const [bikes, setBikes] = useState<Bike[]>(initialBikes)
  const [form, setForm] = useState<Omit<Bike, "id">>({
    type: "eBike",
    accessCode: "",
    features: "",
    hourlyRate: 0,
    discountCode: "",
  })
  const [editingBikeId, setEditingBikeId] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === "hourlyRate" ? parseFloat(value) : value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddUpdateBike = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    if (editingBikeId) {
      setBikes((prev) => prev.map((bike) => (bike.id === editingBikeId ? { ...form, id: editingBikeId } : bike)))
      setMessage("Bike updated successfully!")
    } else {
      const newBike: Bike = { ...form, id: `bike-${Date.now()}` }
      setBikes((prev) => [...prev, newBike])
      setMessage("Bike added successfully!")
    }

    setForm({ type: "eBike", accessCode: "", features: "", hourlyRate: 0, discountCode: "" })
    setEditingBikeId(null)
  }

  const startEditing = (bike: Bike) => {
    setForm(bike)
    setEditingBikeId(bike.id)
    setMessage("")
  }

  const cancelEditing = () => {
    setForm({ type: "eBike", accessCode: "", features: "", hourlyRate: 0, discountCode: "" })
    setEditingBikeId(null)
    setMessage("")
  }

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-12">
          Bike Inventory Management
        </h2>
        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{editingBikeId ? "Update Bike" : "Add New Bike"}</CardTitle>
              <CardDescription>Manage your fleet of eBikes, Gyroscooters, and Segways.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddUpdateBike} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Vehicle Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(value) => handleSelectChange("type", value as Bike["type"])}
                    required
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select a vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eBike">eBike</SelectItem>
                      <SelectItem value="Gyroscooter">Gyroscooter</SelectItem>
                      <SelectItem value="Segway">Segway</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="accessCode">Access Code</Label>
                  <Input
                    id="accessCode"
                    name="accessCode"
                    value={form.accessCode}
                    onChange={handleChange}
                    placeholder="e.g., EBK123"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="features">Features (comma-separated)</Label>
                  <Textarea
                    id="features"
                    name="features"
                    value={form.features}
                    onChange={handleChange}
                    placeholder="e.g., GPS tracking, higher battery life"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hourlyRate">Hourly Rental Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    name="hourlyRate"
                    type="number"
                    value={form.hourlyRate}
                    onChange={handleChange}
                    placeholder="e.g., 25"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="discountCode">Discount Code (Optional)</Label>
                  <Input
                    id="discountCode"
                    name="discountCode"
                    value={form.discountCode}
                    onChange={handleChange}
                    placeholder="e.g., SUMMER20"
                  />
                </div>
                <Button type="submit">
                  {editingBikeId ? "Update Bike" : "Add Bike"}
                </Button>
                {editingBikeId && (
                  <Button type="button" variant="outline" onClick={cancelEditing}>
                    Cancel
                  </Button>
                )}
                {message && (
                  <p className={`text-sm ${message.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
                    {message}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Inventory</CardTitle>
              <CardDescription>List of all bikes in your fleet.</CardDescription>
            </CardHeader>
            <CardContent>
              {bikes.length === 0 ? (
                <p className="text-muted-foreground">No bikes in inventory. Add one!</p>
              ) : (
                <div className="grid gap-4">
                  {bikes.map((bike) => (
                    <div key={bike.id} className="flex items-center justify-between rounded-md border p-4">
                      <div>
                        <h3 className="font-semibold">
                          {bike.type} ({bike.accessCode})
                        </h3>
                        <p className="text-sm text-muted-foreground">Rate: ${bike.hourlyRate}/hour</p>
                        {bike.features && (
                          <p className="text-xs text-muted-foreground">Features: {bike.features}</p>
                        )}
                        {bike.discountCode && (
                          <p className="text-xs text-muted-foreground">Discount: {bike.discountCode}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => startEditing(bike)}>
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}