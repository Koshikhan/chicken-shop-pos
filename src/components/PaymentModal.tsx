"use client";

import { useEffect, useMemo, useState } from "react";

// Define the types for payment methods and completed payment
export type PaymentMethod = "Cash" | "Card";

export type CompletedPayment = {
  method: PaymentMethod; // Payment method used
  amountReceived: number; // Amount received from the customer
  change: number; // Change to be given to the customer
};

// Props for the PaymentModal component
type PaymentModalProps = {
  isOpen: boolean; // Determines if the modal is open
  orderNumber: string; // Order number to display
  total: number; // Total amount to be paid
  onClose: () => void; // Function to close the modal
  onPaymentComplete: (payment: CompletedPayment) => void; // Callback for when payment is completed
};

// Formatter for displaying currency in GBP
const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

// Define the keypad buttons for the number pad
const keypadButtons = [
  "7", "8", "9", "⌫",
  "4", "5", "6", "Clear",
  "1", "2", "3", ".",
  "0", "00",
] as const;

// PaymentModal component
export function PaymentModal({
  isOpen,
  orderNumber,
  total,
  onClose,
  onPaymentComplete,
}: PaymentModalProps) {
  // State for payment method, cash received, and payment status
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [cashReceived, setCashReceived] = useState("");
  const [isPaid, setIsPaid] = useState(false);

  // Reset modal state when it is opened
  useEffect(() => {
    if (!isOpen) return;
    setPaymentMethod("Cash");
    setCashReceived("");
    setIsPaid(false);
  }, [isOpen]);

  // Calculate the amount received, change, and remaining amount
  const amountReceived = paymentMethod === "Card" ? total : Number.parseFloat(cashReceived || "0");
  const change = Math.max(amountReceived - total, 0);
  const remainingAmount = Math.max(total - amountReceived, 0);

  // Determine if the payment can be confirmed
  const canConfirm = paymentMethod === "Card" || amountReceived >= total;

  // Generate quick cash amounts for cash payment
  const quickCashAmounts = useMemo(() => {
    const roundedUp = Math.ceil(total);
    const amounts = [total, roundedUp, 10, 20, 50].filter((amount) => amount >= total);
    return Array.from(new Set(amounts.map((amount) => Number(amount.toFixed(2)))));
  }, [total]);

  // Handle keypad button presses
  const handleKeypadPress = (value: string | "Clear" | "⌫") => {
    setCashReceived((currentValue) => {
      if (value === "Clear") return ""; // Clear the input
      if (value === "⌫") return currentValue.slice(0, -1); // Remove the last character
      if (value === ".") {
        if (currentValue.includes(".")) return currentValue; // Prevent multiple decimals
        return currentValue === "" ? "0." : `${currentValue}.`;
      }
      if (currentValue.includes(".")) {
        const decimalPart = currentValue.split(".")[1] ?? "";
        if (decimalPart.length >= 2) return currentValue; // Limit to two decimal places
      }
      if (currentValue.length >= 9) return currentValue; // Limit input length
      if (currentValue === "0") return value === "00" ? "0" : value; // Prevent leading zeros
      if (currentValue === "" && value === "00") return "0";
      return `${currentValue}${value}`; // Append the value
    });
  };

  // Close the modal if it is not open
  if (!isOpen) return null;

  // Confirm the payment
  const confirmPayment = () => {
    if (!canConfirm) return;
    setIsPaid(true);
  };

  // Finish the payment and call the onPaymentComplete callback
  const finishPayment = () => {
    onPaymentComplete({
      method: paymentMethod,
      amountReceived,
      change,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Payment window"
    >
      <section className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {isPaid ? (
          // Payment success screen
          <div className="p-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl font-black text-green-700">
              ✓
            </div>
            <p className="mt-6 text-sm font-bold uppercase tracking-widest text-green-600">
              Payment successful
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Order #{orderNumber}
            </h2>
            <p className="mt-3 text-slate-500">
              The order has been paid using {paymentMethod}.
            </p>
            <div className="mx-auto mt-7 max-w-lg space-y-3 rounded-2xl bg-slate-100 p-5 text-left">
              <div className="flex justify-between font-semibold text-slate-600">
                <span>Order total</span>
                <span>{currencyFormatter.format(total)}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-600">
                <span>Payment method</span>
                <span>{paymentMethod}</span>
              </div>
              {paymentMethod === "Cash" && (
                <>
                  <div className="flex justify-between font-semibold text-slate-600">
                    <span>Cash received</span>
                    <span>{currencyFormatter.format(amountReceived)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-3 text-xl font-black text-green-700">
                    <span>Change</span>
                    <span>{currencyFormatter.format(change)}</span>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={finishPayment}
              className="mx-auto mt-7 w-full max-w-lg rounded-xl bg-green-600 px-5 py-4 text-lg font-black text-white transition hover:bg-green-700"
            >
              Start next order
            </button>
          </div>
        ) : (
          // Payment input screen
          <>
            <header className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-orange-500">
                  Payment
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Order #{orderNumber}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500 transition hover:bg-red-100 hover:text-red-600"
                aria-label="Close payment window"
              >
                ×
              </button>
            </header>
            <div className="p-6">
              <div className="rounded-2xl bg-slate-950 p-5 text-white">
                <p className="text-sm text-slate-400">Bill amount</p>
                <p className="mt-1 text-4xl font-black">
                  {currencyFormatter.format(total)}
                </p>
              </div>
              <h3 className="mt-6 font-black text-slate-950">Select payment method</h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {(["Cash", "Card"] as PaymentMethod[]).map((method) => {
                  const isSelected = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`rounded-2xl border-2 p-5 text-left transition ${
                        isSelected
                          ? "border-orange-500 bg-orange-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="block text-3xl">
                        {method === "Cash" ? "💷" : "💳"}
                      </span>
                      <span className="mt-3 block font-black text-slate-950">{method}</span>
                    </button>
                  );
                })}
              </div>
              {paymentMethod === "Cash" ? (
                // Cash payment input
                <div className="mt-6 grid gap-6 md:grid-cols-[1fr_330px]">
                  <div>
                    <p className="font-black text-slate-950">Cash received</p>
                    <div className="mt-3 flex items-center rounded-xl border-2 border-orange-500 bg-white px-4">
                      <span className="text-2xl font-black text-slate-500">£</span>
                      <div className="min-h-16 flex-1 px-3 py-4 text-right text-3xl font-black text-slate-950">
                        {cashReceived || "0.00"}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {quickCashAmounts.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setCashReceived(amount.toFixed(2))}
                          className="rounded-xl bg-slate-100 px-3 py-3 font-bold text-slate-700 transition hover:bg-slate-200"
                        >
                          {amount === total ? "Exact" : currencyFormatter.format(amount)}
                        </button>
                      ))}
                    </div>
                    <div className="mt-5 space-y-3 rounded-2xl bg-slate-100 p-5">
                      <div className="flex justify-between font-semibold text-slate-600">
                        <span>Paid amount</span>
                        <span>{currencyFormatter.format(amountReceived)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-red-600">
                        <span>Due amount</span>
                        <span>{currencyFormatter.format(remainingAmount)}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-300 pt-3 text-xl font-black text-green-700">
                        <span>Change</span>
                        <span>{currencyFormatter.format(change)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="font-black text-slate-950">Number pad</p>
                    <div className="mt-3 grid grid-cols-4 gap-2 rounded-2xl bg-slate-200 p-3">
                      {keypadButtons.map((button) => {
                        const isClear = button === "Clear";
                        const isBackspace = button === "⌫";
                        return (
                          <button
                            key={button}
                            type="button"
                            onClick={() => handleKeypadPress(button)}
                            className={`min-h-16 rounded-xl text-xl font-black shadow-sm transition active:scale-95 ${
                              isClear
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : isBackspace
                                ? "bg-orange-500 text-white hover:bg-orange-600"
                                : "bg-slate-950 text-white hover:bg-slate-800"
                            }`}
                          >
                            {button}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setCashReceived(total.toFixed(2))}
                        className="col-span-2 min-h-16 rounded-xl bg-green-600 text-lg font-black text-white shadow-sm transition hover:bg-green-700 active:scale-95"
                      >
                        Exact amount
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Card payment instructions
                <div className="mt-7 rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center">
                  <span className="text-5xl">💳</span>
                  <h3 className="mt-4 font-black text-slate-950">Use the card terminal</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Process the payment using the card machine, then confirm it below.
                  </p>
                </div>
              )}
              <button
                type="button"
                disabled={!canConfirm}
                onClick={confirmPayment}
                className="mt-7 w-full rounded-xl bg-orange-500 px-5 py-4 text-lg font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Confirm {paymentMethod} payment
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}