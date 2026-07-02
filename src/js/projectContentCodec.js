import pako from "pako";

const COMPRESSED_PROJECT_MARKER = "__abundanceCompressedProject";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function base64ToUint8(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encodeProjectContentForGitHub(rawJsonText) {
  const rawBytes = textEncoder.encode(rawJsonText);
  return {
    content: rawJsonText,
    isCompressed: false,
    rawBytes: rawBytes.length,
    storedBytes: rawBytes.length,
  };
}

export function decodeProjectContentFromGitHub(storedText) {
  if (typeof storedText !== "string" || storedText.length === 0) {
    return storedText;
  }

  try {
    const maybeWrapped = JSON.parse(storedText);
    if (!maybeWrapped || maybeWrapped[COMPRESSED_PROJECT_MARKER] !== true) {
      return storedText;
    }

    if (
      maybeWrapped.encoding !== "gzip-base64-utf8" ||
      typeof maybeWrapped.payload !== "string"
    ) {
      throw new Error("Unsupported compressed project format");
    }

    const gzipped = base64ToUint8(maybeWrapped.payload);
    const unzipped = pako.ungzip(gzipped);
    return textDecoder.decode(unzipped);
  } catch (error) {
    // If the file isn't wrapped metadata JSON, return as-is.
    // For wrapped-but-invalid payloads, surface the error.
    const markerPresent = storedText.includes(COMPRESSED_PROJECT_MARKER);
    if (markerPresent) {
      throw error;
    }
    return storedText;
  }
}
