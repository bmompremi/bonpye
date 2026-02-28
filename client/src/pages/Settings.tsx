/* BONPYE Settings Page
 * Like Twitter/X settings
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Eye,
  Globe,
  HelpCircle,
  Key,
  Lock,
  LogOut,
  Moon,
  Palette,
  Search,
  Shield,
  Smartphone,
  Sun,
  User,
  Volume2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

interface SettingItem {
  icon: React.ElementType;
  label: string;
  description?: string;
  href?: string;
}

const settingSections = [
  {
    title: "Your account",
    items: [
      { icon: User, label: "Account information", description: "See your account information like your phone number and email address." },
      { icon: Key, label: "Change your password", description: "Change your password at any time." },
      { icon: Smartphone, label: "Download your data", description: "Get a copy of your BONPYE data." },
      { icon: Shield, label: "Player Verification", description: "Verify your player identity to get the verified badge." },
    ],
  },
  {
    title: "Security and account access",
    items: [
      { icon: Shield, label: "Security", description: "Manage your account's security." },
      { icon: Smartphone, label: "Apps and sessions", description: "See information about when you logged into your account." },
      { icon: Lock, label: "Two-factor authentication", description: "Add an extra layer of security to your account." },
    ],
  },
  {
    title: "Privacy and safety",
    items: [
      { icon: Eye, label: "Audience and tagging", description: "Manage what information you allow others to see." },
      { icon: Volume2, label: "Mute and block", description: "Manage the accounts and words you've muted or blocked." },
      { icon: Globe, label: "Direct Messages", description: "Manage who can message you directly." },
    ],
  },
  {
    title: "Notifications",
    items: [
      { icon: Bell, label: "Push notifications", description: "Manage your mobile and desktop notifications." },
      { icon: Bell, label: "Email notifications", description: "Manage what emails you receive from BONPYE." },
    ],
  },
  {
    title: "Accessibility, display, and languages",
    items: [
      { icon: Palette, label: "Display", description: "Manage your font size, color, and background." },
      { icon: Globe, label: "Languages", description: "Manage which languages are used to personalize your experience." },
    ],
  },
  {
    title: "Additional resources",
    items: [
      { icon: HelpCircle, label: "Help Center", description: "Get help with BONPYE." },
    ],
  },
];

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleComingSoon = () => {
    toast("Feature coming soon!", {
      description: "We're building this for the football community.",
    });
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
    toast.success("Logged out successfully");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-40">
        <div className="flex items-center gap-4 p-4">
          <Link href="/feed" className="p-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-xl font-bold">Settings</h1>
          <div className="ml-auto">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-secondary transition-colors">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings"
              className="w-full bg-secondary rounded-full py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </header>

      {/* Settings List */}
      <div className="pb-8">
        {/* Theme Toggle Card */}
        <div className="p-4 border-b border-border">
          <div className="bg-secondary/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  {theme === "dark" ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                </div>
                <div>
                  <p className="font-semibold">Dark mode</p>
                  <p className="text-sm text-muted-foreground">
                    {theme === "dark" ? "Currently on" : "Currently off"}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`w-12 h-7 rounded-full transition-colors ${
                  theme === "dark" ? "bg-primary" : "bg-muted"
                }`}
              >
                <motion.div
                  className="w-5 h-5 bg-white rounded-full shadow-md"
                  animate={{ x: theme === "dark" ? 24 : 4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        {settingSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.05 }}
            className="border-b border-border"
          >
            <h2 className="px-4 py-3 text-sm font-semibold text-muted-foreground">
              {section.title}
            </h2>
            {section.items.map((item, itemIndex) => (
              <button
                key={item.label}
                onClick={handleComingSoon}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
              >
                <item.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.label}</p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </motion.div>
        ))}

        {/* Logout */}
        <div className="p-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full py-6 rounded-xl text-destructive border-destructive/50 hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Log out
          </Button>
        </div>

        {/* App Info */}
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          <img src="/images/bonpye_logo.gif" alt="BONPYE" className="w-12 h-12 mx-auto mb-2 object-contain" />
          <p>BONPYE v1.0.0</p>
          <p>By Players. For Players.</p>
        </div>
      </div>
    </div>
  );
}
