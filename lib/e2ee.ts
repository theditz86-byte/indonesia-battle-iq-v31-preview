const DB_NAME = "alzava-secure-chat-v1"
const DB_VERSION = 1
const STORE_NAME = "device_keys"
const PRIMARY_KEY = "primary"
const ALG_LABEL = "ECDH-P256+HKDF-SHA256+AES-256-GCM"
const WRAP_INFO = new TextEncoder().encode("alzava-secure-dm-wrap-v1")

export type E2EEPublicDevice = {
  device_id: string
  public_jwk: JsonWebKey
  fingerprint: string
  last_seen_at?: string
}

export type E2EEKeyDirectory = {
  self_public_id?: string
  other_public_id?: string
  self_devices?: E2EEPublicDevice[]
  other_devices?: E2EEPublicDevice[]
}

export type E2EEEnvelopeV1 = {
  device_id: string
  salt: string
  iv: string
  wrapped_key: string
}

export type E2EEPayloadV1 = {
  v: 1
  alg: typeof ALG_LABEL
  msg_iv: string
  ciphertext: string
  ephemeral_public_jwk: JsonWebKey
  envelopes: E2EEEnvelopeV1[]
}

export type LocalE2EEDevice = {
  deviceId: string
  publicJwk: JsonWebKey
  fingerprint: string
  privateKey: CryptoKey
}

type StoredDevice = {
  id: string
  deviceId: string
  publicJwk: JsonWebKey
  fingerprint: string
  privateKey: CryptoKey
}

function cryptoAvailable() {
  return typeof window !== "undefined" && !!window.crypto?.subtle && typeof window.indexedDB !== "undefined"
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error("Secure chat storage unavailable"))
  })
}

async function readStoredDevice(): Promise<StoredDevice | null> {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const request = tx.objectStore(STORE_NAME).get(PRIMARY_KEY)
      request.onsuccess = () => resolve((request.result as StoredDevice | undefined) || null)
      request.onerror = () => reject(request.error || new Error("Secure chat key read failed"))
    })
  } finally {
    db.close()
  }
}

async function writeStoredDevice(value: StoredDevice) {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      tx.objectStore(STORE_NAME).put(value)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error || new Error("Secure chat key write failed"))
      tx.onabort = () => reject(tx.error || new Error("Secure chat key write aborted"))
    })
  } finally {
    db.close()
  }
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ""
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

async function fingerprintPublicJwk(jwk: JsonWebKey) {
  const canonical = [jwk.kty || "", jwk.crv || "", jwk.x || "", jwk.y || ""].join("|")
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

async function createDevice(): Promise<StoredDevice> {
  const generated = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]) as CryptoKeyPair
  const publicJwk = await crypto.subtle.exportKey("jwk", generated.publicKey)
  const privateJwk = await crypto.subtle.exportKey("jwk", generated.privateKey)
  const privateKey = await crypto.subtle.importKey("jwk", privateJwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"])
  const fingerprint = await fingerprintPublicJwk(publicJwk)
  return { id: PRIMARY_KEY, deviceId: crypto.randomUUID(), publicJwk, fingerprint, privateKey }
}

export async function getOrCreateLocalE2EEDevice(): Promise<LocalE2EEDevice> {
  if (!cryptoAvailable()) throw new Error("Browser belum mendukung penyimpanan kunci enkripsi yang diperlukan.")
  let stored = await readStoredDevice()
  if (!stored?.deviceId || !stored.privateKey || !stored.publicJwk || !stored.fingerprint) {
    stored = await createDevice()
    await writeStoredDevice(stored)
  }
  return { deviceId: stored.deviceId, publicJwk: stored.publicJwk, fingerprint: stored.fingerprint, privateKey: stored.privateKey }
}

async function importEcdhPublicKey(jwk: JsonWebKey) {
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, false, [])
}

async function deriveWrapKey(privateKey: CryptoKey, publicJwk: JsonWebKey, salt: Uint8Array) {
  const publicKey = await importEcdhPublicKey(publicJwk)
  const shared = await crypto.subtle.deriveBits({ name: "ECDH", public: publicKey }, privateKey, 256)
  const hkdf = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveKey"])
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info: WRAP_INFO },
    hkdf,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

function uniqueDevices(devices: E2EEPublicDevice[]) {
  const seen = new Set<string>()
  const out: E2EEPublicDevice[] = []
  for (const device of devices) {
    if (!device?.device_id || !device.public_jwk || seen.has(device.device_id)) continue
    seen.add(device.device_id)
    out.push(device)
    if (out.length >= 16) break
  }
  return out
}

export async function encryptPrivateMessage(
  plaintext: string,
  localDevice: LocalE2EEDevice,
  directory: E2EEKeyDirectory,
): Promise<E2EEPayloadV1> {
  const otherDevices = Array.isArray(directory.other_devices) ? directory.other_devices : []
  if (otherDevices.length === 0) throw new Error("secure_peer_not_ready")

  const selfDevices = Array.isArray(directory.self_devices) ? directory.self_devices : []
  const targets = uniqueDevices([
    ...selfDevices,
    ...otherDevices,
    { device_id: localDevice.deviceId, public_jwk: localDevice.publicJwk, fingerprint: localDevice.fingerprint },
  ])
  if (targets.length < 2) throw new Error("secure_peer_not_ready")

  const messageKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])
  const rawMessageKey = new Uint8Array(await crypto.subtle.exportKey("raw", messageKey))
  const msgIv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: msgIv }, messageKey, new TextEncoder().encode(plaintext)))

  const ephemeral = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]) as CryptoKeyPair
  const ephemeralPublicJwk = await crypto.subtle.exportKey("jwk", ephemeral.publicKey)
  const envelopes: E2EEEnvelopeV1[] = []

  for (const target of targets) {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const wrapIv = crypto.getRandomValues(new Uint8Array(12))
    const wrapKey = await deriveWrapKey(ephemeral.privateKey, target.public_jwk, salt)
    const wrapped = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: wrapIv }, wrapKey, rawMessageKey))
    envelopes.push({
      device_id: target.device_id,
      salt: bytesToBase64Url(salt),
      iv: bytesToBase64Url(wrapIv),
      wrapped_key: bytesToBase64Url(wrapped),
    })
  }

  rawMessageKey.fill(0)
  return {
    v: 1,
    alg: ALG_LABEL,
    msg_iv: bytesToBase64Url(msgIv),
    ciphertext: bytesToBase64Url(ciphertext),
    ephemeral_public_jwk: ephemeralPublicJwk,
    envelopes,
  }
}

export async function decryptPrivateMessage(payload: E2EEPayloadV1, localDevice: LocalE2EEDevice) {
  if (!payload || payload.v !== 1 || payload.alg !== ALG_LABEL || !Array.isArray(payload.envelopes)) throw new Error("secure_payload_invalid")
  const envelope = payload.envelopes.find((item) => item.device_id === localDevice.deviceId)
  if (!envelope) throw new Error("secure_device_not_authorized")

  const salt = base64UrlToBytes(envelope.salt)
  const wrapIv = base64UrlToBytes(envelope.iv)
  const wrapKey = await deriveWrapKey(localDevice.privateKey, payload.ephemeral_public_jwk, salt)
  const rawMessageKey = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: wrapIv }, wrapKey, base64UrlToBytes(envelope.wrapped_key)))
  try {
    const messageKey = await crypto.subtle.importKey("raw", rawMessageKey, { name: "AES-GCM" }, false, ["decrypt"])
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64UrlToBytes(payload.msg_iv) }, messageKey, base64UrlToBytes(payload.ciphertext))
    return new TextDecoder().decode(plaintext)
  } finally {
    rawMessageKey.fill(0)
  }
}

export function encryptedPreview(value?: string) {
  return value === "[e2ee:v1]" ? "🔒 Pesan terenkripsi" : value || ""
}
