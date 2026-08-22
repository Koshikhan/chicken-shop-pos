// Import necessary modules
import { NextRequest, NextResponse } from "next/server"; // For handling API requests and responses
import { createClient } from "@/lib/supabase/server"; // Function to create a Supabase client for server-side operations
import { createSupabaseAdminClient } from "@/lib/supabase/admin"; // Function to create an admin Supabase client

// Specify the runtime environment
export const runtime = "nodejs"; // Indicates that this API route runs in a Node.js environment

// Define allowed POS templates
const ALLOWED_TEMPLATES = new Set([
  "FAST_FOOD",
  "DELI",
  "RESTAURANT",
  "RETAIL",
]);

// Define the payload structure for creating a client
type CreateClientPayload = {
  businessName?: unknown; // Business name
  clientEmail?: unknown; // Client's email address
  businessType?: unknown; // Type of business (POS template)
  branchName?: unknown; // Name of the first branch
  managerName?: unknown; // Manager's name
  managerPin?: unknown; // Manager's PIN
};

// Helper function to sanitize and validate text input
function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

// Helper function to validate email format
function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Define the POST handler for creating a new client
export async function POST(request: NextRequest) {
  let invitedUserId: string | null = null; // Variable to store the invited user's ID

  try {
    // Create a Supabase client instance
    const supabase = await createClient();

    // Fetch the current authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser();

    // If no user is authenticated, return a 401 Unauthorized response
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "You must sign in as a platform administrator." },
        { status: 401 }
      );
    }

    // Check if the authenticated user is a platform admin
    const { data: isAdmin, error: adminCheckError } = await supabase.rpc("is_pos_platform_admin");

    // If the user is not an admin, return a 403 Forbidden response
    if (adminCheckError || !isAdmin) {
      return NextResponse.json(
        { error: "Platform administrator access required." },
        { status: 403 }
      );
    }

    // Parse the request payload
    const payload = (await request.json()) as CreateClientPayload;

    // Extract and sanitize input fields from the payload
    const businessName = readText(payload.businessName);
    const clientEmail = readText(payload.clientEmail).toLowerCase();
    const businessType = readText(payload.businessType).toUpperCase();
    const branchName = readText(payload.branchName);
    const managerName = readText(payload.managerName);
    const managerPin = readText(payload.managerPin);

    // Validate the input fields
    if (!businessName) {
      return NextResponse.json(
        { error: "Enter the business name." },
        { status: 400 }
      );
    }

    if (!clientEmail || !isEmail(clientEmail)) {
      return NextResponse.json(
        { error: "Enter a valid client email address." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TEMPLATES.has(businessType)) {
      return NextResponse.json(
        { error: "Choose a valid POS template." },
        { status: 400 }
      );
    }

    if (!branchName) {
      return NextResponse.json(
        { error: "Enter the first branch name." },
        { status: 400 }
      );
    }

    if (!managerName) {
      return NextResponse.json(
        { error: "Enter the manager name." },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(managerPin)) {
      return NextResponse.json(
        { error: "Manager PIN must contain exactly 4 digits." },
        { status: 400 }
      );
    }

    // Create an admin Supabase client
    const adminSupabase = createSupabaseAdminClient();

    // Determine the site URL for the invitation email
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
    const siteUrl = configuredSiteUrl || request.nextUrl.origin;
    const redirectTo = `${siteUrl}/auth/callback?next=/update-password`;

    // Invite the client user via email
    const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
      clientEmail,
      {
        redirectTo,
        data: {
          name: managerName,
          business_name: businessName,
          invited_by: "KAY POS",
        },
      }
    );

    // If the invitation fails, return a 400 Bad Request response
    if (inviteError) {
      return NextResponse.json(
        { error: inviteError.message },
        { status: 400 }
      );
    }

    // Store the invited user's ID
    invitedUserId = inviteData.user?.id ?? null;

    // If no user ID is returned, return a 500 Internal Server Error response
    if (!invitedUserId) {
      return NextResponse.json(
        { error: "Supabase created no client user ID." },
        { status: 500 }
      );
    }

    // Call the RPC function to create the POS client in the database
    const { data: businessRows, error: businessError } = await supabase.rpc("admin_create_pos_client", {
      p_client_user_id: invitedUserId,
      p_business_name: businessName,
      p_business_type: businessType,
      p_branch_name: branchName,
      p_manager_name: managerName,
      p_manager_pin: managerPin,
    });

    // If the database transaction fails, delete the invited user and return an error
    if (businessError) {
      await adminSupabase.auth.admin.deleteUser(invitedUserId); // Rollback the user creation
      invitedUserId = null;
      return NextResponse.json(
        { error: businessError.message },
        { status: 400 }
      );
    }

    // Extract the created business details
    const business = Array.isArray(businessRows) ? businessRows[0] : null;

    // Return a success response with the created business details
    return NextResponse.json(
      {
        success: true,
        business: {
          id: business?.business_id ?? null,
          name: business?.business_name ?? businessName,
          template: business?.pos_template ?? businessType,
        },
        invitationSentTo: clientEmail,
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle unexpected errors and return a 500 Internal Server Error response
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create the client.",
      },
      { status: 500 }
    );
  }
}