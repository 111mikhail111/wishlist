
"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
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
          ← Вернуться ко входу
        </Link>

        <div className="mt-12">
          <p className="text-sm text-muted-foreground">WISHLIST</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Забыли пароль?
          </h1>
          <p className="mt-3 text-muted-foreground">
            Укажи email — мы отправим ссылку для создания нового пароля.
          </p>
        </div>

        {success ? (
          <div className="mt-8 rounded-2xl border border-border p-6">
            <h2 className="text-lg font-medium">Письмо отправлено!</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Если аккаунт с адресом {email} существует, на него придёт
              письмо со ссылкой для восстановления пароля. Проверь также
              папку «Спам».
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="mt-8 space-y-5">
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

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-foreground px-6 py-4 text-sm font-medium text-background transition hover:opacity-80 disabled:opacity-50"
            >
              {loading ? "Отправляем..." : "Отправить ссылку"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
