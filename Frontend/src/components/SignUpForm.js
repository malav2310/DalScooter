"use client"

import { useState } from "react"
import { CognitoUserPool } from "amazon-cognito-identity-js"
import { config } from "../config"

const SignUpForm = () => {
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

  const pool = new CognitoUserPool({
    UserPoolId: config.userPoolId,
    ClientId: config.clientId,
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (message) setMessage("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    pool.signUp(
      form.username,
      form.password,
      [
        { Name: "custom:challenge_question", Value: form.challengeQuestion },
        { Name: "custom:challenge_answer", Value: form.challengeAnswer },
        { Name: "custom:caesar_key", Value: form.caesarKey },
      ],
      null,
      (err, result) => {
        setIsLoading(false)
        if (err) {
          setMessage(err.message)
          setIsSuccess(false)
        } else {
          setMessage("Sign up successful! Please check your email to verify your account.")
          setIsSuccess(true)
        }
      },
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
        <div className="p-6 text-center border-b">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">Sign up for secure access with custom authentication</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={form.username}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter a secure password"
                value={form.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="challengeQuestion" className="block text-sm font-medium text-gray-700 mb-1">
                Security Question
              </label>
              <input
                id="challengeQuestion"
                name="challengeQuestion"
                type="text"
                placeholder="e.g., What's your favorite color?"
                value={form.challengeQuestion}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="challengeAnswer" className="block text-sm font-medium text-gray-700 mb-1">
                Security Answer
              </label>
              <input
                id="challengeAnswer"
                name="challengeAnswer"
                type="text"
                placeholder="Your answer to the security question"
                value={form.challengeAnswer}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="caesarKey" className="block text-sm font-medium text-gray-700 mb-1">
                Caesar Cipher Key
              </label>
              <input
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Choose a number between 1-25 for encryption</p>
            </div>

            {message && (
              <div
                className={`p-3 rounded-md ${isSuccess ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
              >
                <p className={`text-sm ${isSuccess ? "text-green-800" : "text-red-800"}`}>{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/signin" className="text-blue-600 hover:underline font-medium">
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUpForm
