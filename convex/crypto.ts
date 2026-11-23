// Field-level encryption for text the learner writes (AES-256-GCM).
// The key lives only in the Convex environment (DATA_KEY: 32 random bytes, base64),
// so a copy of the database alone does not reveal what anyone wrote.
// Equality lookups use an HMAC of the text instead of the text itself.

const PREFIX = "enc1:"
let keys: Promise<{ aes: CryptoKey; mac: CryptoKey }> | null = null

function b64(bytes: Uint8Array): string {
  let s = ""
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}
function unb64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s)
  const out = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function getKeys() {
  if (!keys) {
    const raw = process.env.DATA_KEY
    if (!raw) throw new Error("DATA_KEY is not set")
    const bytes = unb64(raw)
    if (bytes.length !== 32) throw new Error("DATA_KEY must be 32 bytes (base64)")
    keys = (async () => ({
      aes: await crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]),
      // Separate key for lookups, derived so the AES key is never reused for HMAC.
      mac: await crypto.subtle.importKey(
        "raw",
        new Uint8Array(await crypto.subtle.digest("SHA-256", new Uint8Array([...bytes, ...new TextEncoder().encode("lookup")]))),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      ),
    }))()
  }
  return keys
}

export async function encrypt(text: string): Promise<string> {
  const { aes } = await getKeys()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aes, new TextEncoder().encode(text)))
  const out = new Uint8Array(iv.length + ct.length)
  out.set(iv)
  out.set(ct, iv.length)
  return PREFIX + b64(out)
}

// Rows written before encryption existed are returned as they are.
export async function decrypt(value: string): Promise<string> {
  if (!value.startsWith(PREFIX)) return value
  const { aes } = await getKeys()
  const data = unb64(value.slice(PREFIX.length))
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: data.slice(0, 12) }, aes, data.slice(12))
  return new TextDecoder().decode(pt)
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX)
}

export async function lookupHash(text: string): Promise<string> {
  const { mac } = await getKeys()
  return b64(new Uint8Array(await crypto.subtle.sign("HMAC", mac, new TextEncoder().encode(text.trim().toLowerCase()))))
}
