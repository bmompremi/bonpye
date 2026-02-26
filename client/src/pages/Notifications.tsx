/* TCsocial Notifications Page
 * Like Twitter/X notifications
 */

import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Repeat2,
  Settings,
  Sun,
  UserPlus,
  AtSign,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

interface Notification {
  id: number;
  type: "like" | "repost" | "follow" | "reply" | "mention";
  user: {
    name: string;
    handle: string;
    avatar: string;
    verified: boolean;
  };
  content?: string;
  postPreview?: string;
  timestamp: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    type: "like",
    user: {
      name: "Sarah Wheels",
      handle: "sarah_flatbed",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      verified: true,
    },
    postPreview: "Just dropped a load in Phoenix after 2,400 miles...",
    timestamp: "2m",
    read: false,
  },
  {
    id: 2,
    type: "follow",
    user: {
      name: "Diesel Dan",
      handle: "dieseldan_hauler",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      verified: false,
    },
    timestamp: "15m",
    read: false,
  },
  {
    id: 3,
    type: "repost",
    user: {
      name: "Road Queen",
      handle: "roadqueen_cdl",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      verified: true,
    },
    postPreview: "New rig day! Finally upgraded to a 2024 Peterbilt 579...",
    timestamp: "1h",
    read: false,
  },
  {
    id: 4,
    type: "reply",
    user: {
      name: "Highway Harry",
      handle: "highway_harry",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      verified: true,
    },
    content: "That's a beautiful rig! What engine did you go with?",
    postPreview: "New rig day! Finally upgraded to a 2024 Peterbilt 579...",
    timestamp: "2h",
    read: true,
  },
  {
    id: 5,
    type: "mention",
    user: {
      name: "Flatbed Frank",
      handle: "flatbed_frank",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      verified: false,
    },
    content: "@bigmike_otr you gotta check out this truck stop in Amarillo, best showers on I-40!",
    timestamp: "3h",
    read: true,
  },
  {
    id: 6,
    type: "like",
    user: {
      name: "Night Rider",
      handle: "nightrider_otr",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop",
      verified: true,
    },
    postPreview: "Week 3 on the road. Missing the family but the pay is good...",
    timestamp: "5h",
    read: true,
  },
  {
    id: 7,
    type: "follow",
    user: {
      name: "Mountain Mike",
      handle: "mountain_mike",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
      verified: false,
    },
    timestamp: "1d",
    read: true,
  },
  {
    id: 8,
    type: "like",
    user: {
      name: "Trucker Tom",
      handle: "trucker_tom",
      avatar: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop",
      verified: true,
    },
    postPreview: "Just dropped a load in Phoenix after 2,400 miles...",
    timestamp: "1d",
    read: true,
  },
];

export default function Notifications() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const handleComingSoon = () => {
    toast("Feature coming soon!", {
      description: "We're building this for the trucker community.",
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 text-primary fill-primary" />;
      case "repost":
        return <Repeat2 className="h-5 w-5 text-green-500" />;
      case "follow":
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case "reply":
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case "mention":
        return <AtSign className="h-5 w-5 text-primary" />;
      default:
        return <Heart className="h-5 w-5" />;
    }
  };

  const getMessage = (notif: Notification) => {
    switch (notif.type) {
      case "like":
        return "liked your post";
      case "repost":
        return "reposted your post";
      case "follow":
        return "followed you";
      case "reply":
        return "replied to your post";
      case "mention":
        return "mentioned you";
      default:
        return "";
    }
  };

  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : activeTab === "verified"
    ? notifications.filter(n => n.user.verified)
    : notifications.filter(n => n.type === "mention");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href="/feed" className="p-2 rounded-full hover:bg-secondary transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display text-xl font-bold">Notifications</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-secondary transition-colors">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button onClick={handleComingSoon} className="p-2 rounded-full hover:bg-secondary transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { id: "all", label: "All" },
            { id: "verified", label: "Verified" },
            { id: "mentions", label: "Mentions" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 text-center font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="notifTab"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Notifications List */}
      <div>
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Truck className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="font-bold text-xl mb-2">No notifications yet</h2>
            <p className="text-muted-foreground max-w-sm">
              When other drivers interact with your posts, you'll see it here.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif, index) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.03 }}
              className={`p-4 border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer ${
                !notif.read ? "bg-primary/5" : ""
              }`}
            >
              <div className="flex gap-3">
                {/* Icon */}
                <div className="w-10 flex justify-end">
                  {getIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <img
                      src={notif.user.avatar}
                      alt={notif.user.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p>
                        <span className="font-bold hover:underline">{notif.user.name}</span>
                        {notif.user.verified && (
                          <span className="ml-1 bg-primary text-primary-foreground text-xs px-1 rounded">CDL ✓</span>
                        )}
                        <span className="text-muted-foreground"> {getMessage(notif)}</span>
                        <span className="text-muted-foreground"> · {notif.timestamp}</span>
                      </p>
                      
                      {notif.content && (
                        <p className="mt-1 text-foreground">{notif.content}</p>
                      )}
                      
                      {notif.postPreview && !notif.content && (
                        <p className="mt-1 text-muted-foreground line-clamp-2">{notif.postPreview}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* More button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleComingSoon(); }}
                  className="p-2 rounded-full hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
