import Resend from "@auth/core/providers/resend"

// 6-digit sign-in code sent by email through Resend.
// Set AUTH_RESEND_KEY and AUTH_EMAIL_FROM (e.g. "Dev English <login@seudominio.com>") in the Convex dashboard.
function generateOTP(length: number): string {
  const digits = "0123456789"
  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (n) => digits[n % digits.length]).join("")
}

export const ResendOTP = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 15,
  async generateVerificationToken() {
    return generateOTP(6)
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.AUTH_EMAIL_FROM ?? "Dev English <onboarding@resend.dev>",
        to: [email],
        subject: `Seu código do Dev English: ${token}`,
        text: `Seu código para entrar no Dev English é ${token}.\n\nEle vale por 15 minutos. Se você não pediu este código, ignore este e-mail.`,
      }),
    })
    if (!res.ok) {
      throw new Error(`Could not send sign-in email (${res.status})`)
    }
  },
})
