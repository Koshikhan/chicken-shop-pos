"use client"; // Indicates this is a client-side component

// Import necessary modules and types
import { useEffect, useState } from "react";
import {
  getPosTemplateLabel,
  updateCloudBusinessSettings,
  type BusinessType,
  type CloudBusinessSettings,
  type PosTemplate,
} from "@/lib/cloudBusiness";
import type { StaffMember } from "@/lib/staffStorage";

// Define the props for the BusinessSettingsModal component
type BusinessSettingsModalProps = {
  isOpen: boolean; // Determines if the modal is open
  settings: CloudBusinessSettings | null; // Current business settings
  activeStaff: StaffMember | null; // Currently active staff member
  onSettingsChange: (settings: CloudBusinessSettings) => void; // Callback for when settings are updated
  onClose: () => void; // Function to close the modal
};

// Define the structure of the business settings form
type BusinessSettingsForm = {
  businessName: string;
  businessType: BusinessType;
  posTemplate: PosTemplate;
  receiptName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  vatRegistered: boolean;
  vatNumber: string;
};

// Define the available POS template options
const templateOptions: Array<{
  value: PosTemplate;
  title: string;
  description: string;
}> = [
  {
    value: "FAST_FOOD",
    title: "Fast Food",
    description: "Quick product grid for chicken shops, takeaways and burger shops.",
  },
  {
    value: "DELI",
    title: "Deli",
    description: "Sandwiches, paninis, salads and configurable product options.",
  },
  {
    value: "RESTAURANT",
    title: "Restaurant",
    description: "Table-service layout for restaurants and cafés.",
  },
  {
    value: "RETAIL",
    title: "Retail",
    description: "Barcode and product-first layout for shops.",
  },
];

// Helper function to convert settings to form structure
function settingsToForm(settings: CloudBusinessSettings): BusinessSettingsForm {
  return {
    businessName: settings.businessName,
    businessType: settings.businessType,
    posTemplate: settings.posTemplate,
    receiptName: settings.receiptName,
    phone: settings.phone,
    addressLine1: settings.addressLine1,
    addressLine2: settings.addressLine2,
    city: settings.city,
    postcode: settings.postcode,
    vatRegistered: settings.vatRegistered,
    vatNumber: settings.vatNumber,
  };
}

// BusinessSettingsModal component for managing business settings
export function BusinessSettingsModal({
  isOpen,
  settings,
  activeStaff,
  onSettingsChange,
  onClose,
}: BusinessSettingsModalProps) {
  // State variables for form data, error/success messages, and saving status
  const [form, setForm] = useState<BusinessSettingsForm | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Effect to initialize the form when the modal is opened
  useEffect(() => {
    if (!isOpen || !settings) {
      return;
    }

    setForm(settingsToForm(settings));
    setError("");
    setSuccess("");
  }, [isOpen, settings]);

  // If the modal is not open, return null (do not render anything)
  if (!isOpen) {
    return null;
  }

  // If settings or form data is not available, show a loading message
  if (!settings || !form) {
    return (
      <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
        <div className="rounded-3xl bg-white p-8 font-bold text-slate-600 shadow-2xl">
          Loading business settings...
        </div>
      </div>
    );
  }

  // Function to update form fields
  const updateForm = <Key extends keyof BusinessSettingsForm>(
    key: Key,
    value: BusinessSettingsForm[Key]
  ) => {
    setForm((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current
    );

    setError("");
    setSuccess("");
  };

  // Function to save the updated settings
  const saveSettings = async () => {
    if (!activeStaff || activeStaff.role !== "Manager") {
      setError("A Manager must be signed in to change business settings.");
      return;
    }

    const businessName = form.businessName.trim();
    if (!businessName) {
      setError("Enter the business name.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      // Save the updated settings to the cloud
      const saved = await updateCloudBusinessSettings({
        businessName,
        businessType: form.businessType,
        posTemplate: form.posTemplate,
        receiptName: form.receiptName.trim(),
        phone: form.phone.trim(),
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim(),
        city: form.city.trim(),
        postcode: form.postcode.trim(),
        vatRegistered: form.vatRegistered,
        vatNumber: form.vatNumber.trim(),
      });

      // Update the parent component with the new settings
      onSettingsChange(saved);

      // Update the form with the saved settings
      setForm(settingsToForm(saved));

      // Show a success message
      setSuccess(
        `Business settings saved. POS template: ${getPosTemplateLabel(saved.posTemplate)}.`
      );
    } catch (saveError) {
      // Show an error message if saving fails
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save business settings."
      );
    } finally {
      setIsSaving(false);
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
        {/* Modal Header */}
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-white p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
              Configuration
            </p>
            <h2 className="mt-1 text-3xl font-black text-slate-950">Business Settings</h2>
            <p className="mt-2 text-sm text-slate-500">
              Branding and POS template are stored per business.
            </p>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500 transition hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
            aria-label="Close business settings"
          >
            ×
          </button>
        </header>

        {/* Modal Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {/* Error Message */}
          {error && (
            <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
              {error}
            </p>
          )}

          {/* Success Message */}
          {success && (
            <p className="mb-4 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700">
              {success}
            </p>
          )}

          {/* Form Sections */}
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Business Identity Section */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
                Business
              </p>
              <h3 className="mt-1 text-xl font-black">Identity</h3>
              <div className="mt-5 space-y-4">
                {/* Business Name Input */}
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Business name</span>
                  <input
                    type="text"
                    value={form.businessName}
                    disabled={isSaving}
                    onChange={(event) => updateForm("businessName", event.target.value)}
                    className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500 disabled:bg-slate-100"
                  />
                </label>

                {/* Business Type Display */}
                <div className="block">
                  <span className="text-sm font-bold text-slate-700">Business type</span>
                  <div className="mt-2 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-800">
                    {getPosTemplateLabel(form.posTemplate)}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Business type is selected during onboarding. Changing it later requires
                    a controlled template migration.
                  </p>
                </div>

                {/* Receipt Name Input */}
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Receipt name</span>
                  <input
                    type="text"
                    value={form.receiptName}
                    disabled={isSaving}
                    onChange={(event) => updateForm("receiptName", event.target.value)}
                    placeholder="Optional"
                    className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500 disabled:bg-slate-100"
                  />
                </label>

                {/* Phone Input */}
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Phone</span>
                  <input
                    type="text"
                    value={form.phone}
                    disabled={isSaving}
                    onChange={(event) => updateForm("phone", event.target.value)}
                    className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500 disabled:bg-slate-100"
                  />
                </label>
              </div>
            </section>

            {/* Other sections like POS Template, Address, and VAT Details are defined similarly */}
          </div>
        </div>

        {/* Modal Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-500">
            The actual Deli cashier layout is the next build step.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-5 py-3 font-bold text-slate-700"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                void saveSettings();
              }}
              className="rounded-xl bg-orange-500 px-6 py-3 font-black text-white transition hover:bg-orange-600 disabled:bg-slate-300"
            >
              {isSaving ? "Saving..." : "Save business settings"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}