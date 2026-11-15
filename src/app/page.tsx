
"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Gift,
  Moon,
  Sun,
  Heart,
  LogIn,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import LogoutButton from "@/components/logout-button";

type SiteSettings = {
  site_title: string;
  hero_badge: string;
  hero_title: string;
  hero_title_secondary: string;
  hero_description: string;
  hero_button: string;
  footer_text: string;
  default_theme: "dark" | "light";
};

const defaultSettings: SiteSettings = {
  site_title: "wishlist",
  hero_badge: "Маленькие мечты — большие радости",
  hero_title: "Все желания",
  hero_title_secondary: "в одном месте.",
  hero_description:
    "Здесь собраны вещи, о которых я мечтаю. Выбирайте то, что хотите подарить, а я буду знать, что мои желания не останутся незамеченными.",
  hero_button: "Посмотреть желания",
  footer_text: "Сделано с любовью к мечтам",
  default_theme: "dark",
};

export default function Home() {
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const supabase = createClient();

    async function loadSettings() {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) {
        console.error("Settings loading error:", error);
        return;
      }

      if (data) {
        setSettings({
          site_title: data.site_title,
          hero_badge: data.hero_badge,
          hero_title: data.hero_title,
          hero_title_secondary: data.hero_title_secondary,
          hero_description: data.hero_description,
          hero_button: data.hero_button,
          footer_text: data.footer_text,
          default_theme: data.default_theme,
        });

        setTheme(data.default_theme);
      }
    }

    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsAuthenticated(!!user);
      setAuthChecked(true);
    }

    loadSettings();
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
      setAuthChecked(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setTheme]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-semibold tracking-tight"
        >
          <Gift size={23} />
          {settings.site_title}
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/wishlist"
            className="hidden text-sm text-muted-foreground transition hover:text-foreground sm:block"
          >
            Мои желания
          </Link>

          {authChecked &&
            (isAuthenticated ? (
              <LogoutButton />
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm transition hover:bg-muted"
              >
                <LogIn size={16} />
                Войти
              </Link>
            ))}

          <button
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
            className="rounded-full border border-border p-2.5 transition hover:bg-muted"
            aria-label="Переключить тему"
          >
            {mounted && theme === "dark" ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>
        </div>
      </header>

      <section className="mx-auto flex min-h-[75vh] max-w-7xl flex-col items-center justify-center px-6 pb-24 text-center">
        <div className="mb-8 flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
          <Heart size={15} />
          <span>{settings.hero_badge}</span>
        </div>

        <h1 className="max-w-4xl text-5xl font-semibold leading-[1.1] tracking-tight sm:text-7xl">
          {settings.hero_title}
          <br />
          <span className="text-muted-foreground">
            {settings.hero_title_secondary}
          </span>
        </h1>

        <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          {settings.hero_description}
        </p>

        <Link
          href="/wishlist"
          className="mt-10 inline-flex items-center gap-3 rounded-full bg-foreground px-7 py-4 text-sm font-medium text-background transition hover:opacity-80"
        >
          {settings.hero_button}
          <ArrowRight size={18} />
        </Link>

        <p className="mt-6 text-xs text-muted-foreground">
          {settings.footer_text}
        </p>
      </section>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        {settings.site_title} © 2026
      </footer>
    </main>
  );
}
