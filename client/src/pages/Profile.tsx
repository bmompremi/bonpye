
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { optimizeImageForUpload } from "@/lib/imageOptimization";
import {
  ArrowLeft,
  Calendar,
  Globe,
  MapPin,
  Camera,
  MoreHorizontal,
  Bell,
  MessageCircle,
  Heart,
  Repeat2,
  Share,
  BarChart3,
  Loader2,
  Settings,
  Moon,
  Sun,
  Home,
  Search,
  Shirt,
  Trophy,
  Users,
  User,
  BadgeCheck,
  ImageIcon,
  Edit2,
  Trash2,
} from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useRoute } from "wouter";
import { toast } from "sonner";

export default function Profile() {
  const { user, loading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [matchHandle, params] = useRoute("/profile/:handle");
  const handleParam = matchHandle ? params?.handle : null;
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    handle: "",
    bio: "",
    location: "",
    position: "",
    club: "",
    nationality: "",
    preferredFoot: "",
    age: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  // Check if handleParam is a numeric ID
  const isNumericParam = handleParam ? /^\d+$/.test(handleParam) : false;

  // Fetch other user's profile by handle
  const { data: otherUserByHandle } = trpc.user.getByHandle.useQuery(
    { handle: handleParam || "" },
    { enabled: !!handleParam && !isNumericParam && handleParam !== user?.handle }
  );

  // Fetch other user's profile by ID (fallback for numeric params)
  const { data: otherUserById } = trpc.user.getById.useQuery(
    { id: parseInt(handleParam || "0") },
    { enabled: !!handleParam && isNumericParam && parseInt(handleParam) !== user?.id }
  );

  const otherUser = isNumericParam ? otherUserById : otherUserByHandle;

  // Determine which profile to display
  const isOwnProfile = !handleParam || handleParam === user?.handle || (isNumericParam && parseInt(handleParam) === user?.id);
  const profileUser = isOwnProfile ? user : otherUser;

  // Fetch user's posts
  const { data: userPosts, isLoading: postsLoading, refetch: refetchPosts } = trpc.post.getUserPosts.useQuery(
    { userId: profileUser?.id || 0, limit: 20, offset: 0 },
    { enabled: !!profileUser?.id }
  );

  // Fetch follow counts
  const { data: followCounts } = trpc.user.getFollowCounts.useQuery(
    { userId: profileUser?.id || 0 },
    { enabled: !!profileUser?.id }
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

  // Delete post mutation
  const deletePost = trpc.post.delete.useMutation({
    onSuccess: () => {
      toast.success("Post deleted!");
      refetchPosts();
    },
    onError: () => {
      toast.error("Failed to delete post");
    },
  });

  const handleDeletePost = (postId: number) => {
    if (confirm("Delete this post?")) {
      deletePost.mutate({ postId });
    }
  };

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
        position: (user as any).position || "",
        club: (user as any).club || "",
        nationality: (user as any).nationality || "",
        preferredFoot: (user as any).preferredFoot || "",
        age: (user as any).age?.toString() || "",
      });
      setIsEditing(true);
    }
  };

  const handleEditSubmit = async () => {
    const updates: any = {};
    if (editForm.name) updates.name = editForm.name;
    if (editForm.handle) updates.handle = editForm.handle;
    if (editForm.bio) updates.bio = editForm.bio;
    if (editForm.location) updates.location = editForm.location;
    if (editForm.position) updates.position = editForm.position;
    if (editForm.club) updates.club = editForm.club;
    if (editForm.nationality) updates.nationality = editForm.nationality;
    if (editForm.preferredFoot) updates.preferredFoot = editForm.preferredFoot;
    if (editForm.age) updates.age = parseInt(editForm.age, 10);

    // Upload avatar if a new one was selected
    if (avatarPreview) {
      try {
        const base64Data = avatarPreview.split(",")[1]; // Remove data:image/...;base64, prefix
        const contentType = avatarPreview.split(";")[0].split(":")[1] || "image/jpeg";
        await uploadAvatar.mutateAsync({ base64: base64Data, contentType });
      } catch (error) {
        console.error("Avatar upload failed:", error);
        toast.error("Failed to upload avatar");
        return;
      }
    }

    // Upload header if a new one was selected
    if (headerPreview) {
      try {
        const base64Data = headerPreview.split(",")[1];
        const contentType = headerPreview.split(";")[0].split(":")[1] || "image/jpeg";
        await uploadHeader.mutateAsync({ base64: base64Data, contentType });
      } catch (error) {
        console.error("Header upload failed:", error);
        toast.error("Failed to upload header");
        return;
      }
    }

    if (Object.keys(updates).length === 0 && !avatarPreview && !headerPreview) {
      toast.error("No changes to save");
      return;
    }

    if (Object.keys(updates).length > 0) {
      updateProfile.mutate(updates);
    } else {
      // Images were uploaded but no text updates — just close editing
      setIsEditing(false);
      setAvatarPreview(null);
      setHeaderPreview(null);
      await utils.auth.me.invalidate();
      await utils.auth.me.refetch();
      toast.success("Profile updated!");
    }
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
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Left: back arrow + name */}
          <Link href="/">
            <ArrowLeft className="h-5 w-5 cursor-pointer hover:opacity-70 shrink-0" />
          </Link>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base leading-tight truncate">{profileUser?.name}</h2>
            <p className="text-xs text-muted-foreground">{userPosts?.length || 0} posts</p>
          </div>
          {/* Right: action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isOwnProfile && !isEditing ? (
              <button
                onClick={handleEditClick}
                className="p-2 hover:bg-secondary rounded-full transition-colors"
                title="Edit Profile"
              >
                <Edit2 className="h-5 w-5" />
              </button>
            ) : isOwnProfile && isEditing ? (
              <>
                <button
                  onClick={handleEditSubmit}
                  disabled={updateProfile.isPending}
                  className="px-3 py-1.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-full transition-colors font-semibold text-sm flex items-center gap-1"
                >
                  {updateProfile.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-full transition-colors font-semibold text-sm"
                >
                  Cancel
                </button>
              </>
            ) : null}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="max-w-2xl mx-auto">
        {/* Header Image */}
        <div className="relative h-32 sm:h-40 bg-gradient-to-r from-primary to-primary/80">
          {(headerPreview || profileUser?.headerUrl) && (
            <img src={headerPreview || (profileUser?.headerUrl ?? undefined)} alt="Header" className="w-full h-full object-cover" />
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
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  const optimizedBlob = await optimizeImageForUpload(file, "header");
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setHeaderPreview(event.target?.result as string);
                  };
                  reader.readAsDataURL(optimizedBlob);
                } catch (error) {
                  console.error("Failed to optimize header image", error);
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setHeaderPreview(event.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }
            }}
          />
        </div>

        {/* Profile Info */}
        <div className="px-3 pb-3">
          {/* Avatar */}
          <div className="flex justify-between items-start -mt-12 mb-3">
            <div className="relative">
              <img
                src={avatarPreview || profileUser?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + profileUser?.id}
                alt="Avatar"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-background object-cover"
              />
              {isEditing && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-full transition-colors"
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
                      console.error("Failed to optimize avatar image", error);
                      // Fallback: use unoptimized file
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setAvatarPreview(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-2">
              {isOwnProfile && !isEditing && (
                <>
                  <Button onClick={handleEditClick} variant="outline" size="sm" className="rounded-full text-xs">
                    Edit Profile
                  </Button>
                  <Button onClick={handleLogout} variant="outline" size="sm" className="rounded-full text-xs">
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
                <label className="text-sm font-semibold">Position</label>
                <select
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                  className="w-full bg-secondary text-foreground px-3 py-2 rounded border border-border"
                >
                  <option value="">Select position</option>
                  <option value="Goalkeeper">Goalkeeper</option>
                  <option value="Right Back">Right Back</option>
                  <option value="Left Back">Left Back</option>
                  <option value="Centre Back">Centre Back</option>
                  <option value="Defensive Midfielder">Defensive Midfielder</option>
                  <option value="Central Midfielder">Central Midfielder</option>
                  <option value="Attacking Midfielder">Attacking Midfielder</option>
                  <option value="Right Winger">Right Winger</option>
                  <option value="Left Winger">Left Winger</option>
                  <option value="Striker">Striker</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold">Club</label>
                <input
                  type="text"
                  value={editForm.club}
                  onChange={(e) => setEditForm({ ...editForm, club: e.target.value })}
                  placeholder="e.g. FC Barcelona"
                  className="w-full bg-secondary text-foreground px-3 py-2 rounded border border-border"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Nationality</label>
                <input
                  type="text"
                  value={editForm.nationality}
                  onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                  placeholder="e.g. Brazilian"
                  className="w-full bg-secondary text-foreground px-3 py-2 rounded border border-border"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Preferred Foot</label>
                <select
                  value={editForm.preferredFoot}
                  onChange={(e) => setEditForm({ ...editForm, preferredFoot: e.target.value })}
                  className="w-full bg-secondary text-foreground px-3 py-2 rounded border border-border"
                >
                  <option value="">Select foot</option>
                  <option value="right">Right</option>
                  <option value="left">Left</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold">Age</label>
                <input
                  type="number"
                  value={editForm.age}
                  onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                  placeholder="e.g. 23"
                  min={10}
                  max={50}
                  className="w-full bg-secondary text-foreground px-3 py-2 rounded border border-border"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="mb-1">
                <h1 className="text-lg font-bold flex items-center gap-1.5">
                  {profileUser?.name}
                  {(profileUser as any)?.playerVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
                </h1>
                <p className="text-muted-foreground text-sm">@{profileUser?.handle}</p>
              </div>

              {profileUser?.bio && <p className="mb-2 text-sm">{profileUser.bio}</p>}

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                {profileUser?.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profileUser.location}
                  </div>
                )}
                {(profileUser as any)?.position && (
                  <div className="flex items-center gap-1">
                    <Shirt className="h-4 w-4" />
                    {(profileUser as any).position}
                  </div>
                )}
                {(profileUser as any)?.club && (
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    {(profileUser as any).club}
                  </div>
                )}
                {(profileUser as any)?.nationality && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    {(profileUser as any).nationality}
                  </div>
                )}
                {(profileUser as any)?.age && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Age {(profileUser as any).age}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {formatDate(new Date(profileUser?.createdAt || ""))}
                </div>
              </div>

              {/* Player Verification Status */}
              {(profileUser as any)?.verificationStatus && (
                <div className="mb-4 p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <BadgeCheck className={`h-4 w-4 ${(profileUser as any).verificationStatus === 'verified' ? 'text-green-500' : (profileUser as any).verificationStatus === 'pending' ? 'text-yellow-500' : 'text-red-500'}`} />
                    <span className="font-semibold text-sm">
                      Player Verification Status:
                      <span className={`ml-1 ${(profileUser as any).verificationStatus === 'verified' ? 'text-green-500' : (profileUser as any).verificationStatus === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                        {(profileUser as any).verificationStatus.charAt(0).toUpperCase() + (profileUser as any).verificationStatus.slice(1)}
                      </span>
                    </span>
                  </div>
                  {(profileUser as any).verificationStatus === 'verified' && profileUser?.updatedAt && (
                    <p className="text-xs text-muted-foreground ml-6">
                      Verified on {formatDate(new Date(profileUser!.updatedAt))}
                    </p>
                  )}
                  {(profileUser as any).verificationStatus === 'pending' && (profileUser as any).verificationDeadline && (
                    <p className="text-xs text-yellow-600 ml-6">
                      Deadline: {formatDate(new Date((profileUser as any).verificationDeadline))}
                    </p>
                  )}
                  {(profileUser as any).verificationStatus === 'suspended' && (profileUser as any).suspensionReason && (
                    <p className="text-xs text-red-600 ml-6">
                      Reason: {(profileUser as any).suspensionReason}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-4 text-sm mb-3">
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
                  <div key={post.id} className="border-b border-border py-3 hover:bg-secondary/30 transition-colors">
                    <div className="flex gap-3">
                      <img
                        src={profileUser?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + post.userId}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm hover:underline">{profileUser?.name}</span>
                          <span className="text-muted-foreground text-xs">@{profileUser?.handle}</span>
                          <span className="text-muted-foreground text-xs">·</span>
                          <span className="text-muted-foreground text-xs">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                          {/* Delete Button - only on own profile */}
                          {isOwnProfile && (
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="ml-auto p-1.5 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                              title="Delete post"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-sm whitespace-pre-wrap">{post.content}</p>
                        {post.imageUrl && (
                          <img src={post.imageUrl} alt="Post" className="mt-2 rounded-xl max-h-[600px] w-full object-contain border border-border" />
                        )}
                        <div className="flex gap-6 mt-2 text-muted-foreground text-xs">
                          <div className="flex items-center gap-1 hover:text-primary cursor-pointer">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {post.repliesCount || 0}
                          </div>
                          <div className="flex items-center gap-1 hover:text-green-500 cursor-pointer">
                            <Repeat2 className="h-3.5 w-3.5" />
                            {post.repostsCount || 0}
                          </div>
                          <div className="flex items-center gap-1 hover:text-red-500 cursor-pointer">
                            <Heart className="h-3.5 w-3.5" />
                            {post.likesCount || 0}
                          </div>
                          <button
                            onClick={() => {
                              if (navigator.share) {
                                navigator.share({
                                  title: "BIG Post",
                                  text: post.content,
                                  url: window.location.origin + `/post/${post.id}`,
                                });
                              } else {
                                navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
                                toast.success("Link copied!");
                              }
                            }}
                            className="flex items-center gap-1 hover:text-primary cursor-pointer"
                          >
                            <Share className="h-3.5 w-3.5" />
                          </button>
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
