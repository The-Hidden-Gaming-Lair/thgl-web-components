/**
 * Builds an Error carrying the server's `error` message from an api-forge
 * response, falling back to a generic message with the status code.
 */
export async function errorFromResponse(
  res: Response,
  fallback: string,
): Promise<Error> {
  let message = `${fallback} (${res.status})`;
  try {
    const body = (await res.json()) as { error?: string };
    if (body.error) {
      message = body.error;
    }
  } catch {
    // Non-JSON response body — keep the fallback.
  }
  return new Error(message);
}
