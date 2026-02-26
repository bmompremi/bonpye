
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { optimizeImageForUpload } from "@/lib/imageOptimization";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Camera,
  MoreHorizontal,
  Bell,
  MessageCircle,
  Heart,
  Repeat2,
  Bookmark,
  Share,
  BarChart3,
  Loader2,
  Settings,
  Moon,
  Sun,
  Home,
  Search,
  Users,
  User,
  Truck,
  BadgeCheck,
  ImageIcon,
  Edit2,
} from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Profile() {
  const { user, loading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    handle: "",
    bio: "",
    location: "",
    truckType: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's posts
  const { data: userPosts, isLoading: postsLoading, refetch: refetchPosts } = trpc.post.getUserPosts.useQuery(
    { userId: user?.id || 0, limit: 20, offset: 0 },
    { enabled: !!user?.id }
  );

  // Fetch follow counts
  const { data: followCounts } = trpc.user.getFollowCounts.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Update profile mutation with cache invalidation
  const utils = trpc.useUtils();
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: async () => {
      setIsEditing(false);
      setAvatarPreview(null);
      setHeaderPreview(null);
      toast.success("Profile updated!");
      // Invalidate auth cache to refresh user data
      await utils.auth.me.invalidate();
      // Also refetch to ensure fresh data
      await utils.auth.me.refetch();
    },
    onError: (error) => {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    },
  });

  // Avatar upload mutation
  const uploadAvatar = trpc.upload.avatar.useMutation({
    onSuccess: (data) => {
      toast.success("Avatar uploaded!");
      utils.auth.me.invalidate();
    },
    onError: () => {
      toast.error("Failed to upload avatar");
    },
  });

  // Header upload mutation
  const uploadHeader = trpc.upload.header.useMutation({
    onSuccess: (data) => {
      toast.success("Header uploaded!");
      utils.auth.me.invalidate();
    },
    onError: () => {
      toast.error("Failed to upload header");
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      setLocation("/");
    },
  });

  const handleLogout = async () => {
    logoutMutation.mutate();
  };

  const handleEditClick = () => {
    if (user) {
      setEditForm({
        name: user.name || "",
        handle: user.handle || "",
        bio: user.bio || "",
        location: user.location || "",
        truckType: user.truckType || "",
      });
      setIsEditing(true);
    }
  };

  const handleEditSubmit = () => {
    const updates: any = {};
    if (editForm.name) updates.name = editForm.name;
    if (editForm.handle) updates.handle = editForm.handle;
    if (editForm.bio) updates.bio = editForm.bio;
    if (editForm.location) updates.location = editForm.location;
    if (editForm.truckType) updates.truckType = editForm.truckType;
    
    if (Object.keys(updates).length === 0) {
      toast.error("No changes to save");
      return;
    }
    
    updateProfile.mutate(updates);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Only show edit button in header if it's the user's own profile
  const isOwnProfile = true;

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">You are not logged in</h1>
        <Button onClick={() => (window.location.href = getLoginUrl())}>
          Sign in with Google
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <ArrowLeft className="h-5 w-5 cursor-pointer hover:opacity-70" />
          </Link>
          <div className="flex items-center gap-2">
            <div>
              <h2 className="font-bold text-xl">{user?.name}</h2>
              <p className="text-xs text-muted-foreground">{userPosts?.length || 0} posts</p>
            </div>
            {!isEditing ? (
              <button
                onClick={handleEditClick}
                className="p-2 hover:bg-secondary rounded-full transition-colors ml-2"
                title="Edit Profile"
              >
                <Edit2 className="h-5 w-5" />
              </button>
            ) : (
              <div className="flex gap-2 ml-2">
                <button
                  onClick={handleEditSubmit}
                  disabled={updateProfile.isPending}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-full transition-colors font-semibold text-sm flex items-center gap-2"
                  title="Save Profile"
                >
                  {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-full transition-colors font-semibold text-sm"
                  title="Cancel"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="max-w-2xl mx-auto">
        {/* Header Image */}
        <div className="relative h-48 bg-gradient-to-r from-red-600 to-red-800">
          {user?.headerUrl && (
            <img src={user.headerUrl} alt="Header" className="w-full h-full object-cover" />
          )}
          {isEditing && (
            <button
              onClick={() => headerInputRef.current?.click()}
              className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <Camera className="h-5 w-5" />
            </button>
          )}
          <input
            ref={headerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  setHeaderPreview(event.target?.result as string);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </div>

        {/* Profile Info */}
        <div className="px-4 pb-4">
          {/* Avatar */}
          <div className="flex justify-between items-start -mt-16 mb-4">
            <div className="relative">
              <img
                src={user?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user?.id}
                alt="Avatar"
                className="w-32 h-32 rounded-full border-4 border-background object-cover"
              />
              {isEditing && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
                >
                  <Camera className="h-5 w-5" />
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const optimizedBlob = await optimizeImageForUpload(file, "avatar");
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setAvatarPreview(event.target?.result as string);
                      };
                      reader.readAsDataURL(optimizedBlob);
                    } catch (error) {
                      console.error("Failed to optimize image", error);
                    }
                  }
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setAvatarPreview(null);
                      setHeaderPreview(null);
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleEditSubmit} disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleEditClick} variant="outline">
                    Edit Profile
                  </Button>
                  <Button onClick={handleLogout} variant="destructive">
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Profile Details */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-secondary text-foreground px-3 py-2 rounded border border-border"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Handle</label>
                <input
                  type="text"
                  value={editForm.handle}
                  onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                  className="w-full bg-secondary text-foreground px-3 py-2 rounded border border-border"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full bg-secondary text-foreground px-3 py-2 rounded border border-border"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full bg-secondary text-foreground px-3 py-2 rounded border border-border"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Truck Type</label>
                <input
                  type="text"
                  value={editForm.truckType}
                  onChange={(e) => setEditForm({ ...editForm, truckType: e.target.value })}
                  className="w-full bg-secondary text-foreground px-3 py-2 rounded border border-border"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="mb-2">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {user?.name}
                  {user?.cdlVerified && <BadgeCheck className="h-5 w-5 text-blue-500" />}
                </h1>
                <p className="text-muted-foreground">@{user?.handle}</p>
              </div>

              {user?.bio && <p className="mb-3 text-sm">{user.bio}</p>}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                {user?.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {user.location}
                  </div>
                )}
                {user?.truckType && (
                  <div className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    {user.truckType}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {formatDate(new Date(user?.createdAt || ""))}
                </div>
              </div>

              {/* CDL Verification Status */}
              {user?.verificationStatus && (
                <div className="mb-4 p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <BadgeCheck className={`h-4 w-4 ${user.verificationStatus === 'verified' ? 'text-green-500' : user.verificationStatus === 'pending' ? 'text-yellow-500' : 'text-red-500'}`} />
                    <span className="font-semibold text-sm">
                      CDL Status: 
                      <span className={`ml-1 ${user.verificationStatus === 'verified' ? 'text-green-500' : user.verificationStatus === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                        {user.verificationStatus.charAt(0).toUpperCase() + user.verificationStatus.slice(1)}
                      </span>
                    </span>
                  </div>
                  {user.verificationStatus === 'verified' && user.updatedAt && (
                    <p className="text-xs text-muted-foreground ml-6">
                      Verified on {formatDate(new Date(user.updatedAt))}
                    </p>
                  )}
                  {user.verificationStatus === 'pending' && user.verificationDeadline && (
                    <p className="text-xs text-yellow-600 ml-6">
                      Deadline: {formatDate(new Date(user.verificationDeadline))}
                    </p>
                  )}
                  {user.verificationStatus === 'suspended' && user.suspensionReason && (
                    <p className="text-xs text-red-600 ml-6">
                      Reason: {user.suspensionReason}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-4 text-sm mb-4">
                <div>
                  <span className="font-bold">{formatNumber(followCounts?.following || 0)}</span>
                  <span className="text-muted-foreground"> Following</span>
                </div>
                <div>
                  <span className="font-bold">{formatNumber(followCounts?.followers || 0)}</span>
                  <span className="text-muted-foreground"> Followers</span>
                </div>
              </div>
            </>
          )}

          {/* Tabs */}
          <div className="border-b border-border mt-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("posts")}
                className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === "posts"
                    ? "border-red-600 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Posts
              </button>
              <button
                onClick={() => setActiveTab("media")}
                className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === "media"
                    ? "border-red-600 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Media
              </button>
            </div>
          </div>

          {/* Posts */}
          {activeTab === "posts" && (
            <div>
              {postsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : userPosts && userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <div key={post.id} className="border-b border-border py-4 hover:bg-secondary/30 transition-colors cursor-pointer">
                    <div className="flex gap-3">
                      <img
                        src={user?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + post.userId}
                        alt="Avatar"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold hover:underline">{user?.name}</span>
                          <span className="text-muted-foreground">@{user?.handle}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground text-sm">now</span>
                        </div>
                        <p className="mt-2 text-sm">{post.content}</p>
                        {post.imageUrl && (
                          <img src={post.imageUrl} alt="Post" className="mt-3 rounded-lg max-w-sm" />
                        )}
                        <div className="flex gap-8 mt-3 text-muted-foreground text-sm">
                          <div className="flex items-center gap-2 hover:text-red-600 cursor-pointer">
                            <MessageCircle className="h-4 w-4" />
                            {post.repliesCount || 0}
                          </div>
                          <div className="flex items-center gap-2 hover:text-red-600 cursor-pointer">
                            <Repeat2 className="h-4 w-4" />
                            {post.repostsCount || 0}
                          </div>
                          <div className="flex items-center gap-2 hover:text-red-600 cursor-pointer">
                            <Heart className="h-4 w-4" />
                            {post.likesCount || 0}
                          </div>
                          <div className="flex items-center gap-2 hover:text-red-600 cursor-pointer">
                            <Share className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No posts yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
