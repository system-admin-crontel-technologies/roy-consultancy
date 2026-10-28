import { SITE } from "@/lib/site/config";
import { DATES } from "@/lib/site/content";
import { SectionTag } from "./section-tag";

export function ComplianceCalendar() {
  if (!SITE.showCalendar) return null;
  return (
    <section id="calendar" className="s-container s-section s-split s-split--top" aria-labelledby="calendar-title">
      <div className="s-stack">
        <SectionTag>Compliance calendar</SectionTag>
        <h2 id="calendar-title" className="s-h2">
          Dates That Cost Money When Missed
        </h2>
        <p className="s-body">Retainer clients get reminders well ahead of every deadline — and we file before they arrive.</p>
        <p className="s-note">Indicative; subject to notified extensions.</p>
      </div>
      <ul className="s-dates">
        {DATES.map((d) => (
          <li key={d.form} className="s-date">
            <span className="s-date__when">{d.when}</span>
            <span className="s-date__body">
              <span className="s-date__form">{d.form}</span>
              <span className="s-date__what">{d.what}</span>
            </span>
            <span className="s-date__tag">{d.tag}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
