"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react" // For loading spinner

import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider"

// Environment variables for Cognito
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
const REGION = process.env.NEXT_PUBLIC_REGION

export default function SignUpPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    username: "",
    password: "",
    challengeQuestion: "",
    challengeAnswer: "",
    caesarKey: "",
  })
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Initialize Cognito Client only if CLIENT_ID and REGION are available
  const cognitoClient = CLIENT_ID && REGION ? new CognitoIdentityProviderClient({ region: REGION }) : undefined

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (message) setMessage("")
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!cognitoClient) {
      setMessage("Cognito client not configured. Check environment variables.")
      return
    }

    setIsLoading(true)
    setMessage("")
    setIsSuccess(false)

    const signUpCommand = new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: form.username,
      Password: form.password,
      ClientMetadata: {
        challenge_question: form.challengeQuestion,
        challenge_answer: form.challengeAnswer,
        caesar_key: form.caesarKey,
      },
    })

    try {
      const out = await cognitoClient.send(signUpCommand)
      console.log("SignUpCommand response:", out)

      setIsSuccess(true)
      setMessage("Sign up successful! Please check your email to confirm your account.")
      // Optionally, redirect to a confirmation page or sign-in page
      // router.push('/sign-in');
    } catch (e: any) {
      setMessage(e.message || "An unknown error occurred during sign-up.")
      setIsSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Sign up for secure access with custom authentication</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username (Email)</Label>
              <Input
                id="username"
                name="username"
                type="email"
                placeholder="Enter your email"
                value={form.username}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter a secure password"
                value={form.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="challengeQuestion">Security Question</Label>
              <Input
                id="challengeQuestion"
                name="challengeQuestion"
                type="text"
                placeholder="e.g., What's your favorite color?"
                value={form.challengeQuestion}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="challengeAnswer">Security Answer</Label>
              <Input
                id="challengeAnswer"
                name="challengeAnswer"
                type="text"
                placeholder="Your answer to the security question"
                value={form.challengeAnswer}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="caesarKey">Caesar Cipher Key</Label>
              <Input
                id="caesarKey"
                name="caesarKey"
                type="number"
                placeholder="Enter a number (e.g., 3)"
                value={form.caesarKey}
                onChange={handleChange}
                required
                disabled={isLoading}
                min="1"
                max="25"
              />
              <p className="text-sm text-muted-foreground">Pick a Caesar-Cipher key</p>
            </div>
            {message && (
              <div
                className={`rounded-md p-3 text-sm ${isSuccess ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
                role="alert"
              >
                <p>{message}</p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link href="/sign-in" className="underline">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
