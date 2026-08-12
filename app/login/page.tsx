"use client"

import { useState } from "react"
import { authClient } from "@/lib/client/auth-client"

const SIGN_IN_ERROR_MESSAGE = "Couldn't start Google sign-in. Please try again."

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.84Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.26v3.11C3.24 21.3 7.28 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.61H1.26A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.26 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  )
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogleSignIn() {
    setIsLoading(true)
    setError(null)

    try {
      const { error: signInError } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/profile",
      })

      if (signInError) {
        setError(signInError.message || SIGN_IN_ERROR_MESSAGE)
        setIsLoading(false)
      }
    } catch {
      setError(SIGN_IN_ERROR_MESSAGE)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm text-center">
        <h1
          className="text-3xl font-black tracking-tight"
          style={{ fontFamily: "var(--font-display, sans-serif)" }}
        >
          Sign in to Wear or Dare
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save your looks and pick up where you left off.
        </p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-border bg-card text-sm font-semibold text-foreground shadow-sm transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        >
          <GoogleIcon />
          {isLoading ? "Redirecting…" : "Continue with Google"}
        </button>

        {error && (
          <p role="alert" className="mt-3 text-xs font-semibold text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
