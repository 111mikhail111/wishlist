
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Неверный email или пароль."
          : error.message
      );
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profileError && profile?.role === "owner") {
      router.replace("/admin");
    } else {
      router.replace("/wishlist");
    }

    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12 text-foreground">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          ← На главную
        </Link>

        <div className="mt-12">
          <p className="text-sm text-muted-foreground">WISHLIST</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            С возвращением
          </h1>
          <p className="mt-3 text-muted-foreground">
            Войди в аккаунт, чтобы бронировать желания.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="h-12 w-full rounded-xl border border-border bg-transparent px-4 text-sm outline-none focus:border-foreground"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm">Пароль</label>
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground underline underline-offset-4 transition hover:text-foreground"
              >
                Забыли пароль?
              </Link>
            </div>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Твой пароль"
              className="h-12 w-full rounded-xl border border-border bg-transparent px-4 text-sm outline-none focus:border-foreground"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-foreground px-6 py-4 text-sm font-medium text-background transition hover:opacity-80 disabled:opacity-50"
          >
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Нет аккаунта?{" "}
          <Link
            href="/register"
            className="text-foreground underline underline-offset-4"
          >
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </main>
  );
}
