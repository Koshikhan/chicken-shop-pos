"use client"; // Indicates this is a client-side component

import { useEffect, useState } from "react";

// Define the props for the AddClientModal component
type AddClientModalProps = {
  isOpen: boolean; // Determines if the modal is open
  onClose: () => void; // Function to close the modal
  onCreated: (businessName: string) => void; // Callback when a client is successfully created
};

// Define the available POS templates
type BusinessTemplate = "FAST_FOOD" | "DELI" | "RESTAURANT" | "RETAIL";

// Options for the POS templates
const TEMPLATE_OPTIONS: {
  value: BusinessTemplate;
  label: string;
  description: string;
}[] = [
  {
    value: "FAST_FOOD",
    label: "Fast Food",
    description: "Counter service, meals, burgers, wraps and quick checkout.",
  },
  {
    value: "DELI",
    label: "Deli",
    description: "Sandwiches, baguettes, paninis and counter customisation.",
  },
  {
    value: "RESTAURANT",
    label: "Restaurant",
    description: "Restaurant menu structure. Table features can be expanded later.",
  },
  {
    value: "RETAIL",
    label: "Retail",
    description: "General retail products, inventory and checkout.",
  },
];

// AddClientModal component for creating a new client
export function AddClientModal({ isOpen, onClose, onCreated }: AddClientModalProps) {
  // State variables for form inputs
  const [businessName, setBusinessName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [businessType, setBusinessType] = useState<BusinessTemplate>("DELI");
  const [branchName, setBranchName] = useState("Main Branch");
  const [managerName, setManagerName] = useState("");
  const [managerPin, setManagerPin] = useState("");

  // State variables for error handling and saving status
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Reset error state when the modal is opened
  useEffect(() => {
    if (!isOpen) return;
    setError("");
  }, [isOpen]);

  // If the modal is not open, return null (do not render anything)
  if (!isOpen) {
    return null;
  }

  // Close the modal
  const close = () => {
    if (isSaving) return; // Prevent closing while saving
    onClose();
  };

  // Handle form submission
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission behavior
    setError(""); // Clear previous errors
    setIsSaving(true); // Set saving state to true

    try {
      // Send a POST request to create a new client
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName,
          clientEmail,
          businessType,
          branchName,
          managerName,
          managerPin,
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        business?: { name?: string };
      };

      // If the response is not OK, throw an error
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to create the client.");
      }

      // Extract the created business name
      const createdName = result.business?.name ?? businessName.trim();

      // Reset form fields
      setBusinessName("");
      setClientEmail("");
      setBusinessType("DELI");
      setBranchName("Main Branch");
      setManagerName("");
      setManagerPin("");

      // Call the onCreated callback with the created business name
      onCreated(createdName);
    } catch (createError) {
      // Set the error message
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create the client."
      );
    } finally {
      setIsSaving(false); // Reset saving state
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* Modal Header */}
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">
              Platform Admin
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Add Client</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              You choose the client's POS template. The client will receive an
              invitation to set their account password.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={isSaving}
            className="rounded-xl bg-slate-100 px-4 py-2 font-black text-slate-600 hover:bg-slate-200 disabled:opacity-50"
          >
            Close
          </button>
        </header>

        {/* Form for adding a client */}
        <form onSubmit={submit} className="space-y-6 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            {/* Business Name Input */}
            <label className="block">
              <span className="text-sm font-black text-slate-700">Business name</span>
              <input
                required
                value={businessName}
                disabled={isSaving}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="ABC Deli"
                className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              />
            </label>

            {/* Client Email Input */}
            <label className="block">
              <span className="text-sm font-black text-slate-700">Client login email</span>
              <input
                type="email"
                required
                value={clientEmail}
                disabled={isSaving}
                onChange={(event) => setClientEmail(event.target.value)}
                placeholder="owner@abcdeli.co.uk"
                className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              />
            </label>

            {/* Branch Name Input */}
            <label className="block">
              <span className="text-sm font-black text-slate-700">First branch</span>
              <input
                required
                value={branchName}
                disabled={isSaving}
                onChange={(event) => setBranchName(event.target.value)}
                placeholder="Main Branch"
                className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              />
            </label>

            {/* Manager Name Input */}
            <label className="block">
              <span className="text-sm font-black text-slate-700">Initial manager name</span>
              <input
                required
                value={managerName}
                disabled={isSaving}
                onChange={(event) => setManagerName(event.target.value)}
                placeholder="John Smith"
                className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              />
            </label>
          </div>

          {/* POS Template Selection */}
          <fieldset>
            <legend className="text-sm font-black text-slate-700">POS template</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {TEMPLATE_OPTIONS.map((option) => {
                const selected = option.value === businessType;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isSaving}
                    onClick={() => setBusinessType(option.value)}
                    className={`rounded-2xl border-2 p-4 text-left transition ${
                      selected
                        ? "border-orange-500 bg-orange-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className="font-black text-slate-950">{option.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Manager PIN Input */}
          <label className="block">
            <span className="text-sm font-black text-slate-700">Temporary Manager PIN</span>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              required
              value={managerPin}
              disabled={isSaving}
              onChange={(event) =>
                setManagerPin(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="4 digits"
              className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 tracking-[0.35em] outline-none focus:border-orange-500"
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              This is the first till Manager PIN, not the client's email login password.
              The client can change staff PINs later.
            </p>
          </label>

          {/* Error Message */}
          {error && (
            <p className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>
          )}

          {/* Information Message */}
          <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            The client cannot choose or change the business template. Template changes
            stay under KAY POS platform control.
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-xl bg-orange-500 px-5 py-4 font-black text-white transition hover:bg-orange-600 disabled:bg-orange-300"
          >
            {isSaving ? "Creating client and sending invitation..." : "Create Client & Send Invitation"}
          </button>
        </form>
      </section>
    </div>
  );
}