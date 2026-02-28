/* Link Preview Card
 * Full-width OG image card — like Facebook/LinkedIn link previews
 * Image takes full width with rounded corners, domain shown below
 */

interface LinkPreviewCardProps {
  url: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  siteName?: string | null;
}

export default function LinkPreviewCard({ url, title, description, image, siteName }: LinkPreviewCardProps) {
  const domain = (() => {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return siteName || url; }
  })();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="block mt-3 rounded-2xl overflow-hidden border border-border hover:opacity-90 transition-opacity"
    >
      {/* Full-width image — main visual */}
      {image ? (
        <div className="w-full bg-secondary">
          <img
            src={image}
            alt={title || domain}
            className="w-full object-cover max-h-72"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
          />
        </div>
      ) : (
        /* No image fallback — show a coloured block with domain */
        <div className="w-full h-32 bg-secondary flex items-center justify-center">
          <span className="text-2xl font-bold text-muted-foreground uppercase">{domain.charAt(0)}</span>
        </div>
      )}

      {/* Bottom bar: domain + title */}
      <div className="px-3 py-2 bg-secondary/60">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{siteName || domain}</p>
        {title && (
          <p className="text-sm font-semibold leading-snug line-clamp-2 mt-0.5">{title}</p>
        )}
      </div>
    </a>
  );
}
