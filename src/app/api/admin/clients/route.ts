import {
    NextRequest,
    NextResponse,
  } from "next/server";
  
  import {
    createClient,
  } from "@/lib/supabase/server";
  
  import {
    createSupabaseAdminClient,
  } from "@/lib/supabase/admin";
  
  export const runtime =
    "nodejs";
  
  const ALLOWED_TEMPLATES =
    new Set([
      "FAST_FOOD",
      "DELI",
      "RESTAURANT",
      "RETAIL",
    ]);
  
  type CreateClientPayload = {
    businessName?: unknown;
    clientEmail?: unknown;
    businessType?: unknown;
    branchName?: unknown;
    managerName?: unknown;
    managerPin?: unknown;
  };
  
  function readText(
    value: unknown,
  ) {
    return typeof value ===
      "string"
      ? value.trim()
      : "";
  }
  
  function isEmail(
    value: string,
  ) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value,
    );
  }
  
  export async function POST(
    request: NextRequest,
  ) {
    let invitedUserId:
      | string
      | null = null;
  
    try {
      const supabase =
        await createClient();
  
      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth.getUser();
  
      if (
        userError ||
        !userData.user
      ) {
        return NextResponse.json(
          {
            error:
              "You must sign in as a platform administrator.",
          },
          {
            status: 401,
          },
        );
      }
  
      const {
        data: isAdmin,
        error:
          adminCheckError,
      } =
        await supabase.rpc(
          "is_pos_platform_admin",
        );
  
      if (
        adminCheckError ||
        !isAdmin
      ) {
        return NextResponse.json(
          {
            error:
              "Platform administrator access required.",
          },
          {
            status: 403,
          },
        );
      }
  
      const payload =
        (await request.json()) as
          CreateClientPayload;
  
      const businessName =
        readText(
          payload.businessName,
        );
  
      const clientEmail =
        readText(
          payload.clientEmail,
        ).toLowerCase();
  
      const businessType =
        readText(
          payload.businessType,
        ).toUpperCase();
  
      const branchName =
        readText(
          payload.branchName,
        );
  
      const managerName =
        readText(
          payload.managerName,
        );
  
      const managerPin =
        readText(
          payload.managerPin,
        );
  
      if (!businessName) {
        return NextResponse.json(
          {
            error:
              "Enter the business name.",
          },
          {
            status: 400,
          },
        );
      }
  
      if (
        !clientEmail ||
        !isEmail(
          clientEmail,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Enter a valid client email address.",
          },
          {
            status: 400,
          },
        );
      }
  
      if (
        !ALLOWED_TEMPLATES.has(
          businessType,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Choose a valid POS template.",
          },
          {
            status: 400,
          },
        );
      }
  
      if (!branchName) {
        return NextResponse.json(
          {
            error:
              "Enter the first branch name.",
          },
          {
            status: 400,
          },
        );
      }
  
      if (!managerName) {
        return NextResponse.json(
          {
            error:
              "Enter the manager name.",
          },
          {
            status: 400,
          },
        );
      }
  
      if (
        !/^\d{4}$/.test(
          managerPin,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Manager PIN must contain exactly 4 digits.",
          },
          {
            status: 400,
          },
        );
      }
  
      const adminSupabase =
        createSupabaseAdminClient();
  
      const configuredSiteUrl =
        process.env.NEXT_PUBLIC_SITE_URL
          ?.trim()
          .replace(
            /\/+$/,
            "",
          );
  
      const siteUrl =
        configuredSiteUrl ||
        request.nextUrl.origin;
  
      const redirectTo =
        `${siteUrl}/auth/callback?next=/update-password`;
  
      const {
        data: inviteData,
        error: inviteError,
      } =
        await adminSupabase.auth.admin
          .inviteUserByEmail(
            clientEmail,
            {
              redirectTo,
              data: {
                name:
                  managerName,
                business_name:
                  businessName,
                invited_by:
                  "KAY POS",
              },
            },
          );
  
      if (inviteError) {
        return NextResponse.json(
          {
            error:
              inviteError.message,
          },
          {
            status: 400,
          },
        );
      }
  
      invitedUserId =
        inviteData.user?.id ??
        null;
  
      if (!invitedUserId) {
        return NextResponse.json(
          {
            error:
              "Supabase created no client user ID.",
          },
          {
            status: 500,
          },
        );
      }
  
      const {
        data: businessRows,
        error:
          businessError,
      } =
        await supabase.rpc(
          "admin_create_pos_client",
          {
            p_client_user_id:
              invitedUserId,
            p_business_name:
              businessName,
            p_business_type:
              businessType,
            p_branch_name:
              branchName,
            p_manager_name:
              managerName,
            p_manager_pin:
              managerPin,
          },
        );
  
      if (businessError) {
        // Keep Auth + POS data consistent.
        // If the database transaction fails, remove the newly invited Auth user.
        await adminSupabase.auth.admin
          .deleteUser(
            invitedUserId,
          );
  
        invitedUserId =
          null;
  
        return NextResponse.json(
          {
            error:
              businessError.message,
          },
          {
            status: 400,
          },
        );
      }
  
      const business =
        Array.isArray(
          businessRows,
        )
          ? businessRows[0]
          : null;
  
      return NextResponse.json(
        {
          success: true,
          business: {
            id:
              business?.business_id ??
              null,
            name:
              business?.business_name ??
              businessName,
            template:
              business?.pos_template ??
              businessType,
          },
          invitationSentTo:
            clientEmail,
        },
        {
          status: 201,
        },
      );
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Unable to create the client.",
        },
        {
          status: 500,
        },
      );
    }
  }
  