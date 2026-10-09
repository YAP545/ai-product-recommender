export default function ProductCard({ product, highlighted = false, dimmed = false }) {
  const { name, category, price, features } = product;
  const cls = ["card", highlighted && "card--pick", dimmed && "card--dim"].filter(Boolean).join(" ");

  return (
    <article className={cls}>
      <p className="card__cat">{category}</p>
      <h3 className="card__name">{name}</h3>
      <ul className="card__features">
        {features.map((f) => <li key={f}>{f}</li>)}
      </ul>
      <p className="card__price">${price}</p>
    </article>
  );
}
