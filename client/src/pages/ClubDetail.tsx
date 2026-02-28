/* BONPYE Club Detail Page
 * Route: /clubs/:slug
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Moon,
  Sun,
  Users,
  MapPin,
  Trophy,
  CheckCircle2,
  Calendar,
  FileText,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

type Tab = "posts" | "roster" | "matches";

// Mock data keyed by slug
const clubData: Record<string, {
  name: string;
  country: string;
  city: string;
  league: string;
  founded: number;
  membersCount: number;
  isVerified: boolean;
  logoPlaceholder: string;
  accentColor: string;
  description: string;
}> = {
  "manchester-united": {
    name: "Manchester United FC",
    country: "England",
    city: "Manchester",
    league: "Premier League",
    founded: 1878,
    membersCount: 284600,
    isVerified: true,
    logoPlaceholder: "MU",
    accentColor: "bg-red-600",
    description: "One of the most successful and widely supported football clubs in the world, based at Old Trafford, Manchester.",
  },
  "fc-barcelona": {
    name: "FC Barcelona",
    country: "Spain",
    city: "Barcelona",
    league: "La Liga",
    founded: 1899,
    membersCount: 312400,
    isVerified: true,
    logoPlaceholder: "FCB",
    accentColor: "bg-blue-700",
    description: "Més que un club. FC Barcelona is a globally recognised club renowned for its philosophy of beautiful attacking football.",
  },
};

const rosterPlaceholder = [
  { name: "Marc-André ter Stegen", position: "Goalkeeper", jersey: 1 },
  { name: "Jules Koundé", position: "Right Back", jersey: 23 },
  { name: "Ronald Araújo", position: "Centre Back", jersey: 4 },
  { name: "Pedri", position: "Central Midfielder", jersey: 8 },
  { name: "Raphinha", position: "Right Winger", jersey: 11 },
  { name: "Robert Lewandowski", position: "Striker", jersey: 9 },
];

export default function ClubDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [isFollowing, setIsFollowing] = useState(false);

  const club = clubData[slug];

  const handleComingSoon = () => {
    toast("Feature coming soon!", {
      description: "Full club pages are coming to BONPYE.",
    });
  };

  const handleFollowToggle = () => {
    setIsFollowing((prev) => !prev);
    toast(isFollowing ? "Unfollowed club" : "Following club!", {
      description: isFollowing ? undefined : "You'll see their posts in your feed.",
    });
  };

  if (!club) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h2 className="font-display text-2xl font-bold mb-2">Club Not Found</h2>
          <p className="text-muted-foreground mb-4">This club page doesn't exist yet.</p>
          <Link href="/clubs">
            <Button className="bg-primary hover:bg-primary/90">Browse Clubs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/clubs" className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display text-xl font-bold tracking-wider truncate max-w-[200px]">
              {club.name.toUpperCase()}
            </h1>
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

      <main className="pt-14">
        {/* Cover */}
        <div className={`h-40 ${club.accentColor} relative`} />

        {/* Club Info */}
        <div className="container">
          <div className="relative -mt-10 mb-4 flex items-end justify-between">
            <div className={`w-20 h-20 rounded-2xl ${club.accentColor} border-4 border-background flex items-center justify-center text-white font-display font-bold text-lg`}>
              {club.logoPlaceholder}
            </div>
            <div className="pb-1">
              <Button
                onClick={handleFollowToggle}
                variant={isFollowing ? "outline" : "default"}
                className={isFollowing ? "" : "bg-primary hover:bg-primary/90"}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-display text-2xl font-bold">{club.name}</h2>
              {club.isVerified && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {club.city}, {club.country}
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                {club.league}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Est. {club.founded}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {(club.membersCount / 1000).toFixed(1)}K members
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{club.description}</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 border-b border-border mb-6">
            {(["posts", "roster", "matches"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "posts" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-display text-lg mb-2">No Posts Yet</p>
                <p className="text-sm">Club posts will appear here.</p>
                <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={handleComingSoon}>
                  Post as Club
                </Button>
              </div>
            </motion.div>
          )}

          {activeTab === "roster" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="space-y-3">
                {rosterPlaceholder.map((player, i) => (
                  <Card key={i} className="p-3 bg-secondary/30 border-border flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-sm">
                      {player.jersey}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-muted-foreground">{player.position}</p>
                    </div>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={handleComingSoon}
                >
                  View Full Roster
                </Button>
              </div>
            </motion.div>
          )}

          {activeTab === "matches" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-center py-16 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-display text-lg mb-2">No Matches Scheduled</p>
                <p className="text-sm">Club fixtures will appear here.</p>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
