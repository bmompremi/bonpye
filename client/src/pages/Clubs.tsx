/* BONPYE Clubs Page
 * Official football club / team pages
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Moon,
  Search,
  Sun,
  Trophy,
  Users,
  MapPin,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

interface Club {
  id: number;
  name: string;
  slug: string;
  country: string;
  city: string;
  league: string;
  membersCount: number;
  isVerified: boolean;
  logoPlaceholder: string; // initials
  accentColor: string;
  featured?: boolean;
}

const clubs: Club[] = [
  {
    id: 1,
    name: "Manchester United FC",
    slug: "manchester-united",
    country: "England",
    city: "Manchester",
    league: "Premier League",
    membersCount: 284600,
    isVerified: true,
    logoPlaceholder: "MU",
    accentColor: "bg-red-600",
    featured: true,
  },
  {
    id: 2,
    name: "FC Barcelona",
    slug: "fc-barcelona",
    country: "Spain",
    city: "Barcelona",
    league: "La Liga",
    membersCount: 312400,
    isVerified: true,
    logoPlaceholder: "FCB",
    accentColor: "bg-blue-700",
    featured: true,
  },
  {
    id: 3,
    name: "Paris Saint-Germain",
    slug: "paris-saint-germain",
    country: "France",
    city: "Paris",
    league: "Ligue 1",
    membersCount: 198200,
    isVerified: true,
    logoPlaceholder: "PSG",
    accentColor: "bg-blue-900",
    featured: true,
  },
  {
    id: 4,
    name: "Al-Hilal SFC",
    slug: "al-hilal",
    country: "Saudi Arabia",
    city: "Riyadh",
    league: "Saudi Pro League",
    membersCount: 143800,
    isVerified: true,
    logoPlaceholder: "AH",
    accentColor: "bg-blue-600",
  },
  {
    id: 5,
    name: "Flamengo",
    slug: "flamengo",
    country: "Brazil",
    city: "Rio de Janeiro",
    league: "Brasileirão",
    membersCount: 167400,
    isVerified: true,
    logoPlaceholder: "FLA",
    accentColor: "bg-red-700",
  },
  {
    id: 6,
    name: "Sundowns FC",
    slug: "mamelodi-sundowns",
    country: "South Africa",
    city: "Pretoria",
    league: "DStv Premiership",
    membersCount: 52100,
    isVerified: false,
    logoPlaceholder: "SUN",
    accentColor: "bg-yellow-600",
  },
];

export default function Clubs() {
  const { theme, toggleTheme } = useTheme();

  const handleComingSoon = () => {
    toast("Feature coming soon!", {
      description: "Full club pages are coming to BONPYE.",
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display text-xl font-bold tracking-wider">CLUBS</h1>
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
        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search clubs by name, city, or league..."
              className="w-full bg-secondary/50 border border-border rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
              onClick={handleComingSoon}
            />
          </div>
        </div>

        {/* Featured Clubs */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold mb-6">
            FEATURED <span className="text-primary">CLUBS</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {clubs
              .filter((c) => c.featured)
              .map((club, index) => (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/clubs/${club.slug}`}>
                    <Card className="p-6 bg-secondary/30 border-border card-glow cursor-pointer h-full hover:bg-secondary/50 transition-colors">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-xl ${club.accentColor} flex items-center justify-center text-white font-display font-bold text-sm`}>
                          {club.logoPlaceholder}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <h3 className="font-display text-lg font-semibold">{club.name}</h3>
                            {club.isVerified && (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {club.city}, {club.country}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{club.league}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{formatNumber(club.membersCount)} members</span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                          onClick={(e) => {
                            e.preventDefault();
                            handleComingSoon();
                          }}
                        >
                          Follow
                        </Button>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
          </div>
        </section>

        {/* All Clubs */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">
            ALL <span className="text-primary">CLUBS</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {clubs.map((club, index) => (
              <motion.div
                key={club.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/clubs/${club.slug}`}>
                  <Card className="p-4 bg-secondary/30 border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg ${club.accentColor} flex items-center justify-center text-white font-display font-bold text-xs shrink-0`}>
                        {club.logoPlaceholder}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="font-semibold truncate">{club.name}</h3>
                          {club.isVerified && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {club.league} · {formatNumber(club.membersCount)} members
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleComingSoon();
                        }}
                      >
                        Follow
                      </Button>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Create Club CTA */}
        <section className="mt-12">
          <Card className="p-8 bg-primary/10 border-primary/30 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-display text-2xl font-bold mb-2">
              REPRESENT YOUR CLUB
            </h3>
            <p className="text-muted-foreground mb-4">
              Create a page for your football club — from Sunday league to professional. Connect your squad, post match reports, and grow your fanbase.
            </p>
            <Button
              onClick={handleComingSoon}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Club Page
            </Button>
          </Card>
        </section>
      </main>
    </div>
  );
}
