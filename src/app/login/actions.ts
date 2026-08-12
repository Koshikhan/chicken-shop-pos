"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  return { email, password };
}

export async function login(formData: FormData) {
  const { email, password } = getCredentials(formData);

  if (!email || !password) {
    redirect("/login?error=Enter%20your%20email%20and%20password.");
  }

  const supabase = await createClient();

  const { error: loginError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (loginError) {
    redirect("/login?error=Invalid%20email%20or%20password.");
  }

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    await supabase.auth.signOut();

    redirect("/login?error=Unable%20to%20verify%20your%20account.");
  }

  const {
    data: membership,
    error: membershipError,
  } = await supabase
    .from("business_memberships")
    .select("business_id, role, default_location_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    await supabase.auth.signOut();

    redirect(
      "/login?error=Your%20account%20is%20not%20linked%20to%20an%20active%20business.",
    );
  }

  revalidatePath("/", "layout");
  redirect("/");
}
