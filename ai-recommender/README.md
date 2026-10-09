# AI Product Recommender

**Live Demo:** [https://ai-product-recommender-git-master-yash-patils-projects-fb9ed4af.vercel.app/](https://ai-product-recommender-git-master-yash-patils-projects-fb9ed4af.vercel.app/)

React (Vite) frontend + a Vercel serverless function that calls the Groq API for lightning-fast AI recommendations.

## How it works
1. The user types a preference ("a phone under $500").
2. The frontend POSTs the query and product list to `/api/recommend`.
3. The serverless function asks the model to choose products **from the catalog only**, returning JSON `{ ids, reason }`.
4. The function drops any id not in the catalog, and the UI moves the matching products to the top.

The API key stays server-side. With no key set, a keyword/budget fallback keeps the app working in "demo mode".

## Run locally
```bash
npm install
npm i -g vercel
vercel dev        # runs frontend + /api together (set GROQ_API_KEY in .env.local)
```

## Deploy to Vercel
1. Push this folder to GitHub.
2. Import the repo at vercel.com/new (framework: Vite is auto-detected).
3. Add env var `GROQ_API_KEY` (optional: `GROQ_MODEL`, default `openai/gpt-oss-20b`).
4. Deploy and share the URL.

## Structure
- `src/App.jsx` – page state and layout
- `src/components/ProductCard.jsx` – presentational card
- `src/recommend.js` – API client
- `src/products.js` – catalog
- `api/recommend.js` – AI call, validation, fallback
