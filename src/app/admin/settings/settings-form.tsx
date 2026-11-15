
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SiteSettings = {
  id: number;
  site_title: string;
  hero_badge: string;
  hero_title: string;
  hero_title_secondary: string;
  hero_description: string;
  hero_button: string;
  footer_text: string;
  default_theme: "dark" | "light";
};

type SettingsFormProps = {
  settings: SiteSettings;
};

export default function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();

  const [form, setForm] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField<K extends keyof SiteSettings>(
    field: K,
    value: SiteSettings[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setMessage("");
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("site_settings")
      .update({
        site_title: form.site_title.trim(),
        hero_badge: form.hero_badge.trim(),
        hero_title: form.hero_title.trim(),
        hero_title_secondary: form.hero_title_secondary.trim(),
        hero_description: form.hero_description.trim(),
        hero_button: form.hero_button.trim(),
        footer_text: form.footer_text.trim(),
        default_theme: form.default_theme,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    setSaving(false);

    if (updateError) {
      setError(
        "Не удалось сохранить настройки. Проверь подключение и права доступа."
      );
      console.error("Settings update error:", updateError);
      return;
    }

    setMessage("Настройки успешно сохранены!");
    router.refresh();
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-foreground/50";

  const labelClass = "text-sm font-medium";

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-8">
      <section className="rounded-2xl border border-border p-6 sm:p-8">
        <h2 className="text-lg font-medium">Основные настройки</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Название сайта и оформление.
        </p>

        <div className="mt-6">
          <label htmlFor="site_title" className={labelClass}>
            Название сайта
          </label>
          <input
            id="site_title"
            className={inputClass}
            value={form.site_title}
            onChange={(event) =>
              updateField("site_title", event.target.value)
            }
            required
          />
        </div>

        <div className="mt-6">
          <label htmlFor="default_theme" className={labelClass}>
            Тема по умолчанию
          </label>
          <select
            id="default_theme"
            className={inputClass}
            value={form.default_theme}
            onChange={(event) =>
              updateField(
                "default_theme",
                event.target.value as "dark" | "light"
              )
            }
          >
            <option value="dark">Тёмная</option>
            <option value="light">Светлая</option>
          </select>
          <p className="mt-2 text-xs text-muted-foreground">
            Выбранная тема будет использоваться как стандартная на сайте.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border p-6 sm:p-8">
        <h2 className="text-lg font-medium">Главная страница</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Настрой приветствие и основной текст на главной странице.
        </p>

        <div className="mt-6">
          <label htmlFor="hero_badge" className={labelClass}>
            Небольшая надпись над заголовком
          </label>
          <input
            id="hero_badge"
            className={inputClass}
            value={form.hero_badge}
            onChange={(event) =>
              updateField("hero_badge", event.target.value)
            }
            required
          />
        </div>

        <div className="mt-6">
          <label htmlFor="hero_title" className={labelClass}>
            Основной заголовок
          </label>
          <input
            id="hero_title"
            className={inputClass}
            value={form.hero_title}
            onChange={(event) =>
              updateField("hero_title", event.target.value)
            }
            required
          />
        </div>

        <div className="mt-6">
          <label htmlFor="hero_title_secondary" className={labelClass}>
            Вторая часть заголовка
          </label>
          <input
            id="hero_title_secondary"
            className={inputClass}
            value={form.hero_title_secondary}
            onChange={(event) =>
              updateField("hero_title_secondary", event.target.value)
            }
            required
          />
        </div>

        <div className="mt-6">
          <label htmlFor="hero_description" className={labelClass}>
            Описание
          </label>
          <textarea
            id="hero_description"
            className={`${inputClass} min-h-32 resize-y`}
            value={form.hero_description}
            onChange={(event) =>
              updateField("hero_description", event.target.value)
            }
            required
          />
        </div>

        <div className="mt-6">
          <label htmlFor="hero_button" className={labelClass}>
            Текст кнопки
          </label>
          <input
            id="hero_button"
            className={inputClass}
            value={form.hero_button}
            onChange={(event) =>
              updateField("hero_button", event.target.value)
            }
            required
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border p-6 sm:p-8">
        <h2 className="text-lg font-medium">Подвал сайта</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Текст в нижней части главной страницы.
        </p>

        <div className="mt-6">
          <label htmlFor="footer_text" className={labelClass}>
            Подпись в подвале
          </label>
          <input
            id="footer_text"
            className={inputClass}
            value={form.footer_text}
            onChange={(event) =>
              updateField("footer_text", event.target.value)
            }
            required
          />
        </div>
      </section>

      {error && (
        <p className="rounded-xl border border-red-500/30 p-4 text-sm text-red-500">
          {error}
        </p>
      )}

      {message && (
        <p className="rounded-xl border border-green-500/30 p-4 text-sm text-green-500">
          {message}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Сохраняем..." : "Сохранить настройки"}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => {
            setForm(settings);
            setMessage("");
            setError("");
          }}
          className="rounded-xl border border-border px-6 py-3 text-sm transition hover:bg-muted disabled:opacity-50"
        >
          Сбросить изменения
        </button>
      </div>
    </form>
  );
}
