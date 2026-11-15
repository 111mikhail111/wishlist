
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { requireOwner } from "@/lib/supabase/admin";
import HolidaysManager, { type Holiday } from "./holidays-manager";

async function HolidaysContent() {
  await connection();

  const supabase = await requireOwner();

  const { data, error } = await supabase
    .from("holidays")
    .select("id, name, event_date")
    .order("event_date", { ascending: true });

  if (error) {
    console.error("Ошибка загрузки праздников:", error);

    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-sm text-red-500">
        Не удалось загрузить праздники. Попробуй обновить страницу.
      </div>
    );
  }

  return (
    <HolidaysManager
      initialHolidays={(data ?? []) as Holiday[]}
    />
  );
}

export default function AdminHolidaysPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={16} />
          В админ-панель
        </Link>

        <div className="mb-10 mt-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl border border-border p-3">
              <CalendarDays size={22} />
            </div>

            <p className="text-sm text-muted-foreground">
              УПРАВЛЕНИЕ
            </p>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Праздники
          </h1>

          <p className="mt-4 text-muted-foreground">
            Управляй праздниками и важными событиями.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="py-20 text-center text-muted-foreground">
              Загружаем праздники...
            </div>
          }
        >
          <HolidaysContent />
        </Suspense>
      </div>
    </main>
  );
}
