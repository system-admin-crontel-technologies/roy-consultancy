import { STEPS } from "@/lib/site/content";
import { SectionTag } from "./section-tag";

export function ProcessSteps() {
  return (
    <section id="process" className="s-dark" aria-labelledby="process-title">
      <div className="s-container s-section">
        <SectionTag tone="dark">How we work</SectionTag>
        <h2 id="process-title" className="s-h2">
          Four Steps. No Surprises.
        </h2>
        <ol className="s-steps">
          {STEPS.map((st) => (
            <li key={st.n} className="s-step">
              <span className="s-step__n" aria-hidden>
                {st.n}
              </span>
              <span className="s-step__title">{st.title}</span>
              <span className="s-step__desc">{st.desc}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
