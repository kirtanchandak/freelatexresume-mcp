const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const TAG_LENGTH = 128;

function hexToBuffer(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getKey(secret: string): Promise<CryptoKey> {
  const keyMaterial = hexToBuffer(secret);
  return crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(plaintext: string): Promise<string> {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) throw new Error("ENCRYPTION_SECRET is not set");

  const key = await getKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    encoded
  );

  // Format: hex(iv):hex(ciphertext+tag)
  return `${bufferToHex(iv)}:${bufferToHex(ciphertext)}`;
}

export async function decrypt(encrypted: string): Promise<string> {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) throw new Error("ENCRYPTION_SECRET is not set");

  const [ivHex, ciphertextHex] = encrypted.split(":");
  if (!ivHex || !ciphertextHex) throw new Error("Invalid encrypted format");

  const key = await getKey(secret);
  const iv = hexToBuffer(ivHex);
  const ciphertext = hexToBuffer(ciphertextHex);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
