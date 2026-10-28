import { PILLARS } from "@/lib/site/content";
import { SectionTag } from "./section-tag";

export function Pillars() {
  return (
    <section className="s-grey" aria-labelledby="pillars-title">
      <div className="s-container s-section s-section--center">
        <SectionTag tone="grey">Why Roy Consultancy</SectionTag>
        <h2 id="pillars-title" className="s-h2 s-h2--center">
          Built Around How Businesses Actually File
        </h2>
        <div className="s-grid s-grid--4">
          {PILLARS.map((p, i) => (
            <div key={p.title} className="s-card s-card--pillar">
              <span className="s-card__num">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="s-card__title">{p.title}</h3>
              <p className="s-card__desc">{p.desc}</p>
              <span className="s-corner s-corner--sm" aria-hidden />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
