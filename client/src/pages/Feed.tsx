/* TCsocial Feed Page
 * Like Twitter/X, Threads, Facebook
 * Core social features: posts, likes, comments, shares, messaging
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Bookmark,
  Heart,
  Home,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Repeat2,
  Search,
  Send,
  Settings,
  Sun,
  User,
  Users,
  X,
  Smile,
  BarChart3,
  Share,
  Loader2,
  Video,
  BadgeCheck,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { LinkPreview } from "@/components/LinkPreview";
import { optimizeImageForUpload } from "@/lib/imageOptimization";

// Mock posts for display when no real posts exist
const mockPosts = [
  {
    id: -1,
    userId: 0,
    content: "Just dropped a load in Phoenix after 2,400 miles. Beautiful sunrise over the desert this morning. This is why we do it. 🌅\n\n#TruckerLife #OTR #RoadLife",
    imageUrl: "/images/hero_truck_night.jpg",
    videoUrl: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    likesCount: 847,
    repostsCount: 124,
    repliesCount: 56,
    viewsCount: 12400,
    repostOfId: null,
    replyToId: null,
    updatedAt: new Date(),
    _mock: true,
    _author: {
      name: "Big Mike",
      handle: "bigmike_otr",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      verified: true,
    },
  },
  {
    id: -2,
    userId: 0,
    content: "⚠️ PSA: I-40 westbound near Flagstaff is backed up 3 hours due to weather. Take the 89 alternate if you can.\n\nStay safe out there drivers!",
    imageUrl: null,
    videoUrl: null,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    likesCount: 1243,
    repostsCount: 892,
    repliesCount: 167,
    viewsCount: 45600,
    repostOfId: null,
    replyToId: null,
    updatedAt: new Date(),
    _mock: true,
    _author: {
      name: "Sarah Wheels",
      handle: "sarah_flatbed",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      verified: true,
    },
  },
  {
    id: -3,
    userId: 0,
    content: "Week 3 on the road. Missing the family but the pay is good this month. Broker actually paid on time for once! 😂\n\nSmall wins. #OwnerOperator #TruckerLife",
    imageUrl: null,
    videoUrl: null,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    likesCount: 2156,
    repostsCount: 445,
    repliesCount: 89,
    viewsCount: 67800,
    repostOfId: null,
    replyToId: null,
    updatedAt: new Date(),
    _mock: true,
    _author: {
      name: "Night Owl Trucking",
      handle: "nightowl_otr",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      verified: true,
    },
  },
  {
    id: -4,
    userId: 0,
    content: "5 years ago I got my CDL. Best decision I ever made.\n\nTo all the new drivers out there - it gets easier. The first year is tough but stick with it. This community has your back. 💪\n\n#WomenInTrucking #CDLLife",
    imageUrl: null,
    videoUrl: null,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
    likesCount: 3421,
    repostsCount: 678,
    repliesCount: 234,
    viewsCount: 89000,
    repostOfId: null,
    replyToId: null,
    updatedAt: new Date(),
    _mock: true,
    _author: {
      name: "Road Queen",
      handle: "roadqueen_cdl",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      verified: true,
    },
  },
  {
    id: -5,
    userId: 0,
    content: "LOAD ALERT: $3.50/mile from Atlanta to Chicago, no touch freight. DM me if interested - broker is solid, been using them for 2 years.\n\n#GoodLoads #FreightBoard",
    imageUrl: null,
    videoUrl: null,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    likesCount: 567,
    repostsCount: 234,
    repliesCount: 45,
    viewsCount: 23400,
    repostOfId: null,
    replyToId: null,
    updatedAt: new Date(),
    _mock: true,
    _author: {
      name: "Diesel Dan",
      handle: "dieseldan_hauler",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      verified: true,
    },
  },
  {
    id: -6,
    userId: 0,
    content: "Just passed my CDL skills test! 🎉 After 3 weeks of training, I'm officially a truck driver. Can't wait to hit the road!\n\nAny tips for a new driver? #NewDriver #CDLSuccess",
    imageUrl: null,
    videoUrl: null,
    createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
    likesCount: 4521,
    repostsCount: 312,
    repliesCount: 456,
    viewsCount: 98700,
    repostOfId: null,
    replyToId: null,
    updatedAt: new Date(),
    _mock: true,
    _author: {
      name: "Rookie Runner",
      handle: "rookie_runner_cdl",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100&h=100&fit=crop",
      verified: false,
    },
  },
  {
    id: -7,
    userId: 0,
    content: "Fuel prices update:\n⛽ Pilot in Amarillo: $3.89\n⛽ Love's in OKC: $3.95\n⛽ TA in Tulsa: $4.02\n\nSave where you can, drivers! #FuelPrices #TruckerTips",
    imageUrl: null,
    videoUrl: null,
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    likesCount: 2890,
    repostsCount: 1567,
    repliesCount: 234,
    viewsCount: 67800,
    repostOfId: null,
    replyToId: null,
    updatedAt: new Date(),
    _mock: true,
    _author: {
      name: "Fuel Watch",
      handle: "fuelwatch_otr",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop",
      verified: true,
    },
  },
  {
    id: -8,
    userId: 0,
    content: "Shoutout to the driver who helped me change my tire on I-10 last night. Didn't catch your name but you're a real one. This community is the best! 🙏\n\n#TruckerFamily #RoadHelp",
    imageUrl: null,
    videoUrl: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    likesCount: 5678,
    repostsCount: 890,
    repliesCount: 123,
    viewsCount: 145000,
    repostOfId: null,
    replyToId: null,
    updatedAt: new Date(),
    _mock: true,
    _author: {
      name: "Highway Hero",
      handle: "highway_hero_tx",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
      verified: true,
    },
  },
];

export default function Feed() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("foryou");
  const [newPostText, setNewPostText] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<number[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  
  // Media upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Fetch feed posts
  const { data: feedPosts, isLoading: feedLoading, refetch: refetchFeed } = trpc.post.getFeed.useQuery(
    { limit: 20, offset: 0 },
    { enabled: isAuthenticated }
  );

  // Fetch explore posts (for non-authenticated or "For You" tab)
  const { data: explorePosts, isLoading: exploreLoading } = trpc.post.getExplore.useQuery(
    { limit: 20, offset: 0 }
  );

  // Upload mutations
  const uploadImage = trpc.upload.image.useMutation();
  const uploadVideo = trpc.upload.video.useMutation();

  // Mutations
  const createPost = trpc.post.create.useMutation({
    onSuccess: () => {
      refetchFeed();
      setNewPostText("");
      setSelectedImage(null);
      setSelectedVideo(null);
      setImagePreview(null);
      setVideoPreview(null);
      setShowCompose(false);
      toast.success("Posted!");
    },
    onError: () => {
      toast.error("Failed to post. Please try again.");
    },
  });

  const toggleLike = trpc.like.toggle.useMutation({
    onSuccess: (data, variables) => {
      if (data.liked) {
        setLikedPosts([...likedPosts, variables.postId]);
      } else {
        setLikedPosts(likedPosts.filter(id => id !== variables.postId));
      }
      refetchFeed();
    },
  });

  const toggleBookmark = trpc.bookmark.toggle.useMutation({
    onSuccess: (data, variables) => {
      if (data.bookmarked) {
        setBookmarkedPosts([...bookmarkedPosts, variables.postId]);
        toast.success("Added to bookmarks");
      } else {
        setBookmarkedPosts(bookmarkedPosts.filter(id => id !== variables.postId));
        toast.success("Removed from bookmarks");
      }
    },
  });

  const repost = trpc.post.repost.useMutation({
    onSuccess: () => {
      refetchFeed();
      toast.success("Reposted!");
    },
  });

  const toggleFollow = trpc.follow.toggle.useMutation({
    onSuccess: (data) => {
      if (data.following) {
        toast.success("Following!");
      } else {
        toast.success("Unfollowed");
      }
      refetchFeed();
    },
    onError: () => {
      toast.error("Failed to follow user");
    },
  });

  // Combine real posts with mock posts for display
  const posts = (activeTab === "following" && feedPosts?.length ? feedPosts : explorePosts) || [];
  const displayPosts = posts.length > 0 ? posts : mockPosts;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedVideo(null);
    setVideoPreview(null);
    
    try {
      const optimizedBlob = await optimizeImageForUpload(file, "post");
      const optimizedFile = new File([optimizedBlob], file.name, { type: "image/jpeg" });
      setSelectedImage(optimizedFile);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(optimizedBlob);
    } catch (error) {
      console.error("Failed to optimize image", error);
      toast.error("Failed to process image");
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      toast.error("Video too large! Maximum size is 50MB.");
      e.target.value = ''; // Reset input
      return;
    }
    
    // Check video format
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported video format. Please use MP4, WebM, or MOV.");
      e.target.value = '';
      return;
    }
    
    // Clear image if selecting video
    setSelectedImage(null);
    setImagePreview(null);
    
    setSelectedVideo(file);
    toast.info(`Video selected: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setVideoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearMedia = () => {
    setSelectedImage(null);
    setSelectedVideo(null);
    setImagePreview(null);
    setVideoPreview(null);
  };

  const handlePost = async () => {
    if (!newPostText.trim() && !selectedImage && !selectedVideo) return;
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    setIsUploading(true);
    
    try {
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;

      // Upload image if selected
      if (selectedImage) {
        const base64 = await fileToBase64(selectedImage);
        const result = await uploadImage.mutateAsync({
          base64,
          filename: selectedImage.name,
          contentType: selectedImage.type,
        });
        imageUrl = result.url;
      }

      // Upload video if selected - use FormData for large files
      if (selectedVideo) {
        toast.info("Uploading video... This may take a moment.");
        try {
          const formData = new FormData();
          formData.append("video", selectedVideo);
          
          const response = await fetch("/api/upload/video", {
            method: "POST",
            body: formData,
            credentials: "include",
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Upload failed");
          }
          
          const result = await response.json();
          videoUrl = result.url;
          toast.success("Video uploaded!");
        } catch (videoError: any) {
          console.error("Video upload error:", videoError);
          toast.error(videoError?.message || "Failed to upload video. Try a smaller file.");
          setIsUploading(false);
          return;
        }
      }

      // Create post with media URLs
      createPost.mutate({ 
        content: newPostText || " ",
        imageUrl,
        videoUrl,
      });
    } catch (error) {
      toast.error("Failed to upload media");
      setIsUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleLike = (postId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (postId < 0) {
      // Mock post - just show visual feedback
      toast.success("10-4! 👍");
      return;
    }
    toggleLike.mutate({ postId });
  };

  const handleRepost = (postId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (postId < 0) {
      toast.success("Echoed!");
      return;
    }
    repost.mutate({ postId });
  };

  const handleBookmark = (postId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (postId < 0) {
      toast.success("Bookmarked!");
      return;
    }
    toggleBookmark.mutate({ postId });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "now";
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString();
  };

  const handleComingSoon = () => {
    toast("Feature coming soon!", {
      description: "We're building this for the trucker community.",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleVideoSelect}
        accept="video/*"
        className="hidden"
      />

      {/* Left Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-20 lg:w-64 border-r border-border p-4 z-50 bg-background">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 p-3 mb-4">
          <img src="/images/logo.png" alt="TCsocial" className="h-10 w-10" />
          <span className="font-display text-xl font-bold tracking-wider hidden lg:block">
            TCSOCIAL
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {[
            { icon: Home, label: "Home", active: true, href: "/feed" },
            { icon: Search, label: "Explore", href: "/explore" },
            { icon: Bell, label: "Notifications", href: "/notifications" },
            { icon: MessageCircle, label: "Messages", href: "/messages" },
            { icon: Bookmark, label: "Bookmarks", href: "/bookmarks" },
            { icon: Users, label: "Convoys", href: "/convoys" },
            { icon: User, label: "Profile", href: "/profile" },
            { icon: Settings, label: "Settings", href: "/settings" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 w-full p-3 rounded-full transition-colors ${
                item.active ? "font-bold" : "hover:bg-secondary"
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-4 w-full p-3 rounded-full hover:bg-secondary transition-colors mb-4"
        >
          {theme === "dark" ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          <span className="hidden lg:block">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {/* Post Button */}
        <Button
          onClick={() => setShowCompose(true)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-3 font-bold"
        >
          <span className="hidden lg:block">Post</span>
          <Send className="h-5 w-5 lg:hidden" />
        </Button>
      </aside>

      {/* Right Sidebar - Desktop */}
      <aside className="hidden lg:block fixed right-0 top-0 bottom-0 w-80 border-l border-border p-4 overflow-y-auto bg-background">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search TCsocial"
            className="w-full bg-secondary rounded-full py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Trending */}
        <div className="bg-secondary rounded-2xl p-4 mb-4">
          <h2 className="font-bold text-xl mb-4">Trending in Trucking</h2>
          {[
            { topic: "Fuel Prices", posts: "12.4K" },
            { topic: "I-40 Weather", posts: "8.2K" },
            { topic: "#TruckerLife", posts: "45.6K" },
            { topic: "ELD Mandate", posts: "3.1K" },
          ].map((item) => (
            <div key={item.topic} className="py-3 hover:bg-background/50 rounded-lg px-2 cursor-pointer">
              <p className="text-sm text-muted-foreground">Trending</p>
              <p className="font-bold">{item.topic}</p>
              <p className="text-sm text-muted-foreground">{item.posts} posts</p>
            </div>
          ))}
        </div>

        {/* Who to Follow */}
        <div className="bg-secondary rounded-2xl p-4">
          <h2 className="font-bold text-xl mb-4">Who to Follow</h2>
          {[
            { name: "Trucker Mike", handle: "truckermike", verified: true },
            { name: "Road Warriors", handle: "roadwarriors", verified: true },
            { name: "CDL Training", handle: "cdltraining", verified: false },
          ].map((user) => (
            <div key={user.handle} className="flex items-center gap-3 py-3">
              <div className="w-12 h-12 rounded-full bg-primary/20" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="font-bold truncate">{user.name}</p>
                  {user.verified && <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />}
                </div>
                <p className="text-muted-foreground truncate">@{user.handle}</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full">
                Follow
              </Button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-20 lg:ml-64 md:mr-0 lg:mr-80 min-h-screen border-r border-border">
        {/* Header */}
        <header className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-40">
          <div className="flex">
            <button
              onClick={() => setActiveTab("foryou")}
              className={`flex-1 py-4 text-center font-semibold transition-colors relative ${
                activeTab === "foryou" ? "" : "text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              For You
              {activeTab === "foryou" && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded-full"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={`flex-1 py-4 text-center font-semibold transition-colors relative ${
                activeTab === "following" ? "" : "text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              Following
              {activeTab === "following" && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded-full"
                />
              )}
            </button>
          </div>
        </header>

        {/* Compose Box */}
        <div className="p-4 border-b border-border">
          <div className="flex gap-3">
            <img
              src={(user as any)?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"}
              alt="Your avatar"
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="What's happening on the road?"
                className="w-full bg-transparent text-lg resize-none outline-none placeholder:text-muted-foreground min-h-[60px]"
                rows={2}
              />
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="relative mt-2">
                  <img
                    src={imagePreview}
                    alt="Selected"
                    className="rounded-2xl max-h-64 w-full object-cover"
                  />
                  <button
                    onClick={clearMedia}
                    className="absolute top-2 right-2 p-1 bg-black/70 rounded-full hover:bg-black/90"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              )}
              
              {/* Video Preview */}
              {videoPreview && (
                <div className="relative mt-2">
                  <video
                    src={videoPreview}
                    controls
                    className="rounded-2xl max-h-64 w-full"
                  />
                  <button
                    onClick={clearMedia}
                    className="absolute top-2 right-2 p-1 bg-black/70 rounded-full hover:bg-black/90"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex gap-2">
                  <button 
                    onClick={() => imageInputRef.current?.click()} 
                    className="p-2 hover:bg-primary/10 rounded-full text-primary"
                    title="Add image"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      videoInputRef.current?.click();
                    }} 
                    className="p-2 hover:bg-primary/10 rounded-full text-primary"
                    title="Add video"
                    type="button"
                  >
                    <Video className="h-5 w-5" />
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                      className="p-2 hover:bg-primary/10 rounded-full text-primary"
                      title="Add emoji"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 left-0 bg-background border border-border rounded-xl shadow-lg p-4 grid grid-cols-8 gap-2 z-50 w-64">
                        {['😀', '😂', '😍', '🤔', '😎', '🔥', '👍', '💯', '🚛', '⚡', '🛣️', '🌙', '☀️', '🌧️', '🚗', '✅'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              setNewPostText(newPostText + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="text-2xl hover:bg-secondary p-2 rounded transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      const location = prompt("Enter your location (e.g., Dallas, TX or I-40 near Memphis):");
                      if (location) {
                        setSelectedLocation(location);
                        setNewPostText(newPostText + ` 📍 ${location}`);
                      }
                    }}
                    className="p-2 hover:bg-primary/10 rounded-full text-primary"
                    title="Add location"
                  >
                    <MapPin className="h-5 w-5" />
                  </button>
                </div>
                <Button
                  onClick={handlePost}
                  disabled={(!newPostText.trim() && !selectedImage && !selectedVideo) || createPost.isPending || isUploading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
                >
                  {(createPost.isPending || isUploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        {(feedLoading || exploreLoading) ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div>
            {displayPosts.map((post: any) => {
              const author = post._author || {
                name: "Driver",
                handle: "driver",
                avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
                verified: false,
              };
              const isLiked = likedPosts.includes(post.id);
              const isBookmarked = bookmarkedPosts.includes(post.id);

              return (
                <article
                  key={post.id}
                  className="p-4 border-b border-border hover:bg-secondary/20 transition-colors cursor-pointer group"
                >
                  <div className="flex gap-3">
                    <img
                      src={author.avatar}
                      alt={author.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      {/* Author Info */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (post.userId && post.userId > 0) {
                              setLocation(`/profile/${post.userId}`);
                            } else {
                              toast.info("View profile coming soon!");
                            }
                          }}
                          className="font-bold hover:underline text-left"
                        >
                          {author.name}
                        </button>
                        {author.verified && (
                          <BadgeCheck className="h-4 w-4 text-primary" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (post.userId && post.userId > 0) {
                              setLocation(`/messages?user=${post.userId}`);
                            } else {
                              toast.info("DM coming soon!");
                            }
                          }}
                          className="text-muted-foreground hover:text-primary hover:underline"
                        >
                          @{author.handle}
                        </button>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{formatTime(post.createdAt)}</span>
                        <div className="ml-auto relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === post.id ? null : post.id);
                            }}
                            className="p-1 hover:bg-secondary rounded-full"
                          >
                            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                          </button>
                          {openMenuId === post.id && (
                            <div className="absolute right-0 top-8 bg-background border border-border rounded-xl shadow-lg py-2 min-w-[200px] z-50">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (post.userId && post.userId > 0) {
                                    setLocation(`/profile/${post.userId}`);
                                  }
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2"
                              >
                                <User className="h-4 w-4" /> View Profile
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (post.userId && post.userId > 0) {
                                    setLocation(`/messages?user=${post.userId}`);
                                  }
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2"
                              >
                                <MessageCircle className="h-4 w-4" /> Send Message
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (post.userId && post.userId > 0) {
                                    toggleFollow.mutate({ userId: post.userId });
                                  }
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2"
                              >
                                <Users className="h-4 w-4" /> Follow
                              </button>
                              <hr className="my-1 border-border" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
                                  toast.success("Link copied!");
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2"
                              >
                                <Share className="h-4 w-4" /> Copy Link
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleComingSoon();
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2 text-destructive"
                              >
                                Report Post
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Content with clickable links */}
                      <LinkPreview text={post.content} className="mt-2" />

                      {/* Image */}
                      {post.imageUrl && (
                        <div className="mt-3 rounded-2xl overflow-hidden border border-border">
                          <img
                            src={post.imageUrl}
                            alt="Post image"
                            className="w-full max-h-96 object-cover"
                          />
                        </div>
                      )}

                      {/* Video */}
                      {post.videoUrl && (
                        <div className="mt-3 rounded-2xl overflow-hidden border border-border">
                          <video
                            src={post.videoUrl}
                            controls
                            className="w-full max-h-96"
                          />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-3 max-w-md">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleComingSoon(); }}
                          className="flex items-center gap-2 text-muted-foreground hover:text-primary group"
                        >
                          <div className="p-2 rounded-full group-hover:bg-primary/10">
                            <MessageCircle className="h-5 w-5" />
                          </div>
                          <span className="text-sm">{formatNumber(post.repliesCount || 0)}</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRepost(post.id); }}
                          className="flex items-center gap-2 text-muted-foreground hover:text-green-500 group"
                        >
                          <div className="p-2 rounded-full group-hover:bg-green-500/10">
                            <Repeat2 className="h-5 w-5" />
                          </div>
                          <span className="text-sm">{formatNumber(post.repostsCount || 0)}</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                          className={`flex items-center gap-2 group ${
                            isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                          }`}
                        >
                          <div className="p-2 rounded-full group-hover:bg-red-500/10">
                            <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                          </div>
                          <span className="text-sm">{formatNumber(post.likesCount || 0)}</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          className="flex items-center gap-2 text-muted-foreground hover:text-primary group"
                        >
                          <div className="p-2 rounded-full group-hover:bg-primary/10">
                            <BarChart3 className="h-5 w-5" />
                          </div>
                          <span className="text-sm">{formatNumber(post.viewsCount || 0)}</span>
                        </button>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (post.userId && post.userId > 0) {
                                setLocation(`/messages?user=${post.userId}`);
                              } else {
                                toast.info("DM coming soon!");
                              }
                            }}
                            className="p-2 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary"
                            title="Send Message"
                          >
                            <MessageCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleBookmark(post.id); }}
                            className={`p-2 rounded-full hover:bg-primary/10 ${
                              isBookmarked ? "text-primary" : "text-muted-foreground hover:text-primary"
                            }`}
                          >
                            <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleComingSoon(); }}
                            className="p-2 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary"
                          >
                            <Share className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around py-3 z-50">
        <Link href="/feed" className="p-2 text-primary">
          <Home className="h-6 w-6" />
        </Link>
        <Link href="/explore" className="p-2">
          <Search className="h-6 w-6" />
        </Link>
        <Link href="/notifications" className="p-2">
          <Bell className="h-6 w-6" />
        </Link>
        <Link href="/messages" className="p-2">
          <MessageCircle className="h-6 w-6" />
        </Link>
        <Link href="/profile" className="p-2">
          <User className="h-6 w-6" />
        </Link>
      </nav>

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20"
            onClick={() => setShowCompose(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-2xl w-full max-w-lg mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <button onClick={() => setShowCompose(false)} className="p-2 hover:bg-secondary rounded-full">
                  <X className="h-5 w-5" />
                </button>
                <Button
                  onClick={handlePost}
                  disabled={(!newPostText.trim() && !selectedImage && !selectedVideo) || createPost.isPending || isUploading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
                >
                  {(createPost.isPending || isUploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                </Button>
              </div>
              <div className="p-4">
                <div className="flex gap-3">
                  <img
                    src={(user as any)?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"}
                    alt="Your avatar"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <textarea
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      placeholder="What's happening on the road?"
                      className="w-full bg-transparent text-lg resize-none outline-none placeholder:text-muted-foreground min-h-[120px]"
                      autoFocus
                    />
                    
                    {/* Image Preview in Modal */}
                    {imagePreview && (
                      <div className="relative mt-2">
                        <img
                          src={imagePreview}
                          alt="Selected"
                          className="rounded-2xl max-h-64 w-full object-cover"
                        />
                        <button
                          onClick={clearMedia}
                          className="absolute top-2 right-2 p-1 bg-black/70 rounded-full hover:bg-black/90"
                        >
                          <X className="h-5 w-5 text-white" />
                        </button>
                      </div>
                    )}
                    
                    {/* Video Preview in Modal */}
                    {videoPreview && (
                      <div className="relative mt-2">
                        <video
                          src={videoPreview}
                          controls
                          className="rounded-2xl max-h-64 w-full"
                        />
                        <button
                          onClick={clearMedia}
                          className="absolute top-2 right-2 p-1 bg-black/70 rounded-full hover:bg-black/90"
                        >
                          <X className="h-5 w-5 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <button 
                    onClick={() => imageInputRef.current?.click()} 
                    className="p-2 hover:bg-primary/10 rounded-full text-primary"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      videoInputRef.current?.click();
                    }} 
                    className="p-2 hover:bg-primary/10 rounded-full text-primary"
                    type="button"
                  >
                    <Video className="h-5 w-5" />
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                      className="p-2 hover:bg-primary/10 rounded-full text-primary"
                      title="Add emoji"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 left-0 bg-background border border-border rounded-xl shadow-lg p-4 grid grid-cols-8 gap-2 z-50 w-64">
                        {['😀', '😂', '😍', '🤔', '😎', '🔥', '👍', '💯', '🚛', '⚡', '🛣️', '🌙', '☀️', '🌧️', '🚗', '✅'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              setNewPostText(newPostText + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="text-2xl hover:bg-secondary p-2 rounded transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      const location = prompt("Enter your location (e.g., Dallas, TX or I-40 near Memphis):");
                      if (location) {
                        setSelectedLocation(location);
                        setNewPostText(newPostText + ` 📍 ${location}`);
                      }
                    }}
                    className="p-2 hover:bg-primary/10 rounded-full text-primary"
                    title="Add location"
                  >
                    <MapPin className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
