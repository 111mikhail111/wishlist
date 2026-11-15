
"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string | number;
  name: string;
};

type Holiday = {
  id: string | number;
  name: string;
  event_date: string | null;
};

type WishFormProps = {
  categories: Category[];
};

export default function WishForm({ categories }: WishFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [whyIWant, setWhyIWant] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState("3");
  const [productUrl, setProductUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedHolidayIds, setSelectedHolidayIds] = useState<string[]>([]);
  const [loadingHolidays, setLoadingHolidays] = useState(true);

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHolidays() {
      const { data, error } = await supabase
        .from("holidays")
        .select("id, name, event_date")
        .order("event_date", { ascending: true });

      if (cancelled) return;

      if (error) {
        setError("Не удалось загрузить список праздников.");
      } else {
        setHolidays((data ?? []) as Holiday[]);
      }

      setLoadingHolidays(false);
    }

    loadHolidays();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Выбери файл изображения.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Размер изображения не должен превышать 5 МБ.");
      event.target.value = "";
      return;
    }

    setError("");
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImage(null);
    setPreview("");
  }

  function toggleHoliday(id: string) {
    setSelectedHolidayIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function formatDate(date: string | null) {
    if (!date) return "";

    return new Date(`${date}T00:00:00`).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Укажи название желания.");
      return;
    }

    if (price && (!Number.isFinite(Number(price)) || Number(price) < 0)) {
      setError("Укажи корректную цену.");
      return;
    }

    setLoading(true);
    let uploadedPath: string | null = null;
    let createdWishId: string | null = null;

    try {
      let imageUrl: string | null = null;

      if (image) {
        const extension =
          image.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
          "jpg";

        const filePath = `${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("wish-images")
          .upload(filePath, image, {
            cacheControl: "3600",
            upsert: false,
            contentType: image.type,
          });

        if (uploadError) {
          throw new Error("Не удалось загрузить фотографию: " + uploadError.message);
        }

        uploadedPath = filePath;

        const { data } = supabase.storage
          .from("wish-images")
          .getPublicUrl(filePath);

        imageUrl = data.publicUrl;
      }

      const selectedCategory = categories.find(
        (category) => String(category.id) === categoryId
      );

      const { data: wish, error: insertError } = await supabase
        .from("wishes")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          why_i_want: whyIWant.trim() || null,
          price: price ? Number(price) : null,
          category_id: selectedCategory?.id ?? null,
          priority: Number(priority),
          product_url: productUrl.trim() || null,
          image_url: imageUrl,
          is_active: isActive,
        })
        .select("id")
        .single();

      if (insertError) {
        throw new Error("Не удалось сохранить желание: " + insertError.message);
      }

      createdWishId = String(wish.id);

      if (selectedHolidayIds.length > 0) {
        const { error: holidayError } = await supabase
          .from("wish_holidays")
          .insert(
            selectedHolidayIds.map((holidayId) => ({
              wish_id: wish.id,
              holiday_id: holidayId,
            }))
          );

        if (holidayError) {
          throw new Error(
            "Желание создано, но не удалось привязать праздники: " +
              holidayError.message
          );
        }
      }

      router.push("/admin/wishes");
      router.refresh();
    } catch (err) {
      if (createdWishId) {
        await supabase.from("wish_holidays").delete().eq("wish_id", createdWishId);
        await supabase.from("wishes").delete().eq("id", createdWishId);
      }

      if (uploadedPath) {
        await supabase.storage.from("wish-images").remove([uploadedPath]);
      }

      setError(
        err instanceof Error ? err.message : "Произошла неизвестная ошибка."
      );
      setLoading(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground";

  const labelClass = "text-sm font-medium";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelClass} htmlFor="title">Название *</label>
        <input
          id="title"
          className={inputClass}
          placeholder="Например, наушники Sony"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="image">Фотография желания</label>
        <div className="mt-2 rounded-xl border border-dashed border-border p-4">
          {preview ? (
            <div className="space-y-3">
              <img
                src={preview}
                alt="Предпросмотр фотографии"
                className="max-h-72 w-full rounded-lg object-contain"
              />
              <button
                type="button"
                onClick={removeImage}
                className="text-sm text-red-500 transition hover:opacity-70"
              >
                Удалить фотографию
              </button>
            </div>
          ) : (
            <label
              htmlFor="image"
              className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 text-center"
            >
              <span className="text-3xl">📷</span>
              <span className="text-sm font-medium">Нажми, чтобы выбрать фотографию</span>
              <span className="text-xs text-muted-foreground">PNG, JPG, WEBP — до 5 МБ</span>
            </label>
          )}

          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className={preview ? "hidden" : "sr-only"}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="description">Описание</label>
        <textarea
          id="description"
          className={inputClass}
          placeholder="Расскажи подробнее о желании..."
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="why">Почему я этого хочу</label>
        <textarea
          id="why"
          className={inputClass}
          placeholder="Почему эта вещь для тебя важна?"
          rows={3}
          value={whyIWant}
          onChange={(e) => setWhyIWant(e.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="price">Цена (₽)</label>
          <input
            id="price"
            type="number"
            min="0"
            step="1"
            className={inputClass}
            placeholder="15000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="priority">Приоритет</label>
          <select
            id="priority"
            className={inputClass}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="1">1 — Низкий</option>
            <option value="2">2 — Ниже среднего</option>
            <option value="3">3 — Средний</option>
            <option value="4">4 — Высокий</option>
            <option value="5">5 — Максимальный</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="category">Категория</label>
        <select
          id="category"
          className={inputClass}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Без категории</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className={labelClass}>Праздники и события</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Можно выбрать несколько праздников для одного желания.
        </p>

        <div className="mt-3 space-y-2 rounded-xl border border-border p-4">
          {loadingHolidays ? (
            <p className="text-sm text-muted-foreground">Загружаем праздники...</p>
          ) : holidays.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Пока нет праздников. Сначала добавь их в разделе «Праздники».
            </p>
          ) : (
            holidays.map((holiday) => (
              <label
                key={holiday.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={selectedHolidayIds.includes(String(holiday.id))}
                  onChange={() => toggleHoliday(String(holiday.id))}
                  className="h-4 w-4 accent-foreground"
                />
                <span className="text-sm">{holiday.name}</span>
                {holiday.event_date && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDate(holiday.event_date)}
                  </span>
                )}
              </label>
            ))
          )}
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="productUrl">Ссылка на товар</label>
        <input
          id="productUrl"
          type="url"
          className={inputClass}
          placeholder="https://..."
          value={productUrl}
          onChange={(e) => setProductUrl(e.target.value)}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 accent-foreground"
        />
        <span className="text-sm">Показывать желание в публичном каталоге</span>
      </label>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
        <button
          type="submit"
          disabled={loading || loadingHolidays}
          className="rounded-xl bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Сохраняем..." : "Сохранить желание"}
        </button>

        <Link
          href="/admin/wishes"
          className="rounded-xl border border-border px-6 py-3 text-center text-sm transition hover:bg-muted"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}
