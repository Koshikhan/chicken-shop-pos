import {
    redirect,
  } from "next/navigation";
  
  import {
    AdminDashboard,
  } from "@/components/AdminDashboard";
  
  import {
    createClient,
  } from "@/lib/supabase/server";
  
  export default async function AdminPage() {
    const supabase =
      await createClient();
  
    const {
      data: userData,
    } =
      await supabase.auth.getUser();
  
    if (!userData.user) {
      redirect(
        "/login",
      );
    }
  
    const {
      data: isAdmin,
      error,
    } =
      await supabase.rpc(
        "is_pos_platform_admin",
      );
  
    if (
      error ||
      !isAdmin
    ) {
      redirect(
        "/",
      );
    }
  
    return (
      <AdminDashboard />
    );
  }
  