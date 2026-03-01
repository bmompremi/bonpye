/* BIG Notifications Page
 * Real notifications from database with clickable user profiles
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Moon,
  Repeat2,
  Settings,
  Sun,
  UserPlus,
  AtSign,
  Trophy,
  MoreHorizontal,
  Loader2,
  Bell,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Notifications() {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");

  // Fetch real notifications from database
  const { data: notifications, isLoading, refetch } = trpc.notification.getAll.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated }
  );

  // Unread count
  const { data: unreadCount } = trpc.notification.getUnreadCount.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Mark as read mutation
  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Mark all as read when page loads
  useEffect(() => {
    if (isAuthenticated && unreadCount && unreadCount > 0) {
      markRead.mutate();
    }
  }, [isAuthenticated, unreadCount]);

  const getIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 text-red-500 fill-red-500" />;
      case "repost":
        return <Repeat2 className="h-5 w-5 text-green-500" />;
      case "follow":
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case "reply":
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case "mention":
        return <AtSign className="h-5 w-5 text-primary" />;
      case "message":
        return <MessageCircle className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getMessage = (type: string) => {
    switch (type) {
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
      case "message":
        return "sent you a message";
      default:
        return "";
    }
  };

  const formatTime = (date: Date | string) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString();
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications
    ? activeTab === "all"
      ? notifications
      : activeTab === "verified"
      ? notifications.filter((n: any) => n.actorVerified)
      : notifications.filter((n: any) => n.type === "mention")
    : [];

  const handleNotificationClick = (notif: any) => {
    // Navigate based on notification type
    if (notif.type === "follow") {
      // Go to the follower's profile
      setLocation(`/profile/${notif.actorHandle || notif.actorId}`);
    } else if (notif.postId) {
      // Go to the post/feed
      setLocation(`/feed`);
    } else if (notif.type === "message") {
      setLocation(`/messages`);
    }
  };

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
            <button
              onClick={() => toast("Settings coming soon!")}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
            >
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

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Notifications List */}
      {!isLoading && (
        <div>
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="font-bold text-xl mb-2">
                {activeTab === "all"
                  ? "No notifications yet"
                  : activeTab === "verified"
                  ? "No verified notifications"
                  : "No mentions yet"}
              </h2>
              <p className="text-muted-foreground max-w-sm">
                {activeTab === "all"
                  ? "When other players interact with your posts, you'll see it here."
                  : activeTab === "verified"
                  ? "Notifications from verified players will appear here."
                  : "When someone mentions you, it will show up here."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif: any, index: number) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer active:bg-secondary/50 ${
                  !notif.read ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="w-10 flex justify-end pt-1">
                    {getIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      {/* Avatar - clickable to profile */}
                      <Link
                        href={`/profile/${notif.actorHandle || notif.actorId}`}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <img
                          src={notif.actorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.actorId}`}
                          alt={notif.actorName || "User"}
                          className="w-10 h-10 rounded-full hover:opacity-80 transition-opacity"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <p>
                          {/* Username - clickable to profile */}
                          <Link
                            href={`/profile/${notif.actorHandle || notif.actorId}`}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className="font-bold hover:underline"
                          >
                            {notif.actorName || "User"}
                          </Link>
                          {notif.actorVerified && (
                            <span className="ml-1 bg-primary text-primary-foreground text-xs px-1 rounded">⚽ ✓</span>
                          )}
                          <span className="text-muted-foreground"> {getMessage(notif.type)}</span>
                          <span className="text-muted-foreground"> · {formatTime(notif.createdAt)}</span>
                        </p>

                        {/* Post preview */}
                        {notif.postContent && (
                          <p className="mt-1 text-muted-foreground line-clamp-2 text-sm">
                            {notif.postContent}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
