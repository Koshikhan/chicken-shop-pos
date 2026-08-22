"use client"; // Indicates this is a client-side component

// Import necessary modules and components
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AddClientModal } from "@/components/AddClientModal";
import { listPlatformBusinesses, type PlatformBusinessSummary } from "@/lib/cloudPlatformAdmin";
import { createClient } from "@/lib/supabase/client";

// Helper function to map POS template values to user-friendly labels
function getTemplateLabel(value: string) {
  switch (value) {
    case "DELI":
      return "Deli";
    case "RESTAURANT":
      return "Restaurant";
    case "RETAIL":
      return "Retail";
    default:
      return "Fast Food"; // Default label
  }
}

// Main component for the Admin Dashboard
export function AdminDashboard() {
  const router = useRouter();

  // State variables for managing businesses, loading, errors, and modal visibility
  const [businesses, setBusinesses] = useState<PlatformBusinessSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);

  // Function to load platform businesses
  const loadBusinesses = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const rows = await listPlatformBusinesses(); // Fetch businesses from the API
      setBusinesses(rows); // Update state with fetched businesses
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load platform businesses."
      );
    } finally {
      setIsLoading(false); // Set loading to false after fetching
    }
  }, []);

  // Effect to load businesses when the component mounts
  useEffect(() => {
    void loadBusinesses();
  }, [loadBusinesses]);

  // Memoized summary of businesses by template type
  const summary = useMemo(
    () => ({
      total: businesses.length,
      fastFood: businesses.filter((business) => business.posTemplate === "FAST_FOOD").length,
      deli: businesses.filter((business) => business.posTemplate === "DELI").length,
      other: businesses.filter(
        (business) => !["FAST_FOOD", "DELI"].includes(business.posTemplate)
      ).length,
    }),
    [businesses]
  );

  // Function to sign out the admin
  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut(); // Sign out the user
    window.sessionStorage.clear(); // Clear session storage
    router.replace("/login"); // Redirect to login page
    router.refresh(); // Refresh the page
  };

  // Callback for when a client is successfully created
  const handleClientCreated = (businessName: string) => {
    setIsAddClientOpen(false); // Close the modal
    setSuccessMessage(`${businessName} was created and the client invitation was sent.`); // Show success message
    void loadBusinesses(); // Reload businesses
  };

  return (
    <>
      {/* Main content */}
      <main className="min-h-screen bg-slate-100 text-slate-950">
        {/* Header */}
        <header className="bg-slate-950 px-6 py-5 text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-400">
                KAY POS
              </p>
              <h1 className="mt-1 text-2xl font-black">Platform Admin</h1>
            </div>
            <button
              type="button"
              onClick={() => {
                void signOut();
              }}
              className="rounded-xl bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/20"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Dashboard content */}
        <div className="mx-auto max-w-7xl p-6">
          {/* Success message */}
          {successMessage && (
            <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-bold text-emerald-800">{successMessage}</p>
              <button
                type="button"
                onClick={() => setSuccessMessage("")}
                className="font-black text-emerald-700"
              >
                ×
              </button>
            </div>
          )}

          {/* Business summary cards */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-sm font-bold text-slate-400">Client businesses</p>
              <p className="mt-3 text-4xl font-black">{summary.total}</p>
            </article>
            <article className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
              <p className="text-sm font-bold text-orange-700">Fast Food</p>
              <p className="mt-3 text-4xl font-black text-orange-950">{summary.fastFood}</p>
            </article>
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-bold text-emerald-700">Deli</p>
              <p className="mt-3 text-4xl font-black text-emerald-950">{summary.deli}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-bold text-slate-500">Other templates</p>
              <p className="mt-3 text-4xl font-black">{summary.other}</p>
            </article>
          </section>

          {/* Business list */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">
                  Clients
                </p>
                <h2 className="mt-1 text-2xl font-black">Businesses</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSuccessMessage("");
                  setIsAddClientOpen(true);
                }}
                className="rounded-xl bg-orange-500 px-5 py-3 font-black text-white transition hover:bg-orange-600"
              >
                + Add Client
              </button>
            </div>

            {/* Error message */}
            {error && (
              <p className="m-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>
            )}

            {/* Loading or business table */}
            {isLoading ? (
              <p className="p-10 text-center font-bold text-slate-500">Loading businesses...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Business</th>
                      <th className="px-5 py-4">Template</th>
                      <th className="px-5 py-4">Branches</th>
                      <th className="px-5 py-4">Active staff</th>
                      <th className="px-5 py-4">Login accounts</th>
                      <th className="px-5 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {businesses.map((business) => (
                      <tr key={business.businessId} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <p className="font-black">{business.businessName}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">{business.slug}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                            {getTemplateLabel(business.posTemplate)}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-bold">{business.locationsCount}</td>
                        <td className="px-5 py-4 font-bold">{business.staffCount}</td>
                        <td className="px-5 py-4 font-bold">{business.membersCount}</td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/businesses/${business.businessId}`}
                            className="inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* No businesses message */}
                {businesses.length === 0 && (
                  <p className="p-10 text-center text-slate-500">No businesses have been created yet.</p>
                )}
              </div>
            )}
          </section>

          {/* Platform-controlled onboarding message */}
          <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="font-black text-blue-950">Platform-controlled onboarding</p>
            <p className="mt-2 text-sm leading-6 text-blue-800">
              Only a KAY POS platform administrator can create a new business and choose
              its POS template. Clients sign in to the business that has been assigned
              to them.
            </p>
          </section>
        </div>
      </main>

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onCreated={handleClientCreated}
      />
    </>
  );
}