import { Bell, Home, MessageCircle, Search, User } from "lucide-react";
import { useLocation } from "wouter";

const navItems = [
  { icon: Home, label: "Home", path: "/feed" },
  { icon: Search, label: "Explore", path: "/explore" },
  { icon: MessageCircle, label: "Messages", path: "/messages" },
  { icon: Bell, label: "Alerts", path: "/notifications" },
  { icon: User, label: "Profile", path: "/profile" },
];

const HIDDEN_PATHS = ["/", "/login"];

export default function MobileBottomNav() {
  const [location, setLocation] = useLocation();

  if (HIDDEN_PATHS.includes(location)) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border flex items-center justify-around h-16 px-1">
      {navItems.map(item => {
        const isActive = location === item.path || (item.path === "/feed" && location === "/feed");
        return (
          <button
            key={item.path}
            onClick={() => setLocation(item.path)}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon
              className="h-5 w-5"
              strokeWidth={isActive ? 2.5 : 1.8}
            />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
