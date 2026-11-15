
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireOwner } from "@/lib/supabase/admin";
import WishActions from "./wish-actions";

async function WishesList() {
  await connection();

  const supabase = await requireOwner();

  const { data: wishes, error } = await supabase
    .from("wishes")
    .select(`
      id,
      title,
      price,
      is_active,
      is_completed,
      priority,
      created_at,
      categories ( name )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mt-6 rounded-2xl border border-red-500/30 p-6 text-sm text-red-500">
        Не удалось загрузить желания: {error.message}
      </div>
    );
  }

  if (!wishes || wishes.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-border p-10 text-center">
        <p className="text-lg font-medium">Пока нет желаний</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Здесь будут отображаться все желания твоего списка.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {wishes.map((wish) => {
        const category = Array.isArray(wish.categories)
          ? wish.categories[0]
          : wish.categories;

        const formattedPrice =
          wish.price !== null
            ? new Intl.NumberFormat("ru-RU", {
                style: "currency",
                currency: "RUB",
                maximumFractionDigits: 0,
              }).format(wish.price)
            : "Цена не указана";

        return (
          <div
            key={wish.id}
            className="flex flex-col gap-4 rounded-2xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{wish.title}</h3>

                {wish.is_completed ? (
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs text-blue-500">
                    Подарено
                  </span>
                ) : (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      wish.is_active
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {wish.is_active ? "Активно" : "Скрыто"}
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>{formattedPrice}</span>
                <span>{category?.name ?? "Без категории"}</span>
                <span>Приоритет: {wish.priority ?? "—"}</span>
                <span>
                  {new Date(wish.created_at).toLocaleDateString("ru-RU")}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/wishes/${wish.id}`}
                  className="inline-flex rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-muted"
                >
                  Редактировать →
                </Link>

                <WishActions
                  wishId={wish.id}
                  isCompleted={wish.is_completed}
                />
              </div>
            </div>

            <span className="text-xs text-muted-foreground">
              ID: {wish.id.slice(0, 8)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminWishesPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm tracking-widest text-muted-foreground">
              WISHLIST / ADMIN
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Желания
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Управление желаниями в твоём списке.
            </p>
          </div>

          <Link
            href="/admin/wishes/new"
            className="rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90"
          >
            + Добавить желание
          </Link>

          <Link
            href="/admin"
            className="w-fit rounded-xl border border-border px-5 py-3 text-sm transition hover:bg-muted"
          >
            ← В панель управления
          </Link>
        </header>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Все желания</h2>

            <span className="text-sm text-muted-foreground">
              Каталог владельца
            </span>
          </div>

          <Suspense
            fallback={
              <p className="mt-6 text-sm text-muted-foreground">
                Загружаем желания...
              </p>
            }
          >
            <WishesList />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
