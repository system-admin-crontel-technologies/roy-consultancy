/** Small label chip above section headings. `tone` picks the variant for grey and dark bands. */
export function SectionTag({ children, tone = "light" }: { children: React.ReactNode; tone?: "light" | "grey" | "dark" }) {
  return <span className={`s-tag s-tag--${tone}`}>{children}</span>;
}
