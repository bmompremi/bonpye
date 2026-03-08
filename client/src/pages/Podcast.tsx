import DashboardLayout from "@/components/DashboardLayout";
import { ExternalLink, Mic, Music, Radio } from "lucide-react";
import { useState } from "react";

// TODO: Replace with your real Spotify Show ID
// How to get it:
//   1. Open Spotify for Creators app
//   2. Tap "Podcast" tab → your show
//   3. Tap Share → Copy link
//   4. The ID is the part after: open.spotify.com/show/
const SPOTIFY_SHOW_ID = "YOUR_SHOW_ID_HERE";
const hasShowId = SPOTIFY_SHOW_ID !== "YOUR_SHOW_ID_HERE";

const TAGS = ["#FoutbòlAyisyen", "#BonpyeSoccerTalk", "#Haiti", "#Football", "#Podcast"];

export default function Podcast() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5 py-2">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-[#1DB954] flex items-center justify-center shadow-lg shadow-[#1DB954]/30">
            <Mic className="h-5 w-5 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Bonpye Soccer Talk</h1>
            <p className="text-sm text-muted-foreground">Official Podcast · On Spotify</p>
          </div>
        </div>

        {/* Launch Banner */}
        <div className="rounded-2xl overflow-hidden border border-[#1DB954]/30 bg-gradient-to-br from-[#1DB954]/15 via-background to-black/20 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-[#1DB954] text-black text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse">
              LAUNCHING TOMORROW
            </span>
          </div>
          <h2 className="text-2xl font-bold leading-tight">
            Foutbòl — From Haiti<br />to the World Stage
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The go-to podcast for soccer lovers in the Haitian community and beyond.
            Local leagues, international tournaments, player stories, and everything football.
            In Creole, French &amp; English.
          </p>
          <div className="flex flex-wrap gap-2">
            {TAGS.map(tag => (
              <span
                key={tag}
                className="bg-[#1DB954]/15 text-[#1DB954] px-2.5 py-1 rounded-full text-xs font-medium border border-[#1DB954]/20"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Spotify Player or Coming Soon */}
        {hasShowId ? (
          <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
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
              <p className="font-bold text-lg">First Episode Dropping Tomorrow</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Subscribe on Spotify to get notified the moment we go live
              </p>
            </div>
            <a
              href="https://open.spotify.com/search/Bonpye%20Soccer%20Talk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#1DB954] text-black font-bold px-6 py-3 rounded-full text-sm hover:bg-[#1DB954]/90 transition-colors shadow-lg shadow-[#1DB954]/30"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Follow on Spotify
            </a>
          </div>
        )}

        {/* About */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h3 className="font-semibold">About the Show</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hosted by <span className="text-foreground font-medium">Bonpye</span>, this podcast covers the full world of football —
            from grassroots Haitian community leagues to the biggest international stages.
            New episodes weekly.
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
    </DashboardLayout>
  );
}
