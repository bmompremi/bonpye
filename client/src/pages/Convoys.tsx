/* TCsocial Convoys Page
 * Design: "Midnight Highway" - Cinematic Dark Mode
 * Trucker groups/communities
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
  Truck,
  Users,
  MapPin,
  Shield,
  Wrench,
  DollarSign,
  Heart,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

interface Convoy {
  id: number;
  name: string;
  description: string;
  members: number;
  posts: number;
  icon: typeof Truck;
  color: string;
  featured?: boolean;
}

const convoys: Convoy[] = [
  {
    id: 1,
    name: "Owner Operators United",
    description: "For independent truckers running their own authority. Share tips, rates, and business advice.",
    members: 45200,
    posts: 12400,
    icon: DollarSign,
    color: "text-green-500",
    featured: true,
  },
  {
    id: 2,
    name: "Flatbed Nation",
    description: "Flatbedders unite! Tarping tips, securement advice, and load sharing.",
    members: 28900,
    posts: 8700,
    icon: Truck,
    color: "text-primary",
    featured: true,
  },
  {
    id: 3,
    name: "Women in Trucking",
    description: "Supporting and connecting women drivers across the industry.",
    members: 18500,
    posts: 5600,
    icon: Heart,
    color: "text-pink-500",
    featured: true,
  },
  {
    id: 4,
    name: "Reefer Runners",
    description: "Temperature-controlled hauling community. Keep it cool!",
    members: 22100,
    posts: 6200,
    icon: Truck,
    color: "text-blue-400",
  },
  {
    id: 5,
    name: "New Drivers Hub",
    description: "Just got your CDL? This is your place to learn from experienced drivers.",
    members: 34600,
    posts: 15800,
    icon: Shield,
    color: "text-yellow-500",
  },
  {
    id: 6,
    name: "Truck Mechanics Corner",
    description: "DIY repairs, maintenance tips, and mechanic recommendations.",
    members: 19800,
    posts: 7400,
    icon: Wrench,
    color: "text-orange-500",
  },
  {
    id: 7,
    name: "Regional Haulers",
    description: "Home every weekend? Connect with other regional drivers.",
    members: 15200,
    posts: 4100,
    icon: MapPin,
    color: "text-purple-500",
  },
  {
    id: 8,
    name: "Team Drivers",
    description: "Running team? Share your experiences and find partners.",
    members: 8900,
    posts: 2300,
    icon: Users,
    color: "text-cyan-500",
  },
];

export default function Convoys() {
  const { theme, toggleTheme } = useTheme();

  const handleComingSoon = () => {
    toast("Feature coming soon!", {
      description: "We're building this for the trucker community.",
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
            <h1 className="font-display text-xl font-bold tracking-wider">CONVOYS</h1>
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
              placeholder="Search convoys..."
              className="w-full bg-secondary/50 border border-border rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
              onClick={handleComingSoon}
            />
          </div>
        </div>

        {/* Featured Convoys */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold mb-6">
            FEATURED <span className="text-primary">CONVOYS</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {convoys
              .filter((c) => c.featured)
              .map((convoy, index) => (
                <motion.div
                  key={convoy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="p-6 bg-secondary/30 border-border card-glow cursor-pointer h-full"
                    onClick={handleComingSoon}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-xl bg-secondary flex items-center justify-center ${convoy.color}`}>
                        <convoy.icon className="h-7 w-7" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display text-lg font-semibold">{convoy.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {convoy.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span>{formatNumber(convoy.members)} members</span>
                          <span>·</span>
                          <span>{formatNumber(convoy.posts)} posts</span>
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
                      Join Convoy
                    </Button>
                  </Card>
                </motion.div>
              ))}
          </div>
        </section>

        {/* All Convoys */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">
            ALL <span className="text-primary">CONVOYS</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {convoys.map((convoy, index) => (
              <motion.div
                key={convoy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="p-4 bg-secondary/30 border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={handleComingSoon}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-secondary flex items-center justify-center ${convoy.color}`}>
                      <convoy.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{convoy.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{formatNumber(convoy.members)} members</span>
                        <span>·</span>
                        <span>{formatNumber(convoy.posts)} posts</span>
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

        {/* Create Convoy CTA */}
        <section className="mt-12">
          <Card className="p-8 bg-primary/10 border-primary/30 text-center">
            <h3 className="font-display text-2xl font-bold mb-2">
              START YOUR OWN CONVOY
            </h3>
            <p className="text-muted-foreground mb-4">
              Don't see a group for your niche? Create your own convoy and build your community.
            </p>
            <Button
              onClick={handleComingSoon}
              className="bg-primary hover:bg-primary/90"
            >
              Create Convoy
            </Button>
          </Card>
        </section>
      </main>
    </div>
  );
}
