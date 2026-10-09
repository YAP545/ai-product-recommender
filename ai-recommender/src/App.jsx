import { useState } from "react";
import { PRODUCTS } from "./products.js";
import { getRecommendations } from "./recommend.js";
import ProductCard from "./components/ProductCard.jsx";

const EXAMPLES = [
  "A phone under $500",
  "Headphones for a long commute",
  "Laptop for college, under $800",
  "Gift under $60",
];

export default function App() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [result, setResult] = useState(null); // { ids, reason, source }
  const [error, setError] = useState("");

  async function ask(text) {
    const q = text.trim();
    if (!q) return;
    setQuery(q);
    setStatus("loading");
    setError("");
    try {
      setResult(await getRecommendations(q, PRODUCTS));
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  const recommended = result ? new Set(result.ids) : null;
  // Recommended products first (in AI order), then the rest of the catalog.
  const picks = result ? result.ids.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean) : [];
  const others = recommended ? PRODUCTS.filter((p) => !recommended.has(p.id)) : PRODUCTS;

  return (
    <main className="page">
      <header className="intro">
        <h1>Tell us what you need.<br />We'll pick from the shelf.</h1>
        <form
          className="ask"
          onSubmit={(e) => { e.preventDefault(); ask(query); }}
        >
          <label htmlFor="prefs" className="sr-only">Your preferences</label>
          <input
            id="prefs"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. I want a phone under $500"
            maxLength={300}
          />
          <button type="submit" disabled={status === "loading" || !query.trim()}>
            {status === "loading" ? "Finding…" : "Recommend"}
          </button>
        </form>
        <div className="examples">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="chip" onClick={() => ask(ex)}>
              {ex}
            </button>
          ))}
        </div>
      </header>

      <section aria-live="polite" className="status">
        {status === "error" && <p className="error">{error}</p>}
        {status === "done" && (
          <p className="reason">
            {result.reason}
            {result.source === "fallback" && <span className="badge">demo mode</span>}
          </p>
        )}
      </section>

      {picks.length > 0 && (
        <section>
          <h2>Recommended for you</h2>
          <div className="grid">
            {picks.map((p) => <ProductCard key={p.id} product={p} highlighted />)}
          </div>
        </section>
      )}

      <section>
        <h2>{result ? "Rest of the catalog" : "All products"}</h2>
        <div className="grid">
          {others.map((p) => (
            <ProductCard key={p.id} product={p} dimmed={Boolean(result)} />
          ))}
        </div>
      </section>
    </main>
  );
}
