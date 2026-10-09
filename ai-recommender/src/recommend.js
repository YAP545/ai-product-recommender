// Client-side wrapper around the /api/recommend serverless endpoint.

/**
 * Ask the AI which products fit the user's preferences.
 * @returns {Promise<{ ids: number[], reason: string, source: "ai" | "fallback" }>}
 */
export async function getRecommendations(query, products) {
  const res = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, products }),
  });

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error || `Request failed (${res.status})`);
  }
  return res.json();
}
