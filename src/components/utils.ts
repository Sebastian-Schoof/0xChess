import { generateRandomCode } from "utils/random";

export function generateIdentity() {
    const rawIdentity = Date.now() + generateRandomCode(499);
    return hash(rawIdentity);
}

async function hash(input: string) {
    const utf8 = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((bytes) => bytes.toString(16).padStart(2, "0"))
        .join("");
    return hashHex;
}
