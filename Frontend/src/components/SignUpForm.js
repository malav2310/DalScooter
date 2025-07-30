"use client"

import { useState } from "react"
import { CognitoUserPool } from "amazon-cognito-identity-js"
import { config } from "../config"

const SignUpForm = ({ onNavigateToSignIn }) => {
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

  const handleSubmit = (e) => {
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "28rem",
          backgroundColor: "white",
          borderRadius: "0.5rem",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.5rem",
            textAlign: "center",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              width: "3rem",
              height: "3rem",
              backgroundColor: "#dbeafe",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem auto",
            }}
          >
            <svg
              style={{ width: "1.5rem", height: "1.5rem", color: "#2563eb" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", margin: 0 }}>Create Account</h2>
          <p style={{ color: "#6b7280", marginTop: "0.5rem", margin: "0.5rem 0 0 0" }}>
            Sign up for secure access with custom authentication
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: "1.5rem" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="username"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "0.25rem",
                }}
              >
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
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  outline: "none",
                  transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
                  backgroundColor: isLoading ? "#f9fafb" : "white",
                  cursor: isLoading ? "not-allowed" : "text",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6"
                  e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)"
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db"
                  e.target.style.boxShadow = "none"
                }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "0.25rem",
                }}
              >
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
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  outline: "none",
                  transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
                  backgroundColor: isLoading ? "#f9fafb" : "white",
                  cursor: isLoading ? "not-allowed" : "text",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6"
                  e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)"
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db"
                  e.target.style.boxShadow = "none"
                }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="challengeQuestion"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "0.25rem",
                }}
              >
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
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  outline: "none",
                  transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
                  backgroundColor: isLoading ? "#f9fafb" : "white",
                  cursor: isLoading ? "not-allowed" : "text",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6"
                  e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)"
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db"
                  e.target.style.boxShadow = "none"
                }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="challengeAnswer"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "0.25rem",
                }}
              >
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
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  outline: "none",
                  transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
                  backgroundColor: isLoading ? "#f9fafb" : "white",
                  cursor: isLoading ? "not-allowed" : "text",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6"
                  e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)"
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db"
                  e.target.style.boxShadow = "none"
                }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="caesarKey"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "0.25rem",
                }}
              >
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
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  outline: "none",
                  transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
                  backgroundColor: isLoading ? "#f9fafb" : "white",
                  cursor: isLoading ? "not-allowed" : "text",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6"
                  e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)"
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db"
                  e.target.style.boxShadow = "none"
                }}
              />
              <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem", margin: "0.25rem 0 0 0" }}>
                Choose a number between 1-25 for encryption
              </p>
            </div>

            {message && (
              <div
                style={{
                  padding: "0.75rem",
                  borderRadius: "0.375rem",
                  marginBottom: "1rem",
                  backgroundColor: isSuccess ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
                }}
              >
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: isSuccess ? "#166534" : "#dc2626",
                    margin: 0,
                  }}
                >
                  {message}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                backgroundColor: isLoading ? "#93c5fd" : "#2563eb",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "none",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "background-color 0.2s ease-in-out",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseOver={(e) => {
                if (!isLoading) e.target.style.backgroundColor = "#1d4ed8"
              }}
              onMouseOut={(e) => {
                if (!isLoading) e.target.style.backgroundColor = "#2563eb"
              }}
            >
              {isLoading ? (
                <>
                  <svg
                    style={{
                      animation: "spin 1s linear infinite",
                      marginRight: "0.5rem",
                      height: "1rem",
                      width: "1rem",
                    }}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      style={{ opacity: 0.25 }}
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      style={{ opacity: 0.75 }}
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
              Already have an account?{" "}
              <button
                onClick={onNavigateToSignIn}
                style={{
                  color: "#2563eb",
                  textDecoration: "none",
                  fontWeight: "500",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
                onMouseOver={(e) => (e.target.style.textDecoration = "underline")}
                onMouseOut={(e) => (e.target.style.textDecoration = "none")}
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default SignUpForm
