/* BONPYE Squads Page
 * Football community groups
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
  Users,
  Heart,
  Trophy,
  Target,
  Shield,
  Star,
  Globe,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

interface Squad {
  id: number;
  name: string;
  description: string;
  members: number;
  posts: number;
  icon: typeof Users;
  color: string;
  featured?: boolean;
}

const squads: Squad[] = [
  {
    id: 1,
    name: "Premier League Fans",
    description: "The home of Premier League discussion. Match analysis, transfer news, and fan banter from the world's best league.",
    members: 128400,
    posts: 54200,
    icon: Trophy,
    color: "text-purple-500",
    featured: true,
  },
  {
    id: 2,
    name: "Strikers United",
    description: "For the goal-scorers and number 9s. Share your highlights, tips on finishing, and celebrate goals from around the world.",
    members: 45800,
    posts: 18700,
    icon: Target,
    color: "text-primary",
    featured: true,
  },
  {
    id: 3,
    name: "Women's Football Rising",
    description: "Celebrating the growth of women's football globally. WSL, NWSL, UEFA Women's and beyond.",
    members: 32500,
    posts: 11600,
    icon: Heart,
    color: "text-pink-500",
    featured: true,
  },
  {
    id: 4,
    name: "Futsal & 5-a-Side",
    description: "Small-sided football community. Organise games, share tactics, and discuss the fastest form of the beautiful game.",
    members: 19200,
    posts: 7400,
    icon: Zap,
    color: "text-blue-400",
  },
  {
    id: 5,
    name: "Youth Academy Network",
    description: "Parents, coaches, and young players. Development tips, academy pathways, and support for the next generation.",
    members: 41600,
    posts: 22800,
    icon: Star,
    color: "text-yellow-500",
  },
  {
    id: 6,
    name: "Goalkeepers Guild",
    description: "The last line of defence. Training drills, glove reviews, distribution techniques, and keeper-to-keeper advice.",
    members: 14800,
    posts: 5400,
    icon: Shield,
    color: "text-orange-500",
  },
  {
    id: 7,
    name: "Sunday League Legends",
    description: "Grassroots and amateur football. Organise your squad, share match reports, and relive Sunday morning glory.",
    members: 68200,
    posts: 31100,
    icon: Users,
    color: "text-green-500",
  },
  {
    id: 8,
    name: "Tactics Board",
    description: "Deep tactical analysis, formations, pressing systems, and the chess match behind the beautiful game.",
    members: 27900,
    posts: 12300,
    icon: Globe,
    color: "text-cyan-500",
  },
];

export default function Squads() {
  const { theme, toggleTheme } = useTheme();

  const handleComingSoon = () => {
    toast("Feature coming soon!", {
      description: "We're building this for the football community.",
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
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
            <h1 className="font-display text-xl font-bold tracking-wider">SQUADS</h1>
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
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search squads..."
              className="w-full bg-secondary/50 border border-border rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
              onClick={handleComingSoon}
            />
          </div>
        </div>

        {/* Featured Squads */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold mb-6">
            FEATURED <span className="text-primary">SQUADS</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {squads
              .filter((s) => s.featured)
              .map((squad, index) => (
                <motion.div
                  key={squad.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="p-6 bg-secondary/30 border-border card-glow cursor-pointer h-full"
                    onClick={handleComingSoon}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-xl bg-secondary flex items-center justify-center ${squad.color}`}>
                        <squad.icon className="h-7 w-7" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display text-lg font-semibold">{squad.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {squad.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span>{formatNumber(squad.members)} members</span>
                          <span>·</span>
                          <span>{formatNumber(squad.posts)} posts</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4 bg-primary hover:bg-primary/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComingSoon();
                      }}
                    >
                      Join Squad
                    </Button>
                  </Card>
                </motion.div>
              ))}
          </div>
        </section>

        {/* All Squads */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">
            ALL <span className="text-primary">SQUADS</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {squads.map((squad, index) => (
              <motion.div
                key={squad.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="p-4 bg-secondary/30 border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={handleComingSoon}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-secondary flex items-center justify-center ${squad.color}`}>
                      <squad.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{squad.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{formatNumber(squad.members)} members</span>
                        <span>·</span>
                        <span>{formatNumber(squad.posts)} posts</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComingSoon();
                      }}
                    >
                      Join
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Create Squad CTA */}
        <section className="mt-12">
          <Card className="p-8 bg-primary/10 border-primary/30 text-center">
            <h3 className="font-display text-2xl font-bold mb-2">
              START YOUR OWN SQUAD
            </h3>
            <p className="text-muted-foreground mb-4">
              Don't see a group for your football niche? Create your own squad and build your community.
            </p>
            <Button
              onClick={handleComingSoon}
              className="bg-primary hover:bg-primary/90"
            >
              Create Squad
            </Button>
          </Card>
        </section>
      </main>
    </div>
  );
}
