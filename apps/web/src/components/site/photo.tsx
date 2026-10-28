/**
 * Photo slot from the design. Renders the client's image when `src` is set (see SITE.photos),
 * otherwise a labelled placeholder so the layout keeps its shape until photos are supplied.
 */
export function Photo({ src, alt, label, eager = false }: { src?: string; alt: string; label: string; eager?: boolean }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- client-supplied photo, dimensions unknown until provided
    return <img className="s-photo" src={src} alt={alt} loading={eager ? "eager" : "lazy"} />;
  }
  return (
    <div className="s-photo s-photo--empty" role="img" aria-label={alt}>
      <span className="s-photo__label">{label}</span>
    </div>
  );
}
