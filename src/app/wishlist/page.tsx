"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  X,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Holiday = {
  id: string;
  name: string;
  event_date: string | null;
};

type Wish = {
  id: string;
  title: string;
  category: string;
  price: number | null;
  image_url: string | null;
  product_url: string | null;
  description: string | null;
  why_i_want: string | null;
  priority: number;
  created_at: string;
  holidays: Holiday[];
};

type WishHolidayRow = {
  holidays: Holiday | Holiday[] | null;
};

type WishRow = Omit<Wish, "category" | "holidays"> & {
  categories: { name: string } | { name: string }[] | null;
  wish_holidays: WishHolidayRow[] | null;
};

type WishIdRow = {
  wish_id: string;
};

export default function WishlistPage() {
  const router = useRouter();

  const [wishes, setWishes] = useState<Wish[]>([]);
  const [bookedWishIds, setBookedWishIds] = useState<string[]>([]);
  const [myBookedWishIds, setMyBookedWishIds] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Все");
  const [selectedHolidayId, setSelectedHolidayId] = useState("Все");
  const [sort, setSort] = useState("default");

  const [selectedWish, setSelectedWish] = useState<Wish | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadWishes() {
      const supabase = createClient();

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (!isMounted) return;

      if (authError) {
        console.error("Ошибка авторизации:", authError);
      }

      const currentUserId = authData.user?.id ?? null;

      setUserId(currentUserId);

      const [
        { data, error: wishesError },
        { data: bookedData, error: bookedError },
        { data: myBookingsData, error: myBookingsError },
      ] = await Promise.all([
        supabase
          .from("wishes")
          .select(
            `
            id,
            title,
            description,
            why_i_want,
            image_url,
            product_url,
            price,
            priority,
            created_at,
            categories ( name ),
            wish_holidays (
              holidays (
                id,
                name,
                event_date
              )
            )
          `,
          )
          .eq("is_active", true)
          .eq("is_completed", false)
          .order("created_at", { ascending: false }),

        supabase.rpc("get_booked_wish_ids"),

        currentUserId
          ? supabase.rpc("get_my_booked_wish_ids")
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (!isMounted) return;

      if (wishesError || bookedError || myBookingsError) {
        console.error("Ошибка загрузки каталога:", {
          wishesError,
          bookedError,
          myBookingsError,
        });

        setError(
          "Не удалось загрузить желания и их статусы. Попробуй обновить страницу.",
        );

        setLoading(false);
        return;
      }

      const rows = (data ?? []) as unknown as WishRow[];

      const formattedWishes: Wish[] = rows.map((wish) => {
        const categoryData = Array.isArray(wish.categories)
          ? wish.categories[0]
          : wish.categories;

        const holidays: Holiday[] = (wish.wish_holidays ?? [])
          .flatMap((relation) => {
            if (!relation.holidays) return [];

            return Array.isArray(relation.holidays)
              ? relation.holidays
              : [relation.holidays];
          })
          .filter(
            (holiday, index, array) =>
              array.findIndex((item) => item.id === holiday.id) === index,
          );

        return {
          id: wish.id,
          title: wish.title,
          category: categoryData?.name ?? "Другое",
          price: wish.price,
          image_url: wish.image_url,
          product_url: wish.product_url,
          description: wish.description,
          why_i_want: wish.why_i_want,
          priority: wish.priority,
          created_at: wish.created_at,
          holidays,
        };
      });

      const allBookedRows = (bookedData ?? []) as WishIdRow[];
      const myBookedRows = (myBookingsData ?? []) as WishIdRow[];

      setWishes(formattedWishes);

      setBookedWishIds(allBookedRows.map((item: WishIdRow) => item.wish_id));

      setMyBookedWishIds(myBookedRows.map((item: WishIdRow) => item.wish_id));

      setLoading(false);
    }

    loadWishes();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(
    () => ["Все", ...Array.from(new Set(wishes.map((wish) => wish.category)))],
    [wishes],
  );

  const holidays = useMemo(() => {
    const uniqueHolidays = new Map<string, Holiday>();

    wishes.forEach((wish) => {
      wish.holidays.forEach((holiday) => {
        uniqueHolidays.set(holiday.id, holiday);
      });
    });

    return Array.from(uniqueHolidays.values()).sort((a, b) => {
      if (!a.event_date) return 1;
      if (!b.event_date) return -1;

      return (
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      );
    });
  }, [wishes]);

  const filteredWishes = useMemo(() => {
    return wishes
      .filter((wish) => {
        const matchesSearch = wish.title
          .toLowerCase()
          .includes(search.toLowerCase());

        const matchesCategory =
          category === "Все" || wish.category === category;

        const matchesHoliday =
          selectedHolidayId === "Все" ||
          wish.holidays.some((holiday) => holiday.id === selectedHolidayId);

        return matchesSearch && matchesCategory && matchesHoliday;
      })
      .sort((a, b) => {
        if (sort === "cheap") {
          return (a.price ?? 0) - (b.price ?? 0);
        }

        if (sort === "expensive") {
          return (b.price ?? 0) - (a.price ?? 0);
        }

        if (sort === "priority") {
          return b.priority - a.priority;
        }

        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
  }, [wishes, search, category, selectedHolidayId, sort]);

  const formatPrice = (price: number | null) => {
    if (price === null) return "Цена не указана";

    return `${price.toLocaleString("ru-RU")} ₽`;
  };

  const isBooked = (wishId: string) => bookedWishIds.includes(wishId);

  const isBookedByMe = (wishId: string) => myBookedWishIds.includes(wishId);

  async function handleBooking() {
    if (!selectedWish || bookingLoading) return;

    setBookingError(null);
    setBookingMessage(null);

    const supabase = createClient();

    setBookingLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      if (isBooked(selectedWish.id)) {
        setBookingError("Это желание уже забронировано.");
        return;
      }

      const { error: rpcError } = await supabase.rpc("book_wish", {
        p_wish_id: selectedWish.id,
      });

      if (rpcError) {
        console.error("Ошибка бронирования:", rpcError);

        const message = rpcError.message.toLowerCase();

        if (
          message.includes("wish_already_booked") ||
          message.includes("wish_not_available")
        ) {
          setBookedWishIds((current) =>
            current.includes(selectedWish.id)
              ? current
              : [...current, selectedWish.id],
          );

          setBookingError("К сожалению, это желание уже успели забронировать.");
        } else {
          setBookingError(
            "Не удалось забронировать желание. Попробуй ещё раз.",
          );
        }

        return;
      }

      setBookedWishIds((current) =>
        current.includes(selectedWish.id)
          ? current
          : [...current, selectedWish.id],
      );

      setMyBookedWishIds((current) =>
        current.includes(selectedWish.id)
          ? current
          : [...current, selectedWish.id],
      );

      setBookingMessage("Желание успешно забронировано!");
    } catch (err) {
      console.error("Ошибка бронирования:", err);
      setBookingError("Произошла ошибка. Попробуй ещё раз.");
    } finally {
      setBookingLoading(false);
    }
  }

  async function handleCancelBooking() {
    if (!selectedWish || bookingLoading) return;

    setBookingError(null);
    setBookingMessage(null);

    const supabase = createClient();

    setBookingLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login");
        return;
      }

      const { error: rpcError } = await supabase.rpc("cancel_my_booking", {
        p_wish_id: selectedWish.id,
      });

      if (rpcError) {
        console.error("Ошибка отмены бронирования:", rpcError);

        setBookingError("Не удалось отменить бронирование. Попробуй ещё раз.");

        return;
      }

      setBookedWishIds((current) =>
        current.filter((id) => id !== selectedWish.id),
      );

      setMyBookedWishIds((current) =>
        current.filter((id) => id !== selectedWish.id),
      );

      setBookingMessage("Бронирование успешно отменено!");
    } catch (err) {
      console.error("Ошибка отмены бронирования:", err);
      setBookingError("Произошла ошибка. Попробуй ещё раз.");
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={16} />
          На главную
        </Link>

        <div className="mb-10 mt-12">
          <p className="mb-3 text-sm text-muted-foreground">МОЯ КОЛЛЕКЦИЯ</p>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Мои желания
          </h1>

          <p className="mt-4 text-muted-foreground">
            Здесь собраны вещи, которые сделают меня немного счастливее.
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Найти желание..."
              className="h-12 w-full rounded-xl border border-border bg-transparent pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-3">
              <SlidersHorizontal size={18} className="text-muted-foreground" />

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-12 flex-1 rounded-xl border border-border bg-background px-4 text-sm outline-none sm:flex-none"
              >
                <option value="default">По умолчанию</option>
                <option value="cheap">Сначала дешевле</option>
                <option value="expensive">Сначала дороже</option>
                <option value="priority">По важности</option>
              </select>
            </div>

            {holidays.length > 0 && (
              <select
                value={selectedHolidayId}
                onChange={(e) => setSelectedHolidayId(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none sm:w-auto"
              >
                <option value="Все">Все праздники</option>

                {holidays.map((holiday) => (
                  <option key={holiday.id} value={holiday.id}>
                    {holiday.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {categories.length > 1 && (
          <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-sm transition ${
                  category === item
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Найдено желаний: {filteredWishes.length}
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            Загружаем желания...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-border py-20 text-center">
            <p className="text-lg font-medium">{error}</p>
          </div>
        ) : filteredWishes.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWishes.map((wish) => (
              <button
                key={wish.id}
                onClick={() => {
                  setSelectedWish(wish);
                  setBookingError(null);
                  setBookingMessage(null);
                }}
                className="group overflow-hidden rounded-2xl border border-border bg-card text-left transition duration-300 hover:-translate-y-1 hover:border-foreground/40"
              >
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted text-7xl">
                  {wish.image_url ? (
                    <img
                      src={wish.image_url}
                      alt={wish.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <span>🎁</span>
                  )}

                  {isBooked(wish.id) && (
                    <span className="absolute right-3 top-3 rounded-full bg-black/75 px-3 py-2 text-xs font-medium text-white">
                      Забронировано
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <p className="mb-3 text-xs text-muted-foreground">
                    {wish.category}
                  </p>

                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-medium">{wish.title}</h2>

                    <span className="whitespace-nowrap text-sm font-medium">
                      {formatPrice(wish.price)}
                    </span>
                  </div>

                  {wish.holidays.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {wish.holidays.map((holiday) => (
                        <span
                          key={holiday.id}
                          className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
                        >
                          {holiday.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="mt-3 text-sm text-muted-foreground">
                    Подробнее
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border py-20 text-center">
            <p className="text-lg font-medium">
              {wishes.length === 0
                ? "Пока здесь нет желаний"
                : "Ничего не найдено"}
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              {wishes.length === 0
                ? "Добавим желания через админ-панель на следующем этапе."
                : "Попробуй изменить запрос, категорию или праздник."}
            </p>
          </div>
        )}
      </div>

      {selectedWish && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedWish(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wish-title"
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-background p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedWish(null)}
              className="absolute right-5 top-5 z-10 rounded-full bg-background/80 p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Закрыть"
            >
              <X size={20} />
            </button>

            <div className="mb-6 flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-muted text-8xl">
              {selectedWish.image_url ? (
                <img
                  src={selectedWish.image_url}
                  alt={selectedWish.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>🎁</span>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {selectedWish.category}
            </p>

            <h2 id="wish-title" className="mt-2 text-3xl font-semibold">
              {selectedWish.title}
            </h2>

            {selectedWish.holidays.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedWish.holidays.map((holiday) => (
                  <span
                    key={holiday.id}
                    className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground"
                  >
                    {holiday.name}
                  </span>
                ))}
              </div>
            )}

            {selectedWish.description && (
              <p className="mt-4 leading-7 text-muted-foreground">
                {selectedWish.description}
              </p>
            )}

            {selectedWish.why_i_want && (
              <div className="mt-4 rounded-xl bg-muted p-4">
                <p className="mb-2 text-xs text-muted-foreground">
                  ПОЧЕМУ Я ЭТОГО ХОЧУ
                </p>
                <p className="text-sm leading-6">{selectedWish.why_i_want}</p>
              </div>
            )}

            <div className="mt-7 flex items-center justify-between border-t border-border pt-6">
              <span className="text-sm text-muted-foreground">
                Примерная стоимость
              </span>

              <span className="text-xl font-semibold">
                {formatPrice(selectedWish.price)}
              </span>
            </div>

            {selectedWish.product_url && (
              <a
                href={selectedWish.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-6 py-4 text-sm font-medium transition hover:bg-muted"
              >
                Посмотреть товар
                <ExternalLink size={16} />
              </a>
            )}

            {isBookedByMe(selectedWish.id) ? (
              <>
                <div className="mt-3 rounded-xl border border-border bg-muted px-6 py-4 text-center">
                  <p className="font-medium">Ты забронировал это желание</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Спасибо! Ты можешь отменить бронирование, если передумал.
                  </p>
                </div>

                <button
                  onClick={handleCancelBooking}
                  disabled={bookingLoading}
                  className="mt-3 w-full rounded-xl border border-red-500/40 px-6 py-4 text-sm font-medium text-red-500 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bookingLoading ? "Отменяем..." : "Отменить бронирование"}
                </button>
              </>
            ) : isBooked(selectedWish.id) ? (
              <div className="mt-3 rounded-xl border border-border bg-muted px-6 py-4 text-center">
                <p className="font-medium">Это желание уже забронировано</p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Спасибо, что заглянул!
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={handleBooking}
                  disabled={bookingLoading}
                  className="mt-3 w-full rounded-xl bg-foreground px-6 py-4 text-sm font-medium text-background transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bookingLoading ? "Бронируем..." : "Забронировать"}
                </button>

                {!userId && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Для бронирования нужно{" "}
                    <Link
                      href="/login"
                      className="underline underline-offset-4 hover:text-foreground"
                    >
                      войти в аккаунт
                    </Link>
                    .
                  </p>
                )}
              </>
            )}

            {bookingMessage && (
              <p className="mt-4 rounded-xl border border-green-500/30 bg-green-500/5 p-3 text-center text-sm text-green-600">
                {bookingMessage}
              </p>
            )}

            {bookingError && (
              <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-center text-sm text-red-500">
                {bookingError}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
