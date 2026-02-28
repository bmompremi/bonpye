/* BONPYE Black Book Page
 * Football grounds, pitches, and venue reviews
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Coffee,
  MapPin,
  Moon,
  Search,
  Star,
  Sun,
  Trophy,
  Users,
  Shirt,
  Dumbbell,
  Wifi,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

interface Location {
  id: number;
  name: string;
  type: "stadium" | "training" | "five_a_side" | "football_shop";
  address: string;
  rating: number;
  reviews: number;
  amenities: string[];
  priceRange?: string;
  capacity?: number;
  distance: string;
}

const locations: Location[] = [
  {
    id: 1,
    name: "Emirates Stadium",
    type: "stadium",
    address: "Hornsey Rd, London N7 7AJ",
    rating: 4.8,
    reviews: 12847,
    amenities: ["Seating", "Food & Drink", "Fan Shop", "WiFi", "Parking"],
    capacity: 60704,
    distance: "2.3 mi",
  },
  {
    id: 2,
    name: "Goals Soccer Centre",
    type: "five_a_side",
    address: "123 Sports Way, Manchester M1 2AB",
    rating: 4.5,
    reviews: 2341,
    amenities: ["Astroturf", "Floodlights", "Changing Rooms", "Bar", "Booking"],
    priceRange: "£40-60/hr",
    distance: "1.1 mi",
  },
  {
    id: 3,
    name: "Pro Performance Academy",
    type: "training",
    address: "45 Training Ground Rd, Liverpool L4 5TH",
    rating: 4.9,
    reviews: 456,
    amenities: ["Coaching", "Gym", "Video Analysis", "Recovery Suite"],
    priceRange: "£25-50/session",
    distance: "3.4 mi",
  },
  {
    id: 4,
    name: "PowerPlay 5-a-Side",
    type: "five_a_side",
    address: "78 Arena Park, Birmingham B15 3QA",
    rating: 4.2,
    reviews: 834,
    amenities: ["3G Pitches", "Floodlights", "Changing Rooms", "Café"],
    priceRange: "£35-55/hr",
    distance: "0.8 mi",
  },
  {
    id: 5,
    name: "Pro:Direct Football Store",
    type: "football_shop",
    address: "200 High St, London W1C 1PB",
    rating: 4.3,
    reviews: 1256,
    amenities: ["Boots", "Kits", "Equipment", "Custom Printing"],
    distance: "5.2 mi",
  },
  {
    id: 6,
    name: "The Football Hub",
    type: "training",
    address: "15 Academy Lane, Leeds LS1 4AP",
    rating: 4.6,
    reviews: 389,
    amenities: ["1-on-1 Coaching", "Group Sessions", "Fitness Testing"],
    priceRange: "£20-40/session",
    distance: "2.1 mi",
  },
];

export default function BlackBook() {
  const { theme, toggleTheme } = useTheme();

  const handleComingSoon = () => {
    toast("Feature coming soon!", {
      description: "We're building this for the football community.",
    });
  };

  const getTypeColor = (type: Location["type"]) => {
    switch (type) {
      case "stadium":
        return "bg-primary/20 text-primary";
      case "training":
        return "bg-blue-500/20 text-blue-500";
      case "five_a_side":
        return "bg-green-500/20 text-green-500";
      case "football_shop":
        return "bg-orange-500/20 text-orange-500";
    }
  };

  const getTypeLabel = (type: Location["type"]) => {
    switch (type) {
      case "stadium":
        return "Stadium";
      case "training":
        return "Training Centre";
      case "five_a_side":
        return "5-a-Side";
      case "football_shop":
        return "Football Shop";
    }
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
            <h1 className="font-display text-xl font-bold tracking-wider">THE BLACK BOOK</h1>
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
              placeholder="Search grounds, pitches, or venues..."
              className="w-full bg-secondary/50 border border-border rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
              onClick={handleComingSoon}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {["All", "Stadiums", "5-a-Side", "Training", "Shops"].map((filter) => (
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
            { label: "Venues", value: "12,000+", icon: MapPin },
            { label: "Reviews", value: "850K+", icon: Star },
            { label: "Pitches", value: "5,200+", icon: Trophy },
            { label: "Players", value: "Active", icon: Users },
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

        {/* Nearby Locations */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold">
              NEARBY <span className="text-primary">VENUES</span>
            </h2>
            <Button variant="outline" size="sm" onClick={handleComingSoon}>
              <MapPin className="h-4 w-4 mr-2" />
              View Map
            </Button>
          </div>

          <div className="space-y-4">
            {locations.map((location, index) => (
              <motion.div
                key={location.id}
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
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(location.type)}`}>
                          {getTypeLabel(location.type)}
                        </span>
                        <span className="text-sm text-muted-foreground">{location.distance}</span>
                      </div>
                      <h3 className="font-semibold text-lg mt-2">{location.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {location.address}
                      </p>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(location.rating)
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium">{location.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({location.reviews.toLocaleString()} reviews)
                        </span>
                      </div>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {location.amenities.slice(0, 5).map((amenity) => (
                          <span
                            key={amenity}
                            className="flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="flex md:flex-col gap-4 md:gap-2 md:text-right">
                      {location.priceRange && (
                        <div>
                          <div className="text-xs text-muted-foreground">Price</div>
                          <div className="font-display font-bold text-lg text-green-500">
                            {location.priceRange}
                          </div>
                        </div>
                      )}
                      {location.capacity && (
                        <div>
                          <div className="text-xs text-muted-foreground">Capacity</div>
                          <div className="font-display font-bold text-lg">
                            {location.capacity.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Add Location CTA */}
        <section className="mt-12">
          <Card className="p-8 bg-primary/10 border-primary/30 text-center">
            <h3 className="font-display text-2xl font-bold mb-2">
              KNOW A PITCH?
            </h3>
            <p className="text-muted-foreground mb-4">
              Help fellow players by adding venues and writing reviews.
            </p>
            <Button
              onClick={handleComingSoon}
              className="bg-primary hover:bg-primary/90"
            >
              Add Venue
            </Button>
          </Card>
        </section>
      </main>
    </div>
  );
}
