import type { SiteService } from "@/lib/site/content";

/** Services page card with the bulleted inclusions list and the numbered corner badge. */
export function ServiceCard({ service }: { service: SiteService }) {
  return (
    <article className="s-card s-card--service">
      <span className="s-card__cat">{service.cat}</span>
      <h3 className="s-card__title s-card__title--lg">{service.title}</h3>
      <p className="s-card__desc">{service.desc}</p>
      <ul className="s-card__items">
        {service.items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
      <span className="s-corner" aria-hidden>
        {service.num}
      </span>
    </article>
  );
}
