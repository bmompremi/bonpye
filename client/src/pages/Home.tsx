/* BONPYE Home - Landing Page
 * Like Twitter/X login page - simple and focused
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import { Moon, Sun, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();

  // Redirect to feed if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      setLocation("/feed");
    }
  }, [loading, isAuthenticated, user, setLocation]);

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  const handleComingSoon = () => {
    toast("Feature coming soon!", {
      description: "We're building this for the football community.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-3 rounded-full bg-secondary hover:bg-secondary/80 transition-colors z-50"
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="min-h-screen flex flex-col lg:flex-row w-full max-w-full">
        {/* Left Side - Hero Image/Logo */}
        <div className="lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-16 bg-black relative overflow-hidden min-h-[35vh] lg:min-h-screen">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: "url('/images/hero_football.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
          
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex flex-col items-center"
          >
            <img
              src="/images/bonpye_logo.gif"
              alt="BONPYE"
              className="w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 object-contain"
            />
            <h2 className="font-display text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-widest mt-2">
              BONPYE<sup className="text-xs sm:text-sm align-super">™</sup>
            </h2>
          </motion.div>
        </div>

        {/* Right Side - Auth */}
        <div className="lg:w-1/2 flex items-center justify-center px-4 py-6 sm:p-8 lg:p-16 w-full overflow-hidden">
          <div className="w-full max-w-md overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="font-display text-2xl leading-tight sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 break-words">
                Own your football identity.
              </h1>
              <h2 className="font-display text-base leading-tight sm:text-xl md:text-3xl font-bold mb-6 sm:mb-8 break-words">
                Join the global football community on BONPYE.
              </h2>

              {/* Sign Up Options */}
              <div className="space-y-3 mb-8">
                <Button
                  onClick={handleLogin}
                  variant="outline"
                  className="w-full py-6 rounded-full font-semibold text-base flex items-center justify-center gap-2"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </Button>

                <Button
                  onClick={handleComingSoon}
                  variant="outline"
                  className="w-full py-6 rounded-full font-semibold text-base flex items-center justify-center gap-2"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Sign up with X
                </Button>

                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-muted-foreground text-sm">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <Button
                  onClick={handleLogin}
                  className="w-full py-6 rounded-full font-bold text-base bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Create account
                </Button>

                <p className="text-xs text-muted-foreground mt-2">
                  By signing up, you agree to the{" "}
                  <button onClick={handleComingSoon} className="text-primary hover:underline">Terms of Service</button>
                  {" "}and{" "}
                  <button onClick={handleComingSoon} className="text-primary hover:underline">Privacy Policy</button>
                  , including{" "}
                  <button onClick={handleComingSoon} className="text-primary hover:underline">Cookie Use</button>.
                </p>
              </div>

              {/* Sign In */}
              <div className="mt-12">
                <h3 className="font-bold text-lg mb-4">Already have an account?</h3>
                <Button
                  onClick={handleLogin}
                  variant="outline"
                  className="w-full py-6 rounded-full font-bold text-base text-primary border-border hover:bg-primary/10"
                >
                  Sign in
                </Button>
              </div>

            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 px-8 border-t border-border">
        <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          {["About", "Help Center", "Terms of Service", "Privacy Policy", "Cookie Policy", "Accessibility", "Blog", "Careers"].map((link) => (
            <button key={link} onClick={handleComingSoon} className="hover:underline">
              {link}
            </button>
          ))}
          <span>© 2026 BONPYE</span>
        </div>
      </footer>
    </div>
  );
}
