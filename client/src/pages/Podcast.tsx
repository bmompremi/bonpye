import { ExternalLink, Music, Radio } from "lucide-react";

const SPOTIFY_SHOW_ID = "6g45iCaXSobnH38YMc0ZZw";
const hasShowId = SPOTIFY_SHOW_ID !== "YOUR_SHOW_ID_HERE";

const TAGS = ["#FoutbòlAyisyen", "#BonpyeSoccerTalk", "#Haiti", "#Football", "#Podcast"];

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" className="fill-current">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

export default function Podcast() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative">
            <img src="/images/bonpye_logo.gif" alt="Bonpye" className="h-24 w-24 object-contain rounded-2xl" />
            <div className="absolute -top-2 -right-2 bg-[#1DB954] rounded-full p-1.5 shadow-lg">
              <div className="h-5 w-5 text-white">
                <SpotifyIcon />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-black text-center tracking-wide">BONPYE SOCCER TALK</h1>
        </div>

        {/* Spotify Player */}
        {hasShowId ? (
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <iframe
              src={`https://open.spotify.com/embed/show/${SPOTIFY_SHOW_ID}?utm_source=generator&theme=0`}
              width="100%"
              height="352"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="block"
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#1DB954]/40 bg-[#1DB954]/5 p-8 flex flex-col items-center gap-5 text-center">
            <div className="h-20 w-20 rounded-full bg-[#1DB954]/20 flex items-center justify-center">
              <Music className="h-10 w-10 text-[#1DB954]" />
            </div>
            <div className="space-y-1.5">
              <p className="font-bold text-lg">First Episode Dropping Soon</p>
              <p className="text-sm text-muted-foreground max-w-xs">Subscribe on Spotify to get notified</p>
            </div>
            <a
              href={`https://open.spotify.com/show/${SPOTIFY_SHOW_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#1DB954] text-black font-bold px-6 py-3 rounded-full text-sm hover:bg-[#1DB954]/90 transition-colors"
            >
              <div className="h-4 w-4"><SpotifyIcon /></div>
              Follow on Spotify
            </a>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 justify-center">
          {TAGS.map(tag => (
            <span key={tag} className="bg-[#1DB954]/15 text-[#1DB954] px-2.5 py-1 rounded-full text-xs font-medium border border-[#1DB954]/20">
              {tag}
            </span>
          ))}
        </div>

        {/* About */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h3 className="font-semibold">About the Show</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hosted by <span className="text-foreground font-medium">Bonpye</span>, the go-to podcast for soccer lovers in the Haitian community and beyond. Local leagues, international tournaments, player stories, and everything football.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-[#1DB954]" />
              <span>Weekly episodes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Music className="h-3.5 w-3.5 text-[#1DB954]" />
              <span>Kreyòl · Français · English</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ExternalLink className="h-3.5 w-3.5 text-[#1DB954]" />
              <span>Available on Spotify</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
