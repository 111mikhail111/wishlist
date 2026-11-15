
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOwner } from "@/lib/supabase/admin";
import EditWishForm from "./edit-wish-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function EditWish({ params }: PageProps) {
  const { id } = await params;

  await connection();

  const supabase = await requireOwner();

  const [{ data: wish, error }, { data: categories }] = await Promise.all([
    supabase
      .from("wishes")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("categories")
      .select("id, name")
      .order("name"),
  ]);

  if (error) {
    return (
      <p className="rounded-xl border border-red-500/30 p-5 text-sm text-red-500">
        Не удалось загрузить желание: {error.message}
      </p>
    );
  }

  if (!wish) notFound();

  return (
    <EditWishForm
      wish={wish}
      categories={categories ?? []}
    />
  );
}

export default function EditWishPage({ params }: PageProps) {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-border pb-8">
          <Link
            href="/admin/wishes"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            ← Назад к желаниям
          </Link>

          <p className="mt-8 text-sm tracking-widest text-muted-foreground">
            WISHLIST / ADMIN
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Редактирование
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Измени информацию о желании.
          </p>
        </header>

        <section className="mt-8">
          <Suspense
            fallback={
              <p className="text-sm text-muted-foreground">
                Загружаем желание...
              </p>
            }
          >
            <EditWish params={params} />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
