/* BONPYE Grounds Page
 * Football venues — stadiums, training grounds, academies
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Moon,
  Search,
  Star,
  Sun,
  Users,
  Building2,
  Dumbbell,
  GraduationCap,
  Trophy,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

interface Ground {
  id: number;
  name: string;
  type: "stadium" | "training_ground" | "neutral_venue" | "academy";
  address: string;
  city: string;
  country: string;
  capacity?: number;
  pitchType: "grass" | "artificial" | "hybrid";
  rating: number;
  reviews: number;
  amenities: string[];
}

const grounds: Ground[] = [
  {
    id: 1,
    name: "Old Trafford",
    type: "stadium",
    address: "Sir Matt Busby Way",
    city: "Manchester",
    country: "England",
    capacity: 74310,
    pitchType: "grass",
    rating: 4.7,
    reviews: 12847,
    amenities: ["Museum", "Stadium Tours", "Megastore", "Multiple Restaurants", "Accessible"],
  },
  {
    id: 2,
    name: "Allianz Arena",
    type: "stadium",
    address: "Werner-Heisenberg-Allee 25",
    city: "Munich",
    country: "Germany",
    capacity: 75024,
    pitchType: "grass",
    rating: 4.9,
    reviews: 9341,
    amenities: ["Iconic Exterior Lighting", "Museum", "Tours", "Premium Hospitality"],
  },
  {
    id: 3,
    name: "Cobham Training Centre",
    type: "training_ground",
    address: "Stoke Road",
    city: "Cobham",
    country: "England",
    pitchType: "hybrid",
    rating: 4.6,
    reviews: 456,
    amenities: ["12 Training Pitches", "Gym", "Recovery Pool", "Medical Centre", "Media Suite"],
  },
  {
    id: 4,
    name: "Wembley Stadium",
    type: "neutral_venue",
    address: "Wembley",
    city: "London",
    country: "England",
    capacity: 90000,
    pitchType: "hybrid",
    rating: 4.5,
    reviews: 18234,
    amenities: ["Arch Views", "Tours", "Wembley Arena Nearby", "Hotel", "Accessible"],
  },
  {
    id: 5,
    name: "La Masia",
    type: "academy",
    address: "Carrer d'Arístides Maillol",
    city: "Barcelona",
    country: "Spain",
    pitchType: "grass",
    rating: 4.8,
    reviews: 2156,
    amenities: ["6 Training Pitches", "Residential Facilities", "Education Centre", "Medical Staff"],
  },
  {
    id: 6,
    name: "Hackney Marshes",
    type: "neutral_venue",
    address: "Homerton Road",
    city: "London",
    country: "England",
    pitchType: "grass",
    rating: 4.1,
    reviews: 3289,
    amenities: ["88 Pitches", "Changing Rooms", "Sunday League Hub", "Accessible by Tube"],
  },
];

const typeConfig: Record<Ground["type"], { label: string; icon: typeof Building2; colorClass: string }> = {
  stadium: { label: "Stadium", icon: Trophy, colorClass: "bg-primary/20 text-primary" },
  training_ground: { label: "Training Ground", icon: Dumbbell, colorClass: "bg-blue-500/20 text-blue-500" },
  neutral_venue: { label: "Neutral Venue", icon: Building2, colorClass: "bg-green-500/20 text-green-500" },
  academy: { label: "Academy", icon: GraduationCap, colorClass: "bg-orange-500/20 text-orange-500" },
};

const pitchTypeLabel: Record<Ground["pitchType"], string> = {
  grass: "Natural Grass",
  artificial: "Artificial Turf",
  hybrid: "Hybrid",
};

export default function Grounds() {
  const { theme, toggleTheme } = useTheme();

  const handleComingSoon = () => {
    toast("Feature coming soon!", {
      description: "We're building the Grounds directory for the football community.",
    });
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
            <h1 className="font-display text-xl font-bold tracking-wider">GROUNDS</h1>
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
        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search grounds, cities, or countries..."
              className="w-full bg-secondary/50 border border-border rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
              onClick={handleComingSoon}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {["All", "Stadiums", "Training Grounds", "Academies", "Neutral Venues"].map((filter) => (
              <Button
                key={filter}
                variant={filter === "All" ? "default" : "outline"}
                size="sm"
                onClick={handleComingSoon}
                className={filter === "All" ? "bg-primary" : ""}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Grounds", value: "12,000+", icon: Building2 },
            { label: "Reviews", value: "480K+", icon: Star },
            { label: "Countries", value: "180+", icon: MapPin },
            { label: "Capacity Data", icon: Users, value: "Live" },
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

        {/* Grounds List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold">
              FEATURED <span className="text-primary">GROUNDS</span>
            </h2>
            <Button variant="outline" size="sm" onClick={handleComingSoon}>
              <MapPin className="h-4 w-4 mr-2" />
              View Map
            </Button>
          </div>

          <div className="space-y-4">
            {grounds.map((ground, index) => {
              const config = typeConfig[ground.type];
              return (
                <motion.div
                  key={ground.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="p-4 bg-secondary/30 border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={handleComingSoon}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${config.colorClass}`}>
                            {config.label}
                          </span>
                          <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">
                            {pitchTypeLabel[ground.pitchType]}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg">{ground.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {ground.city}, {ground.country}
                        </p>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(ground.rating)
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-medium">{ground.rating}</span>
                          <span className="text-sm text-muted-foreground">
                            ({ground.reviews.toLocaleString()} reviews)
                          </span>
                        </div>

                        {/* Amenities */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {ground.amenities.slice(0, 4).map((amenity) => (
                            <span
                              key={amenity}
                              className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Quick Info */}
                      <div className="flex md:flex-col gap-4 md:gap-2 md:text-right shrink-0">
                        {ground.capacity && (
                          <div>
                            <div className="text-xs text-muted-foreground">Capacity</div>
                            <div className="font-display font-bold text-lg">
                              {ground.capacity.toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Add Ground CTA */}
        <section className="mt-12">
          <Card className="p-8 bg-primary/10 border-primary/30 text-center">
            <h3 className="font-display text-2xl font-bold mb-2">
              KNOW A GROUND?
            </h3>
            <p className="text-muted-foreground mb-4">
              Help the community by adding pitches, stadiums, and training facilities near you.
            </p>
            <Button
              onClick={handleComingSoon}
              className="bg-primary hover:bg-primary/90"
            >
              Add Ground
            </Button>
          </Card>
        </section>
      </main>
    </div>
  );
}
