import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { useState } from "react";
import { useLocation } from "wouter";

const LANGUAGES = [
  { code: "en" as const, label: "English", flag: "\u{1F1FA}\u{1F1F8}", native: "English" },
  { code: "fr" as const, label: "Fran\u00e7ais", flag: "\u{1F1EB}\u{1F1F7}", native: "Fran\u00e7ais" },
  { code: "ht" as const, label: "Krey\u00f2l", flag: "\u{1F1ED}\u{1F1F9}", native: "Krey\u00f2l Ayisyen" },
  { code: "es" as const, label: "Espa\u00f1ol", flag: "\u{1F1EA}\u{1F1F8}", native: "Espa\u00f1ol" },
];

export default function Welcome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<string | null>(null);

  const setLanguage = trpc.user.setLanguage.useMutation({
    onSuccess: () => setLocation("/feed"),
  });

  const handleSelect = (code: "en" | "fr" | "ht" | "es") => {
    setSelected(code);
    setLanguage.mutate({ language: code });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md text-center"
      >
        {/* Logo */}
        <img
          src="/images/bonpye_logo.gif"
          alt="BONPYE"
          className="w-20 h-20 mx-auto mb-4 object-contain"
        />

        <h1 className="font-display text-2xl font-bold mb-1">
          Welcome{user ? `, ${(user as any).name?.split(" ")[0] || "Player"}` : ""}!
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Choose your preferred language
        </p>

        {/* Language cards */}
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map((lang) => (
            <motion.button
              key={lang.code}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(lang.code)}
              disabled={setLanguage.isPending}
              className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-colors ${
                selected === lang.code
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/50 hover:border-primary/50"
              } ${setLanguage.isPending ? "opacity-60" : ""}`}
            >
              <span className="text-3xl">{lang.flag}</span>
              <span className="text-sm font-semibold">{lang.label}</span>
              <span className="text-xs text-muted-foreground">{lang.native}</span>
            </motion.button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          You can change this later in Settings
        </p>
      </motion.div>
    </div>
  );
}
