import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type ThemeMode = "light" | "dark" | "system";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    prefersDark ? root.classList.add("dark") : root.classList.remove("dark");
  } else if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeToggle() {
  const { user } = useAuth();
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const saved = localStorage.getItem("theme-preference") as ThemeMode | null;
    return saved || (document.documentElement.classList.contains("dark") ? "dark" : "light");
  });

  // Load from profile on login
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("theme_preference")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.theme_preference) {
          const pref = data.theme_preference as ThemeMode;
          setMode(pref);
          localStorage.setItem("theme-preference", pref);
          applyTheme(pref);
        }
      });
  }, [user]);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (mode !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [mode]);

  const cycle = () => {
    const order: ThemeMode[] = ["light", "dark", "system"];
    const next = order[(order.indexOf(mode) + 1) % order.length];
    setMode(next);
    localStorage.setItem("theme-preference", next);

    // Save to profile if logged in
    if (user) {
      supabase
        .from("profiles")
        .update({ theme_preference: next } as any)
        .eq("user_id", user.id)
        .then(() => {});
    }
  };

  const Icon = mode === "dark" ? Sun : mode === "light" ? Moon : Monitor;

  return (
    <Button variant="ghost" size="icon" onClick={cycle} className="h-8 w-8" title={`Theme: ${mode}`}>
      <Icon className="h-4 w-4" />
    </Button>
  );
}
