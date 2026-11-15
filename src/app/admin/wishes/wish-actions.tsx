
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type WishActionsProps = {
  wishId: string;
  isCompleted: boolean;
};

export default function WishActions({
  wishId,
  isCompleted,
}: WishActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleComplete() {
    const message = isCompleted
      ? "Вернуть желание в активный список?"
      : "Отметить желание как подаренное? Оно исчезнет из публичного списка.";

    if (!window.confirm(message)) return;

    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error } = await supabase
      .from("wishes")
      .update({ is_completed: !isCompleted })
      .eq("id", wishId);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  async function handleDelete() {
    if (
      !window.confirm(
        "Точно удалить это желание? Это действие нельзя отменить.",
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error } = await supabase
      .from("wishes")
      .delete()
      .eq("id", wishId);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleComplete}
          disabled={loading}
          className="rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-muted disabled:opacity-50"
        >
          {loading
            ? "Обработка..."
            : isCompleted
              ? "Вернуть в активные"
              : "Отметить подаренным"}
        </button>

        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
        >
          Удалить
        </button>
      </div>

      {error && (
        <p className="max-w-xs text-xs text-red-500">
          Ошибка: {error}
        </p>
      )}
    </div>
  );
}
