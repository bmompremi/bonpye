/* TCsocial Explore/Search Page
 * Like Twitter/X explore with trending topics
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
  Search,
  Settings,
  Sun,
  TrendingUp,
  MapPin,
  Truck,
  BarChart3,
  Bookmark,
  Share,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

interface TrendingTopic {
  id: number;
  category: string;
  topic: string;
  posts: string;
}

interface Post {
  id: number;
  user: {
    name: string;
    handle: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  reposts: number;
  replies: number;
  views: number;
  liked?: boolean;
}

const trendingTopics: TrendingTopic[] = [
  { id: 1, category: "Trucking · Trending", topic: "#FuelPrices", posts: "12.4K posts" },
  { id: 2, category: "Industry · Trending", topic: "ELD Mandate", posts: "8.2K posts" },
  { id: 3, category: "Weather · Trending", topic: "I-70 Closures", posts: "5.1K posts" },
  { id: 4, category: "Trucking · Trending", topic: "#OwnerOperator", posts: "4.8K posts" },
  { id: 5, category: "Business · Trending", topic: "Broker Rates", posts: "3.9K posts" },
  { id: 6, category: "Lifestyle · Trending", topic: "#TruckerLife", posts: "15.2K posts" },
  { id: 7, category: "Safety · Trending", topic: "DOT Inspections", posts: "2.1K posts" },
  { id: 8, category: "Equipment · Trending", topic: "Peterbilt 579", posts: "1.8K posts" },
];

const trendingPosts: Post[] = [
  {
    id: 1,
    user: {
      name: "Trucker News",
      handle: "truckernews",
      avatar: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop",
      verified: true,
    },
    content: "🚨 BREAKING: Diesel prices drop 15 cents nationwide this week. First significant decrease in 3 months. What are you seeing at the pump? #FuelPrices #Trucking",
    timestamp: "2h",
    likes: 2847,
    reposts: 892,
    replies: 234,
    views: 89000,
  },
  {
    id: 2,
    user: {
      name: "Weather Watch OTR",
      handle: "weatherwatch_otr",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      verified: true,
    },
    content: "⚠️ WINTER STORM WARNING: I-70 through Colorado expecting 8-12 inches tonight. Chain laws in effect. Consider alternate routes or staging. Stay safe out there drivers! #I70Closures",
    image: "/images/hero_truck_night.jpg",
    timestamp: "4h",
    likes: 1523,
    reposts: 1204,
    replies: 89,
    views: 125000,
  },
  {
    id: 3,
    user: {
      name: "Load Board Tips",
      handle: "loadboard_tips",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop",
      verified: false,
    },
    content: "Broker rates are finally starting to climb in the Southeast. Seeing $2.80-3.20/mile on reefer loads out of Florida this week. About time! 📈 #BrokerRates #OwnerOperator",
    timestamp: "6h",
    likes: 956,
    reposts: 445,
    replies: 167,
    views: 34000,
  },
];

export default function Explore() {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("foryou");
  const [posts, setPosts] = useState<Post[]>(trendingPosts);

  const handleComingSoon = () => {
    toast("Feature coming soon!", {
      description: "We're building this for the trucker community.",
    });
  };

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-40">
        <div className="flex items-center gap-4 p-4">
          <Link href="/feed" className="p-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search TCsocial"
              className="w-full bg-secondary rounded-full py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-secondary transition-colors">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button onClick={handleComingSoon} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border overflow-x-auto">
          {[
            { id: "foryou", label: "For you" },
            { id: "trending", label: "Trending" },
            { id: "news", label: "News" },
            { id: "loads", label: "Loads" },
            { id: "weather", label: "Weather" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-6 py-4 text-center font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="exploreTab"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1">
          {/* Trending Topics */}
          <div className="border-b border-border">
            <div className="p-4">
              <h2 className="font-bold text-xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Trending in Trucking
              </h2>
            </div>
            
            {trendingTopics.slice(0, 5).map((topic, index) => (
              <motion.button
                key={topic.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={handleComingSoon}
                className="w-full p-4 hover:bg-secondary/50 transition-colors text-left flex items-start justify-between"
              >
                <div>
                  <p className="text-sm text-muted-foreground">{topic.category}</p>
                  <p className="font-bold">{topic.topic}</p>
                  <p className="text-sm text-muted-foreground">{topic.posts}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleComingSoon(); }}
                  className="p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              </motion.button>
            ))}
            
            <button
              onClick={handleComingSoon}
              className="w-full p-4 text-primary hover:bg-secondary/50 transition-colors text-left"
            >
              Show more
            </button>
          </div>

          {/* Trending Posts */}
          <div>
            <div className="p-4 border-b border-border">
              <h2 className="font-bold text-xl">What's happening</h2>
            </div>
            
            {posts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer"
              >
                <div className="flex gap-3">
                  <img
                    src={post.user.avatar}
                    alt={post.user.name}
                    className="w-12 h-12 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    {/* Author Info */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-bold hover:underline">{post.user.name}</span>
                      {post.user.verified && (
                        <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded font-medium">
                          CDL ✓
                        </span>
                      )}
                      <span className="text-muted-foreground">@{post.user.handle}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground hover:underline">{post.timestamp}</span>
                    </div>

                    {/* Content */}
                    <p className="mt-1 whitespace-pre-wrap">{post.content}</p>

                    {/* Image */}
                    {post.image && (
                      <div className="mt-3 rounded-2xl overflow-hidden border border-border">
                        <img
                          src={post.image}
                          alt="Post image"
                          className="w-full max-h-[400px] object-cover"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-3 max-w-md">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleComingSoon(); }}
                        className="flex items-center gap-1 text-muted-foreground hover:text-blue-500 transition-colors group"
                      >
                        <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                          <MessageCircle className="h-5 w-5" />
                        </div>
                        <span className="text-sm">{formatNumber(post.replies)}</span>
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); handleComingSoon(); }}
                        className="flex items-center gap-1 text-muted-foreground hover:text-green-500 transition-colors group"
                      >
                        <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                          <Repeat2 className="h-5 w-5" />
                        </div>
                        <span className="text-sm">{formatNumber(post.reposts)}</span>
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                        className={`flex items-center gap-1 transition-colors group ${
                          post.liked ? "text-primary" : "text-muted-foreground hover:text-primary"
                        }`}
                      >
                        <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                          <Heart className={`h-5 w-5 ${post.liked ? "fill-current" : ""}`} />
                        </div>
                        <span className="text-sm">{formatNumber(post.likes)}</span>
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); handleComingSoon(); }}
                        className="flex items-center gap-1 text-muted-foreground hover:text-blue-500 transition-colors group"
                      >
                        <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                          <BarChart3 className="h-5 w-5" />
                        </div>
                        <span className="text-sm">{formatNumber(post.views)}</span>
                      </button>
                      
                      <div className="flex">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleComingSoon(); }}
                          className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Bookmark className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleComingSoon(); }}
                          className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Share className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        {/* Right Sidebar - Who to follow */}
        <div className="hidden lg:block w-80 p-4 border-l border-border">
          <div className="bg-secondary/50 rounded-2xl p-4">
            <h3 className="font-bold text-xl mb-4">Who to follow</h3>
            
            {[
              { name: "Flatbed Nation", handle: "flatbed_nation", avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop", verified: true },
              { name: "Women in Trucking", handle: "womenintrucking", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop", verified: true },
              { name: "Trucker Tips Daily", handle: "truckertips", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", verified: false },
            ].map((user, index) => (
              <div key={index} className="flex items-center gap-3 py-3">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate flex items-center gap-1">
                    {user.name}
                    {user.verified && (
                      <span className="bg-primary text-primary-foreground text-xs px-1 rounded">✓</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">@{user.handle}</p>
                </div>
                <Button
                  onClick={handleComingSoon}
                  variant="outline"
                  size="sm"
                  className="rounded-full font-bold"
                >
                  Follow
                </Button>
              </div>
            ))}
            
            <button onClick={handleComingSoon} className="text-primary hover:underline text-sm mt-2">
              Show more
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
