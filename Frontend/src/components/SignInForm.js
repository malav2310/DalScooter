import { useState } from "react"
import { CognitoIdentityProviderClient, InitiateAuthCommand, RespondToAuthChallengeCommand } from "@aws-sdk/client-cognito-identity-provider"

const AUTH_FLOW = "CUSTOM_AUTH"
const CLIENT_ID = process.env.REACT_APP_COGNITO_CLIENT_ID

const SignInForm = ({ onNavigateToSignUp, onAuthSuccess }) => {
  const [form, setForm] = useState({ username: "", password: "", answer: "" })
  const [step, setStep] = useState(1)
  const [message, setMessage] = useState("")
  const [currentChallenge, setCurrentChallenge] = useState(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.REACT_APP_REGION })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (message) setMessage("")
  }

  const startAuth = async () => {
    setIsLoading(true)
    setMessage("")

    const signIn = new InitiateAuthCommand({
      ClientId: CLIENT_ID,
      AuthFlow: AUTH_FLOW,
      AuthParameters: {
        USERNAME: form.username,
      },
    })
    let initRes = undefined

    try {
      initRes = await cognitoClient.send(signIn)
    } catch (e) {
      setIsLoading(false)
      setIsSuccess(false)
      setMessage(e.message)
      setMessage("error")
      return
    }

    if (initRes.AuthenticationResult) {
      setIsLoading(false)
      setIsSuccess(true)
      setMessage("Sign in successful!")
    } else if (initRes.ChallengeName) {
      const firstResponse = new RespondToAuthChallengeCommand({
        ClientId: CLIENT_ID,
        ChallengeName: initRes.ChallengeName,
        Session: initRes.Session,
        ChallengeResponses: {
          USERNAME: initRes.ChallengeParameters.USERNAME,
          ANSWER: form.password,
        },
        ClientMetadata: {
          "CLIENT_ID": CLIENT_ID
        }
      })

      try {
        cognitoClient.send(firstResponse).then(out => {
          setIsLoading(false)
          setStep(2)
          setCurrentChallenge({ ChallengeName: out.ChallengeName, ChallangeParameters: out.ChallengeParameters, Session: out.Session })
        })
      } catch (e) {
        setIsLoading(false)
        setIsSuccess(false)
        setMessage(e.message)
      }
    }
  }

  const handleChallengeResponse = () => {
    setIsLoading(true)
    setMessage("")

    const challengeResp = new RespondToAuthChallengeCommand({
      ClientId: CLIENT_ID,
      ChallengeName: currentChallenge.ChallengeName,
      Session: currentChallenge.Session,
      ChallengeResponses: {
        "USERNAME": form.username,
        "ANSWER": form.answer,
      }
    })

    try {
      cognitoClient.send(challengeResp).then(out => {
        if (out.AuthenticationResult) {
          setIsSuccess(true)
          setMessage("Sign in successful!")
        } else if (out.ChallengeName) {
          setCurrentChallenge({ ChallengeName: out.ChallengeName, ChallangeParameters: out.ChallengeParameters, Session: out.Session })
          setForm({ ...form, answer: "" })
          setStep(step + 1)
        }
      })
    } catch (e) {
      setMessage(e.message)
      setIsSuccess(false)
    }

    setIsLoading(false)
  }

  const handleSubmit = (e) => {
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
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", margin: 0 }}>
            {step === 1 ? "Welcome Back" : "Security Challenge"}
          </h2>
          <p style={{ color: "#6b7280", marginTop: "0.5rem", margin: "0.5rem 0 0 0" }}>
            {step === 1 ? "Sign in to your account" : "Please answer your security question"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div style={{ padding: "1rem 1.5rem 0 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
            <div
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "50%",
                backgroundColor: "#2563eb",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.875rem",
                fontWeight: "bold",
              }}
            >
              1
            </div>
            <div
              style={{
                flex: 1,
                height: "2px",
                backgroundColor: step > 1 ? "#2563eb" : "#e5e7eb",
                margin: "0 0.5rem",
              }}
            ></div>
            <div
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "50%",
                backgroundColor: step > 1 ? "#2563eb" : "#e5e7eb",
                color: step > 1 ? "white" : "#6b7280",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.875rem",
                fontWeight: "bold",
              }}
            >
              2
            </div>
            <div
              style={{
                flex: 1,
                height: "2px",
                backgroundColor: step > 2 ? "#2563eb" : "#e5e7eb",
                margin: "0 0.5rem",
              }}
            ></div>
            <div
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "50%",
                backgroundColor: step > 2 ? "#2563eb" : "#e5e7eb",
                color: step > 1 ? "white" : "#6b7280",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.875rem",
                fontWeight: "bold",
              }}
            >
              3
            </div>
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: "0 1.5rem 1.5rem 1.5rem" }}>
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <>
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
                    placeholder="Enter your password"
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
              </>
            )}

            {step === 2 && (
              <>
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.375rem",
                    padding: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
                    <svg
                      style={{ width: "1.25rem", height: "1.25rem", color: "#3b82f6", marginRight: "0.5rem" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#374151" }}>Security Question</span>
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>{currentChallenge.ChallangeParameters.question}</p>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label
                    htmlFor="answer"
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Your Answer
                  </label>
                  <input
                    id="answer"
                    name="answer"
                    type="text"
                    placeholder="Enter your answer"
                    value={form.answer}
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
              </>
            )}

            {step === 3 && (
              <>
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.375rem",
                    padding: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
                    <svg
                      style={{ width: "1.25rem", height: "1.25rem", color: "#3b82f6", marginRight: "0.5rem" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#374151" }}>Please apply your caesar key to this string:</span>
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>{currentChallenge.ChallangeParameters.question}</p>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label
                    htmlFor="answer"
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Your Answer
                  </label>
                  <input
                    id="answer"
                    name="answer"
                    type="text"
                    placeholder="Enter your answer"
                    value={form.answer}
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
              </>
            )}

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

            <div style={{ display: "flex", gap: "0.75rem" }}>
              {step === 2 && (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    backgroundColor: "white",
                    color: "#374151",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #d1d5db",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s ease-in-out",
                  }}
                  onMouseOver={(e) => {
                    if (!isLoading) e.target.style.backgroundColor = "#f9fafb"
                  }}
                  onMouseOut={(e) => {
                    if (!isLoading) e.target.style.backgroundColor = "white"
                  }}
                >
                  Back
                </button>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  flex: step === 2 ? 2 : 1,
                  width: step === 1 ? "100%" : "auto",
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
                    {step === 1 ? "Signing In..." : "Verifying..."}
                  </>
                ) : step === 1 ? (
                  "Sign In"
                ) : (
                  "Submit Answer"
                )}
              </button>
            </div>
          </form>

          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
              Don't have an account?{" "}
              <button
                onClick={onNavigateToSignUp}
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
                Sign up here
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

export default SignInForm
