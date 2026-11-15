
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/wishlist");
      router.refresh();
      return;
    }

    setSuccess(true);
    setLoading(false);
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
            Создать аккаунт
          </h1>
          <p className="mt-3 text-muted-foreground">
            Зарегистрируйся, чтобы бронировать желания.
          </p>
        </div>

        {success ? (
          <div className="mt-8 rounded-2xl border border-border p-6">
            <h2 className="text-lg font-medium">Почти готово!</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Мы отправили письмо на {email}. Перейди по ссылке в письме,
              чтобы подтвердить регистрацию.
            </p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="mt-8 space-y-5">
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

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-foreground px-6 py-4 text-sm font-medium text-background transition hover:opacity-80 disabled:opacity-50"
            >
              {loading ? "Создаём аккаунт..." : "Зарегистрироваться"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link
            href="/login"
            className="text-foreground underline underline-offset-4"
          >
            Войти
          </Link>
        </p>
      </div>
    </main>
  );
}
