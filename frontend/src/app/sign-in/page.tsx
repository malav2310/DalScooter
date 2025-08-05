"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  type ChallengeNameType,
} from "@aws-sdk/client-cognito-identity-provider"

import { CognitoIdentityClient, GetCredentialsForIdentityCommand } from "@aws-sdk/client-cognito-identity"

// Environment variables for Cognito
const AUTH_FLOW = "CUSTOM_AUTH" // Or "USER_SRP_AUTH" depending on your Cognito setup
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
const REGION = process.env.NEXT_PUBLIC_REGION

export default function SignInPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: "", password: "", answer: "" })
  const [step, setStep] = useState(1)
  const [message, setMessage] = useState("")
  const [currentChallenge, setCurrentChallenge] = useState<
    | {
      ChallengeName: ChallengeNameType | undefined
      ChallangeParameters: Record<string, string> | undefined
      Session: string | undefined
    }
    | undefined
  >(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Initialize Cognito Client only if CLIENT_ID and REGION are available
  const cognitoClient = CLIENT_ID && REGION ? new CognitoIdentityProviderClient({ region: REGION }) : undefined

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (message) setMessage("")
  }

  const startAuth = async () => {
    if (!cognitoClient) {
      setMessage("Cognito client not configured. Check environment variables.")
      return
    }

    setIsLoading(true)
    setMessage("")
    setIsSuccess(false)

    const signInCommand = new InitiateAuthCommand({
      ClientId: CLIENT_ID,
      AuthFlow: AUTH_FLOW,
      AuthParameters: {
        USERNAME: form.username,
      },
    })

    try {
      const initRes = await cognitoClient.send(signInCommand)
      console.log("InitiateAuthCommand response:", initRes)

      if (initRes.AuthenticationResult) {
        setIsSuccess(true)
        setMessage("Sign in successful!")
        // Redirect to a protected page after successful authentication
        router.push("/") // Change to your desired post-sign-in page
      } else if (initRes.ChallengeName) {
        // If there's a challenge, respond to it with the password
        const firstResponseCommand = new RespondToAuthChallengeCommand({
          ClientId: CLIENT_ID,
          ChallengeName: initRes.ChallengeName,
          Session: initRes.Session,
          ChallengeResponses: {
            USERNAME: initRes.ChallengeParameters?.USERNAME || form.username,
            ANSWER: form.password, // Assuming password is the answer for the first challenge
          },
          ClientMetadata: {
            CLIENT_ID: CLIENT_ID || "", // Ensure CLIENT_ID is a string
          },
        })

        const out = await cognitoClient.send(firstResponseCommand)
        console.log("First RespondToAuthChallengeCommand response:", out)

        if (out.AuthenticationResult) {
          setIsSuccess(true)
          setMessage("Sign in successful!")
          router.push("/") // Change to your desired post-sign-in page
        } else if (out.ChallengeName) {
          setCurrentChallenge({
            ChallengeName: out.ChallengeName,
            ChallangeParameters: out.ChallengeParameters,
            Session: out.Session,
          })
          setForm({ ...form, answer: "" }) // Clear answer for next challenge
          setStep(2) // Move to challenge step
        }
      }
    } catch (e: any) {
      setMessage(e.message || "An unknown error occurred during sign-in.")
      setIsSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChallengeResponse = async () => {
    if (!cognitoClient || !currentChallenge) {
      setMessage("Cognito client or challenge not configured.")
      return
    }

    setIsLoading(true)
    setMessage("")
    setIsSuccess(false)

    const challengeRespCommand = new RespondToAuthChallengeCommand({
      ClientId: CLIENT_ID,
      ChallengeName: currentChallenge.ChallengeName,
      Session: currentChallenge.Session,
      ChallengeResponses: {
        USERNAME: form.username,
        ANSWER: form.answer,
      },
    })

    try {
      const out = await cognitoClient.send(challengeRespCommand)
      console.log("Subsequent RespondToAuthChallengeCommand response:", out)

      if (out.AuthenticationResult?.IdToken) {
        setIsSuccess(true)
        setMessage("Sign in successful!")

        sessionStorage.setItem("idToken", out.AuthenticationResult.IdToken)

        router.push("/feedback") // Change to your desired post-sign-in page
      } else if (out.ChallengeName) {
        setCurrentChallenge({
          ChallengeName: out.ChallengeName,
          ChallangeParameters: out.ChallengeParameters,
          Session: out.Session,
        })
        setForm({ ...form, answer: "" })
        setStep(step + 1) // Move to next challenge step
      }
    } catch (e: any) {
      setMessage(e.message || "An unknown error occurred during challenge response.")
      setIsSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (step === 1) {
      startAuth()
    } else {
      handleChallengeResponse()
    }
  }

  const goBack = () => {
    setStep(1)
    setMessage("")
    setForm({ ...form, answer: "" })
    setCurrentChallenge(undefined)
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] py-12">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            {step === 1
              ? "Enter your email and password to sign in to your account"
              : `${currentChallenge?.ChallangeParameters?.prompt} ${currentChallenge?.ChallangeParameters?.question}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {step === 1 ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="username">Email</Label>
                  <Input
                    id="username"
                    name="username"
                    type="email"
                    placeholder="m@example.com"
                    value={form.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="ml-auto inline-block text-sm underline">
                      Forgot your password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="answer">Challenge Answer</Label>
                <Input id="answer" name="answer" type="text" value={form.answer} onChange={handleChange} required />
                <Button variant="outline" onClick={goBack} className="w-full mt-2 bg-transparent">
                  Go Back
                </Button>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : step === 1 ? "Sign In" : "Submit Challenge"}
            </Button>
          </form>
          {message && (
            <div className={`mt-4 text-center text-sm ${isSuccess ? "text-green-600" : "text-red-600"}`} role="alert">
              {message}
            </div>
          )}
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="underline">
              Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}