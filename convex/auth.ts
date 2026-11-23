import { convexAuth } from "@convex-dev/auth/server"
import { Password } from "@convex-dev/auth/providers/Password"
import Google from "@auth/core/providers/google"
import LinkedIn from "@auth/core/providers/linkedin"
import { ResendOTP } from "./ResendOTP"

// E-mail + password works without sending any e-mail, so it needs no domain.
// ResendOTP (code by e-mail) stays configured for when a verified sending domain exists.
const EmailPassword = Password({
  profile(params) {
    const email = String(params.email ?? "").trim().toLowerCase()
    return { email }
  },
  validatePasswordRequirements(password: string) {
    if (password.length < 8) throw new Error("PASSWORD_TOO_SHORT")
  },
})

// Social sign-in turns on only when its credentials are set in the Convex dashboard:
// AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET and AUTH_LINKEDIN_ID / AUTH_LINKEDIN_SECRET.
const social = [
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [Google] : []),
  ...(process.env.AUTH_LINKEDIN_ID && process.env.AUTH_LINKEDIN_SECRET ? [LinkedIn] : []),
]

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [EmailPassword, ResendOTP, ...social],
})
