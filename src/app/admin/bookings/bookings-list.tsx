
"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type Booking = {
  wish_id: string;
  wish_title: string;
  status: "active" | "cancelled";
  created_at: string;
  cancelled_at: string | null;
};

type Props = {
  initialBookings: Booking[];
};

export default function BookingsList({ initialBookings }: Props) {
  const [bookings, setBookings] = useState(initialBookings);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const activeCount = bookings.filter(
    (booking) => booking.status === "active"
  ).length;

  const cancelledCount = bookings.filter(
    (booking) => booking.status === "cancelled"
  ).length;

  function formatDate(date: string) {
    return new Date(date).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function cancelBooking(booking: Booking) {
    if (loadingId) return;

    const confirmed = window.confirm(
      `Отменить бронирование «${booking.wish_title}»?`
    );

    if (!confirmed) return;

    setError(null);
    setMessage(null);
    setLoadingId(booking.wish_id);

    try {
      const supabase = createClient();

      const { error: rpcError } = await supabase.rpc(
        "admin_cancel_booking",
        {
          p_wish_id: booking.wish_id,
        }
      );

      if (rpcError) {
        console.error("Ошибка отмены бронирования:", rpcError);

        setError(
          "Не удалось отменить бронирование. Попробуй ещё раз."
        );

        return;
      }

      setBookings((current) =>
        current.map((item) =>
          item.wish_id === booking.wish_id
            ? {
                ...item,
                status: "cancelled",
                cancelled_at: new Date().toISOString(),
              }
            : item
        )
      );

      setMessage("Бронирование успешно отменено.");
    } catch (err) {
      console.error(err);
      setError("Произошла ошибка. Попробуй ещё раз.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Активные бронирования
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {activeCount}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Отменённые бронирования
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {cancelledCount}
          </p>
        </div>
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

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center">
          <CalendarDays
            size={32}
            className="mx-auto mb-4 text-muted-foreground"
          />

          <p className="text-lg font-medium">
            Пока нет бронирований
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Когда гости начнут бронировать желания, они появятся здесь.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={`${booking.wish_id}-${booking.created_at}`}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6"
            >
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <h2 className="text-lg font-medium">
                    {booking.wish_title}
                  </h2>

                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays size={15} />

                    {formatDate(booking.created_at)}
                  </p>

                  {booking.cancelled_at && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Отменено: {formatDate(booking.cancelled_at)}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {booking.status === "active" ? (
                    <>
                      <span className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-2 text-xs font-medium text-green-600">
                        <CheckCircle2 size={14} />
                        Активно
                      </span>

                      <button
                        onClick={() => cancelBooking(booking)}
                        disabled={loadingId !== null}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm text-red-500 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <XCircle size={16} />

                        {loadingId === booking.wish_id
                          ? "Отменяем..."
                          : "Отменить"}
                      </button>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                      <XCircle size={14} />
                      Отменено
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
