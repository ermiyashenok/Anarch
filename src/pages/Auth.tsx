import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, User, Eye, EyeOff, Sparkles, LogIn } from "lucide-react";
import { cn } from "../lib/utils";

type AuthMode = "login" | "signup" | "guest";

interface AuthPageProps {
  onAuthSuccess: (user: { id: string; username: string; isGuest?: boolean }) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [signupForm, setSignupForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      onAuthSuccess(data.user);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (signupForm.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth?action=register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: signupForm.username,
          email: signupForm.email,
          password: signupForm.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      onAuthSuccess(data.user);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    const guestId = `guest_${Date.now()}`;
    onAuthSuccess({ id: guestId, username: "Guest", isGuest: true });
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center font-black text-brand-bg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-brand-primary/20">
              A
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-2xl tracking-tighter text-white italic leading-none">ANARCH</span>
              <span className="text-[8px] font-black tracking-[0.4em] text-brand-primary uppercase">Films & Series</span>
            </div>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-8">
          {(["login", "signup", "guest"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setMode(tab);
                setError(null);
              }}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all relative group",
                mode === tab
                  ? "bg-brand-primary text-white"
                  : "bg-white/5 text-white/30 hover:text-white hover:bg-white/10"
              )}
            >
              {tab === "login" && <LogIn className="w-4 h-4 mx-auto" />}
              {tab === "signup" && <User className="w-4 h-4 mx-auto" />}
              {tab === "guest" && <Sparkles className="w-4 h-4 mx-auto" />}
              <span className="block mt-1">{tab === "login" ? "Login" : tab === "signup" ? "Sign Up" : "Guest"}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Login Form */}
          {mode === "login" && (
            <motion.form
              key="login"
              onSubmit={handleLogin}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2 block">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary/50" />
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-primary/50 focus:bg-white/10 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary/50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-primary/50 focus:bg-white/10 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-[10px] font-medium"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-black uppercase tracking-widest py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20"
              >
                {loading ? "Logging in..." : <><LogIn size={14} /> Login</>}
              </button>
            </motion.form>
          )}

          {/* Signup Form */}
          {mode === "signup" && (
            <motion.form
              key="signup"
              onSubmit={handleSignup}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2 block">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary/50" />
                  <input
                    type="text"
                    placeholder="Choose a username"
                    value={signupForm.username}
                    onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-primary/50 focus:bg-white/10 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2 block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary/50" />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-primary/50 focus:bg-white/10 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary/50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-primary/50 focus:bg-white/10 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary/50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-primary/50 focus:bg-white/10 transition-all"
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-[10px] font-medium"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-black uppercase tracking-widest py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20"
              >
                {loading ? "Creating account..." : <><User size={14} /> Sign Up</>}
              </button>
            </motion.form>
          )}

          {/* Guest Mode */}
          {mode === "guest" && (
            <motion.div
              key="guest"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="bg-brand-primary/10 border border-brand-primary/30 rounded-lg p-6 text-center">
                <Sparkles className="w-12 h-12 text-brand-primary mx-auto mb-4" />
                <h3 className="text-white font-black uppercase tracking-widest text-sm mb-2">Guest Mode</h3>
                <p className="text-white/50 text-[12px] leading-relaxed mb-4">
                  Browse movies and series without creating an account. Your watchlist will be saved locally on this device.
                </p>
                <ul className="text-[10px] text-white/40 space-y-2 mb-6 text-left">
                  <li>✓ Browse all movies and series</li>
                  <li>✓ Local watchlist storage</li>
                  <li>✓ View trending content</li>
                  <li>✓ No account needed</li>
                </ul>
              </div>

              <button
                onClick={handleGuest}
                className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-black uppercase tracking-widest py-3 rounded-lg transition-all active:scale-95 text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20"
              >
                <Sparkles size={14} /> Continue as Guest
              </button>

              <p className="text-center text-[10px] text-white/30">
                You can create an account anytime to sync your data
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
