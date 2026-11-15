
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireOwner } from "@/lib/supabase/admin";
import SettingsForm from "./settings-form";

async function SettingsContent() {
  await connection();

  const supabase = await requireOwner();

  const { data: settings, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !settings) {
    return (
      <div className="mt-8 rounded-2xl border border-red-500/30 p-6">
        <p className="text-sm text-red-500">
          Не удалось загрузить настройки сайта.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Проверь, что таблица site_settings создана и в ней есть запись с id = 1.
        </p>
      </div>
    );
  }

  return <SettingsForm settings={settings} />;
}

export default function AdminSettingsPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm tracking-widest text-muted-foreground">
              WISHLIST / ADMIN
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Настройки сайта
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Измени тексты главной страницы и оформление сайта.
            </p>
          </div>

          <Link
            href="/admin"
            className="w-fit rounded-xl border border-border px-5 py-3 text-sm transition hover:bg-muted"
          >
            ← В админку
          </Link>
        </header>

        <Suspense
          fallback={
            <p className="mt-8 text-sm text-muted-foreground">
              Загружаем настройки...
            </p>
          }
        >
          <SettingsContent />
        </Suspense>
      </div>
    </main>
  );
}
