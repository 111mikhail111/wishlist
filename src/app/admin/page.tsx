
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireOwner } from "@/lib/supabase/admin";

async function AdminContent() {
  await connection();
  const supabase = await requireOwner();

  const [
    { count: wishesCount, error: wishesError },
    { count: categoriesCount, error: categoriesError },
    { count: holidaysCount, error: holidaysError },
  ] = await Promise.all([
    supabase.from("wishes").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("holidays").select("*", { count: "exact", head: true }),
  ]);

  const hasError = wishesError || categoriesError || holidaysError;

  const stats = [
    {
      title: "Всего желаний",
      value: wishesCount,
      description: "Все желания в базе",
    },
    {
      title: "Категории",
      value: categoriesCount,
      description: "Доступные категории",
    },
    {
      title: "Праздники",
      value: holidaysCount,
      description: "Созданные события",
    },
  ];

  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm tracking-widest text-muted-foreground">
              WISHLIST / ADMIN
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Панель управления
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Добро пожаловать в административную панель.
            </p>
          </div>

          <Link
            href="/wishlist"
            className="w-fit rounded-xl border border-border px-5 py-3 text-sm transition hover:bg-muted"
          >
            ← Вернуться к каталогу
          </Link>
        </header>

        <section className="mt-10">
          <h2 className="text-lg font-medium">Обзор сайта</h2>

          {hasError ? (
            <p className="mt-5 rounded-xl border border-red-500/30 p-5 text-sm text-red-500">
              Не удалось загрузить статистику. Проверь подключение к Supabase
              и права доступа.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.title}
                  className="rounded-2xl border border-border p-6"
                >
                  <p className="text-sm text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="mt-4 text-4xl font-semibold tracking-tight">
                    {stat.value ?? 0}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-medium">Управление</h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href="/admin/wishes"
              className="block rounded-2xl border border-border p-5 transition hover:bg-muted/30"
            >
              <h3 className="font-medium">Желания</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Добавление, редактирование и удаление желаний.
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                Перейти к желаниям →
              </p>
            </Link>

            <Link
              href="/admin/holidays"
              className="group rounded-2xl border border-border bg-card p-6 transition hover:border-foreground/40"
            >
              <h2 className="text-lg font-medium">Праздники</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Создание и управление праздниками.
              </p>
              <p className="mt-5 text-sm">Перейти →</p>
            </Link>

            <Link
              href="/admin/bookings"
              className="group rounded-2xl border border-border bg-card p-6 transition hover:border-foreground/40"
            >
              <h2 className="text-lg font-medium">Бронирования</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Просмотр и управление бронированиями гостей.
              </p>
              <p className="mt-5 text-sm">Перейти →</p>
            </Link>

            <Link
              href="/admin/settings"
              className="group rounded-2xl border border-border bg-card p-6 transition hover:border-foreground/40"
            >
              <h2 className="text-lg font-medium">Настройки сайта</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Приветствие, описание и оформление.
              </p>
              <p className="mt-5 text-sm">Перейти →</p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm text-muted-foreground">
              Проверяем доступ к панели управления...
            </p>
          </div>
        </main>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
