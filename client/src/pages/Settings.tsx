/* BIG Settings Page — full functional panels */

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
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
  Trophy,
  User,
  Volume2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

type PanelKey =
  | "account-info"
  | "player-info"
  | "password"
  | "security"
  | "download"
  | "notifications"
  | "privacy"
  | "display"
  | "help"
  | null;

// ─── Settings menu structure ─────────────────────────────────────────────────

const settingSections = [
  {
    title: "Your account",
    items: [
      {
        icon: User,
        label: "Account information",
        description: "Name, handle, bio, location",
        panel: "account-info" as PanelKey,
      },
      {
        icon: Trophy,
        label: "Player information",
        description: "Position, club, nationality, preferred foot",
        panel: "player-info" as PanelKey,
      },
      {
        icon: Key,
        label: "Password & login",
        description: "Change your password or sign-in method",
        panel: "password" as PanelKey,
      },
      {
        icon: Download,
        label: "Download your data",
        description: "Export a copy of your BIG data",
        panel: "download" as PanelKey,
      },
    ],
  },
  {
    title: "Security and account access",
    items: [
      {
        icon: Shield,
        label: "Security",
        description: "Manage your account's security",
        panel: "security" as PanelKey,
      },
    ],
  },
  {
    title: "Privacy and safety",
    items: [
      {
        icon: Eye,
        label: "Privacy",
        description: "Control who can see your profile and posts",
        panel: "privacy" as PanelKey,
      },
      {
        icon: Volume2,
        label: "Mute and block",
        description: "Manage accounts you've muted or blocked",
        panel: null,
      },
    ],
  },
  {
    title: "Notifications",
    items: [
      {
        icon: Bell,
        label: "Notifications",
        description: "Manage what alerts you receive",
        panel: "notifications" as PanelKey,
      },
    ],
  },
  {
    title: "Display",
    items: [
      {
        icon: Palette,
        label: "Display settings",
        description: "Appearance, font size, colour theme",
        panel: "display" as PanelKey,
      },
    ],
  },
  {
    title: "Help",
    items: [
      {
        icon: HelpCircle,
        label: "Help centre",
        description: "FAQs and support",
        panel: "help" as PanelKey,
      },
    ],
  },
];

// ─── Slide panel wrapper ──────────────────────────────────────────────────────

function SlidePanel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.22 }}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      <header className="sticky top-0 bg-background/90 backdrop-blur border-b border-border z-10">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="font-display text-xl font-bold">{title}</h2>
        </div>
      </header>
      <div className="p-4 pb-24">{children}</div>
    </motion.div>
  );
}

// ─── Account Info Panel ───────────────────────────────────────────────────────

function AccountInfoPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    handle: (user as any)?.handle ?? "",
    bio: (user as any)?.bio ?? "",
    location: (user as any)?.location ?? "",
  });
  const [saved, setSaved] = useState(false);
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success("Profile updated");
    },
    onError: (e) => toast.error(e.message || "Update failed"),
  });

  const handleSave = () => {
    updateProfile.mutate({
      name: form.name || undefined,
      handle: form.handle || undefined,
      bio: form.bio || undefined,
      location: form.location || undefined,
    });
  };

  return (
    <SlidePanel title="Account information" onClose={onClose}>
      <div className="space-y-5 max-w-lg">
        <Field
          label="Display name"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          placeholder="Your name"
        />
        <Field
          label="Username / handle"
          value={form.handle}
          onChange={(v) => setForm((f) => ({ ...f, handle: v }))}
          placeholder="@handle"
          prefix="@"
        />
        <div>
          <label className="block text-sm font-medium mb-2">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="Tell the world about yourself..."
            rows={4}
            maxLength={500}
            className="w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {form.bio.length}/500
          </p>
        </div>
        <Field
          label="Location"
          value={form.location}
          onChange={(v) => setForm((f) => ({ ...f, location: v }))}
          placeholder="e.g. Port-au-Prince, Haiti"
        />
        <div className="pt-2">
          <p className="text-sm text-muted-foreground mb-1">Email</p>
          <p className="font-medium">{user?.email ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Email cannot be changed here. Contact support if needed.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateProfile.isPending || saved}
          className="w-full"
        >
          {saved ? (
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Saved
            </span>
          ) : updateProfile.isPending ? (
            "Saving..."
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </SlidePanel>
  );
}

// ─── Player Info Panel ────────────────────────────────────────────────────────

const POSITIONS = [
  "Goalkeeper",
  "Right Back",
  "Centre Back",
  "Left Back",
  "Defensive Midfielder",
  "Central Midfielder",
  "Attacking Midfielder",
  "Right Winger",
  "Left Winger",
  "Second Striker",
  "Striker",
];

function PlayerInfoPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const u = user as any;
  const [form, setForm] = useState({
    position: u?.position ?? "",
    club: u?.club ?? "",
    nationality: u?.nationality ?? "",
    preferredFoot: (u?.preferredFoot ?? "") as "" | "left" | "right" | "both",
    age: u?.age ? String(u.age) : "",
  });
  const [saved, setSaved] = useState(false);
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success("Player info updated");
    },
    onError: (e) => toast.error(e.message || "Update failed"),
  });

  const handleSave = () => {
    const ageNum = form.age ? parseInt(form.age, 10) : undefined;
    updateProfile.mutate({
      position: form.position || undefined,
      club: form.club || undefined,
      nationality: form.nationality || undefined,
      preferredFoot:
        form.preferredFoot === ""
          ? undefined
          : (form.preferredFoot as "left" | "right" | "both"),
      age: ageNum && !isNaN(ageNum) ? ageNum : undefined,
    });
  };

  return (
    <SlidePanel title="Player information" onClose={onClose}>
      <div className="space-y-5 max-w-lg">
        <div>
          <label className="block text-sm font-medium mb-2">Position</label>
          <select
            value={form.position}
            onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
            className="w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          >
            <option value="">Select position</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Current club"
          value={form.club}
          onChange={(v) => setForm((f) => ({ ...f, club: v }))}
          placeholder="e.g. Manchester United"
        />
        <Field
          label="Nationality"
          value={form.nationality}
          onChange={(v) => setForm((f) => ({ ...f, nationality: v }))}
          placeholder="e.g. Haitian"
        />
        <div>
          <label className="block text-sm font-medium mb-2">Preferred foot</label>
          <div className="grid grid-cols-3 gap-2">
            {(["left", "right", "both"] as const).map((foot) => (
              <button
                key={foot}
                onClick={() => setForm((f) => ({ ...f, preferredFoot: foot }))}
                className={`py-2 rounded-xl border text-sm font-medium capitalize transition-colors ${
                  form.preferredFoot === foot
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary hover:border-primary/50"
                }`}
              >
                {foot}
              </button>
            ))}
          </div>
        </div>
        <Field
          label="Age"
          value={form.age}
          onChange={(v) => setForm((f) => ({ ...f, age: v }))}
          placeholder="e.g. 23"
          type="number"
        />
        <Button
          onClick={handleSave}
          disabled={updateProfile.isPending || saved}
          className="w-full"
        >
          {saved ? (
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Saved
            </span>
          ) : updateProfile.isPending ? (
            "Saving..."
          ) : (
            "Save player info"
          )}
        </Button>
      </div>
    </SlidePanel>
  );
}

// ─── Password Panel ───────────────────────────────────────────────────────────

function PasswordPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const provider = (user as any)?.provider ?? "google";

  return (
    <SlidePanel title="Password & login" onClose={onClose}>
      <div className="max-w-lg space-y-6">
        <div className="bg-secondary/50 rounded-xl p-4">
          <p className="text-sm font-medium mb-1">Sign-in method</p>
          <p className="text-sm text-muted-foreground capitalize">
            {provider === "google"
              ? "Google OAuth"
              : provider === "facebook"
              ? "Facebook OAuth"
              : provider}
          </p>
        </div>
        {provider === "google" || provider === "facebook" ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Social login active</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your account uses {provider === "google" ? "Google" : "Facebook"} to
                  sign in. Passwords are managed by{" "}
                  {provider === "google" ? "Google" : "Facebook"} — visit their security
                  settings to update your password.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Security tips</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Use a strong, unique password for your Google/Facebook account",
                  "Enable two-factor authentication on your social login provider",
                  "Sign out of BIG on shared devices",
                  "Review connected apps regularly",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-secondary/50 rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              Password management is coming soon.
            </p>
          </div>
        )}
      </div>
    </SlidePanel>
  );
}

// ─── Security Panel ───────────────────────────────────────────────────────────

function SecurityPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const u = user as any;

  const checks = [
    { label: "Email verified", done: !!u?.email },
    { label: "Profile photo set", done: !!u?.avatarUrl },
    { label: "Bio added", done: !!u?.bio },
    { label: "Player info completed", done: !!u?.position },
  ];

  return (
    <SlidePanel title="Security" onClose={onClose}>
      <div className="max-w-lg space-y-6">
        <div className="bg-secondary/50 rounded-xl p-4">
          <p className="text-sm font-medium mb-3">Account health</p>
          <div className="space-y-3">
            {checks.map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    c.done ? "bg-green-500" : "bg-muted"
                  }`}
                >
                  {c.done ? (
                    <Check className="h-3 w-3 text-white" />
                  ) : (
                    <X className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <span className="text-sm">{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Login information</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Email</span>
              <span>{u?.email ?? "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Provider</span>
              <span className="capitalize">{(u?.provider ?? "email")}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Member since</span>
              <span>
                {u?.createdAt
                  ? new Date(u.createdAt).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-500 mb-1">
            Two-factor authentication
          </p>
          <p className="text-sm text-muted-foreground">
            2FA coming soon. You'll be able to add an extra layer of security to
            your account.
          </p>
        </div>
      </div>
    </SlidePanel>
  );
}

// ─── Download Data Panel ──────────────────────────────────────────────────────

function DownloadDataPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const feedQuery = trpc.post.getFeed.useQuery(
    { limit: 1000, offset: 0 },
    { enabled: false }
  );
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (format: "json" | "csv") => {
    setDownloading(true);
    try {
      const result = await feedQuery.refetch();
      const posts = result.data ?? [];

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === "json") {
        const data = {
          exportedAt: new Date().toISOString(),
          user: { id: user?.id, name: user?.name, email: user?.email },
          posts,
        };
        content = JSON.stringify(data, null, 2);
        filename = `big-data-${Date.now()}.json`;
        mimeType = "application/json";
      } else {
        const rows = [
          ["id", "content", "createdAt", "likes", "reposts"].join(","),
          ...posts.map((p: any) =>
            [
              p.id,
              `"${(p.content ?? "").replace(/"/g, '""')}"`,
              p.createdAt,
              p.likeCount ?? 0,
              p.repostCount ?? 0,
            ].join(",")
          ),
        ];
        content = rows.join("\n");
        filename = `big-posts-${Date.now()}.csv`;
        mimeType = "text/csv";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${filename}`);
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SlidePanel title="Download your data" onClose={onClose}>
      <div className="max-w-lg space-y-6">
        <p className="text-sm text-muted-foreground">
          Export a copy of the data associated with your BIG account.
        </p>

        <div className="space-y-3">
          <p className="text-sm font-medium">What's included</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {["Your posts and reposts", "Your profile information", "Post timestamps and engagement stats"].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handleDownload("json")}
            disabled={downloading}
            variant="outline"
            className="h-16 flex flex-col gap-1"
          >
            <Download className="h-5 w-5" />
            <span className="text-xs">JSON</span>
          </Button>
          <Button
            onClick={() => handleDownload("csv")}
            disabled={downloading}
            variant="outline"
            className="h-16 flex flex-col gap-1"
          >
            <Download className="h-5 w-5" />
            <span className="text-xs">CSV (Posts)</span>
          </Button>
        </div>
        {downloading && (
          <p className="text-sm text-muted-foreground text-center">Preparing your data...</p>
        )}
      </div>
    </SlidePanel>
  );
}

// ─── Notifications Panel ──────────────────────────────────────────────────────

const defaultNotifPrefs = {
  likes: true,
  replies: true,
  reposts: true,
  newFollowers: true,
  mentions: true,
  matchAlerts: false,
  scoutingRequests: false,
  weeklyDigest: false,
};

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [prefs, setPrefs] = useState(defaultNotifPrefs);

  const toggle = (key: keyof typeof prefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const rows: { key: keyof typeof prefs; label: string; desc?: string }[] = [
    { key: "likes", label: "Likes", desc: "When someone likes your post" },
    { key: "replies", label: "Replies", desc: "When someone replies to you" },
    { key: "reposts", label: "Reposts", desc: "When your post is reposted" },
    { key: "newFollowers", label: "New followers", desc: "When someone follows you" },
    { key: "mentions", label: "Mentions", desc: "When you're tagged in a post" },
    { key: "matchAlerts", label: "Match alerts", desc: "Scores and kickoff reminders" },
    { key: "scoutingRequests", label: "Scouting requests", desc: "When a scout views your profile" },
    { key: "weeklyDigest", label: "Weekly digest", desc: "Summary of your account activity" },
  ];

  return (
    <SlidePanel title="Notifications" onClose={onClose}>
      <div className="max-w-lg space-y-1">
        {rows.map(({ key, label, desc }) => (
          <div
            key={key}
            className="flex items-center justify-between py-4 border-b border-border"
          >
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-medium">{label}</p>
              {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
            </div>
            <Toggle on={prefs[key]} onClick={() => toggle(key)} />
          </div>
        ))}
        <div className="pt-4">
          <Button
            onClick={() => toast.success("Notification preferences saved")}
            className="w-full"
          >
            Save preferences
          </Button>
        </div>
      </div>
    </SlidePanel>
  );
}

// ─── Privacy Panel ────────────────────────────────────────────────────────────

const defaultPrivacy = {
  privateAccount: false,
  showLocation: true,
  allowMentions: true,
  allowDMs: true,
  hideActivity: false,
  hideFollowList: false,
};

function PrivacyPanel({ onClose }: { onClose: () => void }) {
  const [prefs, setPrefs] = useState(defaultPrivacy);
  const toggle = (key: keyof typeof prefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const rows: { key: keyof typeof prefs; label: string; desc?: string }[] = [
    { key: "privateAccount", label: "Private account", desc: "Only approved followers can see your posts" },
    { key: "showLocation", label: "Show location", desc: "Display location on your profile" },
    { key: "allowMentions", label: "Allow mentions", desc: "Anyone can tag you in posts" },
    { key: "allowDMs", label: "Allow direct messages", desc: "Anyone can message you" },
    { key: "hideActivity", label: "Hide activity status", desc: "Don't show when you were last active" },
    { key: "hideFollowList", label: "Private follow list", desc: "Hide your followers and following lists" },
  ];

  return (
    <SlidePanel title="Privacy" onClose={onClose}>
      <div className="max-w-lg space-y-1">
        {rows.map(({ key, label, desc }) => (
          <div
            key={key}
            className="flex items-center justify-between py-4 border-b border-border"
          >
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-medium">{label}</p>
              {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
            </div>
            <Toggle on={prefs[key]} onClick={() => toggle(key)} />
          </div>
        ))}
        <div className="pt-4">
          <Button onClick={() => toast.success("Privacy settings saved")} className="w-full">
            Save settings
          </Button>
        </div>
      </div>
    </SlidePanel>
  );
}

// ─── Display Panel ────────────────────────────────────────────────────────────

function DisplayPanel({ onClose }: { onClose: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const [fontSize, setFontSize] = useState<"small" | "default" | "large">("default");

  return (
    <SlidePanel title="Display settings" onClose={onClose}>
      <div className="max-w-lg space-y-6">
        {/* Dark / Light mode */}
        <div>
          <p className="text-sm font-medium mb-3">Colour theme</p>
          <div className="grid grid-cols-2 gap-3">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { if (theme !== t) toggleTheme?.(); }}
                className={`p-4 rounded-xl border text-sm font-medium capitalize flex flex-col items-center gap-2 transition-colors ${
                  theme === t
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary"
                }`}
              >
                {t === "dark" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
                {t === "dark" ? "Dark" : "Light"}
              </button>
            ))}
          </div>
        </div>

        {/* Font size */}
        <div>
          <p className="text-sm font-medium mb-3">Font size</p>
          <div className="grid grid-cols-3 gap-2">
            {(["small", "default", "large"] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`py-3 rounded-xl border text-sm font-medium capitalize transition-colors ${
                  fontSize === size
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary"
                }`}
                style={{
                  fontSize: size === "small" ? "12px" : size === "large" ? "16px" : "14px",
                }}
              >
                {size === "default" ? "Normal" : size}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Font size changes are saved locally.
          </p>
        </div>
      </div>
    </SlidePanel>
  );
}

// ─── Help Panel ───────────────────────────────────────────────────────────────

const faqs = [
  {
    q: "How do I get the verified badge?",
    a: "Go to Settings → Your account → Player verification and submit your ID and proof of play. Approval takes 3–5 business days.",
  },
  {
    q: "Can I change my username?",
    a: "Yes — go to Account information and update your handle. Handles must be 3–50 characters and can contain letters, numbers, and underscores.",
  },
  {
    q: "How do I delete my account?",
    a: "Account deletion is not yet available in the app. Please email support@bonpye.com and we'll process your request within 30 days.",
  },
  {
    q: "Why won't my image upload?",
    a: "Make sure your image is JPEG or PNG and under 10MB. On iOS, images from your camera are automatically converted before upload. If the issue persists, try a different photo.",
  },
  {
    q: "How does the scouting feature work?",
    a: "Complete your Player information in Settings. Scouts can search for players by position, nationality, and club. Your profile appears in scout searches once your info is filled in.",
  },
  {
    q: "How do I report a post or user?",
    a: "Tap the three-dot menu on any post and select 'Report'. For urgent issues, email support@bonpye.com.",
  },
];

function HelpPanel({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <SlidePanel title="Help centre" onClose={onClose}>
      <div className="max-w-lg space-y-2">
        <p className="text-sm text-muted-foreground mb-4">
          Frequently asked questions about BIG — BONPYE Internet Global.
        </p>
        {faqs.map((faq, i) => (
          <div key={i} className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
            >
              <span className="text-sm font-medium pr-4">{faq.q}</span>
              <ChevronRight
                className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${
                  open === i ? "rotate-90" : ""
                }`}
              />
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 text-sm text-muted-foreground">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl text-center">
          <p className="text-sm font-medium mb-1">Still need help?</p>
          <p className="text-sm text-muted-foreground">
            Email us at{" "}
            <a
              href="mailto:support@bonpye.com"
              className="text-primary underline"
            >
              support@bonpye.com
            </a>
          </p>
        </div>
      </div>
    </SlidePanel>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm ${
            prefix ? "pl-7" : ""
          }`}
        />
      </div>
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
        on ? "bg-primary" : "bg-muted"
      }`}
    >
      <motion.div
        className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
        animate={{ left: on ? "calc(100% - 24px)" : "4px" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

// ─── Main Settings component ──────────────────────────────────────────────────

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activePanel, setActivePanel] = useState<PanelKey>(null);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
    toast.success("Logged out successfully");
  };

  const handleComingSoon = () =>
    toast("Coming soon!", {
      description: "We're building this for the football community.",
    });

  const filteredSections = settingSections.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        !searchQuery ||
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((s) => s.items.length > 0);

  const openPanel = (panel: PanelKey) => {
    if (!panel) {
      handleComingSoon();
    } else {
      setActivePanel(panel);
    }
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
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings"
              className="w-full bg-secondary rounded-full py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </header>

      {/* Account summary */}
      {!searchQuery && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-semibold">{user?.name ?? "—"}</p>
              <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dark mode quick toggle */}
      {!searchQuery && (
        <div className="p-4 border-b border-border">
          <div className="bg-secondary/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5 text-primary" />
                  ) : (
                    <Sun className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">Dark mode</p>
                  <p className="text-xs text-muted-foreground">
                    {theme === "dark" ? "Currently on" : "Currently off"}
                  </p>
                </div>
              </div>
              <Toggle on={theme === "dark"} onClick={() => toggleTheme?.()} />
            </div>
          </div>
        </div>
      )}

      {/* Settings sections */}
      <div className="pb-8">
        {filteredSections.map((section) => (
          <div key={section.title} className="border-b border-border">
            <h2 className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </h2>
            {section.items.map((item) => (
              <button
                key={item.label}
                onClick={() => openPanel(item.panel)}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
              >
                <item.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.label}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        ))}

        {/* Logout */}
        <div className="p-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full py-5 rounded-xl text-destructive border-destructive/50 hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Log out
          </Button>
        </div>

        {/* App info */}
        <div className="px-4 py-6 text-center text-xs text-muted-foreground space-y-1">
          <img
            src="/images/bonpye_logo.gif"
            alt="BIG"
            className="w-10 h-10 mx-auto mb-2 object-contain"
          />
          <p className="font-semibold">BIG v1.0.0</p>
          <p>BONPYE Internet Global</p>
          <p>By Players. For Players.</p>
        </div>
      </div>

      {/* Slide panels */}
      <AnimatePresence>
        {activePanel === "account-info" && (
          <AccountInfoPanel onClose={() => setActivePanel(null)} />
        )}
        {activePanel === "player-info" && (
          <PlayerInfoPanel onClose={() => setActivePanel(null)} />
        )}
        {activePanel === "password" && (
          <PasswordPanel onClose={() => setActivePanel(null)} />
        )}
        {activePanel === "security" && (
          <SecurityPanel onClose={() => setActivePanel(null)} />
        )}
        {activePanel === "download" && (
          <DownloadDataPanel onClose={() => setActivePanel(null)} />
        )}
        {activePanel === "notifications" && (
          <NotificationsPanel onClose={() => setActivePanel(null)} />
        )}
        {activePanel === "privacy" && (
          <PrivacyPanel onClose={() => setActivePanel(null)} />
        )}
        {activePanel === "display" && (
          <DisplayPanel onClose={() => setActivePanel(null)} />
        )}
        {activePanel === "help" && (
          <HelpPanel onClose={() => setActivePanel(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
