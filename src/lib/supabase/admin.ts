
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireOwner() {
  const supabase = await createClient();

  // Проверяем авторизацию пользователя
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Проверяем роль в базе данных
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "owner") {
    redirect("/wishlist");
  }

  return supabase;
}
