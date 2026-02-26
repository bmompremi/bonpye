/* TCsocial Bookmarks Page
 * Like Twitter/X bookmarks
 */

import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  Heart,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Repeat2,
  Sun,
  BarChart3,
  Share,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

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
  bookmarked: boolean;
}

const mockBookmarks: Post[] = [
  {
    id: 1,
    user: {
      name: "Load Board Tips",
      handle: "loadboard_tips",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop",
      verified: true,
    },
    content: "🔥 HOT TIP: Best lanes this week:\n\n• LA → Phoenix: $3.40/mi\n• Atlanta → Miami: $3.20/mi\n• Dallas → Houston: $2.90/mi\n• Chicago → Detroit: $3.10/mi\n\nBook em while they last! #LoadBoard #OwnerOperator",
    timestamp: "Dec 28",
    likes: 1247,
    reposts: 567,
    replies: 89,
    views: 45000,
    bookmarked: true,
  },
  {
    id: 2,
    user: {
      name: "Trucker Health",
      handle: "truckerhealth",
      avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=100&h=100&fit=crop",
      verified: true,
    },
    content: "5 exercises you can do at the truck stop:\n\n1. Walk around your rig 10 times\n2. Resistance band pulls\n3. Step-ups on your trailer\n4. Stretches against the cab\n5. Jumping jacks\n\nYour health matters, drivers! 💪 #TruckerHealth",
    timestamp: "Dec 25",
    likes: 3421,
    reposts: 1892,
    replies: 234,
    views: 89000,
    bookmarked: true,
  },
  {
    id: 3,
    user: {
      name: "DOT Inspector Mike",
      handle: "dot_mike",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop",
      verified: true,
    },
    content: "Common inspection fails I see every day:\n\n❌ Tire tread depth\n❌ Brake adjustment\n❌ Lights not working\n❌ Unsecured cargo\n❌ Log violations\n\nDo your pre-trip! Save yourself the headache. #DOT #SafetyFirst",
    timestamp: "Dec 20",
    likes: 5678,
    reposts: 3421,
    replies: 456,
    views: 156000,
    bookmarked: true,
  },
];

export default function Bookmarks() {
  const { theme, toggleTheme } = useTheme();
  const [posts, setPosts] = useState<Post[]>(mockBookmarks);

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

  const handleRemoveBookmark = (postId: number) => {
    setPosts(posts.filter(post => post.id !== postId));
    toast("Bookmark removed", {
      description: "Post has been removed from your bookmarks.",
    });
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
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href="/feed" className="p-2 rounded-full hover:bg-secondary transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-display text-xl font-bold">Bookmarks</h1>
              <p className="text-sm text-muted-foreground">@bigmike_otr</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-secondary transition-colors">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button onClick={handleComingSoon} className="p-2 rounded-full hover:bg-secondary transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Bookmarks List */}
      <div>
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Bookmark className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="font-bold text-3xl mb-2">Save posts for later</h2>
            <p className="text-muted-foreground max-w-sm">
              Bookmark posts to easily find them again in the future.
            </p>
          </div>
        ) : (
          posts.map((post, index) => (
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
                        onClick={(e) => { e.stopPropagation(); handleRemoveBookmark(post.id); }}
                        className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
                        title="Remove bookmark"
                      >
                        <Bookmark className="h-5 w-5 fill-current" />
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
          ))
        )}
      </div>
    </div>
  );
}
