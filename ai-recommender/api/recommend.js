// Vercel serverless function. Keeps the API key off the client.
// POST { query: string, products: Product[] } -> { ids, reason, source }

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  const { query, products } = req.body || {};
  if (typeof query !== "string" || !query.trim() || !Array.isArray(products)) {
    return res.status(400).json({ error: "Send a preference and the product list." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(200).json(fallbackRecommend(query, products));
  }

  try {
    const catalog = products.map(({ id, name, category, price, features }) => ({
      id, name, category, price_usd: price, features,
    }));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a shopping assistant. Recommend products ONLY from the provided catalog. " +
              "Respect hard constraints such as budget and category. Return at most 4 products, best match first. " +
              'Respond with JSON: {"ids": number[], "reason": string}. ' +
              "reason is one or two plain sentences. If nothing fits, return an empty ids array and explain why.",
          },
          {
            role: "user",
            content: `Catalog:\n${JSON.stringify(catalog)}\n\nCustomer request: ${query.slice(0, 500)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("OpenAI error:", response.status, detail);
      return res.status(502).json({ error: "The AI service returned an error. Try again." });
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    // Never trust model output: keep only ids that exist in the catalog.
    const valid = new Set(products.map((p) => p.id));
    const ids = (Array.isArray(parsed.ids) ? parsed.ids : []).filter((id) => valid.has(id));

    return res.status(200).json({ ids, reason: String(parsed.reason || ""), source: "ai" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong while getting recommendations." });
  }
}

// Used only when no API key is configured, so the app still demos end-to-end.
function fallbackRecommend(query, products) {
  const q = query.toLowerCase();
  const budget = q.match(/(?:under|below|less than|max|<)\s*\$?\s*(\d+)/);
  const max = budget ? Number(budget[1]) : Infinity;

  const words = q.split(/\W+/).filter((w) => w.length > 2);
  const scored = products
    .filter((p) => p.price <= max)
    .map((p) => {
      const text = `${p.name} ${p.category} ${p.features.join(" ")}`.toLowerCase();
      const score = words.reduce((s, w) => s + (text.includes(w.replace(/s$/, "")) ? 1 : 0), 0);
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return {
    ids: scored.map((x) => x.p.id),
    reason: scored.length
      ? "Matched by keywords and budget (demo mode — add OPENAI_API_KEY for AI answers)."
      : "No products matched. Try a category like phone or headphones, and a budget.",
    source: "fallback",
  };
}
