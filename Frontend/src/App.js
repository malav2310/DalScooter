import AuthContainer from "./components/auth-container"

function App() {
  return (
    <div className="App">
      {/* Global Header for entire project */}
      <header
        style={{
          backgroundColor: "#1f2937",
          color: "white",
          padding: "1rem 0",
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1
          style={{
            fontSize: "1.875rem",
            fontWeight: "bold",
            margin: 0,
            letterSpacing: "0.05em",
          }}
        >
          Dal Scooter
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#9ca3af",
            margin: "0.25rem 0 0 0",
          }}
        >
          Your Campus Mobility Solution
        </p>
      </header>

      {/* Main Content */}
      <AuthContainer />
    </div>
  )
}

export default App
