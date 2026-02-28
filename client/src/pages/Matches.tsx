/* BONPYE Matches Page
 * Live, upcoming, and recent match discussions
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Moon,
  Sun,
  MessageCircle,
  Calendar,
  MapPin,
  Trophy,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

type MatchStatus = "live" | "upcoming" | "finished";

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  venue: string;
  competition: string;
  matchDate: string;
  status: MatchStatus;
  minute?: number; // for live matches
  discussionCount: number;
}

const matches: Match[] = [
  {
    id: 1,
    homeTeam: "Arsenal",
    awayTeam: "Manchester City",
    homeScore: 2,
    awayScore: 1,
    venue: "Emirates Stadium",
    competition: "Premier League",
    matchDate: "2026-02-26T20:00:00",
    status: "live",
    minute: 67,
    discussionCount: 4821,
  },
  {
    id: 2,
    homeTeam: "Real Madrid",
    awayTeam: "Atlético Madrid",
    homeScore: 0,
    awayScore: 0,
    venue: "Santiago Bernabéu",
    competition: "La Liga",
    matchDate: "2026-02-26T21:00:00",
    status: "live",
    minute: 34,
    discussionCount: 3240,
  },
  {
    id: 3,
    homeTeam: "Bayern Munich",
    awayTeam: "Borussia Dortmund",
    venue: "Allianz Arena",
    competition: "Bundesliga",
    matchDate: "2026-02-28T17:30:00",
    status: "upcoming",
    discussionCount: 1420,
  },
  {
    id: 4,
    homeTeam: "PSG",
    awayTeam: "Lyon",
    venue: "Parc des Princes",
    competition: "Ligue 1",
    matchDate: "2026-02-27T20:45:00",
    status: "upcoming",
    discussionCount: 678,
  },
  {
    id: 5,
    homeTeam: "Liverpool",
    awayTeam: "Chelsea",
    venue: "Wembley Stadium",
    competition: "League Cup Final",
    matchDate: "2026-03-01T15:00:00",
    status: "upcoming",
    discussionCount: 8932,
  },
  {
    id: 6,
    homeTeam: "Juventus",
    awayTeam: "Inter Milan",
    homeScore: 1,
    awayScore: 2,
    venue: "Allianz Stadium",
    competition: "Serie A",
    matchDate: "2026-02-23T18:00:00",
    status: "finished",
    discussionCount: 2156,
  },
  {
    id: 7,
    homeTeam: "Flamengo",
    awayTeam: "Palmeiras",
    homeScore: 3,
    awayScore: 1,
    venue: "Maracanã",
    competition: "Copa do Brasil",
    matchDate: "2026-02-22T21:00:00",
    status: "finished",
    discussionCount: 1893,
  },
];

const statusFilters: { label: string; value: MatchStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Live", value: "live" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Recent", value: "finished" },
];

const formatMatchDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Matches() {
  const { theme, toggleTheme } = useTheme();
  const [filter, setFilter] = useState<MatchStatus | "all">("all");

  const handleComingSoon = () => {
    toast("Feature coming soon!", {
      description: "Match discussions are coming to BONPYE.",
    });
  };

  const filteredMatches = matches.filter(
    (m) => filter === "all" || m.status === filter
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display text-xl font-bold tracking-wider">MATCHES</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-8 container">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {statusFilters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.value)}
              className={filter === f.value ? "bg-primary" : ""}
            >
              {f.value === "live" && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />
              )}
              {f.label}
            </Button>
          ))}
        </div>

        {/* Matches */}
        <div className="space-y-4">
          {filteredMatches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-4 bg-secondary/30 border-border hover:bg-secondary/50 transition-colors cursor-pointer" onClick={handleComingSoon}>
                {/* Competition + Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{match.competition}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {match.status === "live" && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/15 px-2 py-1 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        LIVE {match.minute}'
                      </span>
                    )}
                    {match.status === "finished" && (
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">FT</span>
                    )}
                    {match.status === "upcoming" && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatMatchDate(match.matchDate)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Teams + Score */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex-1 text-right">
                    <span className="font-display font-bold text-lg">{match.homeTeam}</span>
                  </div>
                  <div className="mx-6 text-center min-w-[80px]">
                    {match.status !== "upcoming" ? (
                      <span className="font-display font-bold text-2xl">
                        {match.homeScore} – {match.awayScore}
                      </span>
                    ) : (
                      <span className="font-display text-muted-foreground text-xl">vs</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="font-display font-bold text-lg">{match.awayTeam}</span>
                  </div>
                </div>

                {/* Venue + Discuss */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {match.venue}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleComingSoon();
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {match.discussionCount.toLocaleString()} Discuss
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredMatches.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-display text-lg">No {filter} matches right now</p>
          </div>
        )}
      </main>
    </div>
  );
}
