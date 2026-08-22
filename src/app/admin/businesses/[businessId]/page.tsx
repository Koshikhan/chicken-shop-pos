// Import necessary modules
import { redirect } from "next/navigation"; // For server-side redirection
import { PlatformBusinessManager } from "@/components/PlatformBusinessManager"; // Component to manage platform business details
import { createClient } from "@/lib/supabase/server"; // Function to create a Supabase client

// Define the props for the page component
type Props = { params: Promise<{ businessId: string }> }; // Contains the dynamic `businessId` parameter

// Define the AdminBusinessPage component
export default async function AdminBusinessPage({ params }: Props) {
  // Extract the `businessId` from the dynamic route parameters
  const { businessId } = await params;

  // Create a Supabase client instance
  const supabase = await createClient();

  // Fetch the current authenticated user
  const { data: userData } = await supabase.auth.getUser();

  // If no user is authenticated, redirect to the login page
  if (!userData.user) redirect("/login");

  // Check if the authenticated user is a platform admin
  const { data: isAdmin, error } = await supabase.rpc("is_pos_platform_admin");

  // If there is an error or the user is not an admin, redirect to the home page
  if (error || !isAdmin) redirect("/");

  // Render the PlatformBusinessManager component with the `businessId` prop
  return <PlatformBusinessManager businessId={businessId} />;
}