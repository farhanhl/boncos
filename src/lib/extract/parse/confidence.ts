import type { Field, ExtractionStatus } from "../types";

export function computeExtractionConfidence(
  amount: Field<number>,
  date: Field<string>,
  name: Field<string>
): number {
  const amountConf = amount.value !== null ? amount.confidence : 0;
  const dateConf = date.value !== null ? date.confidence : 0;
  const nameConf = name.value !== null ? name.confidence : 0;

  const score = 0.6 * amountConf + 0.2 * dateConf + 0.2 * nameConf;
  return Math.round(score * 100) / 100;
}

export function determineExtractionStatus(
  amount: Field<number>,
  date: Field<string>,
  name: Field<string>
): ExtractionStatus {
  if (amount.value === null) {
    return "empty";
  }

  const isAmountConfident = amount.confidence >= 0.7;
  const isDateConfident = date.value !== null && date.confidence >= 0.7;
  const isNameConfident = name.value !== null && name.confidence >= 0.7;

  if (isAmountConfident && isDateConfident && isNameConfident) {
    return "ok";
  }

  return "partial";
}
