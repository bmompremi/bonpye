/* TCsocial Black Book Page
 * Design: "Midnight Highway" - Cinematic Dark Mode
 * Crowd-sourced truck stop and location reviews
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Coffee,
  Fuel,
  MapPin,
  Moon,
  ParkingCircle,
  Search,
  Droplets,
  Star,
  Sun,
  Truck,
  Wifi,
  Wrench,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

interface Location {
  id: number;
  name: string;
  type: "truck_stop" | "rest_area" | "repair_shop" | "parking";
  address: string;
  rating: number;
  reviews: number;
  amenities: string[];
  fuelPrice?: string;
  parkingSpots?: number;
  distance: string;
}

const locations: Location[] = [
  {
    id: 1,
    name: "Pilot Travel Center #445",
    type: "truck_stop",
    address: "I-40 Exit 234, Amarillo, TX",
    rating: 4.2,
    reviews: 1847,
    amenities: ["Fuel", "Showers", "Restaurant", "WiFi", "Parking"],
    fuelPrice: "$3.45/gal",
    parkingSpots: 150,
    distance: "2.3 mi",
  },
  {
    id: 2,
    name: "Love's Travel Stop #298",
    type: "truck_stop",
    address: "I-10 Exit 112, Phoenix, AZ",
    rating: 4.5,
    reviews: 2341,
    amenities: ["Fuel", "Showers", "Restaurant", "WiFi", "Parking", "Scales"],
    fuelPrice: "$3.52/gal",
    parkingSpots: 200,
    distance: "5.1 mi",
  },
  {
    id: 3,
    name: "Big Rig Repair & Towing",
    type: "repair_shop",
    address: "4521 Industrial Blvd, Dallas, TX",
    rating: 4.8,
    reviews: 456,
    amenities: ["24/7 Service", "Towing", "All Brands"],
    distance: "12.4 mi",
  },
  {
    id: 4,
    name: "Rest Area Mile Marker 156",
    type: "rest_area",
    address: "I-70 Westbound, Kansas",
    rating: 3.2,
    reviews: 234,
    amenities: ["Restrooms", "Vending", "Parking"],
    parkingSpots: 45,
    distance: "8.7 mi",
  },
  {
    id: 5,
    name: "TA Petro #1022",
    type: "truck_stop",
    address: "I-95 Exit 89, Jacksonville, FL",
    rating: 4.0,
    reviews: 1256,
    amenities: ["Fuel", "Showers", "Restaurant", "WiFi", "Parking"],
    fuelPrice: "$3.38/gal",
    parkingSpots: 180,
    distance: "15.2 mi",
  },
  {
    id: 6,
    name: "Walmart Supercenter Parking",
    type: "parking",
    address: "2100 Commerce Dr, Tulsa, OK",
    rating: 3.8,
    reviews: 89,
    amenities: ["Free Parking", "24hr Security"],
    parkingSpots: 25,
    distance: "3.4 mi",
  },
];

const amenityIcons: Record<string, typeof Fuel> = {
  Fuel: Fuel,
  Showers: Droplets,
  Restaurant: Coffee,
  WiFi: Wifi,
  Parking: ParkingCircle,
  "24/7 Service": Wrench,
  Towing: Truck,
};

export default function BlackBook() {
  const { theme, toggleTheme } = useTheme();

  const handleComingSoon = () => {
    toast("Feature coming soon!", {
      description: "We're building this for the trucker community.",
    });
  };

  const getTypeColor = (type: Location["type"]) => {
    switch (type) {
      case "truck_stop":
        return "bg-primary/20 text-primary";
      case "rest_area":
        return "bg-blue-500/20 text-blue-500";
      case "repair_shop":
        return "bg-orange-500/20 text-orange-500";
      case "parking":
        return "bg-green-500/20 text-green-500";
    }
  };

  const getTypeLabel = (type: Location["type"]) => {
    switch (type) {
      case "truck_stop":
        return "Truck Stop";
      case "rest_area":
        return "Rest Area";
      case "repair_shop":
        return "Repair Shop";
      case "parking":
        return "Parking";
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
              placeholder="Search locations, cities, or interstates..."
              className="w-full bg-secondary/50 border border-border rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
              onClick={handleComingSoon}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {["All", "Truck Stops", "Rest Areas", "Repair Shops", "Parking"].map((filter) => (
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
            { label: "Locations", value: "45,000+", icon: MapPin },
            { label: "Reviews", value: "2.1M+", icon: Star },
            { label: "Fuel Prices", value: "Real-time", icon: Fuel },
            { label: "Parking Alerts", value: "Live", icon: ParkingCircle },
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
              NEARBY <span className="text-primary">LOCATIONS</span>
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
                        {location.amenities.slice(0, 5).map((amenity) => {
                          const Icon = amenityIcons[amenity] || MapPin;
                          return (
                            <span
                              key={amenity}
                              className="flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded"
                            >
                              <Icon className="h-3 w-3" />
                              {amenity}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="flex md:flex-col gap-4 md:gap-2 md:text-right">
                      {location.fuelPrice && (
                        <div>
                          <div className="text-xs text-muted-foreground">Diesel</div>
                          <div className="font-display font-bold text-lg text-green-500">
                            {location.fuelPrice}
                          </div>
                        </div>
                      )}
                      {location.parkingSpots && (
                        <div>
                          <div className="text-xs text-muted-foreground">Parking</div>
                          <div className="font-display font-bold text-lg">
                            {location.parkingSpots} spots
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
              KNOW A SPOT?
            </h3>
            <p className="text-muted-foreground mb-4">
              Help fellow drivers by adding locations and writing reviews.
            </p>
            <Button
              onClick={handleComingSoon}
              className="bg-primary hover:bg-primary/90"
            >
              Add Location
            </Button>
          </Card>
        </section>
      </main>
    </div>
  );
}
