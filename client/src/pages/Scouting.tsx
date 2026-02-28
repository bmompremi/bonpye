/* BONPYE Scouting Page
 * Player scouting board — discover talent, find trials
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Moon,
  Sun,
  Search,
  Filter,
  Globe,
  Trophy,
  Target,
  Users,
  CheckCircle2,
  Briefcase,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

interface ScoutingPlayer {
  id: number;
  name: string;
  handle: string;
  position: string;
  club?: string;
  nationality: string;
  age: number;
  appearances: number;
  goals: number;
  assists: number;
  availableForTransfer: boolean;
  availableForTrial: boolean;
  playerVerified: boolean;
}

const players: ScoutingPlayer[] = [
  {
    id: 1,
    name: "Carlos Mendes",
    handle: "@carlosmendes10",
    position: "Attacking Midfielder",
    club: "Sporting CP B",
    nationality: "Portuguese",
    age: 21,
    appearances: 48,
    goals: 14,
    assists: 22,
    availableForTransfer: true,
    availableForTrial: false,
    playerVerified: true,
  },
  {
    id: 2,
    name: "Amara Koné",
    handle: "@amara_kone",
    position: "Striker",
    club: "Wydad AC",
    nationality: "Ivorian",
    age: 23,
    appearances: 67,
    goals: 38,
    assists: 11,
    availableForTransfer: true,
    availableForTrial: true,
    playerVerified: true,
  },
  {
    id: 3,
    name: "Lena Müller",
    handle: "@lena_muller",
    position: "Central Midfielder",
    club: "SG Eintracht Frankfurt",
    nationality: "German",
    age: 19,
    appearances: 32,
    goals: 7,
    assists: 18,
    availableForTransfer: false,
    availableForTrial: true,
    playerVerified: false,
  },
  {
    id: 4,
    name: "Taiwo Adeyemi",
    handle: "@taiwo_striker",
    position: "Right Winger",
    nationality: "Nigerian",
    age: 20,
    appearances: 54,
    goals: 21,
    assists: 16,
    availableForTransfer: true,
    availableForTrial: true,
    playerVerified: true,
  },
  {
    id: 5,
    name: "Sebastián Ruiz",
    handle: "@seba_ruiz9",
    position: "Centre Back",
    club: "Independiente Rivadavia",
    nationality: "Argentine",
    age: 24,
    appearances: 89,
    goals: 6,
    assists: 4,
    availableForTransfer: false,
    availableForTrial: false,
    playerVerified: false,
  },
  {
    id: 6,
    name: "Yui Tanaka",
    handle: "@yui_gk1",
    position: "Goalkeeper",
    club: "INAC Kobe Leonessa",
    nationality: "Japanese",
    age: 22,
    appearances: 41,
    goals: 0,
    assists: 0,
    availableForTransfer: true,
    availableForTrial: false,
    playerVerified: true,
  },
];

const POSITIONS = [
  "All Positions",
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Striker",
];

export default function Scouting() {
  const { theme, toggleTheme } = useTheme();
  const [positionFilter, setPositionFilter] = useState("All Positions");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "transfer" | "trial">("all");

  const handleComingSoon = () => {
    toast("Feature coming soon!", {
      description: "The full scouting board is coming to BONPYE.",
    });
  };

  const filteredPlayers = players.filter((p) => {
    const posMatch =
      positionFilter === "All Positions" ||
      p.position.toLowerCase().includes(positionFilter.toLowerCase()) ||
      (positionFilter === "Defender" && ["Right Back", "Left Back", "Centre Back"].some((pos) => p.position.includes(pos))) ||
      (positionFilter === "Midfielder" && p.position.includes("Midfielder")) ||
      (positionFilter === "Striker" && ["Striker", "Winger", "Forward"].some((pos) => p.position.includes(pos)));

    const avMatch =
      availabilityFilter === "all" ||
      (availabilityFilter === "transfer" && p.availableForTransfer) ||
      (availabilityFilter === "trial" && p.availableForTrial);

    return posMatch && avMatch;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display text-xl font-bold tracking-wider">SCOUTING</h1>
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
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search players by name, position, or nationality..."
              className="w-full bg-secondary/50 border border-border rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
              onClick={handleComingSoon}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Position Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {POSITIONS.map((pos) => (
              <Button
                key={pos}
                variant={positionFilter === pos ? "default" : "outline"}
                size="sm"
                onClick={() => setPositionFilter(pos)}
                className={positionFilter === pos ? "bg-primary shrink-0" : "shrink-0"}
              >
                {pos}
              </Button>
            ))}
          </div>

          {/* Availability Filter */}
          <div className="flex gap-2 ml-auto shrink-0">
            <Button
              variant={availabilityFilter === "transfer" ? "default" : "outline"}
              size="sm"
              onClick={() => setAvailabilityFilter(availabilityFilter === "transfer" ? "all" : "transfer")}
              className={availabilityFilter === "transfer" ? "bg-primary" : ""}
            >
              <Briefcase className="h-4 w-4 mr-1" />
              Transfer
            </Button>
            <Button
              variant={availabilityFilter === "trial" ? "default" : "outline"}
              size="sm"
              onClick={() => setAvailabilityFilter(availabilityFilter === "trial" ? "all" : "trial")}
              className={availabilityFilter === "trial" ? "bg-primary" : ""}
            >
              <Filter className="h-4 w-4 mr-1" />
              Trial
            </Button>
          </div>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Players Listed", value: "8,400+", icon: Users },
            { label: "Nationalities", value: "120+", icon: Globe },
            { label: "Verified Players", value: "2,100+", icon: CheckCircle2 },
            { label: "Available for Transfer", value: "1,300+", icon: Briefcase },
          ].map((stat) => (
            <Card key={stat.label} className="p-4 bg-secondary/30 border-border">
              <div className="flex items-center gap-3">
                <stat.icon className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-display font-bold text-lg">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Player Cards */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-4 bg-secondary/30 border-border hover:bg-secondary/50 transition-colors cursor-pointer" onClick={handleComingSoon}>
                {/* Player Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-sm shrink-0">
                    {player.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-semibold truncate">{player.name}</h3>
                      {player.playerVerified && (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{player.handle}</p>
                  </div>
                </div>

                {/* Position + Info */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-medium">
                    {player.position}
                  </span>
                  {player.club && (
                    <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {player.club}
                    </span>
                  )}
                  <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {player.nationality}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-secondary/50 rounded p-2">
                    <div className="font-display font-bold">{player.appearances}</div>
                    <div className="text-xs text-muted-foreground">Apps</div>
                  </div>
                  <div className="bg-secondary/50 rounded p-2">
                    <div className="font-display font-bold text-primary">{player.goals}</div>
                    <div className="text-xs text-muted-foreground">Goals</div>
                  </div>
                  <div className="bg-secondary/50 rounded p-2">
                    <div className="font-display font-bold text-blue-400">{player.assists}</div>
                    <div className="text-xs text-muted-foreground">Assists</div>
                  </div>
                </div>

                {/* Availability + CTA */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {player.availableForTransfer && (
                      <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded font-medium">
                        Transfer
                      </span>
                    )}
                    {player.availableForTrial && (
                      <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-1 rounded font-medium">
                        Trial
                      </span>
                    )}
                  </div>
                  <Link href={`/profile/${player.handle.replace("@", "")}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Profile
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredPlayers.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-display text-lg">No players match your filters</p>
          </div>
        )}

        {/* My Scouting Profile CTA */}
        <section className="mt-12">
          <Card className="p-8 bg-primary/10 border-primary/30 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-display text-2xl font-bold mb-2">
              GET SCOUTED
            </h3>
            <p className="text-muted-foreground mb-4">
              Create your scouting profile to be discovered by clubs, scouts, and agents worldwide.
            </p>
            <Button
              onClick={handleComingSoon}
              className="bg-primary hover:bg-primary/90"
            >
              Create Scouting Profile
            </Button>
          </Card>
        </section>
      </main>
    </div>
  );
}
