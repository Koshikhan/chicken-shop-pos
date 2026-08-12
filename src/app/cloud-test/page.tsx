import {
    redirect,
  } from "next/navigation";
  
  import {
    createClient,
  } from "@/lib/supabase/server";
  
  export default async function CloudTestPage() {
    const supabase =
      await createClient();
  
    // ---------------------------------------------
    // 1. Find the currently logged-in Supabase user
    // ---------------------------------------------
  
    const {
      data: claimsData,
    } =
      await supabase.auth.getClaims();
  
    const userId =
      claimsData?.claims?.sub;
  
    if (!userId) {
      redirect("/login");
    }
  
    // ---------------------------------------------
    // 2. Find which business this user belongs to
    // ---------------------------------------------
  
    const {
      data: membership,
      error: membershipError,
    } =
      await supabase
        .from(
          "business_memberships",
        )
        .select(
          "business_id, role, default_location_id",
        )
        .eq(
          "user_id",
          userId,
        )
        .eq(
          "is_active",
          true,
        )
        .limit(1)
        .maybeSingle();
  
    if (
      membershipError ||
      !membership
    ) {
      return (
        <main className="p-10">
          <h1 className="text-2xl font-bold text-red-600">
            Membership error
          </h1>
  
          <pre className="mt-4">
            {JSON.stringify(
              membershipError,
              null,
              2,
            )}
          </pre>
        </main>
      );
    }
  
    // ---------------------------------------------
    // 3. Load business
    // ---------------------------------------------
  
    const {
      data: business,
      error: businessError,
    } =
      await supabase
        .from("businesses")
        .select(
          "id, name, slug, currency",
        )
        .eq(
          "id",
          membership.business_id,
        )
        .single();
  
    if (
      businessError ||
      !business
    ) {
      return (
        <main className="p-10">
          <h1 className="text-2xl font-bold text-red-600">
            Business error
          </h1>
  
          <pre className="mt-4">
            {JSON.stringify(
              businessError,
              null,
              2,
            )}
          </pre>
        </main>
      );
    }
  
    // ---------------------------------------------
    // 4. Load branch
    // ---------------------------------------------
  
    const {
      data: location,
      error: locationError,
    } =
      await supabase
        .from("locations")
        .select(
          "id, name, code",
        )
        .eq(
          "id",
          membership.default_location_id,
        )
        .single();
  
    if (
      locationError ||
      !location
    ) {
      return (
        <main className="p-10">
          <h1 className="text-2xl font-bold text-red-600">
            Branch error
          </h1>
  
          <pre className="mt-4">
            {JSON.stringify(
              locationError,
              null,
              2,
            )}
          </pre>
        </main>
      );
    }
  
    // ---------------------------------------------
    // 5. Load products
    // ---------------------------------------------
  
    const {
      data: products,
      error: productsError,
    } =
      await supabase
        .from("products")
        .select(
          `
          id,
          name,
          description,
          price,
          emoji,
          available,
          track_stock,
          low_stock_threshold,
          category_id
          `,
        )
        .eq(
          "business_id",
          business.id,
        )
        .eq(
          "is_active",
          true,
        )
        .order("name");
  
    if (productsError) {
      return (
        <main className="p-10">
          <h1 className="text-2xl font-bold text-red-600">
            Product error
          </h1>
  
          <pre className="mt-4">
            {JSON.stringify(
              productsError,
              null,
              2,
            )}
          </pre>
        </main>
      );
    }
  
    // ---------------------------------------------
    // 6. Load inventory for the Main Branch
    // ---------------------------------------------
  
    const {
      data: inventory,
      error: inventoryError,
    } =
      await supabase
        .from("inventory")
        .select(
          "product_id, stock_quantity",
        )
        .eq(
          "location_id",
          location.id,
        );
  
    if (inventoryError) {
      return (
        <main className="p-10">
          <h1 className="text-2xl font-bold text-red-600">
            Inventory error
          </h1>
  
          <pre className="mt-4">
            {JSON.stringify(
              inventoryError,
              null,
              2,
            )}
          </pre>
        </main>
      );
    }
  
    // ---------------------------------------------
    // 7. Combine product information with stock
    // ---------------------------------------------
  
    const productsWithStock =
      (products ?? []).map(
        (product) => {
          const stockRecord =
            inventory?.find(
              (item) =>
                item.product_id ===
                product.id,
            );
  
          return {
            ...product,
  
            stockQuantity:
              stockRecord?.stock_quantity ??
              0,
          };
        },
      );
  
    // ---------------------------------------------
    // 8. Display cloud data
    // ---------------------------------------------
  
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 rounded-3xl bg-slate-950 p-8 text-white">
            <p className="text-sm font-bold uppercase tracking-widest text-orange-500">
              Cloud connection test
            </p>
  
            <h1 className="mt-2 text-3xl font-black">
              {business.name}
            </h1>
  
            <p className="mt-2 text-slate-300">
              {location.name}
              {" • "}
              {membership.role}
            </p>
          </div>
  
          <div className="overflow-hidden rounded-3xl bg-white shadow">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-4 text-left">
                    Product
                  </th>
  
                  <th className="p-4 text-left">
                    Price
                  </th>
  
                  <th className="p-4 text-left">
                    Stock
                  </th>
  
                  <th className="p-4 text-left">
                    Available
                  </th>
                </tr>
              </thead>
  
              <tbody>
                {productsWithStock.map(
                  (product) => (
                    <tr
                      key={product.id}
                      className="border-t"
                    >
                      <td className="p-4 font-bold">
                        {product.emoji}
                        {" "}
                        {product.name}
                      </td>
  
                      <td className="p-4">
                        £
                        {Number(
                          product.price,
                        ).toFixed(2)}
                      </td>
  
                      <td className="p-4">
                        {
                          product.stockQuantity
                        }
                      </td>
  
                      <td className="p-4">
                        {product.available
                          ? "Yes"
                          : "No"}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    );
  }