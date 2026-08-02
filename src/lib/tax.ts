export type TaxType =
  | "VAT"
  | "NON_VAT";

export type TaxBreakdown = {
  taxType: TaxType;
  vatRate: number;
  grossAmount: number;
  netAmount: number;
  vatAmount: number;
};

export const VAT_RATE = 0.2;

function roundCurrency(
  amount: number,
) {
  return Math.round(
    (amount + Number.EPSILON) * 100,
  ) / 100;
}

export function calculateTaxBreakdown(
  grossAmount: number,
  taxType: TaxType,
): TaxBreakdown {
  const roundedGross =
    roundCurrency(grossAmount);

  if (taxType === "NON_VAT") {
    return {
      taxType,
      vatRate: 0,
      grossAmount:
        roundedGross,
      netAmount:
        roundedGross,
      vatAmount: 0,
    };
  }

  const netAmount =
    roundCurrency(
      roundedGross /
        (1 + VAT_RATE),
    );

  const vatAmount =
    roundCurrency(
      roundedGross -
        netAmount,
    );

  return {
    taxType,
    vatRate: VAT_RATE,
    grossAmount:
      roundedGross,
    netAmount,
    vatAmount,
  };
}