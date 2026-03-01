/* BIG Explore/Search Page
 * Football trending topics and discovery
 */

import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Repeat2,
  Search,
  Sun,
  TrendingUp,
  BarChart3,
  Bookmark,
  User,
  Loader2,
} from "lucide-react";
import LinkPreviewCard from "@/components/LinkPreviewCard";
import { useState } from "react";
import { useLocation } from "wouter";

const trendingTopics = [
  { id: 1, category: "Football · Trending", topic: "#TransferWindow", posts: "52.4K posts" },
  { id: 2, category: "Football · Trending", topic: "Champions League", posts: "128.2K posts" },
  { id: 3, category: "Football · Trending", topic: "#MatchDay", posts: "45.1K posts" },
  { id: 4, category: "Football · Trending", topic: "#PremierLeague", posts: "94.8K posts" },
  { id: 5, category: "Football · Trending", topic: "Ballon d'Or", posts: "22.1K posts" },
];

export default function Explore() {
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"foryou" | "people">("foryou");

  // Real data from tRPC
  const explorePosts = trpc.post.getExplore.useQuery({ limit: 20 });
  const searchUsers = trpc.user.search.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length >= 2 }
  );

  const isSearching = searchQuery.length >= 2;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-40">
        <div className="flex items-center gap-3 p-3">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search BIG"
              className="w-full bg-secondary rounded-full py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-secondary transition-colors shrink-0">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        {!isSearching && (
          <div className="flex border-b border-border">
            {[
              { id: "foryou", label: "For you" },
              { id: "people", label: "Trending" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 text-center text-sm font-medium transition-colors relative ${
                  activeTab === tab.id ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="exploreTab"
                    className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-primary rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Search Results */}
      {isSearching ? (
        <div>
          {searchUsers.isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {searchUsers.data?.length === 0 && !searchUsers.isLoading && (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No results for "<strong>{searchQuery}</strong>"</p>
            </div>
          )}
          {searchUsers.data?.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setLocation(`/profile/${user.handle}`)}
              className="flex items-center gap-3 p-4 border-b border-border hover:bg-secondary/30 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name || ""} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{user.name || user.handle}</p>
                <p className="text-sm text-muted-foreground truncate">@{user.handle}</p>
                {user.bio && <p className="text-sm text-muted-foreground truncate mt-0.5">{user.bio}</p>}
              </div>
              {user.playerVerified && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full shrink-0">⚽ ✓</span>
              )}
            </motion.div>
          ))}
        </div>
      ) : activeTab === "foryou" ? (
        /* Real Posts Feed */
        <div>
          {explorePosts.isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {explorePosts.data?.length === 0 && !explorePosts.isLoading && (
            <div className="p-8 text-center text-muted-foreground">
              <p>No posts yet. Be the first to post!</p>
            </div>
          )}
          {explorePosts.data?.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.03 }}
              className="p-4 border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer"
            >
              <div className="flex gap-3">
                <div
                  onClick={() => post._author?.handle && setLocation(`/profile/${post._author.handle}`)}
                  className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                >
                  {post._author?.avatar ? (
                    <img src={post._author.avatar} alt={post._author.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <button onClick={() => post._author?.handle && setLocation(`/profile/${post._author.handle}`)} className="font-bold text-sm hover:underline">
                      {post._author?.name || "Player"}
                    </button>
                    {post._author?.verified && (
                      <span className="bg-primary text-primary-foreground text-xs px-1 rounded">⚽</span>
                    )}
                    <span className="text-muted-foreground text-sm">@{post._author?.handle || "player"}</span>
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {post.linkUrl ? post.content.replace(post.linkUrl, "").trim() : post.content}
                  </p>
                  {post.imageUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-border">
                      <img src={post.imageUrl} alt="Post" className="w-full max-h-72 object-cover" />
                    </div>
                  )}
                  {post.linkUrl && (
                    <LinkPreviewCard
                      url={post.linkUrl}
                      title={post.linkTitle}
                      description={post.linkDescription}
                      image={post.linkImage}
                      siteName={post.linkSiteName}
                    />
                  )}
                  <div className="flex items-center justify-between mt-2 max-w-xs text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-xs">{formatNumber(post.repliesCount || 0)}</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                      <Repeat2 className="h-4 w-4" />
                      <span className="text-xs">{formatNumber(post.repostsCount || 0)}</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                      <Heart className="h-4 w-4" />
                      <span className="text-xs">{formatNumber(post.likesCount || 0)}</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                      <BarChart3 className="h-4 w-4" />
                      <span className="text-xs">{formatNumber(post.viewsCount || 0)}</span>
                    </button>
                    <button className="hover:text-primary transition-colors">
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        /* Trending Topics */
        <div>
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Trending in Football
            </h2>
          </div>
          {trendingTopics.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 border-b border-border hover:bg-secondary/30 cursor-pointer flex items-start justify-between"
            >
              <div>
                <p className="text-xs text-muted-foreground">{topic.category}</p>
                <p className="font-bold">{topic.topic}</p>
                <p className="text-xs text-muted-foreground">{topic.posts}</p>
              </div>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground mt-1" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
