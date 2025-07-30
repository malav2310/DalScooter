"use client"

import { useState } from "react"
import SignUpForm from "./SignUpForm"
import SignInForm from "./SignInForm"

const AuthContainer = () => {
  const [currentView, setCurrentView] = useState("signin") // Start with sign in

  const navigateToSignUp = () => {
    setCurrentView("signup")
  }

  const navigateToSignIn = () => {
    setCurrentView("signin")
  }

  return (
    <div>
      {currentView === "signup" ? (
        <SignUpForm onNavigateToSignIn={navigateToSignIn} />
      ) : (
        <SignInForm onNavigateToSignUp={navigateToSignUp} />
      )}
    </div>
  )
}

export default AuthContainer
