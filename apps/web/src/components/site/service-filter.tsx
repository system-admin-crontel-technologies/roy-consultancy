"use client";

import { useState } from "react";
import { SERVICES, TABS, type Tab } from "@/lib/site/content";
import { ServiceCard } from "./service-card";

export function ServiceFilter() {
  const [tab, setTab] = useState<Tab>("All");
  const list = tab === "All" ? SERVICES : SERVICES.filter((s) => s.cat === tab);
  return (
    <section id="services" className="s-grey" aria-label="Services">
      <div className="s-container s-services">
        <div className="s-tabs" role="group" aria-labelledby="filter-label">
          <span id="filter-label" className="s-tabs__label">
            Filter by practice area
          </span>
          {TABS.map((t) => (
            <button key={t} type="button" className="s-chip" aria-pressed={t === tab} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="s-grid" aria-live="polite">
          {list.map((s) => (
            <ServiceCard key={s.num} service={s} />
          ))}
        </div>
      </div>
    </section>
  );
}
