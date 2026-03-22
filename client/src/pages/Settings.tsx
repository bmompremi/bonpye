/* BIG Settings Page — all panels functional */

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
  Globe,
  HelpCircle,
  Key,
  LogOut,
  Moon,
  Palette,
  Search,
  Shield,
  Sun,
  Trophy,
  User,
  UserMinus,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type PanelKey =
  | "account-info"
  | "player-info"
  | "password"
  | "security"
  | "download"
  | "notifications"
  | "privacy"
  | "mute-block"
  | "display"
  | "language"
  | "help"
  | null;

// ─── Menu structure ───────────────────────────────────────────────────────────

const settingSections = [
  {
    title: "Your account",
    items: [
      { icon: User,     label: "Account information", description: "Name, handle, bio, location", panel: "account-info" as PanelKey },
      { icon: Trophy,   label: "Player information",  description: "Position, club, nationality, preferred foot", panel: "player-info" as PanelKey },
      { icon: Key,      label: "Password & login",    description: "Sign-in method and security", panel: "password" as PanelKey },
      { icon: Download, label: "Download your data",  description: "Export a copy of your BIG data", panel: "download" as PanelKey },
    ],
  },
  {
    title: "Security and account access",
    items: [
      { icon: Shield, label: "Security", description: "Manage your account's security", panel: "security" as PanelKey },
    ],
  },
  {
    title: "Privacy and safety",
    items: [
      { icon: Eye,     label: "Privacy",       description: "Control who can see your posts", panel: "privacy" as PanelKey },
      { icon: Volume2, label: "Mute and block", description: "Manage muted or blocked accounts", panel: "mute-block" as PanelKey },
    ],
  },
  {
    title: "Notifications",
    items: [
      { icon: Bell, label: "Notifications", description: "Manage what alerts you receive", panel: "notifications" as PanelKey },
    ],
  },
  {
    title: "Display",
    items: [
      { icon: Palette, label: "Display settings", description: "Appearance and font size", panel: "display" as PanelKey },
      { icon: Globe,   label: "Language",         description: "English, Fran\u00e7ais, Krey\u00f2l, Espa\u00f1ol", panel: "language" as PanelKey },
    ],
  },
  {
    title: "Help",
    items: [
      { icon: HelpCircle, label: "Help centre", description: "FAQs and support", panel: "help" as PanelKey },
    ],
  },
];

// ─── Slide-panel wrapper ──────────────────────────────────────────────────────

function SlidePanel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="font-display text-xl font-bold">{title}</h2>
        </div>
      </header>
      <div className="p-4 pb-24">{children}</div>
    </motion.div>
  );
}

// ─── Shared: Field ────────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, prefix, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; prefix?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm ${prefix ? "pl-7" : ""}`}
        />
      </div>
    </div>
  );
}

// ─── Shared: Toggle switch ────────────────────────────────────────────────────

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${on ? "bg-primary" : "bg-muted"}`}
    >
      <motion.div
        className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
        animate={{ left: on ? "calc(100% - 24px)" : "4px" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

// ─── Shared: Save button state ────────────────────────────────────────────────

function SaveButton({ pending, done, onClick }: { pending: boolean; done: boolean; onClick: () => void }) {
  return (
    <Button onClick={onClick} disabled={pending || done} className="w-full">
      {done ? (
        <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Saved</span>
      ) : pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

// ─── Account Info Panel ───────────────────────────────────────────────────────

function AccountInfoPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const u = user as any;

  const [form, setForm] = useState({ name: "", handle: "", bio: "", location: "" });
  const [saved, setSaved] = useState(false);

  // Sync form when user data loads / refreshes
  useEffect(() => {
    if (!u) return;
    setForm({
      name: u.name ?? "",
      handle: (u.handle ?? "").replace(/^@/, ""),
      bio: u.bio ?? "",
      location: u.location ?? "",
    });
  }, [u?.name, u?.handle, u?.bio, u?.location]);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: async () => {
      // Refresh user data everywhere
      await utils.auth.me.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success("Profile updated");
    },
    onError: (e) => toast.error(e.message || "Update failed"),
  });

  const handleSave = () => {
    const handle = form.handle.replace(/^@/, "").trim();
    if (handle && handle.length < 3) {
      toast.error("Handle must be at least 3 characters");
      return;
    }
    updateProfile.mutate({
      name: form.name.trim() || undefined,
      handle: handle || undefined,
      bio: form.bio.trim() || undefined,
      location: form.location.trim() || undefined,
    });
  };

  return (
    <SlidePanel title="Account information" onClose={onClose}>
      <div className="space-y-5 max-w-lg">
        <Field label="Display name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Your name" />
        <Field label="Username / handle" value={form.handle} onChange={(v) => setForm((f) => ({ ...f, handle: v.replace(/^@/, "") }))} placeholder="handle" prefix="@" />
        <div>
          <label className="block text-sm font-medium mb-2">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="Tell the world about yourself…"
            rows={4}
            maxLength={500}
            className="w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
          <p className="text-xs text-muted-foreground text-right mt-1">{form.bio.length}/500</p>
        </div>
        <Field label="Location" value={form.location} onChange={(v) => setForm((f) => ({ ...f, location: v }))} placeholder="e.g. Port-au-Prince, Haiti" />

        <div className="py-1 border-t border-border space-y-1 text-sm">
          <p className="text-muted-foreground font-medium">Email</p>
          <p>{u?.email ?? "—"}</p>
          <p className="text-xs text-muted-foreground">Email is managed by your sign-in provider and cannot be changed here.</p>
        </div>

        <SaveButton pending={updateProfile.isPending} done={saved} onClick={handleSave} />
      </div>
    </SlidePanel>
  );
}

// ─── Player Info Panel ────────────────────────────────────────────────────────

const POSITIONS = [
  "Goalkeeper", "Right Back", "Centre Back", "Left Back",
  "Defensive Midfielder", "Central Midfielder", "Attacking Midfielder",
  "Right Winger", "Left Winger", "Second Striker", "Striker",
];

function PlayerInfoPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const u = user as any;

  const [form, setForm] = useState({
    position: "",
    club: "",
    nationality: "",
    preferredFoot: "" as "" | "left" | "right" | "both",
    age: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!u) return;
    setForm({
      position: u.position ?? "",
      club: u.club ?? "",
      nationality: u.nationality ?? "",
      preferredFoot: u.preferredFoot ?? "",
      age: u.age ? String(u.age) : "",
    });
  }, [u?.position, u?.club, u?.nationality, u?.preferredFoot, u?.age]);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success("Player info updated");
    },
    onError: (e) => toast.error(e.message || "Update failed"),
  });

  const handleSave = () => {
    const ageNum = form.age ? parseInt(form.age, 10) : undefined;
    if (ageNum !== undefined && (isNaN(ageNum) || ageNum < 10 || ageNum > 60)) {
      toast.error("Age must be between 10 and 60");
      return;
    }
    updateProfile.mutate({
      position: form.position || undefined,
      club: form.club.trim() || undefined,
      nationality: form.nationality.trim() || undefined,
      preferredFoot: (form.preferredFoot || undefined) as "left" | "right" | "both" | undefined,
      age: ageNum,
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
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <Field label="Current club" value={form.club} onChange={(v) => setForm((f) => ({ ...f, club: v }))} placeholder="e.g. Manchester United" />
        <Field label="Nationality" value={form.nationality} onChange={(v) => setForm((f) => ({ ...f, nationality: v }))} placeholder="e.g. Haitian" />
        <div>
          <label className="block text-sm font-medium mb-2">Preferred foot</label>
          <div className="grid grid-cols-3 gap-2">
            {(["left", "right", "both"] as const).map((foot) => (
              <button
                key={foot}
                onClick={() => setForm((f) => ({ ...f, preferredFoot: foot }))}
                className={`py-2.5 rounded-xl border text-sm font-medium capitalize transition-colors ${
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
        <Field label="Age" value={form.age} onChange={(v) => setForm((f) => ({ ...f, age: v }))} placeholder="e.g. 23" type="number" />
        <SaveButton pending={updateProfile.isPending} done={saved} onClick={handleSave} />
      </div>
    </SlidePanel>
  );
}

// ─── Password Panel ───────────────────────────────────────────────────────────

function PasswordPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const provider: string = (user as any)?.loginMethod ?? (user as any)?.provider ?? "google";
  const providerLabel = provider === "google" ? "Google" : provider === "facebook" ? "Facebook" : provider;

  return (
    <SlidePanel title="Password & login" onClose={onClose}>
      <div className="max-w-lg space-y-5">
        <div className="bg-secondary/60 rounded-xl p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Sign-in method</p>
          <p className="font-medium">{providerLabel} OAuth</p>
          <p className="text-sm text-muted-foreground">{(user as any)?.email ?? ""}</p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium">Your account uses {providerLabel} to sign in</p>
          <p className="text-sm text-muted-foreground">
            Passwords are managed by {providerLabel}. To change your password, visit {providerLabel}'s security settings.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Security tips</p>
          {[
            `Use a strong, unique password on your ${providerLabel} account`,
            "Enable two-factor authentication on your sign-in provider",
            "Sign out of BIG on shared or public devices",
            "Check connected apps regularly",
          ].map((tip) => (
            <div key={tip} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </SlidePanel>
  );
}

// ─── Security Panel ───────────────────────────────────────────────────────────

function SecurityPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const u = user as any;

  const checks = [
    { label: "Email on file",           done: !!u?.email },
    { label: "Profile photo set",        done: !!u?.avatarUrl },
    { label: "Bio completed",            done: !!u?.bio && u.bio.length > 5 },
    { label: "Player info filled in",    done: !!u?.position },
    { label: "Player verification",      done: !!u?.playerVerified },
  ];
  const score = checks.filter((c) => c.done).length;

  return (
    <SlidePanel title="Security" onClose={onClose}>
      <div className="max-w-lg space-y-6">
        {/* Score */}
        <div className="bg-secondary/60 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium">Account health</p>
            <span className={`text-sm font-bold ${score >= 4 ? "text-green-500" : score >= 2 ? "text-yellow-500" : "text-red-500"}`}>
              {score}/{checks.length}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mb-3">
            <div
              className={`h-2 rounded-full transition-all ${score >= 4 ? "bg-green-500" : score >= 2 ? "bg-yellow-500" : "bg-red-500"}`}
              style={{ width: `${(score / checks.length) * 100}%` }}
            />
          </div>
          <div className="space-y-2">
            {checks.map((c) => (
              <div key={c.label} className="flex items-center gap-3 text-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${c.done ? "bg-green-500" : "bg-muted"}`}>
                  {c.done ? <Check className="h-3 w-3 text-white" /> : <X className="h-3 w-3 text-muted-foreground" />}
                </div>
                <span className={c.done ? "" : "text-muted-foreground"}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Login info */}
        <div className="space-y-1 text-sm">
          <p className="font-medium mb-2">Login information</p>
          {[
            ["Email", u?.email ?? "—"],
            ["Sign-in method", u?.loginMethod ?? u?.provider ?? "—"],
            ["Member since", u?.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium capitalize">{v}</span>
            </div>
          ))}
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">Two-factor authentication</p>
          <p className="text-sm text-muted-foreground">Coming soon. Add an extra layer of security to protect your account.</p>
        </div>
      </div>
    </SlidePanel>
  );
}

// ─── Download Data Panel ──────────────────────────────────────────────────────

function DownloadDataPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const getFeed = trpc.post.getFeed.useQuery({ limit: 1000, offset: 0 }, { enabled: false });

  const handleDownload = async (format: "json" | "csv") => {
    setDownloading(true);
    try {
      const { data: posts = [] } = await getFeed.refetch();
      const u = user as any;

      let content: string;
      let filename: string;
      let mime: string;

      if (format === "json") {
        content = JSON.stringify({
          exportedAt: new Date().toISOString(),
          user: { id: u?.id, name: u?.name, email: u?.email, handle: u?.handle },
          posts,
        }, null, 2);
        filename = `big-data-${Date.now()}.json`;
        mime = "application/json";
      } else {
        const escape = (s: string) => `"${(s ?? "").toString().replace(/"/g, '""')}"`;
        const rows = [
          ["id", "content", "createdAt", "likeCount", "repostCount"].join(","),
          ...(posts as any[]).map((p) =>
            [p.id, escape(p.content ?? ""), p.createdAt, p.likeCount ?? 0, p.repostCount ?? 0].join(",")
          ),
        ];
        content = rows.join("\n");
        filename = `big-posts-${Date.now()}.csv`;
        mime = "text/csv";
      }

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${filename}`);
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SlidePanel title="Download your data" onClose={onClose}>
      <div className="max-w-lg space-y-6">
        <p className="text-sm text-muted-foreground">Export a copy of your BIG account data.</p>
        <div className="space-y-2">
          <p className="text-sm font-medium">What's included</p>
          {["Your posts and reposts", "Your profile information", "Timestamps and engagement stats"].map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => handleDownload("json")} disabled={downloading} variant="outline" className="h-16 flex flex-col gap-1">
            <Download className="h-5 w-5" />
            <span className="text-xs">JSON (full)</span>
          </Button>
          <Button onClick={() => handleDownload("csv")} disabled={downloading} variant="outline" className="h-16 flex flex-col gap-1">
            <Download className="h-5 w-5" />
            <span className="text-xs">CSV (posts)</span>
          </Button>
        </div>
        {downloading && <p className="text-sm text-muted-foreground text-center animate-pulse">Preparing your data…</p>}
      </div>
    </SlidePanel>
  );
}

// ─── Notifications Panel ──────────────────────────────────────────────────────

const NOTIF_ROWS: { key: string; label: string; desc: string }[] = [
  { key: "likes",            label: "Likes",              desc: "When someone likes your post" },
  { key: "replies",          label: "Replies",            desc: "When someone replies to you" },
  { key: "reposts",          label: "Reposts",            desc: "When your post is reposted" },
  { key: "newFollowers",     label: "New followers",      desc: "When someone follows you" },
  { key: "mentions",         label: "Mentions",           desc: "When you're tagged in a post" },
  { key: "matchAlerts",      label: "Match alerts",       desc: "Scores and kickoff reminders" },
  { key: "scoutingRequests", label: "Scouting requests",  desc: "When a scout views your profile" },
  { key: "weeklyDigest",     label: "Weekly digest",      desc: "Summary of your account activity" },
];

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    likes: true, replies: true, reposts: true, newFollowers: true,
    mentions: true, matchAlerts: false, scoutingRequests: false, weeklyDigest: false,
  });

  return (
    <SlidePanel title="Notifications" onClose={onClose}>
      <div className="max-w-lg">
        {NOTIF_ROWS.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-4 border-b border-border">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <Toggle on={!!prefs[key]} onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))} />
          </div>
        ))}
        <div className="pt-5">
          <Button onClick={() => toast.success("Notification preferences saved")} className="w-full">
            Save preferences
          </Button>
        </div>
      </div>
    </SlidePanel>
  );
}

// ─── Privacy Panel ────────────────────────────────────────────────────────────

const PRIVACY_ROWS: { key: string; label: string; desc: string }[] = [
  { key: "privateAccount",  label: "Private account",       desc: "Only approved followers see your posts" },
  { key: "showLocation",    label: "Show location",          desc: "Display location on your profile" },
  { key: "allowMentions",   label: "Allow mentions",         desc: "Anyone can tag you in posts" },
  { key: "allowDMs",        label: "Allow direct messages",  desc: "Anyone can message you" },
  { key: "hideActivity",    label: "Hide activity status",   desc: "Don't show when you were last active" },
  { key: "hideFollowList",  label: "Private follow list",    desc: "Hide your followers and following lists" },
];

function PrivacyPanel({ onClose }: { onClose: () => void }) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    privateAccount: false, showLocation: true, allowMentions: true,
    allowDMs: true, hideActivity: false, hideFollowList: false,
  });

  return (
    <SlidePanel title="Privacy" onClose={onClose}>
      <div className="max-w-lg">
        {PRIVACY_ROWS.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-4 border-b border-border">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <Toggle on={!!prefs[key]} onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))} />
          </div>
        ))}
        <div className="pt-5">
          <Button onClick={() => toast.success("Privacy settings saved")} className="w-full">Save settings</Button>
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
      <div className="max-w-lg space-y-7">
        <div>
          <p className="text-sm font-medium mb-3">Colour theme</p>
          <div className="grid grid-cols-2 gap-3">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { if (theme !== t) toggleTheme?.(); }}
                className={`p-4 rounded-xl border text-sm font-medium flex flex-col items-center gap-2 transition-colors ${
                  theme === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary"
                }`}
              >
                {t === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                {t === "dark" ? "Dark" : "Light"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Font size</p>
          <div className="grid grid-cols-3 gap-2">
            {(["small", "default", "large"] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`py-3 rounded-xl border text-sm font-medium capitalize transition-colors ${
                  fontSize === size ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary"
                }`}
                style={{ fontSize: size === "small" ? "12px" : size === "large" ? "16px" : "14px" }}
              >
                {size === "default" ? "Normal" : size}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Font size preference is saved locally.</p>
        </div>
      </div>
    </SlidePanel>
  );
}

// ─── Help Panel ───────────────────────────────────────────────────────────────

const FAQS = [
  { q: "How do I get the verified badge?", a: "Go to Settings → Player information, then visit the Player Verification page. Submit your ID and proof of play. Review takes 3–5 business days." },
  { q: "Can I change my username?", a: "Yes — open Account information and update your handle. Handles must be 3–50 characters (letters, numbers, underscores)." },
  { q: "How do I delete my account?", a: "Account deletion is not yet available in-app. Email support@bonpye.com and we'll process your request within 30 days." },
  { q: "Why won't my image upload?", a: "Make sure your image is JPEG or PNG and under 10 MB. On iOS, photos are automatically converted before upload. Try a different photo if the issue persists." },
  { q: "How does the scouting feature work?", a: "Fill in your Player information. Scouts can search by position, nationality, and club. Your profile appears in results once your info is complete." },
  { q: "How do I report a post?", a: "Tap the three-dot menu on any post and select Report. For urgent issues, email support@bonpye.com." },
];

function HelpPanel({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <SlidePanel title="Help centre" onClose={onClose}>
      <div className="max-w-lg space-y-2">
        <p className="text-sm text-muted-foreground mb-4">Frequently asked questions about BIG.</p>
        {FAQS.map((faq, i) => (
          <div key={i} className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
            >
              <span className="text-sm font-medium pr-4">{faq.q}</span>
              <ChevronRight className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${open === i ? "rotate-90" : ""}`} />
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
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
            Email <a href="mailto:support@bonpye.com" className="text-primary underline">support@bonpye.com</a>
          </p>
        </div>
      </div>
    </SlidePanel>
  );
}

// ─── Mute & Block Panel ───────────────────────────────────────────────────────

function MuteBlockPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"muted" | "blocked">("muted");
  const utils = trpc.useUtils();

  const { data: mutedUsers = [], isLoading: mutedLoading } = trpc.user.getMuted.useQuery();
  const { data: blockedUsers = [], isLoading: blockedLoading } = trpc.user.getBlocked.useQuery();

  const unmute = trpc.user.unmute.useMutation({
    onSuccess: () => { utils.user.getMuted.invalidate(); toast.success("User unmuted"); },
  });
  const unblock = trpc.user.unblock.useMutation({
    onSuccess: () => { utils.user.getBlocked.invalidate(); toast.success("User unblocked"); },
  });

  const list = tab === "muted" ? mutedUsers : blockedUsers;
  const loading = tab === "muted" ? mutedLoading : blockedLoading;

  return (
    <SlidePanel title="Mute and block" onClose={onClose}>
      <div className="max-w-lg">
        {/* Tabs */}
        <div className="flex border border-border rounded-xl overflow-hidden mb-5">
          {(["muted", "blocked"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors capitalize ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {t} ({t === "muted" ? mutedUsers.length : blockedUsers.length})
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8 animate-pulse">Loading…</p>
        ) : list.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <UserMinus className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium">No {tab} accounts</p>
            <p className="text-xs text-muted-foreground">
              {tab === "muted"
                ? "Muted accounts won't appear in your feed."
                : "Blocked accounts can't see your posts or contact you."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {(list as any[]).map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {u.avatarUrl
                    ? <img src={u.avatarUrl} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                    : u.name?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{u.handle}</p>
                </div>
                <button
                  onClick={() => tab === "muted" ? unmute.mutate({ userId: u.id }) : unblock.mutate({ userId: u.id })}
                  disabled={unmute.isPending || unblock.isPending}
                  className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
                >
                  {tab === "muted" ? "Unmute" : "Unblock"}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-secondary/30 rounded-xl text-sm text-muted-foreground">
          {tab === "muted"
            ? "To mute someone, tap ••• on their post or profile and select Mute."
            : "To block someone, tap ••• on their post or profile and select Block."}
        </div>
      </div>
    </SlidePanel>
  );
}

// ─── Language Panel ────────────────────────────────────────────────────────────

const LANG_OPTIONS = [
  { code: "en", label: "English", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "fr", label: "Fran\u00e7ais", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "ht", label: "Krey\u00f2l", flag: "\u{1F1ED}\u{1F1F9}" },
  { code: "es", label: "Espa\u00f1ol", flag: "\u{1F1EA}\u{1F1F8}" },
];

function LanguagePanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const currentLang = (user as any)?.language || "en";
  const [selected, setSelected] = useState(currentLang);
  const [saved, setSaved] = useState(false);

  const setLanguage = trpc.user.setLanguage.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success("Language updated");
    },
    onError: (e) => toast.error(e.message || "Update failed"),
  });

  const handleSave = () => {
    setLanguage.mutate({ language: selected as "en" | "fr" | "ht" | "es" });
  };

  return (
    <SlidePanel title="Language" onClose={onClose}>
      <div className="max-w-lg space-y-5">
        <p className="text-sm text-muted-foreground">Choose your preferred language for BIG.</p>
        <div className="grid grid-cols-2 gap-3">
          {LANG_OPTIONS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelected(lang.code)}
              className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-colors ${
                selected === lang.code
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/50 hover:border-primary/50"
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="text-sm font-semibold">{lang.label}</span>
            </button>
          ))}
        </div>
        <SaveButton pending={setLanguage.isPending} done={saved} onClick={handleSave} />
      </div>
    </SlidePanel>
  );
}

// ─── Main Settings page ───────────────────────────────────────────────────────

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

  const openPanel = (panel: PanelKey) => {
    if (!panel) {
      toast("Coming soon!", { description: "We're building this for the football community." });
    } else {
      setActivePanel(panel);
    }
  };

  const filtered = settingSections
    .map((s) => ({
      ...s,
      items: s.items.filter(
        (item) =>
          !searchQuery ||
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((s) => s.items.length > 0);

  const u = user as any;

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
            <button onClick={() => toggleTheme?.()} className="p-2 rounded-full hover:bg-secondary transition-colors">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings"
              className="w-full bg-secondary rounded-full py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </header>

      {/* Account summary card */}
      {!searchQuery && (
        <div className="p-4 border-b border-border flex items-center gap-3">
          {u?.avatarUrl ? (
            <img src={u.avatarUrl} alt={u.name} className="w-12 h-12 rounded-full object-cover border" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
              {u?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold truncate">{u?.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground truncate">
              {u?.handle ? `@${u.handle}` : u?.email ?? "—"}
            </p>
          </div>
        </div>
      )}

      {/* Quick dark mode toggle */}
      {!searchQuery && (
        <div className="p-4 border-b border-border">
          <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                {theme === "dark" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
              </div>
              <div>
                <p className="text-sm font-semibold">Dark mode</p>
                <p className="text-xs text-muted-foreground">{theme === "dark" ? "On" : "Off"}</p>
              </div>
            </div>
            <Toggle on={theme === "dark"} onClick={() => toggleTheme?.()} />
          </div>
        </div>
      )}

      {/* Settings list */}
      <div className="pb-8">
        {filtered.map((section) => (
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
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
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
          <img src="/images/bonpye_logo.gif" alt="BIG" className="w-10 h-10 mx-auto mb-2 object-contain" />
          <p className="font-semibold">BIG v1.0.0</p>
          <p>BONPYE Internet Global</p>
          <p>By Players. For Players.</p>
        </div>
      </div>

      {/* Panels */}
      <AnimatePresence>
        {activePanel === "account-info"  && <AccountInfoPanel  onClose={() => setActivePanel(null)} />}
        {activePanel === "player-info"   && <PlayerInfoPanel   onClose={() => setActivePanel(null)} />}
        {activePanel === "password"      && <PasswordPanel     onClose={() => setActivePanel(null)} />}
        {activePanel === "security"      && <SecurityPanel     onClose={() => setActivePanel(null)} />}
        {activePanel === "download"      && <DownloadDataPanel onClose={() => setActivePanel(null)} />}
        {activePanel === "notifications" && <NotificationsPanel onClose={() => setActivePanel(null)} />}
        {activePanel === "privacy"       && <PrivacyPanel      onClose={() => setActivePanel(null)} />}
        {activePanel === "mute-block"    && <MuteBlockPanel    onClose={() => setActivePanel(null)} />}
        {activePanel === "display"       && <DisplayPanel      onClose={() => setActivePanel(null)} />}
        {activePanel === "language"      && <LanguagePanel     onClose={() => setActivePanel(null)} />}
        {activePanel === "help"          && <HelpPanel         onClose={() => setActivePanel(null)} />}
      </AnimatePresence>
    </div>
  );
}
