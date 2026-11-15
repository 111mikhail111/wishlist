
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12 text-foreground">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          ← Ко входу
        </Link>

        <div className="mt-12">
          <p className="text-sm text-muted-foreground">WISHLIST</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Новый пароль
          </h1>
          <p className="mt-3 text-muted-foreground">
            Придумай новый пароль для своего аккаунта.
          </p>
        </div>

        {success ? (
          <div className="mt-8 rounded-2xl border border-border p-6">
            <h2 className="text-lg font-medium">Пароль обновлён!</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Теперь можешь войти с новым паролем.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-block text-sm underline underline-offset-4"
            >
              Перейти ко входу →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm">Новый пароль</label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                className="h-12 w-full rounded-xl border border-border bg-transparent px-4 text-sm outline-none focus:border-foreground"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm">
                Повтори новый пароль
              </label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повтори пароль"
                className="h-12 w-full rounded-xl border border-border bg-transparent px-4 text-sm outline-none focus:border-foreground"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-foreground px-6 py-4 text-sm font-medium text-background transition hover:opacity-80 disabled:opacity-50"
            >
              {loading ? "Сохраняем..." : "Сохранить новый пароль"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
