import { Address } from "@stellar/stellar-sdk";

export type StellarAddressType = "account" | "contract";

export function getStellarAddressType(
  value: string,
): StellarAddressType | null {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  try {
    Address.fromString(normalized);
  } catch {
    return null;
  }

  if (normalized.startsWith("G")) {
    return "account";
  }

  if (normalized.startsWith("C")) {
    return "contract";
  }

  return null;
}

export function isValidStellarAddress(value: string): boolean {
  return getStellarAddressType(value) !== null;
}
