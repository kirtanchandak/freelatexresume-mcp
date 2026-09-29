"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Auth form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        // Reset form errors
        setAuthError(null);
        setAuthMessage(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthMessage(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setMenuOpen(false);
      setEmail("");
      setPassword("");
    }
    setAuthLoading(false);
  };

  const handleSignUp = async () => {
    setAuthLoading(true);
    setAuthError(null);
    setAuthMessage(null);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
    } else if (data.session) {
      // Direct login successful (email confirmation is disabled)
      setMenuOpen(false);
      setEmail("");
      setPassword("");
    } else {
      // Fallback just in case email confirmation is still enabled
      setAuthMessage("Check your email for the confirmation link.");
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-700" />
    );
  }

  if (!user) {
    return (
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
          </svg>
          Sign in
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-zinc-700 bg-zinc-800 p-3 shadow-xl">
            <form onSubmit={handleSignIn} className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-zinc-200 mb-1">Account Login</p>
              
              <input
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-green-500 focus:outline-none"
              />
              
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-green-500 focus:outline-none"
              />

              {authError && <p className="text-[10px] text-red-400">{authError}</p>}
              {authMessage && <p className="text-[10px] text-green-400">{authMessage}</p>}

              <div className="flex gap-2 mt-1">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="flex-1 rounded-md bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-600 disabled:opacity-50 transition-colors"
                >
                  {authLoading ? "..." : "Sign in"}
                </button>
                <button
                  type="button"
                  onClick={handleSignUp}
                  disabled={authLoading || !email || !password}
                  className="flex-1 rounded-md border border-zinc-700 bg-transparent px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-colors"
                >
                  Sign up
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors hover:bg-zinc-700"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-5 w-5 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[10px] font-bold text-white">
            {displayName[0].toUpperCase()}
          </div>
        )}
        <span className="text-xs text-zinc-400 max-w-[100px] truncate hidden sm:inline">{displayName}</span>
        <svg className="h-3 w-3 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-xl">
          <div className="border-b border-zinc-700 px-3 py-2">
            <p className="text-xs font-medium text-zinc-200 truncate">{displayName}</p>
            <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
