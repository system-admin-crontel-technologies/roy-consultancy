"use client";

import { useId, useState } from "react";
import { FAQS } from "@/lib/site/content";
import { SectionTag } from "./section-tag";

/** One item open at a time; the first is open by default. Clicking an open item closes it. */
export function Faq() {
  const [open, setOpen] = useState(0);
  const base = useId();
  return (
    <section id="faq" className="s-container s-section s-section--center" aria-labelledby="faq-title">
      <SectionTag>FAQ</SectionTag>
      <h2 id="faq-title" className="s-h2 s-h2--center">
        Asked Often
      </h2>
      <div className="s-faq__list">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          const panelId = `${base}-${i}`;
          return (
            <div key={f.q} className="s-faq__item">
              <h3>
                <button type="button" className="s-faq__q" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpen(isOpen ? -1 : i)}>
                  <span className="s-faq__q-text">{f.q}</span>
                  <span className="s-faq__sign" aria-hidden>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
              </h3>
              {isOpen ? (
                <p id={panelId} className="s-faq__a">
                  {f.a}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
