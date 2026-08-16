"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getPosTemplateLabel,
  updateCloudBusinessSettings,
  type BusinessType,
  type CloudBusinessSettings,
  type PosTemplate,
} from "@/lib/cloudBusiness";

import type {
  StaffMember,
} from "@/lib/staffStorage";

type BusinessSettingsModalProps = {
  isOpen: boolean;

  settings:
    CloudBusinessSettings | null;

  activeStaff:
    StaffMember | null;

  onSettingsChange: (
    settings:
      CloudBusinessSettings,
  ) => void;

  onClose: () => void;
};

type BusinessSettingsForm = {
  businessName: string;
  businessType:
    BusinessType;
  posTemplate:
    PosTemplate;
  receiptName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  vatRegistered: boolean;
  vatNumber: string;
};

const templateOptions:
  Array<{
    value: PosTemplate;
    title: string;
    description: string;
  }> = [
    {
      value: "FAST_FOOD",
      title: "Fast Food",
      description:
        "Quick product grid for chicken shops, takeaways and burger shops.",
    },
    {
      value: "DELI",
      title: "Deli",
      description:
        "Sandwiches, paninis, salads and configurable product options.",
    },
    {
      value: "RESTAURANT",
      title: "Restaurant",
      description:
        "Table-service layout for restaurants and cafés.",
    },
    {
      value: "RETAIL",
      title: "Retail",
      description:
        "Barcode and product-first layout for shops.",
    },
  ];

function settingsToForm(
  settings:
    CloudBusinessSettings,
): BusinessSettingsForm {
  return {
    businessName:
      settings.businessName,

    businessType:
      settings.businessType,

    posTemplate:
      settings.posTemplate,

    receiptName:
      settings.receiptName,

    phone:
      settings.phone,

    addressLine1:
      settings.addressLine1,

    addressLine2:
      settings.addressLine2,

    city:
      settings.city,

    postcode:
      settings.postcode,

    vatRegistered:
      settings.vatRegistered,

    vatNumber:
      settings.vatNumber,
  };
}

export function BusinessSettingsModal({
  isOpen,
  settings,
  activeStaff,
  onSettingsChange,
  onClose,
}: BusinessSettingsModalProps) {
  const [
    form,
    setForm,
  ] =
    useState<
      BusinessSettingsForm | null
    >(null);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  useEffect(() => {
    if (
      !isOpen ||
      !settings
    ) {
      return;
    }

    setForm(
      settingsToForm(
        settings,
      ),
    );

    setError("");
    setSuccess("");
  }, [
    isOpen,
    settings,
  ]);

  if (!isOpen) {
    return null;
  }

  if (
    !settings ||
    !form
  ) {
    return (
      <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
        <div className="rounded-3xl bg-white p-8 font-bold text-slate-600 shadow-2xl">
          Loading business
          settings...
        </div>
      </div>
    );
  }

  const updateForm = <
    Key extends keyof BusinessSettingsForm,
  >(
    key: Key,
    value:
      BusinessSettingsForm[Key],
  ) => {
    setForm(
      (current) =>
        current
          ? {
              ...current,
              [key]: value,
            }
          : current,
    );

    setError("");
    setSuccess("");
  };

  const saveSettings =
    async () => {
      if (
        !activeStaff ||
        activeStaff.role !==
          "Manager"
      ) {
        setError(
          "A Manager must be signed in to change business settings.",
        );

        return;
      }

      const businessName =
        form.businessName.trim();

      if (!businessName) {
        setError(
          "Enter the business name.",
        );

        return;
      }

      setIsSaving(
        true,
      );

      setError("");
      setSuccess("");

      try {
        const saved =
          await updateCloudBusinessSettings(
            {
              businessName,

              businessType:
                form.businessType,

              posTemplate:
                form.posTemplate,

              receiptName:
                form.receiptName.trim(),

              phone:
                form.phone.trim(),

              addressLine1:
                form.addressLine1.trim(),

              addressLine2:
                form.addressLine2.trim(),

              city:
                form.city.trim(),

              postcode:
                form.postcode.trim(),

              vatRegistered:
                form.vatRegistered,

              vatNumber:
                form.vatNumber.trim(),
            },
          );

        onSettingsChange(
          saved,
        );

        setForm(
          settingsToForm(
            saved,
          ),
        );

        setSuccess(
          `Business settings saved. POS template: ${getPosTemplateLabel(
            saved.posTemplate,
          )}.`,
        );
      } catch (
        saveError
      ) {
        setError(
          saveError instanceof
            Error
            ? saveError.message
            : "Unable to save business settings.",
        );
      } finally {
        setIsSaving(
          false,
        );
      }
    };

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Business settings"
    >
      <section className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-slate-100 shadow-2xl">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-white p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
              Configuration
            </p>

            <h2 className="mt-1 text-3xl font-black text-slate-950">
              Business Settings
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Branding and POS
              template are stored
              per business.
            </p>
          </div>

          <button
            type="button"
            disabled={
              isSaving
            }
            onClick={
              onClose
            }
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500 transition hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
            aria-label="Close business settings"
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {error && (
            <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
              {error}
            </p>
          )}

          {success && (
            <p className="mb-4 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700">
              {success}
            </p>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
                Business
              </p>

              <h3 className="mt-1 text-xl font-black">
                Identity
              </h3>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Business name
                  </span>

                  <input
                    type="text"
                    value={
                      form.businessName
                    }
                    disabled={
                      isSaving
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        "businessName",
                        event.target
                          .value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500 disabled:bg-slate-100"
                  />
                </label>

                <div className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Business type
                  </span>

                  <div className="mt-2 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-800">
                    {getPosTemplateLabel(
                      form.posTemplate,
                    )}
                  </div>

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Business type is
                    selected during
                    onboarding. Changing
                    it later requires a
                    controlled template
                    migration.
                  </p>
                </div>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Receipt name
                  </span>

                  <input
                    type="text"
                    value={
                      form.receiptName
                    }
                    disabled={
                      isSaving
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        "receiptName",
                        event.target
                          .value,
                      )
                    }
                    placeholder="Optional"
                    className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500 disabled:bg-slate-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Phone
                  </span>

                  <input
                    type="text"
                    value={
                      form.phone
                    }
                    disabled={
                      isSaving
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        "phone",
                        event.target
                          .value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500 disabled:bg-slate-100"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
                Layout
              </p>

              <h3 className="mt-1 text-xl font-black">
                POS Template
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                This determines
                which cashier layout
                is loaded for the
                business.
              </p>

              <div className="mt-5 rounded-2xl border-2 border-orange-300 bg-orange-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-slate-950">
                      {getPosTemplateLabel(
                        form.posTemplate,
                      )}
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      This template was
                      chosen during
                      business onboarding
                      and loads
                      automatically when
                      the business signs
                      in.
                    </p>
                  </div>

                  <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-white">
                    Active
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
                Address
              </p>

              <h3 className="mt-1 text-xl font-black">
                Receipt Address
              </h3>

              <div className="mt-5 space-y-4">
                <input
                  type="text"
                  value={
                    form.addressLine1
                  }
                  disabled={
                    isSaving
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "addressLine1",
                      event.target
                        .value,
                    )
                  }
                  placeholder="Address line 1"
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500 disabled:bg-slate-100"
                />

                <input
                  type="text"
                  value={
                    form.addressLine2
                  }
                  disabled={
                    isSaving
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "addressLine2",
                      event.target
                        .value,
                    )
                  }
                  placeholder="Address line 2"
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500 disabled:bg-slate-100"
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={
                      form.city
                    }
                    disabled={
                      isSaving
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        "city",
                        event.target
                          .value,
                      )
                    }
                    placeholder="City"
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500 disabled:bg-slate-100"
                  />

                  <input
                    type="text"
                    value={
                      form.postcode
                    }
                    disabled={
                      isSaving
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        "postcode",
                        event.target
                          .value,
                      )
                    }
                    placeholder="Postcode"
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 uppercase outline-none focus:border-orange-500 disabled:bg-slate-100"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
                Tax
              </p>

              <h3 className="mt-1 text-xl font-black">
                VAT Details
              </h3>

              <label className="mt-5 flex items-center justify-between rounded-xl bg-slate-100 p-4">
                <div>
                  <p className="font-bold text-slate-950">
                    VAT registered
                  </p>

                  <p className="text-xs text-slate-500">
                    Store the
                    business VAT
                    registration
                    details.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    form.vatRegistered
                  }
                  disabled={
                    isSaving
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "vatRegistered",
                      event.target
                        .checked,
                    )
                  }
                  className="h-6 w-6 accent-orange-500"
                />
              </label>

              {form.vatRegistered && (
                <label className="mt-4 block">
                  <span className="text-sm font-bold text-slate-700">
                    VAT number
                  </span>

                  <input
                    type="text"
                    value={
                      form.vatNumber
                    }
                    disabled={
                      isSaving
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        "vatNumber",
                        event.target
                          .value,
                      )
                    }
                    placeholder="GB..."
                    className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500 disabled:bg-slate-100"
                  />
                </label>
              )}

              <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-bold text-blue-900">
                  Current branch
                </p>

                <p className="mt-1 text-sm text-blue-700">
                  {settings.locationName}
                  {" · "}
                  {settings.locationCode}
                </p>
              </div>
            </section>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-500">
            The actual Deli
            cashier layout is the
            next build step.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={
                isSaving
              }
              onClick={
                onClose
              }
              className="rounded-xl bg-slate-100 px-5 py-3 font-bold text-slate-700"
            >
              Close
            </button>

            <button
              type="button"
              disabled={
                isSaving
              }
              onClick={() => {
                void saveSettings();
              }}
              className="rounded-xl bg-orange-500 px-6 py-3 font-black text-white transition hover:bg-orange-600 disabled:bg-slate-300"
            >
              {isSaving
                ? "Saving..."
                : "Save business settings"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
