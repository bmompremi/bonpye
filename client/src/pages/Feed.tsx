/* BIG Feed Page
 * Football identity social network
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
  Calendar,
  ChevronDown,
  ChevronUp,
  Heart,
  Home,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Menu,
  Moon,
  MoreHorizontal,
  Repeat2,
  Search,
  Send,
  Settings,
  Sun,
  Trash2,
  Trophy,
  User,
  Users,
  X,
  Smile,
  BarChart3,
  Share,
  Loader2,
  Video,
  BadgeCheck,
  Newspaper,
  ExternalLink,
  Globe,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { LinkPreview } from "@/components/LinkPreview";
import { optimizeImageForUpload } from "@/lib/imageOptimization";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import VideoPlayer from "@/components/VideoPlayer";

// Mock posts for display when no real posts exist
const mockPosts = [
  {
    id: -1,
    userId: 0,
    content: "What a finish from Bukayo Saka tonight! That cut inside on his left foot and curled it into the top corner — pure class. North London is RED! ⚽🔴\n\n#Arsenal #PremierLeague #Saka",
    imageUrl: null,
    videoUrl: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    likesCount: 12400,
    repostsCount: 3210,
    repliesCount: 892,
    viewsCount: 187000,
    repostOfId: null,
    replyToId: null,
    updatedAt: new Date(),
    _mock: true,
    _author: {
      name: "Gooner For Life",
      handle: "gooner_afc",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      verified: true,
    },
  },
  {
    id: -2,
    userId: 0,
    content: "⚠️ MATCH ALERT: Wembley Way is packed early today. If you're heading to the game, take the Jubilee line — Metropolitan line is delayed.\n\nSee you in the stands! 🏟️ #England #Wembley",
    imageUrl: null,
    videoUrl: null,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    likesCount: 4567,
    repostsCount: 2890,
    repliesCount: 234,
    viewsCount: 78900,
    repostOfId: null,
    replyToId: null,
    updatedAt: new Date(),
    _mock: true,
    _author: {
      name: "Three Lions FC",
      handle: "threelions_fc",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      verified: true,
    },
  },
  {
    id: -3,
    userId: 0,
    content: "My first training session with the new club today. Different style, higher intensity — this is exactly the challenge I needed.\n\nGrinding every day. 💪 #NewChapter #FootballLife",
    imageUrl: null,
    videoUrl: null,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    likesCount: 8901,
    repostsCount: 1234,
    repliesCount: 456,
    viewsCount: 145000,
    repostOfId: null,
    replyToId: null,
    updatedAt: new Date(),
    _mock: true,
    _author: {
      name: "Carlos Mendes",
      handle: "carlosmendes10",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      verified: true,
    },
  },
  {
    id: -4,
    userId: 0,
    content: "5 years ago I signed my first professional contract. Signed for a League Two club and cried the whole drive home.\n\nTo all the academy players grinding — your moment is coming. Keep believing. 🙏\n\n#ProFootball #YouthAcademy",
    imageUrl: null,
    videoUrl: null,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
    likesCount: 21456,
    repostsCount: 5678,
    repliesCount: 1230,
    viewsCount: 312000,
    repostOfId: null,
    replyToId: null,
    updatedAt: new Date(),
    _mock: true,
    _author: {
      name: "Taiwo Adeyemi",
      handle: "taiwo_striker",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      verified: true,
    },
  },
  {
    id: -5,
    userId: 0,
    content: "TRIAL OPPORTUNITY: Looking for a right winger for our pre-season. U23, based in London. Must have played at semi-pro level or above.\n\nDM me or share with players who might be interested! ⚽ #FootballTrial #London",
    imageUrl: null,
    videoUrl: null,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    likesCount: 3456,
    repostsCount: 4567,
    repliesCount: 234,
    viewsCount: 67800,
    repostOfId: null,
    replyToId: null,
    updatedAt: new Date(),
    _mock: true,
    _author: {
      name: "London Rovers FC",
      handle: "londonrovers_fc",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      verified: true,
    },
  },
  {
    id: -6,
    userId: 0,
    content: "Just got my BIG Player Verification badge! 🎉 Months of submitting documents and it's finally done.\n\nIf you're serious about being scouted, get verified. It makes a real difference. #PlayerVerification #BIG",
    imageUrl: null,
    videoUrl: null,
    createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
    likesCount: 5678,
    repostsCount: 890,
    repliesCount: 345,
    viewsCount: 112000,
    repostOfId: null,
    replyToId: null,
    updatedAt: new Date(),
    _mock: true,
    _author: {
      name: "Amara Koné",
      handle: "amara_kone",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100&h=100&fit=crop",
      verified: true,
    },
  },
  {
    id: -7,
    userId: 0,
    content: "Half-time player ratings:\n⭐ De Gea: 7\n⭐ Varane: 8\n⭐ Fernandes: 6\n⭐ Rashford: 9 🔥\n\nRashford is on fire tonight. Different level. #MUFC #ManUnited",
    imageUrl: null,
    videoUrl: null,
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    likesCount: 9012,
    repostsCount: 2345,
    repliesCount: 1567,
    viewsCount: 198000,
    repostOfId: null,
    replyToId: null,
    updatedAt: new Date(),
    _mock: true,
    _author: {
      name: "Match Day Stats",
      handle: "matchday_stats",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop",
      verified: true,
    },
  },
  {
    id: -8,
    userId: 0,
    content: "Shoutout to the striker who squared it to me instead of going for glory last Sunday. We won 3-1 because of that selfless assist.\n\nBest feeling in football — team first. This community gets it. 🙏⚽\n\n#SundayLeague #TeamFirst",
    imageUrl: null,
    videoUrl: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    likesCount: 7890,
    repostsCount: 1234,
    repliesCount: 345,
    viewsCount: 234000,
    repostOfId: null,
    replyToId: null,
    updatedAt: new Date(),
    _mock: true,
    _author: {
      name: "Sunday League Hero",
      handle: "sundayleague_hero",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
      verified: false,
    },
  },
];

// ============ COMMENT THREAD COMPONENT ============
interface CommentThreadProps {
  postId: number;
  repliesCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  visibleCount: number;
  onShowMore: () => void;
  onShowLess: () => void;
  formatTime: (date: Date) => string;
}

const CommentThread = (props: CommentThreadProps) => {
  const { postId, repliesCount, isExpanded, onToggle, visibleCount, onShowMore, onShowLess, formatTime } = props;
  const [, setReplyLocation] = useLocation();
  const { data: replies, isLoading } = trpc.post.getReplies.useQuery(
    { postId, limit: 50 },
    { enabled: isExpanded }
  );

  const visibleReplies = replies?.slice(0, visibleCount) || [];
  const hasMore = (replies?.length || 0) > visibleCount;
  const showingExtra = visibleCount > 2 && (replies?.length || 0) > 2;

  return (
    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium py-1"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-3.5 w-3.5" />
            Hide replies
          </>
        ) : (
          <>
            <ChevronDown className="h-3.5 w-3.5" />
            {repliesCount === 1 ? "View 1 reply" : `View ${repliesCount} replies`}
          </>
        )}
      </button>

      {/* Comments list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {isLoading ? (
              <div className="flex items-center gap-2 py-3 pl-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Loading replies...</span>
              </div>
            ) : (
              <div className="relative mt-1">
                {/* Vertical thread line */}
                {visibleReplies.length > 0 && (
                  <div className="absolute left-4 top-0 bottom-3 w-0.5 bg-border rounded-full" />
                )}

                {visibleReplies.map((reply: any, index: number) => {
                  const replyAuthor = reply._author || {
                    name: "Player",
                    handle: "player",
                    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
                    verified: false,
                  };

                  return (
                    <div key={reply.id} className="relative flex gap-2.5 pl-4 py-2">
                      {/* Horizontal connector line */}
                      <div className="absolute left-4 top-5 w-3 h-0.5 bg-border" />
                      <img
                        src={replyAuthor.avatar}
                        alt={replyAuthor.name}
                        className="w-7 h-7 rounded-full object-cover flex-shrink-0 ml-3 relative z-10 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          if (replyAuthor.handle && replyAuthor.handle !== "player") {
                            setReplyLocation(`/profile/${replyAuthor.handle}`);
                          } else if (reply.userId) {
                            setReplyLocation(`/profile/${reply.userId}`);
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0 bg-secondary/40 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              if (replyAuthor.handle && replyAuthor.handle !== "player") {
                                setReplyLocation(`/profile/${replyAuthor.handle}`);
                              } else if (reply.userId) {
                                setReplyLocation(`/profile/${reply.userId}`);
                              }
                            }}
                            className="font-semibold text-xs hover:underline"
                          >
                            {replyAuthor.name}
                          </button>
                          {replyAuthor.verified && (
                            <BadgeCheck className="h-3 w-3 text-primary" />
                          )}
                          <button
                            onClick={() => {
                              if (replyAuthor.handle && replyAuthor.handle !== "player") {
                                setReplyLocation(`/profile/${replyAuthor.handle}`);
                              } else if (reply.userId) {
                                setReplyLocation(`/profile/${reply.userId}`);
                              }
                            }}
                            className="text-xs text-muted-foreground hover:underline"
                          >
                            @{replyAuthor.handle}
                          </button>
                          <span className="text-xs text-muted-foreground">· {formatTime(reply.createdAt)}</span>
                        </div>
                        <p className="text-sm mt-0.5 break-words">{reply.content}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Show more / Show less */}
                {(hasMore || showingExtra) && (
                  <div className="flex items-center gap-3 pl-8 pt-1 pb-1">
                    {hasMore && (
                      <button
                        onClick={onShowMore}
                        className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-0.5"
                      >
                        <ChevronDown className="h-3 w-3" />
                        Show more replies
                      </button>
                    )}
                    {showingExtra && (
                      <button
                        onClick={onShowLess}
                        className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-0.5"
                      >
                        <ChevronUp className="h-3 w-3" />
                        Show less
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Feed() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [installDismissed, setInstallDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState("foryou");
  const [newsCategory, setNewsCategory] = useState<"all" | "worldcup" | "haiti">("all");
  const [newPostText, setNewPostText] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<number[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const [visibleCommentCount, setVisibleCommentCount] = useState<Record<number, number>>({});
  const COMMENTS_PREVIEW_COUNT = 2;

  // Media upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (openMenuId === null) return;
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuId]);

  // Fetch feed posts
  const { data: feedPosts, isLoading: feedLoading, refetch: refetchFeed } = trpc.post.getFeed.useQuery(
    { limit: 20, offset: 0 },
    { enabled: isAuthenticated }
  );

  // Fetch explore posts (for non-authenticated or "For You" tab)
  const { data: explorePosts, isLoading: exploreLoading, refetch: refetchExplore } = trpc.post.getExplore.useQuery(
    { limit: 20, offset: 0 }
  );

  // Soccer news query
  const { data: newsItems, isLoading: newsLoading } = trpc.news.getLatest.useQuery(
    { category: newsCategory },
    { enabled: activeTab === "news", staleTime: 15 * 60 * 1000 }
  );

  // Upload mutations
  const uploadImage = trpc.upload.image.useMutation();
  const uploadVideo = trpc.upload.video.useMutation();

  // Mutations
  const createPost = trpc.post.create.useMutation({
    onSuccess: () => {
      setIsUploading(false);
      refetchFeed();
      refetchExplore();
      setNewPostText("");
      setSelectedImage(null);
      setSelectedVideo(null);
      setImagePreview(null);
      setVideoPreview(null);
      setShowCompose(false);
      setReplyingTo(null);
      setReplyText("");
      toast.success("Posted!");
    },
    onError: () => {
      setIsUploading(false);
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
      refetchExplore();
    },
    onError: () => {
      toast.error("Failed to follow user");
    },
  });

  const deletePost = trpc.post.delete.useMutation({
    onSuccess: () => {
      refetchFeed();
      refetchExplore();
      toast.success("Post deleted");
    },
    onError: () => {
      toast.error("Failed to delete post");
    },
  });

  const handleDeletePost = (postId: number) => {
    if (postId < 0) return;
    if (window.confirm("Are you sure you want to delete this post? This cannot be undone.")) {
      deletePost.mutate({ postId });
    }
    setOpenMenuId(null);
  };

  // Combine real posts with mock posts for display
  const forYouPosts = explorePosts || [];
  const followingPosts = feedPosts || [];
  const isFollowingTab = activeTab === "following";
  const activePosts = isFollowingTab ? followingPosts : forYouPosts;
  // Deduplicate by post ID to prevent any double-render
  const seenPostIds = new Set<number>();
  const uniqueActivePosts = activePosts.filter((p: any) => {
    if (seenPostIds.has(p.id)) return false;
    seenPostIds.add(p.id);
    return true;
  });
  const displayPosts = uniqueActivePosts.length > 0 ? uniqueActivePosts : (isFollowingTab ? [] : mockPosts);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedVideo(null);
    setVideoPreview(null);
    
    try {
      const optimizedBlob = await optimizeImageForUpload(file, "post");
      // Always use .jpg extension — avoids iOS CDN/proxy confusion with .HEIC filenames
      const safeFilename = file.name.replace(/\.[^.]+$/, "") + ".jpg";
      const optimizedFile = new File([optimizedBlob], safeFilename, { type: "image/jpeg" });
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
      toast.success("Goal! ⚽");
      return;
    }
    toggleLike.mutate({ postId });
  };

  const [repostedPosts, setRepostedPosts] = useState<number[]>([]);

  const handleRepost = (postId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (postId < 0) {
      toast.success("Assist! 🎯");
      return;
    }
    // Prevent duplicate reposts
    if (repost.isPending || repostedPosts.includes(postId)) {
      toast.info("Already reposted!");
      return;
    }
    repost.mutate({ postId });
    setRepostedPosts([...repostedPosts, postId]);
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

  const handleReply = (postId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (postId < 0) {
      toast.info("Comments coming soon for this post!");
      return;
    }
    setReplyingTo(replyingTo === postId ? null : postId);
    setReplyText("");
  };

  const submitReply = (postId: number) => {
    if (!replyText.trim()) return;
    createPost.mutate({
      content: replyText,
      replyToId: postId,
    });
    // Show comments after posting a reply
    if (!expandedComments.includes(postId)) {
      setExpandedComments([...expandedComments, postId]);
    }
    setReplyingTo(null);
    setReplyText("");
  };

  const handleComingSoon = () => {
    toast("Feature coming soon!", {
      description: "We're building this for the football community.",
    });
  };

  // Pull-to-refresh handlers
  const PULL_THRESHOLD = 80;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchFeed(),
        refetchExplore(),
      ]);
      toast.success("Feed refreshed! ⚽");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [refetchFeed, refetchExplore]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(diff * 0.5, 120));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
    isPulling.current = false;
  }, [pullDistance, isRefreshing, handleRefresh]);

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
          <img src="/images/bonpye_logo.gif" alt="BIG" className="h-10 w-10 object-contain" />
          <span className="font-display text-xl font-bold tracking-wider hidden lg:block">
            BIG
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
            { icon: Users, label: "Squads", href: "/squads" },
            { icon: Trophy, label: "Clubs", href: "/clubs" },
            { icon: Calendar, label: "Matches", href: "/matches" },
            { icon: Search, label: "Scouting", href: "/scouting" },
            { icon: MapPin, label: "Grounds", href: "/grounds" },
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
            placeholder="Search BIG"
            className="w-full bg-secondary rounded-full py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Trending */}
        <div className="bg-secondary rounded-2xl p-4 mb-4">
          <h2 className="font-bold text-xl mb-4">Trending in Football</h2>
          {[
            { topic: "#PremierLeague", posts: "89.4K" },
            { topic: "Transfer Window", posts: "34.2K" },
            { topic: "#ChampionsLeague", posts: "56.1K" },
            { topic: "Sunday League", posts: "12.8K" },
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
            { name: "Match Day Stats", handle: "matchday_stats", verified: true },
            { name: "Premier League", handle: "premierleague", verified: true },
            { name: "Tactics Board", handle: "tacticsboard_fc", verified: false },
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
      <main
        className="md:ml-20 lg:ml-64 md:mr-0 lg:mr-80 min-h-screen border-r border-border pb-16 md:pb-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
        {(pullDistance > 0 || isRefreshing) && (
          <div
            className="flex items-center justify-center overflow-hidden bg-background transition-all"
            style={{ height: isRefreshing ? 50 : pullDistance }}
          >
            {isRefreshing ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  animate={{ rotate: pullDistance >= PULL_THRESHOLD ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12l7-7 7 7" />
                  </svg>
                </motion.div>
                <span className="text-xs text-muted-foreground">
                  {pullDistance >= PULL_THRESHOLD ? "Release to refresh" : "Pull to refresh"}
                </span>
              </div>
            )}
          </div>
        )}


        {/* Install App Banner */}
        {isInstallable && !installDismissed && !isInstalled && (
          <div className="bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm">Install BIG App</p>
                <p className="text-xs text-white/80 truncate">Get the full app experience on your device</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={async () => {
                  const success = await install();
                  if (success) {
                    toast.success("BIG app installed!");
                  }
                }}
                className="bg-white text-primary font-bold text-sm px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors"
              >
                Install
              </button>
              <button
                onClick={() => setInstallDismissed(true)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-40">
          {/* Facebook-style top bar — mobile only (desktop uses sidebar) */}
          <div className="md:hidden flex items-center gap-3 px-3 py-2">
            <button
              onClick={() => setLocation("/settings")}
              className="p-2 hover:bg-secondary rounded-full transition-colors flex-shrink-0"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex flex-col leading-none">
              <span className="font-display text-3xl font-black tracking-wider text-primary leading-none">BIG</span>
              <span className="text-[10px] text-muted-foreground font-normal tracking-wide mt-0.5">BONPYE Internet Global</span>
            </div>
          </div>

          {/* Tab bar: For You / Following / News */}
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
            <button
              onClick={() => setActiveTab("news")}
              className={`flex-1 py-4 text-center font-semibold transition-colors relative ${
                activeTab === "news" ? "" : "text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                <Newspaper className="h-4 w-4" />
                News
              </span>
              {activeTab === "news" && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded-full"
                />
              )}
            </button>
          </div>
        </header>

        {/* Compose Box — hidden on news tab */}
        <div className={`p-4 border-b border-border ${activeTab === "news" ? "hidden" : ""}`}>
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
                placeholder="What's your take on the beautiful game?"
                className="w-full bg-transparent text-lg resize-none outline-none placeholder:text-muted-foreground min-h-[60px]"
                rows={2}
              />
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="relative mt-2 bg-secondary/30 rounded-2xl">
                  <img
                    src={imagePreview}
                    alt="Selected"
                    className="rounded-2xl max-h-80 w-full object-contain"
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
                      <div className="absolute bottom-12 left-0 bg-background border border-border rounded-xl shadow-lg p-3 grid grid-cols-8 gap-1 z-50 w-[min(280px,calc(100vw-2rem))]">
                        {['😀', '😂', '😍', '🤔', '😎', '🔥', '👍', '💯', '⚽', '🥅', '🏆', '🌍', '👟', '🎯', '💪', '✅'].map((emoji) => (
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
                      const location = prompt("Enter your location (e.g., London, UK or Old Trafford, Manchester):");
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

        {/* News Feed */}
        {activeTab === "news" && (
          <div>
            {/* Category filter pills */}
            <div className="flex gap-2 px-4 py-3 border-b border-border overflow-x-auto">
              {(["all", "worldcup", "haiti"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setNewsCategory(cat)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    newsCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat === "all" ? "⚽ All Soccer" : cat === "worldcup" ? "🏆 World Cup 2026" : "🇭🇹 Haiti"}
                </button>
              ))}
            </div>

            {newsLoading ? (
              <div className="space-y-4 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                    <div className="h-3 bg-secondary rounded w-1/2 mb-1" />
                    <div className="h-3 bg-secondary rounded w-full" />
                  </div>
                ))}
              </div>
            ) : !newsItems || newsItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <Newspaper className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-bold mb-2">No news right now</h3>
                <p className="text-muted-foreground text-sm">Check back soon for the latest soccer updates.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {newsItems.map((item: any, idx: number) => (
                  <a
                    key={idx}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 px-4 py-4 hover:bg-secondary/40 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-3">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">{item.source}</span>
                        {item.pubDate && (
                          <>
                            <span className="text-muted-foreground text-xs">·</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {new Date(item.pubDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Posts Feed */}
        {activeTab !== "news" && (
          (feedLoading || exploreLoading) ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : displayPosts.length === 0 && isFollowingTab ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-bold mb-2">No posts yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Follow other players, clubs, and fans to see their posts here. Check out the <button onClick={() => setActiveTab("foryou")} className="text-primary font-medium hover:underline">For You</button> tab to discover people to follow.
            </p>
          </div>
        ) : (
          <div>
            {displayPosts.map((post: any) => {
              const author = post._author || {
                name: "Player",
                handle: "player",
                avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
                verified: false,
              };
              const isLiked = likedPosts.includes(post.id);

              return (
                <article
                  key={post.id}
                  className="border-b border-border hover:bg-secondary/20 transition-colors cursor-pointer group"
                >
                  {/* Author row: avatar + name + post text */}
                  <div className="px-4 pt-4 flex gap-3">
                    <img
                      src={author.avatar}
                      alt={author.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (author.handle && author.handle !== "player") {
                          setLocation(`/profile/${author.handle}`);
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      {/* Author Info */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (author.handle && author.handle !== "player") {
                              setLocation(`/profile/${author.handle}`);
                            } else if (post.userId && post.userId > 0) {
                              setLocation(`/profile/${post.userId}`);
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
                            if (author.handle && author.handle !== "player") {
                              setLocation(`/profile/${author.handle}`);
                            } else if (post.userId && post.userId > 0) {
                              setLocation(`/profile/${post.userId}`);
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
                                  if (author.handle && author.handle !== "player") {
                                    setLocation(`/profile/${author.handle}`);
                                  } else if (post.userId && post.userId > 0) {
                                    setLocation(`/profile/${post.userId}`);
                                  }
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2"
                              >
                                <User className="h-4 w-4" /> View Profile
                              </button>
                              {post.userId !== user?.id && (
                                <>
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
                                    <Users className="h-4 w-4" /> Follow / Unfollow
                                  </button>
                                </>
                              )}
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
                              {post.userId === user?.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePost(post.id);
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2 text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" /> Delete Post
                                </button>
                              )}
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

                      {/* Post text + link preview */}
                      <LinkPreview
                        text={post.content}
                        className="mt-2"
                        edgeToEdge
                        ogData={post.linkUrl ? {
                          linkUrl: post.linkUrl,
                          linkTitle: post.linkTitle,
                          linkDescription: post.linkDescription,
                          linkImage: post.linkImage,
                          linkSiteName: post.linkSiteName,
                        } : null}
                      />
                    </div>
                  </div>

                  {/* Image — outside flex row, full width with equal 8px bezels */}
                  {post.imageUrl && (
                    <div className="px-2 mt-3">
                      <img
                        src={post.imageUrl}
                        alt="Post image"
                        className="w-full rounded-2xl object-cover max-h-[500px]"
                        decoding="async"
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.onerror = null;
                          img.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  {/* Video — outside flex row, full width with equal 8px bezels */}
                  {post.videoUrl && (
                    <VideoPlayer
                      src={post.videoUrl}
                      className="mt-3 mx-2 rounded-2xl"
                      maxHeight="500px"
                    />
                  )}

                  {/* Actions + replies — indented to align with text column */}
                  <div className="px-4 pb-4">
                    <div className="ml-[60px]">
                      {/* Actions */}
                      <div className="flex items-center justify-between mt-3 w-full md:max-w-md">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReply(post.id); }}
                          className={`flex items-center gap-0.5 sm:gap-1.5 group ${
                            replyingTo === post.id ? "text-primary" : "text-muted-foreground hover:text-primary"
                          }`}
                        >
                          <div className="p-1 sm:p-2 rounded-full group-hover:bg-primary/10">
                            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <span className="text-xs sm:text-sm">{formatNumber(post.repliesCount || 0)}</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRepost(post.id); }}
                          className={`flex items-center gap-0.5 sm:gap-1.5 group ${
                            repostedPosts.includes(post.id) ? "text-green-500" : "text-muted-foreground hover:text-green-500"
                          }`}
                        >
                          <div className="p-1 sm:p-2 rounded-full group-hover:bg-green-500/10">
                            <Repeat2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <span className="text-xs sm:text-sm">{formatNumber(post.repostsCount || 0)}</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                          className={`flex items-center gap-0.5 sm:gap-1.5 group ${
                            isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                          }`}
                        >
                          <div className="p-1 sm:p-2 rounded-full group-hover:bg-red-500/10">
                            <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isLiked ? "fill-current" : ""}`} />
                          </div>
                          <span className="text-xs sm:text-sm">{formatNumber(post.likesCount || 0)}</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          className="flex items-center gap-0.5 sm:gap-1.5 text-muted-foreground hover:text-primary group"
                        >
                          <div className="p-1 sm:p-2 rounded-full group-hover:bg-primary/10">
                            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <span className="text-xs sm:text-sm hidden sm:inline">{formatNumber(post.viewsCount || 0)}</span>
                        </button>
                        {post.userId !== user?.id && post.userId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/messages?user=${post.userId}`);
                            }}
                            className="flex items-center gap-0.5 sm:gap-1.5 group text-muted-foreground hover:text-blue-500"
                            title="Send direct message"
                          >
                            <div className="p-1 sm:p-2 rounded-full group-hover:bg-blue-500/10">
                              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const shareUrl = window.location.origin + `/post/${post.id}`;
                            const shareText = post.content?.substring(0, 100) || "Check out this post on BIG";
                            if (navigator.share) {
                              navigator.share({
                                title: "BIG",
                                text: shareText,
                                url: shareUrl,
                              }).catch(() => {});
                            } else {
                              navigator.clipboard.writeText(shareUrl);
                              toast.success("Link copied!");
                            }
                          }}
                          className="p-1 sm:p-2 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary"
                          title="Share"
                        >
                          <Share className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>

                      {/* Inline Reply Box */}
                      {replyingTo === post.id && (
                        <div className="mt-2 pt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <img
                              src={(user as any)?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"}
                              alt="You"
                              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex-1 relative">
                              <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && replyText.trim()) {
                                    submitReply(post.id);
                                  }
                                }}
                                placeholder="Reply..."
                                className="w-full bg-secondary/50 border border-border rounded-full pl-3 pr-9 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/50"
                                autoFocus
                              />
                              <button
                                onClick={() => submitReply(post.id)}
                                disabled={!replyText.trim() || createPost.isPending}
                                className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
                              >
                                {createPost.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Comment Thread */}
                      {post.id > 0 && (post.repliesCount || 0) > 0 && (
                        <CommentThread
                          postId={post.id}
                          repliesCount={post.repliesCount || 0}
                          isExpanded={expandedComments.includes(post.id)}
                          onToggle={() => {
                            setExpandedComments(
                              expandedComments.includes(post.id)
                                ? expandedComments.filter(id => id !== post.id)
                                : [...expandedComments, post.id]
                            );
                          }}
                          visibleCount={visibleCommentCount[post.id] || COMMENTS_PREVIEW_COUNT}
                          onShowMore={() => {
                            setVisibleCommentCount({
                              ...visibleCommentCount,
                              [post.id]: (visibleCommentCount[post.id] || COMMENTS_PREVIEW_COUNT) + 5,
                            });
                          }}
                          onShowLess={() => {
                            setVisibleCommentCount({
                              ...visibleCommentCount,
                              [post.id]: COMMENTS_PREVIEW_COUNT,
                            });
                          }}
                          formatTime={formatTime}
                        />
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ))}
      </main>


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
                      placeholder="What's your take on the beautiful game?"
                      className="w-full bg-transparent text-lg resize-none outline-none placeholder:text-muted-foreground min-h-[120px]"
                      autoFocus
                    />
                    
                    {/* Image Preview in Modal */}
                    {imagePreview && (
                      <div className="relative mt-2 bg-secondary/30 rounded-2xl">
                        <img
                          src={imagePreview}
                          alt="Selected"
                          className="rounded-2xl max-h-80 w-full object-contain"
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
                      <div className="absolute bottom-12 left-0 bg-background border border-border rounded-xl shadow-lg p-3 grid grid-cols-8 gap-1 z-50 w-[min(280px,calc(100vw-2rem))]">
                        {['😀', '😂', '😍', '🤔', '😎', '🔥', '👍', '💯', '⚽', '🥅', '🏆', '🌍', '👟', '🎯', '💪', '✅'].map((emoji) => (
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
                      const location = prompt("Enter your location (e.g., London, UK or Old Trafford, Manchester):");
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
