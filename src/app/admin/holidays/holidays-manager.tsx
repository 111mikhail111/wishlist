
"use client";

import { useState, type FormEvent } from "react";
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type Holiday = {
  id: string;
  name: string;
  event_date: string | null;
};

type Props = {
  initialHolidays: Holiday[];
};

export default function HolidaysManager({
  initialHolidays,
}: Props) {
  const [holidays, setHolidays] = useState(initialHolidays);

  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDate, setEditingDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function formatDate(date: string | null) {
    if (!date) return "Дата не указана";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "ru-RU",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  function sortHolidays(items: Holiday[]) {
    return [...items].sort((a, b) => {
      if (!a.event_date) return 1;
      if (!b.event_date) return -1;

      return a.event_date.localeCompare(b.event_date);
    });
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim() || loading) return;

    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: insertError } = await supabase
        .from("holidays")
        .insert({
          name: name.trim(),
          event_date: eventDate || null,
        })
        .select("id, name, event_date")
        .single();

      if (insertError) throw insertError;

      setHolidays((current) =>
        sortHolidays([...current, data as Holiday])
      );

      setName("");
      setEventDate("");
      setMessage("Праздник успешно добавлен!");
    } catch (err) {
      console.error("Ошибка создания праздника:", err);
      setError("Не удалось добавить праздник.");
    } finally {
      setLoading(false);
    }
  }

  function startEditing(holiday: Holiday) {
    setEditingId(holiday.id);
    setEditingName(holiday.name);
    setEditingDate(holiday.event_date ?? "");
    setError(null);
    setMessage(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingName("");
    setEditingDate("");
  }

  async function handleUpdate(id: string) {
    if (!editingName.trim() || loading) return;

    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("holidays")
        .update({
          name: editingName.trim(),
          event_date: editingDate || null,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      setHolidays((current) =>
        sortHolidays(
          current.map((holiday) =>
            holiday.id === id
              ? {
                  ...holiday,
                  name: editingName.trim(),
                  event_date: editingDate || null,
                }
              : holiday
          )
        )
      );

      cancelEditing();
      setMessage("Изменения сохранены!");
    } catch (err) {
      console.error("Ошибка изменения праздника:", err);
      setError("Не удалось сохранить изменения.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(holiday: Holiday) {
    if (deletingId || loading) return;

    const confirmed = window.confirm(
      `Удалить праздник «${holiday.name}»?`
    );

    if (!confirmed) return;

    setError(null);
    setMessage(null);
    setDeletingId(holiday.id);

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("holidays")
        .delete()
        .eq("id", holiday.id);

      if (deleteError) throw deleteError;

      setHolidays((current) =>
        current.filter((item) => item.id !== holiday.id)
      );

      if (editingId === holiday.id) {
        cancelEditing();
      }

      setMessage("Праздник удалён.");
    } catch (err) {
      console.error("Ошибка удаления праздника:", err);
      setError("Не удалось удалить праздник.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="mb-6 text-xl font-medium">
          Добавить праздник
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">
              Название
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Новый год"
              required
              maxLength={100}
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-foreground"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted-foreground">
              Дата
            </label>

            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:opacity-80 disabled:opacity-50"
          >
            <Plus size={17} />
            {loading ? "Добавляем..." : "Добавить праздник"}
          </button>
        </form>
      </div>

      {message && (
        <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/5 p-4 text-sm text-green-600">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-medium">
          Все праздники
        </h2>

        <span className="text-sm text-muted-foreground">
          {holidays.length} шт.
        </span>
      </div>

      {holidays.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center">
          <CalendarDays
            size={32}
            className="mx-auto mb-4 text-muted-foreground"
          />

          <p className="text-lg font-medium">
            Пока нет праздников
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Добавь первый праздник с помощью формы выше.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              {editingId === holiday.id ? (
                <div className="space-y-4">
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    maxLength={100}
                    className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-foreground"
                  />

                  <input
                    type="date"
                    value={editingDate}
                    onChange={(e) => setEditingDate(e.target.value)}
                    className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-foreground"
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleUpdate(holiday.id)}
                      disabled={loading || !editingName.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm text-background transition hover:opacity-80 disabled:opacity-50"
                    >
                      <Check size={16} />
                      Сохранить
                    </button>

                    <button
                      onClick={cancelEditing}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm transition hover:bg-muted"
                    >
                      <X size={16} />
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-medium">
                      {holiday.name}
                    </h3>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatDate(holiday.event_date)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => startEditing(holiday)}
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm transition hover:bg-muted"
                    >
                      <Pencil size={15} />
                      Изменить
                    </button>

                    <button
                      onClick={() => handleDelete(holiday)}
                      disabled={deletingId !== null}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      {deletingId === holiday.id
                        ? "Удаляем..."
                        : "Удалить"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
