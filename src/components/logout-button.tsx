
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Ошибка выхода:", error);
      setLoading(false);
      alert("Не удалось выйти из аккаунта.");
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm transition hover:bg-muted disabled:opacity-50"
    >
      <LogOut size={16} />
      {loading ? "Выходим..." : "Выйти"}
    </button>
  );
}
