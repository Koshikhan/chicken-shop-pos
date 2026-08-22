"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getPlatformBusinessDetails,
  setPlatformBusinessStatus,
  type PlatformBusinessDetails,
} from "@/lib/cloudPlatformAdmin";

type Props = { businessId: string };

function templateLabel(value: string) {
  if (value === "DELI") return "Deli";
  if (value === "RESTAURANT") return "Restaurant";
  if (value === "RETAIL") return "Retail";
  return "Fast Food";
}

export function PlatformBusinessManager({ businessId }: Props) {
  const [details, setDetails] = useState<PlatformBusinessDetails | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getPlatformBusinessDetails(businessId)
      .then((result) => { if (!cancelled) setDetails(result); })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load client."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [businessId]);

  const changeBusinessStatus =
    async () => {
      if (!details) {
        return;
      }

      const nextStatus =
        details.business.businessStatus ===
          "ACTIVE"
          ? "SUSPENDED"
          : "ACTIVE";

      const actionLabel =
        nextStatus ===
          "SUSPENDED"
          ? "suspend"
          : "reactivate";

      const confirmed =
        window.confirm(
          `${actionLabel === "suspend" ? "Suspend" : "Reactivate"} ${details.business.name}?\n\n${
            nextStatus === "SUSPENDED"
              ? "The client will be blocked from normal POS access. No business data will be deleted."
              : "The client will be allowed to use their POS again."
          }`,
        );

      if (!confirmed) {
        return;
      }

      setStatusError("");
      setIsChangingStatus(true);

      try {
        const savedStatus =
          await setPlatformBusinessStatus(
            businessId,
            nextStatus,
          );

        setDetails(
          (current) =>
            current
              ? {
                  ...current,
                  business: {
                    ...current.business,
                    businessStatus:
                      savedStatus,
                  },
                }
              : current,
        );
      } catch (statusChangeError) {
        setStatusError(
          statusChangeError instanceof Error
            ? statusChangeError.message
            : "Unable to change client status.",
        );
      } finally {
        setIsChangingStatus(false);
      }
    };

  if (loading) return <main className="min-h-screen bg-slate-100 p-8 font-bold text-slate-500">Loading client...</main>;

  if (!details || error) {
    return <main className="min-h-screen bg-slate-100 p-8">
      <Link href="/admin" className="font-black text-orange-600">← Back to Admin</Link>
      <p className="mt-6 rounded-2xl bg-red-50 p-5 font-bold text-red-700">{error || "Unable to load client."}</p>
    </main>;
  }

  const { business, locations, staff, members, counts } = details;
  const address = [business.addressLine1, business.addressLine2, business.city, business.postcode].filter(Boolean).join(", ") || "—";

  return <main className="min-h-screen bg-slate-100 text-slate-950">
    <header className="bg-slate-950 px-6 py-5 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[0.35em] text-orange-400">KAY POS</p><h1 className="mt-1 text-2xl font-black">Client Management</h1></div>
        <Link href="/admin" className="rounded-xl bg-white/10 px-4 py-3 text-sm font-black">← Platform Admin</Link>
      </div>
    </header>

    <div className="mx-auto max-w-7xl p-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">Client Business</p><h2 className="mt-2 text-3xl font-black">{business.name}</h2><p className="mt-2 text-sm font-semibold text-slate-400">{business.slug}</p></div>
          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4"><p className="text-xs font-black uppercase text-orange-600">POS Template</p><p className="mt-1 text-xl font-black">{templateLabel(business.posTemplate)}</p><p className="mt-1 text-xs font-bold text-orange-700">Platform controlled</p></div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl bg-slate-950 p-5 text-white"><p className="text-sm font-bold text-slate-400">Branches</p><p className="mt-3 text-4xl font-black">{counts.locations}</p></article>
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="text-sm font-bold text-emerald-700">Active staff</p><p className="mt-3 text-4xl font-black">{counts.activeStaff}</p></article>
        <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><p className="text-sm font-bold text-blue-700">Login accounts</p><p className="mt-3 text-4xl font-black">{counts.activeLoginAccounts}</p></article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">Business details</h3>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs font-bold uppercase text-slate-400">Business type</dt><dd className="mt-1 font-black">{templateLabel(business.businessType)}</dd></div>
            <div><dt className="text-xs font-bold uppercase text-slate-400">Currency</dt><dd className="mt-1 font-black">{business.currency || "—"}</dd></div>
            <div><dt className="text-xs font-bold uppercase text-slate-400">Country</dt><dd className="mt-1 font-black">{business.country || "—"}</dd></div>
            <div><dt className="text-xs font-bold uppercase text-slate-400">Timezone</dt><dd className="mt-1 font-black">{business.timezone || "—"}</dd></div>
            <div><dt className="text-xs font-bold uppercase text-slate-400">VAT registered</dt><dd className="mt-1 font-black">{business.vatRegistered ? "Yes" : "No"}</dd></div>
            <div><dt className="text-xs font-bold uppercase text-slate-400">VAT number</dt><dd className="mt-1 font-black">{business.vatNumber || "—"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs font-bold uppercase text-slate-400">Phone</dt><dd className="mt-1 font-black">{business.phone || "—"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs font-bold uppercase text-slate-400">Address</dt><dd className="mt-1 font-black">{address}</dd></div>
          </dl>
        </article>
        <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <h3 className="text-xl font-black text-blue-950">
            Platform controls
          </h3>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/80 p-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Client status
              </p>

              <p className={`mt-1 text-lg font-black ${
                business.businessStatus === "ACTIVE"
                  ? "text-emerald-700"
                  : "text-red-700"
              }`}>
                {
                  business.businessStatus
                }
              </p>
            </div>

            <button
              type="button"
              disabled={isChangingStatus}
              onClick={() => {
                void changeBusinessStatus();
              }}
              className={`rounded-xl px-4 py-3 text-sm font-black text-white transition disabled:opacity-50 ${
                business.businessStatus === "ACTIVE"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {isChangingStatus
                ? "Saving..."
                : business.businessStatus === "ACTIVE"
                  ? "Suspend Client"
                  : "Reactivate Client"}
            </button>
          </div>

          {statusError && (
            <p className="mt-4 rounded-xl bg-red-100 p-3 text-sm font-bold text-red-700">
              {
                statusError
              }
            </p>
          )}

          <p className="mt-4 text-sm font-semibold leading-6 text-blue-900">
            The client can operate
            their assigned POS, but
            cannot change the POS
            template, create another
            business, or access
            Platform Admin.
          </p>

          <p className="mt-3 text-sm font-semibold leading-6 text-blue-900">
            Suspending a client
            blocks normal POS access
            without deleting products,
            orders, inventory, staff or
            reports.
          </p>
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b p-5"><h3 className="text-xl font-black">Branches</h3></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-4">Branch</th><th className="px-5 py-4">Code</th></tr></thead><tbody className="divide-y">{locations.map((x)=><tr key={x.id}><td className="px-5 py-4 font-black">{x.name}</td><td className="px-5 py-4 font-bold">{x.code}</td></tr>)}</tbody></table></div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b p-5"><h3 className="text-xl font-black">Client login accounts</h3></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-4">Email</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Default branch</th><th className="px-5 py-4">Status</th></tr></thead><tbody className="divide-y">{members.map((x)=><tr key={x.userId}><td className="px-5 py-4 font-black">{x.email}</td><td className="px-5 py-4 font-bold">{x.role}</td><td className="px-5 py-4 font-bold">{x.defaultLocationName || "—"}</td><td className="px-5 py-4 font-black">{x.isActive ? "ACTIVE" : "INACTIVE"}</td></tr>)}</tbody></table></div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b p-5"><h3 className="text-xl font-black">Till staff</h3></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-4">Name</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Branch</th><th className="px-5 py-4">Status</th></tr></thead><tbody className="divide-y">{staff.map((x)=><tr key={x.id}><td className="px-5 py-4 font-black">{x.name}</td><td className="px-5 py-4 font-bold">{x.role}</td><td className="px-5 py-4 font-bold">{x.locationName || "—"}</td><td className="px-5 py-4 font-black">{x.isActive ? "ACTIVE" : "INACTIVE"}</td></tr>)}</tbody></table></div>
      </section>
    </div>
  </main>;
}
