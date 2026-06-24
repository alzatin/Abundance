export function getOAuthRedirectUri(configuredRedirectUri, origin) {
  if (configuredRedirectUri?.trim()) {
    const normalizedRedirectUri = configuredRedirectUri.trim().replace(/\/$/, "");
    return normalizedRedirectUri.endsWith("/callback")
      ? normalizedRedirectUri
      : `${normalizedRedirectUri}/callback`;
  }

  return `${origin}/callback`;
}
