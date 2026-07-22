"use client"

import { createAuthClient } from "better-auth/react"

// When running inside the v0 preview iframe the client must explicitly
// target the origin of the running app so cookies are sent to the right host.
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return undefined
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
})

export const { signIn, signUp, signOut, useSession } = authClient
