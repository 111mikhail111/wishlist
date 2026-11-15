import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireOwner } from "@/lib/supabase/admin";
import WishForm from "./new-wish-form";

async function NewWishContent() {
  await connection();
  const supabase = await requireOwner();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  if (error) {
    return (
      <p className="mt-6 rounded-xl border border-red-500/30 p-5 text-sm text-red-500">
        Не удалось загрузить категории: {error.message}
      </p>
    );
  }

  return <WishForm categories={categories ?? []} />;
}

export default function NewWishPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-border pb-8">
          <p className="text-sm tracking-widest text-muted-foreground">
            WISHLIST / ADMIN
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Новое желание
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Добавь новую вещь в каталог желаний.
          </p>
          <Link
            href="/admin/wishes"
            className="mt-5 inline-block text-sm text-muted-foreground transition hover:text-foreground"
          >
            ← Вернуться к желаниям
          </Link>
        </header>

        <Suspense
          fallback={
            <p className="mt-8 text-sm text-muted-foreground">
              Загружаем форму...
            </p>
          }
        >
          <NewWishContent />
        </Suspense>
      </div>
    </main>
  );
}
